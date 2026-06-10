"use client";

import { useState, useCallback } from "react";
import PharmacyCard from "@/components/PharmacyCard";
import CityDistrictPicker from "@/components/CityDistrictPicker";
import KvkkBanner from "@/components/KvkkBanner";
import KvkkModal from "@/components/KvkkModal";
import OnboardingFlow from "@/components/OnboardingFlow";
import HealthDashboard from "@/components/HealthDashboard";
import DrugProspectus from "@/components/DrugProspectus";
import { MapPin, RefreshCw, Compass, AlertTriangle, ShieldCheck, Glasses } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { usePharmacies } from "@/lib/hooks/usePharmacies";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] rounded-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-center mb-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-800 border-t-emerald-500" />
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Harita Yükleniyor</span>
      </div>
    </div>
  )
});

export default function Home() {
  const { pharmacies, loading, error, isOfflineData, fetchPharmacies } = usePharmacies();
  
  // Geolocation states from custom hook
  const {
    gpsStatus,
    setGpsStatus,
    userCoords,
    clearCoords,
    resolvedAddress,
    addressLoading,
    requestLocation
  } = useGeolocation();

  const [elderMode, setElderMode] = useState(false);
  const [isKvkkOpen, setIsKvkkOpen] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Selected area fallback states
  const [selectedArea, setSelectedArea] = useState<{ city: string; district: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Wrapper for requestLocation to also fetch pharmacies
  const handleRequestLocation = useCallback(() => {
    requestLocation(
      (lat, lng) => fetchPharmacies(lat, lng), // onSuccess
      () => setShowPicker(true) // onError
    );
  }, [requestLocation, fetchPharmacies]);

  const handleOnboardingComplete = (useGps: boolean) => {
    setIsAppReady(true);
    if (useGps) {
      requestLocation();
    } else {
      setGpsStatus("denied");
      setShowPicker(true);
    }
  };

  const handleManualSearch = useCallback((city: string, district: string) => {
    setSelectedArea({ city, district });
    clearCoords(); // Clear GPS coordinates to bypass distance sorting based on GPS
    setShowPicker(false);
    fetchPharmacies(undefined, undefined, city, district);
  }, [clearCoords, fetchPharmacies]);


  if (!isAppReady) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col flex-grow items-center bg-background px-4 pb-12 pt-6 font-sans">
      <main className="w-full max-w-md flex flex-col flex-grow">
        
        {/* Header Branding */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-900/30">
              <span className="text-xl font-bold text-white leading-none">+</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-100 flex items-center gap-1.5">
                Eczane<span className="text-emerald-500">+</span>
              </h1>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none mt-0.5">
                En yakın nöbetçi eczaneye tek dokunuş.
              </p>
            </div>
          </div>

          {/* Action Header Button */}
          <div className="flex items-center gap-2">
            {/* Elder Mode Toggle */}
            <button
              onClick={() => setElderMode(!elderMode)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 border ${
                elderMode
                  ? "bg-white text-black border-black font-black"
                  : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300"
              }`}
            >
              <Glasses className="h-4 w-4 shrink-0" />
              {elderMode ? "Standart Mod" : "Büyük Yazı"}
            </button>

            {gpsStatus === "granted" && (
              <button
                onClick={handleRequestLocation}
                disabled={loading}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 border ${
                  elderMode
                    ? "bg-black text-white border-white font-black"
                    : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300"
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
                Yenile
              </button>
            )}
          </div>
        </header>

        {/* GPS Prompt / Status Messaging */}
        <div className="mb-5 space-y-3">
          {isOfflineData && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-center flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                  Çevrimdışı Çalışma Modu
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                İnternet bağlantısı yok. Bilgiler yerel veritabanı önbelleğinden getirildi.
              </span>
            </div>
          )}
          {gpsStatus === "requesting" && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center animate-pulse-slow">
              <Compass className="mx-auto h-7 w-7 text-emerald-500 animate-spin" />
              <p className="mt-2 text-xs font-semibold text-neutral-300">
                Konumunuz alınıyor...
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">
                En yakın nöbetçi eczaneleri sıralamak için konum izni gereklidir.
              </p>
            </div>
          )}

          {gpsStatus === "denied" && !selectedArea && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
              <div className="flex justify-center mb-1">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h4 className="text-xs font-bold text-amber-200">Konum alamadık.</h4>
              <p className="mt-1 text-[11px] text-neutral-400 leading-normal">
                İl/ilçe seçerek devam edebilirsin veya tekrar konum izni isteyebilirsin.
              </p>
              <button
                onClick={handleRequestLocation}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
              >
                Konum İznini Yeniden Dene →
              </button>
            </div>
          )}

          {gpsStatus === "granted" && (
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center flex flex-col items-center justify-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-300">
                  Konuma Göre Sıralandı (En Yakın 3 Eczane)
                </span>
              </div>
              {addressLoading ? (
                <span className="text-[9px] text-neutral-500 font-semibold animate-pulse">Konum adı çözülüyor...</span>
              ) : resolvedAddress ? (
                <span className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                  📍 {resolvedAddress}
                </span>
              ) : null}
            </div>
          )}

          {selectedArea && !gpsStatus.includes("granted") && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Seçilen Bölge
                </span>
                <span className="text-xs font-bold text-neutral-200">
                  {selectedArea.city} / {selectedArea.district}
                </span>
              </div>
              <button
                onClick={() => setShowPicker(true)}
                className="rounded-xl border border-neutral-800 bg-neutral-800/60 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
              >
                Değiştir
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && pharmacies.length === 0 && (
          <div className="flex flex-grow flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-800 border-t-emerald-500" />
            <p className="mt-4 text-xs font-semibold text-neutral-400">Yükleniyor...</p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="my-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-xs text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {/* Health, Weather, and Holiday Dashboard */}
        {userCoords.lat && userCoords.lng && !elderMode && (
           <HealthDashboard latitude={userCoords.lat} longitude={userCoords.lng} />
        )}

        {/* Drug Prospectus Lookup */}
        <DrugProspectus elderMode={elderMode} />

        {/* Interactive Map */}
        {!loading && pharmacies.length > 0 && (
          <div className="mb-6">
            <InteractiveMap 
              pharmacies={pharmacies} 
              userCoords={userCoords.lat && userCoords.lng ? { lat: userCoords.lat, lng: userCoords.lng } : null}
            />
          </div>
        )}

        {/* Pharmacy Cards List */}
        <div className="space-y-4 flex-grow">
          {pharmacies.slice(0, 3).map((pharmacy, index) => (
            <motion.div
              key={pharmacy.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <PharmacyCard pharmacy={pharmacy} index={index} elderMode={elderMode} />
            </motion.div>
          ))}
          
          {pharmacies.length > 3 && (
            <button
               onClick={() => setShowPicker(true)} // Or implement a 'showAll' state
               className="w-full py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white transition"
            >
              Tüm Eczaneleri Göster ({pharmacies.length})
            </button>
          )}

          {/* Empty state when no pharmacies found */}
          {!loading && pharmacies.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-semibold text-neutral-400">
                Hiç nöbetçi eczane bulunamadı.
              </p>
              <p className="mt-1 text-xs text-neutral-500 max-w-xs">
                Lütfen konum izni verdiğinizden emin olun veya üstteki menüden başka bir il/ilçe arayın.
              </p>
            </div>
          )}
        </div>

        {/* Google AdSense or Custom Sponsorship Banner */}
        <div className="mt-6">

        </div>



        {/* Action picker toggles / forms */}
        <div className="mt-6 space-y-4">
          {/* Toggle Button for manual picker */}
          {!showPicker && (
            <button
              onClick={() => setShowPicker(true)}
              className="w-full py-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white transition flex items-center justify-center gap-2"
            >
              <MapPin className="h-4 w-4 text-emerald-400" /> Başka Bir İl / İlçe Ara
            </button>
          )}

          {/* City / District form picker */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <CityDistrictPicker
                  onSelect={handleManualSearch}
                  defaultCity={selectedArea?.city}
                  defaultDistrict={selectedArea?.district}
                />
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="mt-2.5 w-full text-center text-xs font-semibold text-neutral-500 hover:text-neutral-400 py-1"
                >
                  Kapat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand Footer */}
        <footer className="mt-10 text-center">
          <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
            Nöbetçi+ © 2026
          </p>
          <p className="mt-1 text-[9px] text-neutral-500">
            Resmi kaynaklardan anlık olarak derlenmektedir. Reklam barındırmaz.
          </p>
          <button
            onClick={() => setIsKvkkOpen(true)}
            className="text-[9px] text-neutral-500 hover:text-emerald-400 hover:underline transition font-bold uppercase tracking-wider block mx-auto mt-2.5"
          >
            Gizlilik Politikası & KVKK Aydınlatma
          </button>
        </footer>

      </main>

      {/* KVKK Overlays */}
      <KvkkBanner />
      <KvkkModal isOpen={isKvkkOpen} onClose={() => setIsKvkkOpen(false)} />
    </div>
  );
}
