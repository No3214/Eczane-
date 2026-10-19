import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { IzmirProvider } from "@/lib/providers/izmir-provider";
import { fetchLiveIzmirPharmacies } from "@/lib/pharmacy-api";
import { normalizePharmacy } from "@/lib/pharmacy-normalizer";
import { GET } from "@/app/api/pharmacies/route";
import { renderToStaticMarkup } from "react-dom/server";
import DistrictPharmaciesPage, { generateMetadata } from "@/app/[city]/[district]/nobetci-eczane/page";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  isSupabaseConfigured: false,
}));

const ENDPOINT = "https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler";
const fetchMock = vi.fn();

// Synthetic fixture values using the documented and observed municipal field names.
// These are not real pharmacy/contact records.
const officialRow = (overrides: Record<string, unknown> = {}) => ({
  EczaneId: 1,
  Adi: "TEST ECZANESİ",
  Adres: "TEST FIXTURE - NOT A REAL ADDRESS",
  Telefon: "2320000000",
  IlceId: 0,
  BolgeId: 11,
  Bolge: "BALÇOVA",
  LokasyonX: "38.384829",
  LokasyonY: "27.057011",
  Tarih: "2026-10-19T08:00:00",
  ...overrides,
});

const respondWith = (body: unknown, status = 200) => {
  fetchMock.mockImplementation(async () => new Response(JSON.stringify(body), { status }));
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T14:00:00Z"));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("COLLECTAPI_KEY", "");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("official Izmir roster contract", () => {
  it("uses the documented endpoint and maps the real response shape without inventing duty hours", async () => {
    respondWith([officialRow()]);

    const rows = await new IzmirProvider().fetch({ city: "İzmir" });

    expect(fetchMock).toHaveBeenCalledWith(ENDPOINT, { next: { revalidate: 900 } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "TEST ECZANESİ",
      city: "İzmir",
      district: "BALÇOVA",
      latitude: 38.384829,
      longitude: 27.057011,
      phone: "0 (232) 000 00 00",
      source: "izmir_open_data",
      roster_date: "2026-10-19",
      is_live: false,
    });
    expect(rows[0].warning_message).toContain("2026-10-19");
    expect(rows[0].warning_message).toContain("doğrulanmadı");
    expect(rows[0].updated_at).toBeUndefined();
    expect(rows[0].source_updated_at).toBeUndefined();
    expect(rows[0].confidence_score).toBeUndefined();
  });

  it("keeps the legacy entry point on the same verified adapter", async () => {
    respondWith([officialRow(), officialRow({ Bolge: "BORNOVA 1" })]);

    const rows = await fetchLiveIzmirPharmacies("balçova");

    expect(fetchMock).toHaveBeenCalledWith(ENDPOINT, { next: { revalidate: 900 } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ district: "BALÇOVA", is_live: false, roster_date: "2026-10-19" });
  });

  it("matches normalized exact Bolge labels without guessing administrative district membership", async () => {
    respondWith([
      officialRow(),
      officialRow({ Bolge: "BALÇOVA 2", Adi: "SECOND TEST ECZANESİ" }),
      officialRow({ Bolge: "BORNOVA 1", Adi: "THIRD TEST ECZANESİ" }),
    ]);
    expect(await new IzmirProvider().fetch({ city: "İzmir", district: "  balçova  " })).toHaveLength(1);
    expect(await new IzmirProvider().fetch({ city: "İzmir", district: "Bornova" })).toEqual([]);
  });

  it("does not treat repeated EczaneId values as a unique record identity", async () => {
    respondWith([officialRow(), officialRow({ Adi: "SECOND TEST ECZANESİ", Bolge: "ALİAĞA" })]);
    const rows = await new IzmirProvider().fetch({ city: "İzmir" });
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
  });

  it.each([null, {}, "", [], [null]])("rejects empty or invalid response roots: %j", async (body) => {
    respondWith(body);
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
  });

  it.each([
    { Adi: " \u00a0\uFEFF " },
    { Adres: " " },
    { Bolge: "" },
    { LokasyonX: "" },
    { LokasyonX: "NaN" },
    { LokasyonX: "38.4trailing" },
    { LokasyonX: 91 },
    { LokasyonY: "Infinity" },
    { LokasyonY: 181 },
    { Tarih: undefined },
    { Tarih: "not-a-date" },
    { Tarih: "2026-02-30T08:00:00" },
    { Tarih: "2026-10-19T25:00:00" },
  ])("rejects malformed required source fields: %j", async (overrides) => {
    respondWith([officialRow(overrides)]);
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
  });

  it("does not accept the old mock-shaped fields as an official response", async () => {
    respondWith([{
      Adi: "TEST ECZANESİ", Ilce: "Balçova", Adres: "TEST FIXTURE",
      Telefon: "", Enlem: 38.4, Boylam: 27.1,
    }]);
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
  });

  it("drops past and future roster dates without inferring a 24-hour duty interval", async () => {
    respondWith([
      officialRow({ Tarih: "2026-10-18T08:00:00" }),
      officialRow({ Tarih: "2026-10-20T08:00:00" }),
    ]);
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
  });

  it("uses the Istanbul calendar date for freshness without interpreting the naive source time as an instant", async () => {
    vi.setSystemTime(new Date("2026-10-19T21:30:00Z"));
    respondWith([
      officialRow(),
      officialRow({ Adi: "NEXT DATE TEST ECZANESİ", Tarih: "2026-10-20T08:00:00" }),
    ]);
    const rows = await new IzmirProvider().fetch({ city: "İzmir" });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ roster_date: "2026-10-20", is_live: false });
    expect(rows[0].source_updated_at).toBeUndefined();
  });

  it.each([404, 500])("returns no official records for HTTP %i", async (status) => {
    respondWith({ message: "unavailable" }, status);
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
  });

  it("returns no official records for invalid JSON or a rejected fetch", async () => {
    fetchMock.mockImplementationOnce(async () => new Response("not JSON"));
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
    fetchMock.mockRejectedValueOnce(new Error("offline fixture"));
    expect(await new IzmirProvider().fetch({ city: "İzmir" })).toEqual([]);
  });

  it("preserves unverified roster metadata through normalization and the real route", async () => {
    respondWith([officialRow()]);
    const response = await GET(new NextRequest("http://localhost/api/pharmacies?city=%C4%B0zmir&district=Bal%C3%A7ova"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ source: "izmir_open_data", roster_date: "2026-10-19", is_live: false });
    expect(body.data[0].warning_message).toContain("doğrulanmadı");
    expect(body.data[0]).not.toHaveProperty("updated_at");
    expect(body.data[0]).not.toHaveProperty("source_updated_at");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never upgrades the real demo fallback to official or live data after a 404", async () => {
    respondWith({ message: "not found" }, 404);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const response = await GET(new NextRequest("http://localhost/api/pharmacies?city=%C4%B0zmir&district=Bal%C3%A7ova"));
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const row of body.data) {
      expect(row).toMatchObject({ source: "mock", source_label: "Demo veri", is_live: false });
      expect(row.warning_message).toContain("demo");
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not manufacture update timestamps or live status from a source name", () => {
    const row = normalizePharmacy({
      name: "TEST ECZANESİ", city: "İzmir", district: "Balçova",
      address: "TEST FIXTURE", phone: "", latitude: 38.4, longitude: 27.1,
    }, "izmir_open_data");
    expect(row.is_live).toBe(false);
    expect(row.updated_at).toBeUndefined();
    expect(row.source_updated_at).toBeUndefined();
    expect(row.warning_message).toContain("doğrulanmadı");
  });

  it("keeps the SSR list and its structured data honest about unverified duty hours", async () => {
    respondWith([officialRow()]);
    const page = await DistrictPharmaciesPage({ params: Promise.resolve({ city: "İzmir", district: "Balçova" }) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("doğrulanmadı");
    expect(html).not.toContain("şu an nöbetçi olan eczanelerin tam listesi");
    expect(html).not.toContain("nöbetçi olan eczanelerin güncel adres ve telefon listesi aşağıdadır");
  });

  it("resolves canonical SSR slugs to the source's Turkish city and region names", async () => {
    respondWith([officialRow()]);
    const page = await DistrictPharmaciesPage({ params: Promise.resolve({ city: "izmir", district: "balcova" }) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("Test Eczanesi");
    expect(html).toContain("İzmir Büyükşehir Belediyesi");
    expect(html).toContain("doğrulanmadı");
  });

  it("does not describe the SSR roster as a complete current-duty list in metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ city: "izmir", district: "balcova" }) });
    expect(metadata.description).not.toContain("tüm nöbetçi");
    expect(metadata.description).not.toContain("En güncel");
  });
});
