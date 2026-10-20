import { Pharmacy } from "@/types/pharmacy";
import { PharmacyProvider, PharmacyProviderInput } from "../pharmacy-provider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export class SupabaseProvider implements PharmacyProvider {
  readonly name = "supabase";
  priority = 30; // Fallback database

  canHandle(input: PharmacyProviderInput): boolean {
    return Boolean(isSupabaseConfigured && supabase && (input.lat || input.city));
  }

  async fetch(input: PharmacyProviderInput): Promise<Pharmacy[]> {
    if (!supabase) return [];

    try {
      let query = supabase.from("pharmacies").select("*");
      
      // Bounding box geospatial query (~5.5km range)
      if (input.lat !== undefined && input.lng !== undefined) {
        const delta = 0.05; 
        query = query
          .gte("latitude", input.lat - delta)
          .lte("latitude", input.lat + delta)
          .gte("longitude", input.lng - delta)
          .lte("longitude", input.lng + delta);
      } else {
        if (input.city) query = query.eq("city", input.city);
        if (input.district) query = query.eq("district", input.district);
      }
      
      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        return data.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          name: item.name as string,
          city: item.city as string,
          district: item.district as string,
          address: item.address as string,
          phone: item.phone as string,
          latitude: item.latitude as number,
          longitude: item.longitude as number,
          confidence_score: (item.confidence_score as number) ?? 80,
          updated_at: item.source_updated_at 
            ? new Date(item.source_updated_at as string).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) 
            : "22:00",
          source: this.name,
          source_label: "Eczane+ Veritabanı",
          source_updated_at: (item.source_updated_at as string) || new Date().toISOString(),
          is_live: false,
          warning_message: "Bu veriler geçmiş nöbetçi listelerine dayalı olabilir. Lütfen teyit ediniz."
        }));
      }
      return [];
    } catch (error) {
      console.error("Error in Supabase provider request:", error);
      return [];
    }
  }
}
