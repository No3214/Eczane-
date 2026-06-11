import { describe, it, expect } from "vitest";
import { toSlug, fromSlug, normalizeTurkishText, findCityBySlug, findDistrictBySlug } from "@/lib/slugs";

describe("slug utilities", () => {
  describe("toSlug", () => {
    it("should translate Turkish characters to English equivalents", () => {
      expect(toSlug("İzmir")).toBe("izmir");
      expect(toSlug("Kadıköy")).toBe("kadikoy");
      expect(toSlug("Çeşme")).toBe("cesme");
      expect(toSlug("Beşiktaş")).toBe("besiktas");
      expect(toSlug("Ümraniye")).toBe("umraniye");
      expect(toSlug("Ortaköy")).toBe("ortakoy");
    });

    it("should handle mixed case and spaces", () => {
      expect(toSlug("Yeni Mahalle")).toBe("yeni-mahalle");
      expect(toSlug("  Buca  ")).toBe("buca");
    });

    it("should remove special characters", () => {
      expect(toSlug("Eczane & İlaç!")).toBe("eczane-ilac");
    });

    it("should return empty string for empty inputs", () => {
      expect(toSlug("")).toBe("");
    });
  });

  describe("fromSlug", () => {
    it("should replace dashes with spaces and capitalize words", () => {
      expect(fromSlug("yeni-mahalle")).toBe("Yeni Mahalle");
      expect(fromSlug("izmir")).toBe("Izmir");
    });

    it("should return empty string for empty inputs", () => {
      expect(fromSlug("")).toBe("");
    });
  });

  describe("normalizeTurkishText", () => {
    it("should lower case with Turkish locale", () => {
      expect(normalizeTurkishText("İZMİR")).toBe("izmir");
      expect(normalizeTurkishText("Isparta")).toBe("ısparta");
    });
  });

  describe("findCityBySlug", () => {
    it("should resolve city by slug correct regardless of casing", () => {
      const city = findCityBySlug("izmir");
      expect(city).toBeDefined();
      expect(city?.city).toBe("İzmir");
      
      const cityCapital = findCityBySlug("IZMIR");
      expect(cityCapital?.city).toBe("İzmir");
    });

    it("should return undefined for invalid city slug", () => {
      expect(findCityBySlug("nonexistent")).toBeUndefined();
    });
  });

  describe("findDistrictBySlug", () => {
    it("should resolve district correctly", () => {
      const district = findDistrictBySlug("İzmir", "cesme");
      expect(district).toBe("Çeşme");
    });

    it("should return undefined for invalid district", () => {
      expect(findDistrictBySlug("İzmir", "invalid-district")).toBeUndefined();
    });
  });
});
