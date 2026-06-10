"use client";

import React from "react";
import { Pharmacy } from "@/types/pharmacy";
import { ShieldAlert, Phone, MapPin, ExternalLink } from "lucide-react";

interface ShareCardProps {
  pharmacy: Pharmacy;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export default function ShareCard({ pharmacy, cardRef }: ShareCardProps) {
  // Generate a QR code pointing to the pharmacy's coordinates on Google Maps
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mapsUrl)}&color=10-185-129&bgcolor=17-20-19`;

  return (
    <div className="absolute left-[-9999px] top-[-9999px]">
      <div 
        ref={cardRef} 
        className="w-[400px] bg-[#0c0f0e] border-2 border-emerald-500/30 rounded-3xl p-6 text-white font-sans flex flex-col gap-5 shadow-2xl relative overflow-hidden"
        style={{ width: "400px", backgroundColor: "#0c0f0e" }}
      >
        {/* Background Glows */}
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-600 shadow-md">
              <span className="text-white font-black text-lg">+</span>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-neutral-100 flex items-center gap-1">
                Eczane<span className="text-emerald-400">+</span>
              </h1>
              <p className="text-[7px] text-neutral-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                Acil Durum Bilgi Kartı
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3" /> Nöbetçi
          </span>
        </div>

        {/* Pharmacy Details */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-neutral-100 leading-tight">
              {pharmacy.name}
            </h2>
            {pharmacy.distance !== undefined && (
              <p className="text-[10px] text-emerald-400 font-bold mt-1">
                📍 Yaklaşık Mesafe: {pharmacy.distance >= 1 ? `${pharmacy.distance.toFixed(1)} km` : `${Math.round(pharmacy.distance * 1000)} m`}
              </p>
            )}
          </div>

          {/* Address Box */}
          <div className="p-3 bg-neutral-950/60 rounded-2xl border border-neutral-800/60 flex items-start gap-2.5">
            <MapPin className="h-4.5 w-4.5 text-neutral-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">Açık Adres</span>
              <p className="text-xs text-neutral-300 leading-normal font-medium mt-0.5">
                {pharmacy.address}
              </p>
            </div>
          </div>

          {/* Phone Box */}
          <div className="p-3 bg-neutral-950/60 rounded-2xl border border-neutral-800/60 flex items-center gap-2.5">
            <Phone className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            <div className="text-left">
              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">Telefon Numarası</span>
              <p className="text-xs text-emerald-300 font-bold mt-0.5">
                {pharmacy.phone}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code and Instructions */}
        <div className="border-t border-neutral-800/80 pt-4 flex items-center justify-between gap-4">
          <div className="flex flex-col text-left gap-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
              <ExternalLink className="h-3 w-3" /> Canlı Yol Tarifi
            </span>
            <p className="text-[9px] text-neutral-500 leading-normal max-w-[170px] font-medium mt-0.5">
              Yandaki QR kodu telefonunuzun kamerasıyla taratarak doğrudan yol tarifi alabilirsiniz.
            </p>
          </div>
          
          {/* QR Code Container */}
          <div className="h-20 w-20 bg-[#111413] border border-neutral-800 rounded-xl p-1.5 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrCodeUrl} 
              alt="Harita Rota QR Kodu" 
              className="h-full w-full object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Disclaimer footer */}
        <div className="text-[7px] text-neutral-600 text-center font-bold uppercase tracking-wider">
          ⚠️ YOLA ÇIKMADAN ÖNCE ECZANEYİ ARAYIP NÖBET DURUMUNU TEYİT EDİN.
        </div>

      </div>
    </div>
  );
}
