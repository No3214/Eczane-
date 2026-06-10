"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyId: string;
  pharmacyName: string;
}

const REPORT_TYPES = [
  { value: "wrong_location", label: "📍 Konum Yanlış / Farklı Yerde" },
  { value: "wrong_phone", label: "📞 Telefon Numarası Yanlış" },
  { value: "closed", label: "🔒 Eczane Kapalı / Nöbetçi Değil" },
  { value: "wrong_address", label: "📝 Adres Eksik / Hatalı" },
  { value: "other", label: "❓ Diğer Sorun" }
];

export default function ReportDialog({
  isOpen,
  onClose,
  pharmacyId,
  pharmacyName
}: ReportDialogProps) {
  const [reportType, setReportType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [allowLocation, setAllowLocation] = useState(false);

  const handleLocationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAllowLocation(checked);
    if (checked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          setAllowLocation(false);
          alert("Konum alınamadı. Lütfen tarayıcı izinlerinizi kontrol edin.");
        },
        { enableHighAccuracy: true }
      );
    } else if (!checked) {
      setCoords({});
    }
  };

  useEffect(() => {
    if (isOpen) {
      const frameId = requestAnimationFrame(() => {
        setReportType("");
        setMessage("");
        setIsSuccess(false);
        setIsSubmitting(false);
      });
      return () => {
        cancelAnimationFrame(frameId);
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType) return;

    setIsSubmitting(true);

    try {
      const payload = {
        pharmacy_id: pharmacyId,
        pharmacy_name: pharmacyName,
        report_type: reportType,
        message: message.trim(),
        user_latitude: coords.lat,
        user_longitude: coords.lng
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        alert("Bildirim gönderilemedi: " + (data.error || "Bilinmeyen Hata"));
      }
    } catch (err) {
      console.error("Submit report error:", err);
      alert("Bir internet bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Portal>
        {/* Backdrop */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

        {/* Drawer content container */}
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl bg-neutral-900 p-6 text-white shadow-2xl border-t border-neutral-800 focus:outline-none flex flex-col max-h-[96vh]">
          {/* Header Handle */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-700 shrink-0 cursor-row-resize" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-emerald-400" />
              <Drawer.Title className="font-bold text-sm text-neutral-100">
                Sorun Bildir
              </Drawer.Title>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-neutral-800 p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-0.5 mt-4">
            <Drawer.Description className="hidden">
              Sorun bildir formu
            </Drawer.Description>
            
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-pulse" />
                <h4 className="mt-4 text-lg font-bold">Bildiriminiz Alındı</h4>
                <p className="mt-2 text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Geri bildiriminiz için teşekkürler! Harita koordinatları ve bilgiler en kısa sürede doğrulanacaktır.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-neutral-400 leading-normal">
                  <span className="font-semibold text-emerald-400">{pharmacyName}</span> hakkında hatalı olan bilgiyi seçip detaylı bilgi ekleyebilirsiniz.
                </p>

                {/* Options */}
                <div className="space-y-2.5">
                  {REPORT_TYPES.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                        reportType === opt.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold"
                          : "border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={opt.value}
                        checked={reportType === opt.value}
                        onChange={(e) => setReportType(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Extra explanation */}
                {reportType && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                      Açıklama (İsteğe bağlı)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Örn: Eczane arka sokakta kalıyor, telefon meşgul çalıyor vb."
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-800 p-3 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      rows={3}
                    />
                  </div>
                )}

                {/* Explicit Consent for Location */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="allowLocation"
                    checked={allowLocation}
                    onChange={handleLocationToggle}
                    className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-neutral-900"
                  />
                  <label htmlFor="allowLocation" className="text-xs text-neutral-400 leading-tight">
                    Hata doğrulaması için mevcut konumumun gönderilmesine izin veriyorum. (İsteğe bağlı)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-neutral-800 py-3.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-700 transition"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={!reportType || isSubmitting}
                    className="flex-1 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...
                      </>
                    ) : (
                      "Bildir"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
