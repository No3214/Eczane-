// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import InteractiveMap from "../InteractiveMap";

// Mock maplibre-gl
vi.mock("maplibre-gl", () => {
  class Map {
    on(event: string, callback: () => void) {
      if (event === "load") {
        setTimeout(callback, 0);
      }
    }
    remove = vi.fn();
    fitBounds = vi.fn();
    flyTo = vi.fn();
    zoomIn = vi.fn();
    zoomOut = vi.fn();
  }

  class Marker {
    setLngLat = vi.fn().mockReturnThis();
    setPopup = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  class Popup {
    setHTML = vi.fn().mockReturnThis();
  }

  class LngLatBounds {
    extend = vi.fn();
  }

  const mockLib = {
    Map,
    Marker,
    Popup,
    LngLatBounds
  };

  return {
    default: mockLib,
    Map,
    Marker,
    Popup,
    LngLatBounds
  };
});

describe("InteractiveMap Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPharmacies = [
    {
      id: "ph-1",
      name: "Şifa Eczanesi",
      city: "Izmir",
      district: "Foca",
      address: "Ataturk Cd. No: 5",
      phone: "02321111111",
      latitude: 38.67,
      longitude: 26.75,
    }
  ];

  it("renders loader screen initially before map loads", () => {
    render(
      <InteractiveMap 
        pharmacies={mockPharmacies} 
        userCoords={null} 
      />
    );
    expect(screen.getByText("WebGL Harita Yükleniyor")).toBeDefined();
  });

  it("renders zoom controls and expand button", async () => {
    render(
      <InteractiveMap 
        pharmacies={mockPharmacies} 
        userCoords={{ lat: 38.67, lng: 26.75 }} 
      />
    );
    expect(screen.getByText("Haritayı Genişlet")).toBeDefined();
  });
});
