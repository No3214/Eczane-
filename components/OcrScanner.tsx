"use client";

import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { Camera, X, RefreshCw, Upload, AlertCircle, Sparkles, CheckCircle } from "lucide-react";
import { DRUGS_DATABASE } from "@/lib/drug-data";

interface OcrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (drugName: string) => void;
}

export default function OcrScanner({ isOpen, onClose, onDetected }: OcrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMatch, setSuccessMatch] = useState<string | null>(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera stream
  const startCamera = async () => {
    setError(null);
    setSuccessMatch(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Kameraya erişilemedi. Lütfen izin verin veya dosya yükleme seçeneğini kullanın.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    let frameId: number;
    if (isOpen) {
      frameId = requestAnimationFrame(() => {
        startCamera();
      });
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      stopCamera();
      document.body.style.overflow = "unset";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fuzzy match drug names in text
  const findMatchingDrug = (extractedText: string): string | null => {
    const normalizedText = extractedText.toLowerCase().replace(/[^a-zA-Z0-9şğüıiöç\s]/g, " ");
    
    // Check direct name matches first
    for (const drug of DRUGS_DATABASE) {
      const drugNameLower = drug.name.toLowerCase();
      // Look for exact word match
      const wordRegex = new RegExp(`\\b${drugNameLower}\\b`, "i");
      if (wordRegex.test(normalizedText) || normalizedText.includes(drugNameLower)) {
        return drug.name;
      }
    }

    // Try active ingredients match
    for (const drug of DRUGS_DATABASE) {
      const activeParts = drug.activeIngredient.toLowerCase().split(/[\s,()]+/);
      for (const part of activeParts) {
        // Only match parts longer than 4 characters to avoid false positives
        if (part.length > 4 && normalizedText.includes(part)) {
          return drug.name;
        }
      }
    }
    
    return null;
  };

  // Perform OCR on Image
  const processImage = async (imageSrc: string | File) => {
    setLoading(true);
    setError(null);
    setProgress("Tarayıcı motoru başlatılıyor...");
    
    let worker;
    try {
      // Create Tesseract Worker
      worker = await createWorker("tur");
      
      setProgress("Yazı okunuyor...");
      const { data: { text } } = await worker.recognize(imageSrc);
      
      console.log("OCR Extracted Text:", text);
      
      if (!text.trim()) {
        throw new Error("Görselde okunabilir herhangi bir yazı bulunamadı.");
      }

      const matchedDrug = findMatchingDrug(text);
      
      if (matchedDrug) {
        setSuccessMatch(matchedDrug);
        setProgress(`Başarılı! "${matchedDrug}" tespit edildi.`);
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        setTimeout(() => {
          onDetected(matchedDrug);
          onClose();
        }, 1200);
      } else {
        throw new Error(`İlaç tespit edilemedi. Okunan metin: "${text.slice(0, 40)}..."`);
      }
    } catch (err: unknown) {
      console.error("OCR process error:", err);
      const errMsg = err instanceof Error ? err.message : "Görsel işlenirken bir hata oluştu.";
      setError(errMsg);
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setLoading(false);
    }
  };

  // Capture frame from video feed
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop stream while processing
      stopCamera();
      
      // Get base64 image data
      const dataUrl = canvas.toDataURL("image/jpeg");
      processImage(dataUrl);
    }
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      processImage(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
            <h3 className="font-black text-sm text-neutral-100 uppercase tracking-wider">İlaç / Reçete Tarayıcı</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="relative flex-grow flex flex-col justify-center items-center p-6 min-h-[300px]">
          
          {/* Laser Scanning Effect Layer */}
          {cameraActive && !loading && !successMatch && (
            <div className="absolute left-6 right-6 top-6 bottom-24 rounded-2xl border-2 border-emerald-500/30 overflow-hidden pointer-events-none z-10">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
              {/* Scanning laser beam */}
              <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/80 shadow-[0_0_10px_2px_rgba(16,185,129,0.7)] top-0 animate-scan" />
            </div>
          )}

          {/* Camera View */}
          {cameraActive && (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full rounded-2xl border border-neutral-800 bg-black aspect-[4/3] object-cover"
            />
          )}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Status Display Overlay */}
          {!cameraActive && !loading && !successMatch && (
            <div className="w-full aspect-[4/3] rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="h-8 w-8 text-neutral-600 mb-3" />
              <p className="text-xs font-semibold text-neutral-400">Kamera Devre Dışı</p>
              <p className="text-[10px] text-neutral-500 mt-1 max-w-xs leading-normal">
                Kamera izni verilmediyse veya tarayıcıyı başlatmak istiyorsanız aşağıdaki butona tıklayın ya da cihazınızdan bir resim yükleyin.
              </p>
            </div>
          )}

          {/* Loader Overlay */}
          {loading && (
            <div className="w-full aspect-[4/3] rounded-2xl border border-neutral-800 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-xs font-bold text-neutral-200">{progress}</p>
              <p className="text-[10px] text-neutral-500 mt-1.5">Okuma işlemi cihazınızda yerel olarak gerçekleşir.</p>
            </div>
          )}

          {/* Success Overlay */}
          {successMatch && (
            <div className="w-full aspect-[4/3] rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center p-6 text-center z-10">
              <CheckCircle className="h-10 w-10 text-emerald-400 animate-bounce mb-3" />
              <p className="text-sm font-black text-emerald-300">{successMatch}</p>
              <p className="text-[10px] text-neutral-400 mt-1">İlaç tespit edildi. Prospektüs açılıyor...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full mt-4 p-3.5 rounded-2xl border border-red-500/10 bg-red-500/5 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-[11px] font-black text-red-400 uppercase tracking-wide">Okuma Hatası</p>
                <p className="text-[10px] text-neutral-400 leading-normal mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-neutral-800 bg-neutral-950/40 flex gap-3">
          {cameraActive ? (
            <button
              onClick={captureFrame}
              disabled={loading || !!successMatch}
              className="flex-grow py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/30 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Camera className="h-4 w-4" /> Fotoğraf Çek & Tara
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={loading || !!successMatch}
              className="flex-grow py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" /> Kamerayı Yeniden Başlat
            </button>
          )}

          <label className="px-4 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer flex items-center justify-center shrink-0 active:scale-95">
            <Upload className="h-4 w-4" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={loading || !!successMatch}
            />
          </label>
        </div>

      </div>
    </div>
  );
}
