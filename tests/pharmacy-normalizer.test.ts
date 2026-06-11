import { describe, it, expect } from "vitest";
import { normalizePharmacy, capitalizeTurkish, formatTurkishPhone } from "@/lib/pharmacy-normalizer";

describe("pharmacy normalizer helper", () => {
  describe("capitalizeTurkish", () => {
    it("should capitalize Turkish text correctly taking account of dotless i", () => {
      expect(capitalizeTurkish("KARAİSALI")).toBe("Karaisalı");
      expect(capitalizeTurkish("ADIYAMAN")).toBe("Adıyaman");
      expect(capitalizeTurkish("İZMİR")).toBe("İzmir");
      expect(capitalizeTurkish("YÜREĞİR")).toBe("Yüreğir");
      expect(capitalizeTurkish("efeler")).toBe("Efeler");
    });
  });

  describe("formatTurkishPhone", () => {
    it("should format 10 digit phones correctly", () => {
      expect(formatTurkishPhone("2321234567")).toBe("0 (232) 123 45 67");
    });

    it("should format 11 digit phones starting with 0 correctly", () => {
      expect(formatTurkishPhone("02321234567")).toBe("0 (232) 123 45 67");
    });
  });

  describe("normalizePharmacy", () => {
    it("should normalize raw Izmir provider payload correctly", () => {
      const raw = {
        Adi: "KONAK",
        Ilce: "Konak",
        Adres: "Mithatpasa Cad. No:1",
        Telefon: "2321234567",
        Enlem: 38.419,
        Boylam: 27.128
      };
      
      const normalized = normalizePharmacy(raw, "izmir_open_data");
      expect(normalized.name).toBe("Konak Eczanesi");
      expect(normalized.city).toBe("İzmir");
      expect(normalized.phone).toBe("0 (232) 123 45 67");
      expect(normalized.latitude).toBe(38.419);
      expect(normalized.is_live).toBe(true);
      expect(normalized.source).toBe("izmir_open_data");
      expect(normalized.source_label).toBe("İzmir Büyükşehir Belediyesi");
    });

    it("should normalize raw mock provider payload correctly with custom warnings", () => {
      const raw = {
        name: "Mock Eczane",
        city: "Ankara",
        district: "Cankaya",
        address: "Ataturk Bulvari No:100",
        phone: "3121112233",
        latitude: 39.93,
        longitude: 32.85
      };

      const normalized = normalizePharmacy(raw, "mock");
      expect(normalized.name).toBe("Mock Eczanesi");
      expect(normalized.is_live).toBe(false);
      expect(normalized.source).toBe("mock");
      expect(normalized.source_label).toBe("Demo veri");
      expect(normalized.warning_message).toContain("demo amaçlıdır");
    });
  });
});
