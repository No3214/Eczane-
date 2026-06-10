import { useState, useCallback } from "react";
import { Pharmacy } from "@/types/pharmacy";
import { db } from "@/lib/db";
import { calculateDistanceKm } from "@/lib/distance";

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);

  const fetchPharmacies = useCallback(async (lat?: number, lng?: number, city?: string, district?: string) => {
    setLoading(true);
    setError(null);
    setIsOfflineData(false);
    try {
      let url = "/api/pharmacies?";
      if (lat !== undefined && lng !== undefined) {
        url += `lat=${lat}&lng=${lng}`;
      } else if (city && district) {
        url += `city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`;
      }

      const res = await fetch(url);
      const resData = await res.json();

      if (resData.success) {
        const fetchedList: Pharmacy[] = resData.data;
        setPharmacies(fetchedList);
        
        // Cache in Dexie DB
        try {
          if (fetchedList.length > 0) {
            await db.pharmacies.bulkPut(
              fetchedList.map(p => ({
                ...p,
                timestamp: Date.now()
              }))
            );
          }
        } catch (dbErr) {
          console.error("Dexie cache error:", dbErr);
        }
      } else {
        throw new Error(resData.error || "Eczaneler çekilemedi.");
      }
    } catch (err) {
      console.error("Fetch pharmacies error, falling back to local database:", err);
      
      // Attempt to retrieve from Dexie DB
      try {
        let cached: Pharmacy[] = [];
        if (city && district) {
          // Search by city and district
          cached = await db.pharmacies
            .where("city")
            .equalsIgnoreCase(city)
            .filter(p => p.district.toLowerCase() === district.toLowerCase())
            .toArray();
        } else if (lat !== undefined && lng !== undefined) {
          // Find closest from all cached pharmacies
          const allCached = await db.pharmacies.toArray();
          cached = allCached
            .map(p => {
              const dist = calculateDistanceKm(lat, lng, p.latitude, p.longitude);
              return { ...p, distance: dist };
            })
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
            .slice(0, 5); // Return top 5 closest
        } else {
          // Retrieve last 10 cached pharmacies
          cached = await db.pharmacies.limit(10).toArray();
        }

        if (cached.length > 0) {
          setPharmacies(cached);
          setIsOfflineData(true);
          setError("İnternet bağlantısı yok. Bilgiler yerel veritabanı önbelleğinden yüklendi.");
        } else {
          setError("İnternet bağlantı hatası ve yerel veritabanında kayıtlı eczane bulunamadı.");
        }
      } catch (dbErr) {
        console.error("Dexie read error:", dbErr);
        setError("İnternet bağlantı hatası. Eczane bilgileri yüklenemedi.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pharmacies,
    loading,
    error,
    isOfflineData,
    fetchPharmacies
  };
}

