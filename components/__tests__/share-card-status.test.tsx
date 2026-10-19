// @vitest-environment jsdom
import React, { createRef } from "react";
import { Socket } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/pharmacies/route";
import ShareCard from "@/components/ShareCard";
import { Pharmacy } from "@/types/pharmacy";

vi.mock("@/lib/supabase", () => ({ supabase: {}, isSupabaseConfigured: false }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-19T14:00:00Z"));
  vi.stubEnv("COLLECTAPI_KEY", "");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  // Rendering the real QR <img> must never contact its external service here.
  vi.spyOn(Socket.prototype, "connect").mockImplementation(() => {
    throw new Error("Network is disabled in this component test");
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const request = () => new NextRequest("http://localhost/api/pharmacies?city=%C4%B0zmir&district=Bal%C3%A7ova");

describe("truthful share image contents", () => {
  it("carries the real API's official roster date, source, and uncertainty into the actual ShareCard", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{
      EczaneId: 1, IlceId: 0, BolgeId: 11, Bolge: "BALÇOVA",
      Adi: "TEST ECZANESİ", Adres: "TEST FIXTURE - NOT A REAL ADDRESS", Telefon: "",
      LokasyonX: "38.4", LokasyonY: "27.1", Tarih: "2026-10-19T08:00:00",
      BolgeAciklama: "TEST REGION", UzaklikMetre: null,
    }]))));
    const body = await (await GET(request())).json();
    const pharmacy: Pharmacy = body.data[0];
    expect(pharmacy.source).toBe("izmir_open_data");
    render(<ShareCard pharmacy={pharmacy} cardRef={createRef<HTMLDivElement>()} />);

    expect(screen.queryByText(/^Nöbetçi$/)).toBeNull();
    expect(screen.getByText("NÖBET SAATLERİ TEYİT EDİLMEDİ")).toBeTruthy();
    expect(screen.getByText(/Kaynak: İzmir Büyükşehir Belediyesi/)).toBeTruthy();
    expect(screen.getByText(/Liste tarihi: 2026-10-19/)).toBeTruthy();
    expect(screen.getByText(pharmacy.warning_message!)).toBeTruthy();
    expect(Socket.prototype.connect).not.toHaveBeenCalled();
  });

  it("keeps the real unavailable-source demo fallback visibly demo when rendered for sharing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const body = await (await GET(request())).json();
    const pharmacy: Pharmacy = body.data[0];
    expect(pharmacy.source).toBe("mock");
    render(<ShareCard pharmacy={pharmacy} cardRef={createRef<HTMLDivElement>()} />);

    expect(screen.queryByText(/^Nöbetçi$/)).toBeNull();
    expect(screen.getByText("DEMO VERİ")).toBeTruthy();
    expect(screen.getByText(/Kaynak: Demo veri/)).toBeTruthy();
    expect(screen.getByText(pharmacy.warning_message!)).toBeTruthy();
    expect(Socket.prototype.connect).not.toHaveBeenCalled();
  });

  it("does not upgrade missing provenance or a legacy live flag into verified duty hours", () => {
    const pharmacy: Pharmacy = {
      id: "test-legacy", name: "TEST ECZANESİ", city: "İzmir", district: "Balçova",
      address: "TEST FIXTURE", phone: "", latitude: 38.4, longitude: 27.1, is_live: true,
    };
    render(<ShareCard pharmacy={pharmacy} cardRef={createRef<HTMLDivElement>()} />);

    expect(screen.queryByText(/^Nöbetçi$/)).toBeNull();
    expect(screen.getByText("NÖBET SAATLERİ TEYİT EDİLMEDİ")).toBeTruthy();
    expect(screen.getByText(/Kaynak: Bilinmiyor/)).toBeTruthy();
    expect(Socket.prototype.connect).not.toHaveBeenCalled();
  });
});
