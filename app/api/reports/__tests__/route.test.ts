import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT } from "../route";
import { NextRequest } from "next/server";

// Mock the lib/supabase module
vi.mock("@/lib/supabase", () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      }))
    }
  };
});

describe("/api/reports Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 503 if ADMIN_SECRET_KEY is not configured", async () => {
      const originalKey = process.env.ADMIN_SECRET_KEY;
      delete process.env.ADMIN_SECRET_KEY;

      const req = new NextRequest("http://localhost/api/reports", {
        headers: { "x-admin-key": "some-key" }
      });
      const res = await GET(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Admin yetkisi yapılandırılmamış");

      process.env.ADMIN_SECRET_KEY = originalKey;
    });

    it("returns 401 for unauthorized requests", async () => {
      process.env.ADMIN_SECRET_KEY = "super-secret";
      const req = new NextRequest("http://localhost/api/reports", {
        headers: { "x-admin-key": "wrong-key" }
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Yetkisiz erişim.");
    });
  });

  describe("POST", () => {
    it("returns 400 for missing pharmacy_id or report_type", async () => {
      const req = new NextRequest("http://localhost/api/reports", {
        method: "POST",
        body: JSON.stringify({
          pharmacy_name: "Test Eczanesi"
        })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Eksik parametre dolduruldu.");
    });

    it("returns 400 if message is too long", async () => {
      const longMessage = "a".repeat(501);
      const req = new NextRequest("http://localhost/api/reports", {
        method: "POST",
        body: JSON.stringify({
          pharmacy_id: "test-id",
          report_type: "wrong_location",
          message: longMessage
        })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Açıklama 500 karakterden uzun olamaz.");
    });

    it("returns 400 for invalid latitude/longitude", async () => {
      const req = new NextRequest("http://localhost/api/reports", {
        method: "POST",
        body: JSON.stringify({
          pharmacy_id: "test-id",
          report_type: "wrong_location",
          user_latitude: 95,
          user_longitude: 100
        })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Geçersiz enlem");
    });
  });

  describe("PUT", () => {
    it("returns 401 for unauthorized updates", async () => {
      process.env.ADMIN_SECRET_KEY = "super-secret";
      const req = new NextRequest("http://localhost/api/reports", {
        method: "PUT",
        headers: { "x-admin-key": "wrong-key" },
        body: JSON.stringify({ id: "test-id", status: "resolved" })
      });
      const res = await PUT(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for missing id or status", async () => {
      process.env.ADMIN_SECRET_KEY = "super-secret";
      const req = new NextRequest("http://localhost/api/reports", {
        method: "PUT",
        headers: { "x-admin-key": "super-secret" },
        body: JSON.stringify({ id: "test-id" })
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
    });
  });
});
