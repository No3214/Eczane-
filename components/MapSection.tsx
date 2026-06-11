"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Pharmacy } from "@/types/pharmacy";
import { Phone, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon images in Next.js/Webpack
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}

// Custom Leaflet Icons for premium look
const userIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-user-marker",
  html: `<div class="h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" style="box-shadow: 0 0 10px #10b981;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}) : undefined;

const pharmacyIcon = typeof window !== "undefined" ? L.divIcon({
  className: "custom-pharmacy-marker",
  html: `<div class="h-6 w-6 rounded-full bg-neutral-900 border-2 border-emerald-500 flex items-center justify-center font-bold text-[10px] text-emerald-400" style="box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);">+</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
}) : undefined;

// Helper component to adjust map bounds to include all markers
function MapResizer({ userCoords, pharmacies }: { userCoords: { lat: number; lng: number } | null, pharmacies: Pharmacy[] }) {
  const map = useMap();

  useEffect(() => {
    if (pharmacies.length === 0) return;

    const points: L.LatLngExpression[] = [];
    if (userCoords) {
      points.push([userCoords.lat, userCoords.lng]);
    }
    
    // Fit to user coords + nearest 3 pharmacies
    pharmacies.slice(0, 3).forEach((p) => {
      points.push([p.latitude, p.longitude]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, userCoords, pharmacies]);

  return null;
}

interface MapSectionProps {
  pharmacies: Pharmacy[];
  userCoords: { lat: number; lng: number } | null;
}

export default function MapSection({ pharmacies, userCoords }: MapSectionProps) {
  // Center on user coords if available, otherwise first pharmacy
  const defaultCenter: L.LatLngExpression = userCoords
    ? [userCoords.lat, userCoords.lng]
    : pharmacies.length > 0
      ? [pharmacies[0].latitude, pharmacies[0].longitude]
      : [38.4192, 27.1287]; // Default to Izmir

  const displayPharmacies = pharmacies.slice(0, 3);

  return (
    <div className="w-full h-[250px] rounded-3xl overflow-hidden border border-neutral-850 bg-neutral-950 relative z-10 shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Location Marker */}
        {userCoords && userIcon && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="text-xs font-bold text-neutral-800">Buradasınız</div>
            </Popup>
          </Marker>
        )}

        {/* Pharmacy Markers */}
        {displayPharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            position={[pharmacy.latitude, pharmacy.longitude]}
            icon={pharmacyIcon}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[140px] text-neutral-900">
                <h4 className="font-bold text-xs">{pharmacy.name}</h4>
                <p className="text-[10px] text-neutral-500 mt-0.5">{pharmacy.address}</p>
                <div className="mt-2 flex gap-1.5">
                  <a
                    href={`tel:${pharmacy.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-1 rounded bg-neutral-100 hover:bg-neutral-200 px-2 py-1 text-[9px] font-bold text-neutral-700 transition"
                  >
                    <Phone className="h-2.5 w-2.5" /> Ara
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-[9px] font-bold text-white transition"
                  >
                    <Navigation className="h-2.5 w-2.5" /> Rota
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapResizer userCoords={userCoords} pharmacies={pharmacies} />
      </MapContainer>
    </div>
  );
}
