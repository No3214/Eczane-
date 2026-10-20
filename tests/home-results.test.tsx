// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import type { Pharmacy } from "@/types/pharmacy";

// The page, hooks, onboarding, picker and pharmacy cards are real. Only the
// external cache, weather widget and unopened dynamic map cross test boundaries.
vi.mock("@/lib/db", () => ({ db: { pharmacies: { bulkPut: vi.fn(async () => undefined) } } }));
vi.mock("@/lib/supabase", () => ({ supabase: {}, isSupabaseConfigured: false }));
vi.mock("@/components/HealthDashboard", () => ({ default: () => null }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

const fixtures: Pharmacy[] = ["A", "B", "C", "D", "E"].map((letter, index) => ({
  id: `result-fixture-${letter}`,
  name: `TEST ECZANESİ ${letter}`,
  city: "İzmir", district: "Konak", address: "TEST FIXTURE - NOT A REAL ADDRESS",
  phone: "", latitude: 38.4, longitude: 27.1, distance: index + 1,
  source: "mock", source_label: "Yerel test verisi", is_live: false,
  warning_message: "Demo test kaydıdır; gerçek nöbet listesi değildir.",
}));
let rows: Pharmacy[];
let pharmacyRequests: string[];
let unexpectedRequests: string[];
let nextPharmacyResponse: Promise<Response> | null;
const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
const position = {
  coords: { latitude: 38.4, longitude: 27.1, accuracy: 1, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
  timestamp: 0,
} as GeolocationPosition;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("nobetci-kvkk-consent", "true");
  rows = fixtures;
  pharmacyRequests = [];
  unexpectedRequests = [];
  nextPharmacyResponse = null;
  const geolocation: Geolocation = {
    getCurrentPosition: (success) => success(position),
    watchPosition: () => 0,
    clearWatch: () => undefined,
  };
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: geolocation });
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/pharmacies?")) {
      pharmacyRequests.push(url);
      if (nextPharmacyResponse) {
        const pending = nextPharmacyResponse;
        nextPharmacyResponse = null;
        return pending;
      }
      return new Response(JSON.stringify({ success: true, data: rows }));
    }
    if (url.startsWith("/api/geocode?")) {
      return new Response(JSON.stringify({ success: true, address: "Yerel test konumu" }));
    }
    unexpectedRequests.push(url);
    throw new Error(`Unexpected network request: ${url}`);
  }));
});

afterEach(() => {
  cleanup();
  expect(unexpectedRequests).toEqual([]);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalGeolocation) {
    Object.defineProperty(navigator, "geolocation", originalGeolocation);
  } else {
    Reflect.deleteProperty(navigator, "geolocation");
  }
});

const cards = () => screen.queryAllByRole("heading", { level: 3, name: /^TEST ECZANESİ [A-E]$/ });

async function loadPage() {
  render(<Home />);
  await waitFor(() => expect(pharmacyRequests).toHaveLength(1));
  await waitFor(() => expect(cards()).toHaveLength(Math.min(rows.length, 3)));
}

function expand() {
  fireEvent.click(screen.getByRole("button", { name: /Tüm Eczaneleri Göster/ }));
}

describe("home pharmacy result expansion", () => {
  it("starts with the first three records in provider order", async () => {
    await loadPage();
    expect(cards().map(node => node.textContent)).toEqual([
      "TEST ECZANESİ A", "TEST ECZANESİ B", "TEST ECZANESİ C",
    ]);
  });

  it("expands the current results without opening the area picker or fetching again", async () => {
    await loadPage();
    expand();
    expect(cards().map(node => node.textContent)).toEqual([
      "TEST ECZANESİ A", "TEST ECZANESİ B", "TEST ECZANESİ C", "TEST ECZANESİ D", "TEST ECZANESİ E",
    ]);
    expect(screen.queryByPlaceholderText(/İl ara/)).toBeNull();
    expect(pharmacyRequests).toHaveLength(1);
    expect(screen.getByRole("button", { name: /İlk 3 Eczaneyi Göster/ }).getAttribute("aria-expanded")).toBe("true");
  });

  it("collapses back to three without discarding records or starting a new query", async () => {
    await loadPage();
    expand();
    fireEvent.click(screen.getByRole("button", { name: /İlk 3 Eczaneyi Göster/ }));
    expect(cards()).toHaveLength(3);
    expect(screen.getByRole("button", { name: /Tüm Eczaneleri Göster \(5\)/ }).getAttribute("aria-expanded")).toBe("false");
    expand();
    expect(cards()).toHaveLength(5);
    expect(pharmacyRequests).toHaveLength(1);
  });

  it("resets expansion when a new GPS query is started", async () => {
    await loadPage();
    expand();
    expect(cards()).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));
    await waitFor(() => expect(pharmacyRequests).toHaveLength(2));
    expect(cards()).toHaveLength(3);
  });

  it("keeps a new query collapsed while GPS and its response are still pending", async () => {
    await loadPage();
    expand();
    let locationSuccess: PositionCallback | undefined;
    navigator.geolocation.getCurrentPosition = (success) => { locationSuccess = success; };
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));
    expect(cards()).toHaveLength(3);
    expect((screen.getByRole("button", { name: /Tüm Eczaneleri Göster/ }) as HTMLButtonElement).disabled).toBe(true);
    expand();
    expect(cards()).toHaveLength(3);

    let resolveResponse!: (response: Response) => void;
    nextPharmacyResponse = new Promise(resolve => { resolveResponse = resolve; });
    await act(async () => { locationSuccess?.(position); });
    expect(pharmacyRequests).toHaveLength(2);
    expect((screen.getByRole("button", { name: /Tüm Eczaneleri Göster/ }) as HTMLButtonElement).disabled).toBe(true);
    expand();
    expect(cards()).toHaveLength(3);

    await act(async () => {
      resolveResponse(new Response(JSON.stringify({ success: true, data: fixtures.slice(0, 4) })));
    });
    const toggle = screen.getByRole("button", { name: /Tüm Eczaneleri Göster \(4\)/ }) as HTMLButtonElement;
    expect(toggle.disabled).toBe(false);
    expect(cards()).toHaveLength(3);
    fireEvent.click(toggle);
    expect(cards()).toHaveLength(4);
  });

  it("resets expansion on a submitted manual city/district search", async () => {
    await loadPage();
    expand();
    expect(cards()).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: /Başka Bir İl \/ İlçe Ara/ }));
    fireEvent.change(screen.getByPlaceholderText(/İl ara/), { target: { value: "İzmir" } });
    fireEvent.click(screen.getByRole("button", { name: "İzmir" }));
    fireEvent.change(screen.getByPlaceholderText(/İlçe ara/), { target: { value: "Konak" } });
    fireEvent.click(screen.getByRole("button", { name: "Konak" }));
    fireEvent.click(screen.getByRole("button", { name: /Eczaneleri Listele/ }));
    await waitFor(() => expect(pharmacyRequests).toHaveLength(2));
    expect(new URL(pharmacyRequests[1], "https://example.invalid").searchParams.get("district")).toBe("Konak");
    expect(cards()).toHaveLength(3);
  });

  it("keeps expanded results when the unrelated large-text preference changes", async () => {
    await loadPage();
    expand();
    fireEvent.click(screen.getByRole("button", { name: "Büyük Yazı" }));
    expect(cards()).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Standart Mod" })).toBeTruthy();
    expect(pharmacyRequests).toHaveLength(1);
  });

  it("keeps expanded results when the area picker is opened and closed without submitting", async () => {
    await loadPage();
    expand();
    fireEvent.click(screen.getByRole("button", { name: /Başka Bir İl \/ İlçe Ara/ }));
    expect(screen.getByPlaceholderText(/İl ara/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Kapat" }));
    expect(cards()).toHaveLength(5);
    expect(pharmacyRequests).toHaveLength(1);
  });

  it.each([0, 1, 3])("does not offer expansion for a result set of %i", async (count) => {
    rows = fixtures.slice(0, count);
    await loadPage();
    expect(cards()).toHaveLength(count);
    expect(screen.queryByRole("button", { name: /Tüm Eczaneleri Göster/ })).toBeNull();
  });
});
