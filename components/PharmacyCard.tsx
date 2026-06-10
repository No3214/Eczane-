"use client";

import { useState, useRef } from "react";
import { Pharmacy } from "@/types/pharmacy";
import { formatDistance } from "@/lib/distance";
import { getPhoneUrl, getWhatsappUrl, normalizePhone } from "@/lib/phone";
import { Phone, MessageCircle, MapPin, AlertTriangle, Navigation, Clock, Share2 } from "lucide-react";
import MapChoiceSheet from "@/components/MapChoiceSheet";
import ReportDialog from "@/components/ReportDialog";
import ShareCard from "@/components/ShareCard";
import { toBlob } from "html-to-image";

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  index: number; // 0, 1, 2 for display priority
  elderMode?: boolean;
}

export default function PharmacyCard({ pharmacy, index, elderMode = false }: PharmacyCardProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [medication, setMedication] = useState("");

  // Calculate current duty time countdown (weekdays: 18:00-08:00, Sat: 13:00-08:00, Sun: 24h)
  const getDutyTimeStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0: Sunday, 6: Sat
    const hour = now.getHours();

    let isDuty = false;
    let statusText = "";

    if (day === 0) {
      isDuty = true;
      statusText = "🟢 NÖBETÇİ (PAZAR HİZMETİ)";
    } else if (day === 6) {
      if (hour >= 13 || hour < 8) {
        isDuty = true;
        statusText = "🟢 NÖBETÇİ (CUMARTESİ HİZMETİ)";
      } else {
        statusText = `⏰ NÖBET BAŞLANGICI: ${13 - hour} SAAT SONRA`;
      }
    } else {
      if (hour >= 18 || hour < 8) {
        isDuty = true;
        statusText = "🟢 NÖBETÇİ (HAFTA İÇİ HİZMETİ)";
      } else {
        statusText = `⏰ NÖBET BAŞLANGICI: ${18 - hour} SAAT SONRA`;
      }
    }
    return { isDuty, statusText };
  };

  const { isDuty, statusText } = getDutyTimeStatus();

  // Dynamic WhatsApp text generator for prefilled stock query
  const getCustomWhatsappUrl = () => {
    if (!medication.trim()) {
      return getWhatsappUrl(pharmacy.phone);
    }
    const cleanNum = normalizePhone(pharmacy.phone);
    const text = encodeURIComponent(
      `Merhaba, ${pharmacy.name}. Nöbetçi misiniz? Stoklarınızda "${medication.trim()}" ilacı bulunuyor mu? Konum teyidi ile birlikte bilgi alabilir miyim?`
    );
    return `https://wa.me/${cleanNum}?text=${text}`;
  };

  const cardRef = useRef<HTMLDivElement>(null);

  // Generate PNG visual card and share via Web Share API
  const handleShare = async () => {
    if (!cardRef.current) return;
    
    const shareText = `🏥 ${pharmacy.name}\n📍 Adres: ${pharmacy.address}\n📞 Telefon: ${pharmacy.phone}\n🗺️ Yol Tarifi Al: https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`;

    try {
      const blob = await toBlob(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (!blob) throw new Error("Görsel oluşturulamadı.");

      const file = new File([blob], `${pharmacy.name.replace(/\s+/g, "_")}_nobetci.png`, { type: "image/png" });

      if (typeof window !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${pharmacy.name} Nöbetçi Eczane`,
          text: shareText,
        });
      } else {
        const dataUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${pharmacy.name}_nobetci.png`;
        link.href = dataUrl;
        link.click();
        URL.revokeObjectURL(dataUrl);

        await navigator.clipboard.writeText(shareText);
        alert("Eczane bilgi görseli indirildi ve detaylar panoya kopyalandı!");
      }
    } catch (err) {
      console.error("Görsel paylaşım hatası, metin paylaşımına geçiliyor:", err);
      if (typeof window !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: `${pharmacy.name} Nöbetçi Eczane`,
            text: shareText,
          });
        } catch (shareErr) {
          console.warn("Share API iptal edildi:", shareErr);
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareText);
          alert("Eczane bilgileri panoya kopyalandı!");
        } catch (copyErr) {
          console.error("Kopyalama hatası:", copyErr);
        }
      }
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        elderMode 
          ? "bg-black text-white border-white border-2 p-6 shadow-none" 
          : index === 0
            ? "bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/20 border-emerald-500/40 p-5 shadow-emerald-950/10 shadow-xl"
            : "bg-neutral-900/90 border-neutral-800 p-5 hover:border-neutral-700 shadow-md"
      }`}
    >
      {/* Index Tag / Highlight badge */}
      {index === 0 && !elderMode && (
        <span className="absolute top-0 right-0 rounded-bl-2xl bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          En Yakın Eczane
        </span>
      )}
      {index === 0 && elderMode && (
        <span className="absolute top-0 right-0 rounded-bl-xl bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
          EN YAKIN
        </span>
      )}

      {/* Basic info row */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-black text-neutral-100 flex items-center gap-1.5 leading-tight ${
            elderMode ? "text-2xl md:text-3xl text-white" : "text-xl"
          }`}>
            {pharmacy.name}
          </h3>
          
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {/* Distance badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
              elderMode 
                ? "bg-white text-black text-sm border border-black" 
                : "bg-neutral-800 text-emerald-400 text-xs"
            }`}>
              <MapPin className="h-3.5 w-3.5" />
              {pharmacy.distance !== undefined ? formatDistance(pharmacy.distance) : "Hesaplanıyor"}
            </span>

            {/* Countdown / Status badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              elderMode
                ? "bg-black text-white border border-white text-xs"
                : isDuty 
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
            }`}>
              <Clock className="h-3 w-3" />
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Address */}
      <p className={`leading-relaxed text-neutral-200 ${
        elderMode 
          ? "mt-4 text-base md:text-lg font-black text-white" 
          : "mt-3.5 text-xs text-neutral-400 font-medium line-clamp-2"
      }`}>
        {pharmacy.address}
      </p>

      {/* Legal disclaimer notice inside card */}
      <p className={`text-[10px] text-amber-500/80 font-bold mt-2.5 flex items-center gap-1`}>
        ⚠️ Yola çıkmadan önce eczaneyi arayıp nöbet durumunu teyit edin.
      </p>

      {/* Dynamic Medication Stock inquiry box (Consumer pain point) */}
      {!elderMode && (
        <div className="mt-3 bg-neutral-950/40 rounded-xl p-2.5 border border-neutral-800/40 flex items-center gap-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide shrink-0">💊 İlaç Sor:</span>
          <input
            type="text"
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            placeholder="Sorgulamak için ilaç adı yazın..."
            className="flex-grow bg-transparent text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none"
          />
        </div>
      )}

      {/* Surplus Items block removed per product strategy */}

      {/* Last Updated Status */}
      <div className={`mt-2 font-bold flex items-center gap-1 ${
        elderMode ? "text-xs text-neutral-300" : "text-[10px] text-neutral-500"
      }`}>
        <span className={`rounded-full bg-emerald-500 ${elderMode ? "h-2.5 w-2.5" : "h-1.5 w-1.5 animate-pulse"}`} />
        Son Güncelleme: {pharmacy.updated_at || "22:40"}
      </div>

      {/* Action Buttons Row */}
      <div className={`grid grid-cols-3 gap-2.5 ${elderMode ? "mt-6" : "mt-5"}`}>
        {/* Yol Tarifi */}
        <button
          onClick={() => setIsMapOpen(true)}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 transition-all ${
            elderMode 
              ? "bg-emerald-500 border border-white py-5 shadow-none hover:bg-emerald-400" 
              : "bg-emerald-600/90 py-3.5 hover:bg-emerald-500 shadow-md shadow-emerald-900/10"
          }`}
        >
          <Navigation className={`text-white ${elderMode ? "h-7 w-7" : "h-5.5 w-5.5"}`} />
          <span className={`font-black uppercase ${elderMode ? "text-xs md:text-sm" : "text-[11px]"}`}>Yol Tarifi</span>
        </button>

        {/* Ara */}
        <a
          href={getPhoneUrl(pharmacy.phone)}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 transition-all ${
            elderMode 
              ? "bg-white text-black border border-black py-5 shadow-none hover:bg-neutral-100" 
              : "bg-neutral-800 text-neutral-100 border border-neutral-700/50 py-3.5 hover:bg-neutral-700"
          }`}
        >
          <Phone className={`${elderMode ? "h-7 w-7 text-black" : "h-5.5 w-5.5 text-neutral-200"}`} />
          <span className={`font-black uppercase ${elderMode ? "text-xs md:text-sm" : "text-[11px]"}`}>Ara</span>
        </a>

        {/* WhatsApp */}
        <a
          href={getCustomWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 transition-all ${
            elderMode 
              ? "bg-black text-emerald-400 border-2 border-emerald-400 py-5 shadow-none hover:bg-neutral-900" 
              : "bg-neutral-800 text-neutral-100 border border-neutral-700/50 py-3.5 hover:bg-neutral-700"
          }`}
        >
          <MessageCircle className={`text-emerald-400 ${elderMode ? "h-7 w-7" : "h-5.5 w-5.5"}`} />
          <span className={`font-black uppercase ${elderMode ? "text-xs md:text-sm" : "text-[11px]"}`}>WhatsApp</span>
        </a>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 flex flex-col gap-3 border-t border-neutral-800/40 pt-3">
        
        {/* Affiliate / Monetization: Taxi/Uber (Demoted to optional link) */}
        <div className="flex justify-center mb-1">
          <a 
            href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${pharmacy.latitude}&dropoff[longitude]=${pharmacy.longitude}&dropoff[nickname]=${encodeURIComponent(pharmacy.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-neutral-500 hover:text-neutral-400 underline decoration-neutral-700 underline-offset-4 focus-visible:outline-none focus-visible:text-neutral-300 transition"
          >
            🚕 (Opsiyonel) Taksi Çağır
          </a>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleShare}
            className={`inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:underline focus-visible:text-emerald-300 transition ${
              elderMode ? "text-xs underline" : "text-[11px]"
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          Bilgileri Paylaş
        </button>
        <button
          onClick={() => setIsReportOpen(true)}
          className={`inline-flex items-center gap-1 font-bold focus-visible:outline-none focus-visible:underline focus-visible:text-amber-400 transition ${
            elderMode 
              ? "text-xs text-white underline hover:text-amber-400" 
              : "text-[11px] text-neutral-500 hover:text-amber-400"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Konum hatalı mı? Bildir
        </button>
        </div>
      </div>

      {/* Dialog Sheets */}
      <MapChoiceSheet
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        latitude={pharmacy.latitude}
        longitude={pharmacy.longitude}
        pharmacyName={pharmacy.name}
      />

      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        pharmacyId={pharmacy.id}
        pharmacyName={pharmacy.name}
      />

      <ShareCard
        pharmacy={pharmacy}
        cardRef={cardRef}
      />
    </div>
  );
}
