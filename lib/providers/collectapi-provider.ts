import { Pharmacy } from "@/types/pharmacy";
import { PharmacyProvider, PharmacyProviderInput } from "../pharmacy-provider";
import { z } from "zod";

const CollectApiPharmacySchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string().nullish().transform(val => val ?? ""),
  loc: z.string(),
}).passthrough();

const CollectApiResponseSchema = z.object({
  success: z.boolean(),
  result: z.array(CollectApiPharmacySchema).optional().default([]),
}).passthrough();

export class CollectApiProvider implements PharmacyProvider {
  name = "collectapi";
  priority = 20; // Secondary priority after official free ones

  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COLLECTAPI_KEY || "";
  }

  canHandle(input: PharmacyProviderInput): boolean {
    const key = this.apiKey || process.env.COLLECTAPI_KEY || "";
    // Only handle if we have an API key and exact city/district 
    // CollectAPI requires city and district explicitly for reliable duty pharmacies
    return Boolean(key && input.city && input.district);
  }

  async fetch(input: PharmacyProviderInput): Promise<Pharmacy[]> {
    const key = this.apiKey || process.env.COLLECTAPI_KEY || "";
    if (!key || !input.city || !input.district) return [];

    try {
      const res = await fetch(
        `https://api.collectapi.com/health/dutyPharmacy?il=${encodeURIComponent(input.city)}&ilce=${encodeURIComponent(input.district)}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `apikey ${key}`
          },
          next: { revalidate: 1800 } // Cache for 30 minutes
        }
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error body");
        console.warn(`CollectAPI returned error status: ${res.status}. Response: ${errorText}`);
        return [];
      }

      const data = await res.json();
      const parsed = CollectApiResponseSchema.safeParse(data);

      if (!parsed.success) {
        console.warn("CollectAPI shape changed or invalid:", parsed.error.format());
        return [];
      }

      if (!parsed.data.success) return [];

      return parsed.data.result.map((item, idx: number) => {
        const parts = item.loc.split(",");
        const lat = parseFloat(parts[0] || "0");
        const lng = parseFloat(parts[1] || "0");

        return {
          id: `collectapi-${input.city}-${input.district}-${idx}`,
          name: item.name.toLowerCase().includes("eczane") ? item.name : `${item.name} Eczanesi`,
          city: input.city || "",
          district: input.district || "",
          address: item.address,
          phone: item.phone,
          latitude: lat,
          longitude: lng,
          confidence_score: 95,
          updated_at: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          source: this.name,
          source_label: "CollectAPI (Türkiye Geneli)",
          source_updated_at: new Date().toISOString(),
          is_live: true
        };
      });
    } catch (error) {
      console.error("Error in CollectAPI provider request:", error);
      return [];
    }
  }
}
