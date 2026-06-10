"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Pharmacy } from "@/types/pharmacy";
import { Navigation, Plus, Minus, Locate } from "lucide-react";

interface InteractiveMapProps {
  pharmacies: Pharmacy[];
  userCoords: { lat: number; lng: number } | null;
  activePharmacy?: Pharmacy | null;
  onSelectPharmacy?: (pharmacy: Pharmacy) => void;
}

export default function InteractiveMap({
  pharmacies,
  userCoords,
  activePharmacy,
  onSelectPharmacy
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedPharmacy, setClickedPharmacy] = useState<Pharmacy | null>(null);

  // Derive the active selected pharmacy using derived state
  const isClickedInList = clickedPharmacy && pharmacies.some(p => p.id === clickedPharmacy.id);
  const selectedPharmacy = activePharmacy || (isClickedInList ? clickedPharmacy : null) || (pharmacies.length > 0 ? pharmacies[0] : null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Default center at Turkey coordinate (Ankara)
    const defaultLat = 39.9334;
    const defaultLng = 32.8597;

    const initialLat = userCoords?.lat ?? (pharmacies[0]?.latitude ?? defaultLat);
    const initialLng = userCoords?.lng ?? (pharmacies[0]?.longitude ?? defaultLng);

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [initialLng, initialLat],
      zoom: userCoords ? 14 : 11,
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      setMapLoaded(true);
    });

    map.current = mapInstance;

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers and bounds when pharmacies or userCoords change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear old markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add user marker if available
    if (userCoords) {
      const el = document.createElement("div");
      el.className = "w-6 h-6 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center relative";
      const inner = document.createElement("div");
      inner.className = "w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse";
      el.appendChild(inner);

      const userMarker = new maplibregl.Marker({ element: el })
        .setLngLat([userCoords.lng, userCoords.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(
            "<span class='text-xs font-bold text-neutral-800'>Konumunuz</span>"
          )
        )
        .addTo(map.current);

      markers.current.push(userMarker);
    }

    // Add pharmacy markers
    pharmacies.forEach((p) => {
      const el = document.createElement("div");
      el.className = "w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500 flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-900/40 hover:scale-110 hover:bg-emerald-500/40 transition-all duration-250";
      
      const dot = document.createElement("div");
      dot.className = "w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black shadow-inner shadow-black/30";
      dot.innerText = "+";
      el.appendChild(dot);

      el.addEventListener("click", () => {
        setClickedPharmacy(p);
        if (onSelectPharmacy) onSelectPharmacy(p);
      });

      const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
        .setHTML(`
          <div class="p-2 text-neutral-800 font-sans max-w-[200px] leading-relaxed">
            <h4 class="font-black text-xs text-neutral-900">${p.name}</h4>
            <p class="text-[10px] text-neutral-500 mt-1">${p.address}</p>
            ${p.phone ? `<p class="text-[10px] text-emerald-600 font-bold mt-1">📞 ${p.phone}</p>` : ""}
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Auto fit bounds
    if (pharmacies.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      if (userCoords) {
        bounds.extend([userCoords.lng, userCoords.lat]);
      }
      pharmacies.forEach((p) => {
        bounds.extend([p.longitude, p.latitude]);
      });

      map.current.fitBounds(bounds, {
        padding: 45,
        maxZoom: 15,
        duration: 1200,
      });
    } else if (userCoords) {
      map.current.flyTo({
        center: [userCoords.lng, userCoords.lat],
        zoom: 14,
        duration: 1000
      });
    }
  }, [pharmacies, userCoords, mapLoaded, onSelectPharmacy]);

  // Fetch and draw route geometry using OSRM API
  useEffect(() => {
    if (!map.current || !mapLoaded || !userCoords || !selectedPharmacy) {
      // Clear route if no longer active
      if (map.current && mapLoaded) {
        if (map.current.getLayer("route")) map.current.removeLayer("route");
        if (map.current.getLayer("route-glow")) map.current.removeLayer("route-glow");
        if (map.current.getSource("route")) map.current.removeSource("route");
      }
      return;
    }

    let active = true;

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userCoords.lng},${userCoords.lat};${selectedPharmacy.longitude},${selectedPharmacy.latitude}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (active && data.code === "Ok" && data.routes && data.routes[0]) {
          const routeGeometry = data.routes[0].geometry;

          if (!map.current) return;

          // Check if source already exists
          const existingSource = map.current.getSource("route");
          if (existingSource) {
            (existingSource as maplibregl.GeoJSONSource).setData({
              type: "Feature",
              properties: {},
              geometry: routeGeometry
            });
          } else {
            map.current.addSource("route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: routeGeometry
              }
            });

            // Glowing outer layer
            map.current.addLayer({
              id: "route-glow",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": "#10b981",
                "line-width": 8,
                "line-opacity": 0.35
              }
            });

            // Solid inner layer
            map.current.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": "#34d399",
                "line-width": 4
              }
            });
          }
        }
      } catch (err) {
        console.error("OSRM Route API fetch error:", err);
      }
    };

    fetchRoute();

    return () => {
      active = false;
    };
  }, [selectedPharmacy, userCoords, mapLoaded]);

  // Map Controls functions
  const zoomIn = () => map.current?.zoomIn();
  const zoomOut = () => map.current?.zoomOut();
  const flyToUser = () => {
    if (userCoords && map.current) {
      map.current.flyTo({
        center: [userCoords.lng, userCoords.lat],
        zoom: 14,
        duration: 1000
      });
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-neutral-800 shadow-xl transition-all duration-350 ${
      isFullscreen ? "h-[450px]" : "h-[220px]"
    }`}>
      {/* Map Element Container */}
      <div ref={mapContainer} className="w-full h-full bg-neutral-950" />

      {/* Floating Map Controls */}
      <div className="absolute right-3.5 top-3.5 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          className="p-2 bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl shadow-lg active:scale-95 transition"
          title="Yakınlaştır"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl shadow-lg active:scale-95 transition"
          title="Uzaklaştır"
        >
          <Minus className="h-4 w-4" />
        </button>
        {userCoords && (
          <button
            onClick={flyToUser}
            className="p-2 bg-neutral-900/90 border border-neutral-800 text-emerald-400 hover:text-emerald-300 rounded-xl shadow-lg active:scale-95 transition"
            title="Konumuma Git"
          >
            <Locate className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Resize Button */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute left-3.5 top-3.5 px-3 py-1.5 bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl shadow-lg text-xs font-bold active:scale-95 transition flex items-center gap-1.5 z-10"
      >
        <Navigation className="h-3.5 w-3.5 text-emerald-400 rotate-45" />
        {isFullscreen ? "Haritayı Küçült" : "Haritayı Genişlet"}
      </button>

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-800 border-t-emerald-500" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">WebGL Harita Yükleniyor</span>
          </div>
        </div>
      )}
    </div>
  );
}
