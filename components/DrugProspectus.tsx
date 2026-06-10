"use client";

import { useState } from "react";
import { BookOpen, Search, Pill, Activity, HelpCircle, AlertTriangle, Clock, Camera } from "lucide-react";
import { DRUGS_DATABASE, DrugInfo } from "@/lib/drug-data";
import { motion, AnimatePresence } from "framer-motion";
import OcrScanner from "./OcrScanner";

interface DrugProspectusProps {
  elderMode?: boolean;
}

export default function DrugProspectus({ elderMode = false }: DrugProspectusProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<DrugInfo | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSelectedDrug(null);
      return;
    }
    
    const matched = DRUGS_DATABASE.find(d => 
      d.name.toLowerCase().includes(query.toLowerCase()) || 
      d.activeIngredient.toLowerCase().includes(query.toLowerCase())
    );
    setSelectedDrug(matched || null);
  };

  const handleSelectQuick = (drug: DrugInfo) => {
    setSearchQuery(drug.name);
    setSelectedDrug(drug);
  };

  // Popular quick suggestions
  const quickSuggs = DRUGS_DATABASE.slice(0, 4);

  return (
    <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide ${
          elderMode ? "text-base" : "text-xs"
        }`}>
          <BookOpen className="h-4 w-4" /> 📖 İlaç Prospektüs Bilgisi
        </h3>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3 flex items-center">
        <input 
          type="text" 
          placeholder="İlaç veya etken madde adı yazın (örn: Parol)..." 
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-11 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 transition-all ${
            elderMode ? "text-base py-3" : "text-xs"
          }`}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
        <button
          onClick={() => setIsScannerOpen(true)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-emerald-400 active:scale-95 transition"
          title="Kamerayla İlaç Tara"
        >
          <Camera className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Quick Suggestion Pills */}
      {!selectedDrug && (
        <div className="mb-4">
          <span className={`text-neutral-500 font-bold block mb-1.5 ${
            elderMode ? "text-xs" : "text-[10px] uppercase tracking-wider"
          }`}>
            Sık Aranan İlaçlar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggs.map((drug) => (
              <button
                key={drug.id}
                onClick={() => handleSelectQuick(drug)}
                className={`bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/30 text-neutral-300 hover:text-emerald-400 rounded-lg px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-900 transition ${
                  elderMode ? "text-sm font-bold" : "text-[10px] font-semibold"
                }`}
              >
                {drug.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Display Area */}
      <AnimatePresence mode="wait">
        {selectedDrug ? (
          <motion.div
            key={selectedDrug.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-3 mt-4"
          >
            {/* Header Block */}
            <div className="flex items-center gap-2 bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/50">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Pill className="h-4 w-4" />
              </div>
              <div>
                <h4 className={`font-black text-neutral-100 ${elderMode ? "text-lg" : "text-sm"}`}>
                  {selectedDrug.name}
                </h4>
                <p className={`text-neutral-500 font-medium ${elderMode ? "text-xs" : "text-[10px]"}`}>
                  {selectedDrug.drugClass}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5">
              {/* Etken Madde */}
              <div className="p-3 bg-neutral-950/30 rounded-xl border border-neutral-800/40">
                <span className={`text-neutral-500 font-bold block uppercase tracking-wider mb-1 ${
                  elderMode ? "text-xs" : "text-[9px]"
                }`}>
                  🧪 Etken Madde
                </span>
                <p className={`text-neutral-200 font-bold ${elderMode ? "text-base" : "text-xs"}`}>
                  {selectedDrug.activeIngredient}
                </p>
              </div>

              {/* Kullanım Amacı */}
              <div className="p-3 bg-neutral-950/30 rounded-xl border border-neutral-800/40">
                <span className={`text-neutral-500 font-bold block uppercase tracking-wider mb-1 ${
                  elderMode ? "text-xs" : "text-[9px]"
                }`}>
                  💡 Ne İçin Kullanılır? (Endikasyon)
                </span>
                <p className={`text-neutral-200 leading-relaxed ${elderMode ? "text-base" : "text-xs"}`}>
                  {selectedDrug.purpose}
                </p>
              </div>

              {/* Bilimsel Açıklama */}
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <span className={`text-emerald-400 font-black block uppercase tracking-wider mb-1 flex items-center gap-1 ${
                  elderMode ? "text-xs" : "text-[9px]"
                }`}>
                  <Activity className="h-3.5 w-3.5" /> Bilimsel Etki Mekanizması
                </span>
                <p className={`text-neutral-300 leading-relaxed ${elderMode ? "text-base" : "text-xs"}`}>
                  {selectedDrug.scientificExplanation}
                </p>
              </div>

              {/* Nasıl Kullanılır */}
              <div className="p-3 bg-neutral-950/30 rounded-xl border border-neutral-800/40">
                <span className={`text-neutral-500 font-bold block uppercase tracking-wider mb-1 flex items-center gap-1 ${
                  elderMode ? "text-xs" : "text-[9px]"
                }`}>
                  <Clock className="h-3.5 w-3.5" /> Kullanım Şekli & Dozajı
                </span>
                <p className={`text-neutral-200 leading-relaxed ${elderMode ? "text-base" : "text-xs"}`}>
                  {selectedDrug.howToUse}
                </p>
              </div>

              {/* Önemli Uyarılar */}
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className={`text-amber-400 font-black block uppercase tracking-wider mb-1 flex items-center gap-1 ${
                  elderMode ? "text-xs" : "text-[9px]"
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5" /> ⚠️ Kritik Uyarılar
                </span>
                <p className={`text-neutral-300 leading-relaxed ${elderMode ? "text-base" : "text-xs"}`}>
                  {selectedDrug.warnings}
                </p>
              </div>
            </div>
          </motion.div>
        ) : searchQuery.trim() ? (
          <motion.div
            key="not-found"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-neutral-950/40 border border-neutral-800/80 rounded-xl text-center"
          >
            <HelpCircle className="mx-auto h-7 w-7 text-neutral-600 mb-2" />
            <h4 className={`font-bold text-neutral-400 ${elderMode ? "text-base" : "text-xs"}`}>
              Kayıtlı İlaç Bulunamadı
            </h4>
            <p className={`text-neutral-500 mt-1 leading-normal ${elderMode ? "text-sm" : "text-[10px]"}`}>
              Girdiğiniz ilaç ismi yerel prospektüs listemizde eşleşmedi. Doğru kullanımdan emin olmak için lütfen hekiminize veya eczacınıza danışın.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <p className={`text-neutral-500 italic ${elderMode ? "text-sm" : "text-[10px]"}`}>
              Etken madde ve bilimsel çalışma detaylarını incelemek için yukarıdan bir ilaç aratın veya sık kullanılan ilaçlardan birine tıklayın.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tıbbi Uyarı / Yasal Sorumluluk Sınırı */}
      <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className={`text-neutral-500 leading-normal font-medium ${elderMode ? "text-xs" : "text-[9px]"}`}>
          <strong>Yasal Uyarı:</strong> Burada sunulan bilgiler sadece bilgilendirme amaçlıdır. Bir hekim tavsiyesi, tıbbi tanı veya tedavi yöntemi yerine geçmez. İlaç kullanımı ve sağlık sorunlarınız için lütfen doktorunuza veya eczacınıza danışın.
        </p>
      </div>

      {/* OCR Scanner Component */}
      <OcrScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onDetected={(drugName) => handleSearch(drugName)} 
      />
    </div>
  );
}
