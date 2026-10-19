import { Pharmacy } from "@/types/pharmacy";
import { PharmacyProvider, PharmacyProviderInput } from "../pharmacy-provider";
import { z } from "zod";

const CoordinateSchema = z.union([
  z.number(),
  z.string().trim().regex(/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/).transform(Number),
]);

// Tarih is a naive roster timestamp, not a pharmacy-specific duty interval.
const RosterTimestampSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,7})?$/)
  .refine(value => {
    const date = value.slice(0, 10);
    const parsed = new Date(date + "T00:00:00Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }, "Invalid roster calendar date");

const IzmirPharmacySchema = z.object({
  Adi: z.string().trim().min(1),
  Bolge: z.string().trim().min(1),
  Adres: z.string().trim().min(1),
  Telefon: z.string().nullish().transform(val => val ?? ""),
  LokasyonX: CoordinateSchema.pipe(z.number().min(-90).max(90)),
  LokasyonY: CoordinateSchema.pipe(z.number().min(-180).max(180)),
  Tarih: RosterTimestampSchema,
}).passthrough();

const IzmirApiResponseSchema = z.array(IzmirPharmacySchema);

export class IzmirProvider implements PharmacyProvider {
  readonly name = "izmir_open_data";
  priority = 10; // Highest priority for official free data

  canHandle(input: PharmacyProviderInput): boolean {
    if (input.city) {
      const city = input.city.toLocaleLowerCase("tr-TR").trim().normalize("NFC");
      if (city === "izmir" || city === "i̇zmir".normalize("NFC")) return true;
    }
    
    if (input.lat && input.lng) {
      // Rough bounding box for Izmir province
      const isLatOk = input.lat > 37.8 && input.lat < 39.3;
      const isLngOk = input.lng > 26.2 && input.lng < 28.5;
      return isLatOk && isLngOk;
    }
    return false;
  }

  async fetch(input: PharmacyProviderInput): Promise<Pharmacy[]> {
    try {
      const res = await fetch("https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler", {
        next: { revalidate: 900 } 
      });

      if (!res.ok) {
        console.warn("Izmir Open Data API returned error status:", res.status);
        return [];
      }

      const data = await res.json();
      const parsed = IzmirApiResponseSchema.safeParse(data);
      
      if (!parsed.success) {
        console.warn("Izmir API shape changed or invalid:", parsed.error.format());
        return [];
      }

      // Conservative freshness policy for this jurisdiction: accept only the
      // current Istanbul calendar date. Do not infer hours or convert Tarih
      // into an instant; individual pharmacy schedules differ on the source site.
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());

      let pharmacies: Pharmacy[] = parsed.data
        .filter(item => item.Tarih.slice(0, 10) === today)
        .map((item, index: number) => {
        const rawPhone = item.Telefon.replace(/\D/g, "");
        let formattedPhone = item.Telefon;
        if (rawPhone.length === 10 && rawPhone.startsWith("232")) {
          formattedPhone = `0 (232) ${rawPhone.slice(3, 6)} ${rawPhone.slice(6, 8)} ${rawPhone.slice(8, 10)}`;
        }

        return {
          id: `live-izmir-${item.Adi.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${index}`,
          name: item.Adi.toLowerCase().includes("eczane") ? item.Adi : `${item.Adi} Eczanesi`,
          city: "İzmir",
          district: item.Bolge,
          address: item.Adres,
          phone: formattedPhone,
          latitude: item.LokasyonX,
          longitude: item.LokasyonY,
          source: this.name,
          source_label: "İzmir Büyükşehir Belediyesi",
          roster_date: item.Tarih.slice(0, 10),
          is_live: false,
          warning_message: item.Tarih.slice(0, 10) + " tarihli belediye listesi. Nöbet saatleri doğrulanmadı; yola çıkmadan önce eczaneyi arayın.",
        };
      });

      if (input.district) {
        // Bolge is a service-region label; IlceId can be 0. Do not guess an
        // administrative district from labels such as BORNOVA 1 or ESKİ FOÇA.
        const matchDistrict = input.district.normalize("NFC").toLocaleLowerCase("tr-TR").trim();
        pharmacies = pharmacies.filter(
          (p) => p.district.normalize("NFC").toLocaleLowerCase("tr-TR").trim() === matchDistrict
        );
      }

      return pharmacies;
    } catch (error) {
      console.error("Error fetching live Izmir pharmacies:", error);
      return [];
    }
  }
}
