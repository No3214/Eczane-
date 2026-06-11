import { describe, it, expect } from "vitest";
import { calculateDistanceKm, formatDistance } from "@/lib/distance";

describe("distance helper", () => {
  describe("calculateDistanceKm", () => {
    it("should return 0 for the same coordinates", () => {
      const lat = 38.67;
      const lng = 26.75;
      const dist = calculateDistanceKm(lat, lng, lat, lng);
      expect(dist).toBe(0);
    });

    it("should calculate correct distance between Izmir and Istanbul", () => {
      // Izmir Konak: ~38.419, 27.128
      // Istanbul Kadikoy: ~40.991, 29.027
      // Distance is approx 328 km
      const dist = calculateDistanceKm(38.419, 27.128, 40.991, 29.027);
      expect(dist).toBeGreaterThan(320);
      expect(dist).toBeLessThan(340);
    });
  });

  describe("formatDistance", () => {
    it("should format distances less than 1km as meters", () => {
      expect(formatDistance(0.35)).toBe("350 m");
      expect(formatDistance(0.005)).toBe("5 m");
    });

    it("should format distances greater than or equal to 1km as km", () => {
      expect(formatDistance(1.25)).toBe("1.3 km");
      expect(formatDistance(15.67)).toBe("15.7 km");
    });
  });
});
