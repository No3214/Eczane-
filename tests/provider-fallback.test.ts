import { describe, it, expect, vi } from "vitest";
import { IzmirProvider } from "@/lib/providers/izmir-provider";
import { CollectApiProvider } from "@/lib/providers/collectapi-provider";
import { SupabaseProvider } from "@/lib/providers/supabase-provider";
import { MockProvider } from "@/lib/providers/mock-provider";

describe("provider fallback chain", () => {
  it("should sort providers by priority correctly", () => {
    const izmir = new IzmirProvider();
    const collect = new CollectApiProvider();
    const supabase = new SupabaseProvider();
    const mock = new MockProvider();

    const chain = [izmir, collect, supabase, mock].sort((a, b) => a.priority - b.priority);

    // Expected order: Izmir (10), CollectAPI (20), Supabase (30), Mock (100)
    expect(chain[0].name).toBe("izmir_open_data");
    expect(chain[1].name).toBe("collectapi");
    expect(chain[2].name).toBe("supabase");
    expect(chain[3].name).toBe("mock");
  });

  describe("IzmirProvider", () => {
    it("should handle Izmir queries but reject other cities", () => {
      const provider = new IzmirProvider();
      expect(provider.canHandle({ city: "İzmir" })).toBe(true);
      expect(provider.canHandle({ city: "izmir" })).toBe(true);
      expect(provider.canHandle({ city: "İstanbul" })).toBe(false);
    });
  });

  describe("CollectApiProvider", () => {
    it("should handle only if API key is present and city/district is provided", () => {
      const provider = new CollectApiProvider();
      // If no API key is set in environment, should return false
      const originalKey = process.env.COLLECTAPI_KEY;
      
      process.env.COLLECTAPI_KEY = "test-key";
      expect(provider.canHandle({ city: "İstanbul", district: "Kadikoy" })).toBe(true);
      
      delete process.env.COLLECTAPI_KEY;
      expect(provider.canHandle({ city: "İstanbul", district: "Kadikoy" })).toBe(false);

      process.env.COLLECTAPI_KEY = originalKey;
    });
  });

  describe("MockProvider", () => {
    it("should handle all queries as fallback", () => {
      const provider = new MockProvider();
      expect(provider.canHandle({})).toBe(true);
      expect(provider.canHandle({ city: "Adana", district: "Seyhan" })).toBe(true);
    });
  });
});
