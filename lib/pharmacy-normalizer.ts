import { Pharmacy } from "@/types/pharmacy";

export function capitalizeTurkish(str: string): string {
  if (!str) return "";
  return str.split(" ").map(word => {
    if (!word) return "";
    const lower = word.toLocaleLowerCase("tr-TR");
    return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
  }).join(" ");
}

export function formatTurkishPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `0 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    return `0 (${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  return phone;
}

export function normalizePharmacy(
  raw: any,
  source: "izmir_open_data" | "collectapi" | "supabase" | "mock"
): Pharmacy {
  // Normalize name
  let name = raw.name || raw.Adi || "Eczane";
  name = capitalizeTurkish(name.trim());
  if (name.toLocaleLowerCase("tr-TR").endsWith(" eczane")) {
    name = name.slice(0, -7) + " Eczanesi";
  } else if (!name.toLocaleLowerCase("tr-TR").includes("eczane")) {
    name = `${name} Eczanesi`;
  }

  // Normalize city and district
  const city = capitalizeTurkish(raw.city || raw.il || "İzmir");
  const district = capitalizeTurkish(raw.district || raw.Ilce || raw.ilce || "");

  // Normalize phone
  const phone = formatTurkishPhone(raw.phone || raw.Telefon || "");

  // Normalize coordinates
  let latitude = 0;
  let longitude = 0;
  if (raw.latitude !== undefined) {
    latitude = typeof raw.latitude === "number" ? raw.latitude : parseFloat(String(raw.latitude));
  } else if (raw.Enlem !== undefined) {
    latitude = typeof raw.Enlem === "number" ? raw.Enlem : parseFloat(String(raw.Enlem));
  }
  
  if (raw.longitude !== undefined) {
    longitude = typeof raw.longitude === "number" ? raw.longitude : parseFloat(String(raw.longitude));
  } else if (raw.Boylam !== undefined) {
    longitude = typeof raw.Boylam === "number" ? raw.Boylam : parseFloat(String(raw.Boylam));
  }

  // Default warnings & labels based on source
  let sourceLabel = "Bilinmeyen Kaynak";
  let isLive = false;
  let warningMessage = "";
  let confidenceScore = 50;

  switch (source) {
    case "izmir_open_data":
      sourceLabel = "İzmir Büyükşehir Belediyesi";
      isLive = true;
      confidenceScore = 99;
      break;
    case "collectapi":
      sourceLabel = "CollectAPI (Türkiye Geneli)";
      isLive = true;
      confidenceScore = 95;
      break;
    case "supabase":
      sourceLabel = "Eczane+ Veritabanı";
      isLive = false;
      confidenceScore = 80;
      warningMessage = "Bu veriler geçmiş nöbetçi listelerine dayalı olabilir. Lütfen teyit ediniz.";
      break;
    case "mock":
      sourceLabel = "Demo veri";
      isLive = false;
      confidenceScore = 50;
      warningMessage = "Bu kayıt demo amaçlıdır; yola çıkmadan önce resmi kaynaklardan teyit edin.";
      break;
  }

  return {
    id: raw.id || `${source}-${city}-${district}-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`.toLowerCase(),
    name,
    city,
    district,
    address: raw.address || raw.Adres || "",
    phone,
    latitude,
    longitude,
    distance: raw.distance,
    confidence_score: raw.confidence_score || confidenceScore,
    updated_at: raw.updated_at || new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    source,
    source_label: raw.source_label || sourceLabel,
    source_updated_at: raw.source_updated_at || new Date().toISOString(),
    is_live: raw.is_live !== undefined ? raw.is_live : isLive,
    warning_message: raw.warning_message || warningMessage,
  };
}
