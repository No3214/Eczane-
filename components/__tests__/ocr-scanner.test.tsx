// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import OcrScanner from "../OcrScanner";

// Mock tesseract.js
vi.mock("tesseract.js", () => {
  return {
    createWorker: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        recognize: vi.fn().mockResolvedValue({ data: { text: "PAROL" } }),
        terminate: vi.fn().mockResolvedValue(null)
      });
    }),
  };
});

describe("OcrScanner Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <OcrScanner isOpen={false} onClose={() => {}} onDetected={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when isOpen is true and attempts to load camera stream", async () => {
    const mockStop = vi.fn();
    const mockStream = {
      getTracks: () => [{ stop: mockStop }]
    };
    
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: mockGetUserMedia
      },
      configurable: true,
      writable: true
    });

    render(
      <OcrScanner isOpen={true} onClose={() => {}} onDetected={() => {}} />
    );

    expect(screen.getByText("İlaç / Reçete Tarayıcı")).toBeDefined();
    expect(await screen.findByText("Fotoğraf Çek & Tara")).toBeDefined();
  });
});

