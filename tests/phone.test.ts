import { describe, it, expect } from "vitest";
import { normalizePhone, getPhoneUrl, getWhatsappUrl } from "@/lib/phone";

describe("phone helper", () => {
  describe("normalizePhone", () => {
    it("should remove spaces and non-digits and append country code 90", () => {
      expect(normalizePhone("0 (232) 123 45 67")).toBe("902321234567");
      expect(normalizePhone("555 444 33 22")).toBe("905554443322");
    });

    it("should handle already prefixed number starting with 90", () => {
      expect(normalizePhone("902321234567")).toBe("902321234567");
    });

    it("should handle numbers without leading zero", () => {
      expect(normalizePhone("2321234567")).toBe("902321234567");
    });
  });

  describe("getPhoneUrl", () => {
    it("should return tel link with normalized number prefix", () => {
      expect(getPhoneUrl("0 (232) 123 45 67")).toBe("tel:+902321234567");
    });
  });

  describe("getWhatsappUrl", () => {
    it("should return correct wa.me link with encoded Turkish text", () => {
      const url = getWhatsappUrl("0 (232) 123 45 67");
      expect(url).toContain("https://wa.me/902321234567");
      expect(url).toContain("text=");
      expect(url).toContain(encodeURIComponent("Konumunuzu"));
    });
  });
});
