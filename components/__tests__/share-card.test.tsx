// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ShareCard from "../ShareCard";

describe("ShareCard Component", () => {
  const mockPharmacy = {
    id: "ph-1",
    name: "Örnek Eczanesi",
    city: "Izmir",
    district: "Foca",
    address: "Ataturk Cd. No: 5",
    phone: "02321111111",
    latitude: 38.67,
    longitude: 26.75,
    distance: 1.2
  };

  it("renders pharmacy info correctly in sharing card template", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ShareCard pharmacy={mockPharmacy} cardRef={ref} />);
    
    expect(screen.getByText("Örnek Eczanesi")).toBeDefined();
    expect(screen.getByText("Ataturk Cd. No: 5")).toBeDefined();
    expect(screen.getByText("02321111111")).toBeDefined();
    expect(screen.getByText(/Yaklaşık Mesafe: 1.2 km/)).toBeDefined();
  });
});
