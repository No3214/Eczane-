import { Pharmacy } from "../types/pharmacy";
import { z } from "zod";
import { IzmirProvider } from "./providers/izmir-provider";

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

/**
 * Compatibility entry point for the dated municipal roster.
 * The shared adapter does not attest individual pharmacies' current duty hours.
 */
export async function fetchLiveIzmirPharmacies(district?: string): Promise<Pharmacy[]> {
  return new IzmirProvider().fetch({ city: "İzmir", district });
}

/**
 * Commercial Integration Wrapper: CollectAPI
 * This function displays how we connect to CollectAPI if the user provides an API key.
 */
export async function fetchCollectAPILivePharmacies(
  city: string,
  district: string,
  apiKey: string
): Promise<Pharmacy[]> {
  try {
    const res = await fetch(
      `https://api.collectapi.com/health/dutyPharmacy?il=${encodeURIComponent(city)}&ilce=${encodeURIComponent(district)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `apikey ${apiKey}`
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
        id: `collectapi-${city}-${district}-${idx}`,
        name: item.name.toLowerCase().includes("eczane") ? item.name : `${item.name} Eczanesi`,
        city: city,
        district: district,
        address: item.address,
        phone: item.phone,
        latitude: lat,
        longitude: lng,
        confidence_score: 95,
        updated_at: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      };
    });
  } catch (error) {
    console.error("Error in CollectAPI request:", error);
    return [];
  }
}
