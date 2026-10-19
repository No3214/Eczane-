import { Pharmacy } from "@/types/pharmacy";
import { PharmacyProvider, PharmacyProviderInput } from "../pharmacy-provider";
import { z } from "zod";

const IzmirPharmacySchema = z.object({
  Adi: z.string(),
  Ilce: z.string(),
  Adres: z.string(),
  Telefon: z.string().nullish().transform(val => val ?? ""),
  Enlem: z.union([z.string(), z.number()]),
  Boylam: z.union([z.string(), z.number()]),
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
      const res = await fetch("https://openapi.izmir.bel.tr/api/nobetcieczaneler", {
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

      let pharmacies: Pharmacy[] = parsed.data.map((item, index: number) => {
        const rawPhone = item.Telefon.replace(/\D/g, "");
        let formattedPhone = item.Telefon;
        if (rawPhone.length === 10 && rawPhone.startsWith("232")) {
          formattedPhone = `0 (232) ${rawPhone.slice(3, 6)} ${rawPhone.slice(6, 8)} ${rawPhone.slice(8, 10)}`;
        }

        return {
          id: `live-izmir-${item.Adi.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-${index}`,
          name: item.Adi.toLowerCase().includes("eczane") ? item.Adi : `${item.Adi} Eczanesi`,
          city: "İzmir",
          district: item.Ilce.trim(),
          address: item.Adres,
          phone: formattedPhone,
          latitude: typeof item.Enlem === "number" ? item.Enlem : parseFloat(String(item.Enlem)),
          longitude: typeof item.Boylam === "number" ? item.Boylam : parseFloat(String(item.Boylam)),
          confidence_score: 99,
          updated_at: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          source: this.name,
          source_label: "İzmir Büyükşehir Belediyesi",
          source_updated_at: new Date().toISOString(),
          is_live: true
        };
      });

      if (input.district) {
        const matchDistrict = input.district.toLocaleLowerCase("tr-TR").trim();
        pharmacies = pharmacies.filter(
          (p) => p.district.toLocaleLowerCase("tr-TR").trim() === matchDistrict
        );
      }

      return pharmacies;
    } catch (error) {
      console.error("Error fetching live Izmir pharmacies:", error);
      return [];
    }
  }
}
