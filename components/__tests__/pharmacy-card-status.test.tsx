// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PharmacyCard from "@/components/PharmacyCard";
import { Pharmacy } from "@/types/pharmacy";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/pharmacies/route";

vi.mock("@/components/MapChoiceSheet", () => ({ default: () => null }));
vi.mock("@/components/ReportDialog", () => ({ default: () => null }));
vi.mock("@/components/ShareCard", () => ({ default: () => null }));
vi.mock("html-to-image", () => ({ toBlob: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: {}, isSupabaseConfigured: false }));

const pharmacy: Pharmacy = {
  id: "test-only", name: "TEST ECZANESİ", city: "İzmir", district: "Balçova",
  address: "TEST FIXTURE - NOT A REAL ADDRESS", phone: "",
  latitude: 38.4, longitude: 27.1, source: "izmir_open_data",
  source_label: "İzmir Büyükşehir Belediyesi", is_live: false,
  roster_date: "2026-10-19",
  warning_message: "2026-10-19 tarihli liste; nöbet saatleri doğrulanmadı.",
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("truthful pharmacy status card", () => {
  it.each([
    "2026-10-19T20:00:00Z",
    "2026-10-17T14:00:00Z",
    "2026-10-18T12:00:00Z",
  ])("never derives current duty or a countdown from the weekday clock: %s", (now) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    render(<PharmacyCard pharmacy={pharmacy} index={1} />);

    expect(screen.queryByText(/NÖBETÇİ \(/)).toBeNull();
    expect(screen.queryByText(/SAAT SONRA/)).toBeNull();
    expect(screen.getByText("NÖBET SAATLERİ TEYİT EDİLMEDİ")).toBeTruthy();
    expect(screen.getByText(pharmacy.warning_message!)).toBeTruthy();
    expect(screen.getByText(/Kaynak: İzmir Büyükşehir Belediyesi/)).toBeTruthy();
    expect(screen.getByText(/Liste tarihi: 2026-10-19/)).toBeTruthy();
  });

  it("makes demo provenance and its warning visible on the actual card", () => {
    render(<PharmacyCard pharmacy={{
      ...pharmacy, source: "mock", source_label: "Demo veri",
      warning_message: "Bu kayıt demo amaçlıdır.", roster_date: undefined,
    }} index={1} elderMode />);

    expect(screen.getByText("DEMO VERİ")).toBeTruthy();
    expect(screen.getByText("Bu kayıt demo amaçlıdır.")).toBeTruthy();
    expect(screen.getByText(/Kaynak: Demo veri/)).toBeTruthy();
    expect(screen.queryByText(/NÖBETÇİ \(/)).toBeNull();
  });

  it("does not fabricate 22:40 for a missing update time", () => {
    render(<PharmacyCard pharmacy={pharmacy} index={1} />);
    expect(screen.queryByText(/22:40/)).toBeNull();
    expect(screen.queryByText(/Kaynak güncellemesi:/)).toBeNull();
  });

  it("does not label the real demo fallback's generated time as a source update", async () => {
    vi.stubEnv("COLLECTAPI_KEY", "");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await GET(new NextRequest("http://localhost/api/pharmacies?city=%C4%B0zmir&district=Bal%C3%A7ova"));
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].source).toBe("mock");
    render(<PharmacyCard pharmacy={body.data[0]} index={1} />);

    expect(screen.queryByText(/Kaynak güncellemesi:/)).toBeNull();
    expect(screen.getByText("DEMO VERİ")).toBeTruthy();
    for (const row of body.data) {
      expect(row).not.toHaveProperty("updated_at");
      expect(row).not.toHaveProperty("source_updated_at");
    }
  });

  it("does not treat an arbitrary supplied update label as verified source freshness", () => {
    render(<PharmacyCard pharmacy={{ ...pharmacy, updated_at: "19.10.2026 07:30" }} index={1} />);
    expect(screen.queryByText(/Kaynak güncellemesi:/)).toBeNull();
    expect(screen.queryByText(/19.10.2026 07:30/)).toBeNull();
  });

  it("does not present an older cached demo timestamp as source freshness", () => {
    render(<PharmacyCard pharmacy={{
      ...pharmacy, source: "mock", source_label: "Demo veri", updated_at: "12:41",
      roster_date: undefined, warning_message: "Bu kayıt demo amaçlıdır.",
    }} index={1} />);
    expect(screen.queryByText(/Kaynak güncellemesi: 12:41/)).toBeNull();
    expect(screen.queryByText(/Kaynak güncellemesi:/)).toBeNull();
  });

  it.each([
    { source: "collectapi" as const, source_label: "CollectAPI", updated_at: "17:23", source_updated_at: "2026-10-19T14:23:00.000Z" },
    { source: "supabase" as const, source_label: "Veritabanı", updated_at: "22:00", source_updated_at: "2026-10-19T14:23:00.000Z" },
  ])("never displays an unverifiable provider-supplied update time as source freshness: $source", (record) => {
    // Synthetic existing-provider/cache shapes only; no provider or database call.
    render(<PharmacyCard pharmacy={{ ...pharmacy, ...record }} index={1} />);

    expect(screen.queryByText(/Kaynak güncellemesi:/)).toBeNull();
    expect(screen.queryByText(new RegExp(record.updated_at))).toBeNull();
    expect(screen.queryByText(new RegExp(record.source_updated_at))).toBeNull();
    expect(screen.getByText(new RegExp(`Kaynak: ${record.source_label}`))).toBeTruthy();
    expect(screen.getByText(/Liste tarihi: 2026-10-19/)).toBeTruthy();
    expect(screen.getByText(pharmacy.warning_message!)).toBeTruthy();
  });
});
