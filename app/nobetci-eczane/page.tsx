import Link from "next/link";
import citiesData from "@/data/tr-cities-districts.json";
import { toSlug } from "@/lib/slugs";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nobetci-plus.vercel.app";

export const metadata: Metadata = {
  title: "Türkiye Nöbetçi Eczaneleri | Eczane+",
  description: "Türkiye geneli en güncel nöbetçi eczaneler listesi. İl ve ilçe seçerek size en yakın nöbetçi eczaneyi hemen bulun.",
  alternates: {
    canonical: `${SITE_URL}/nobetci-eczane`,
  },
  openGraph: {
    title: "Türkiye Nöbetçi Eczaneleri | Eczane+",
    description: "81 ilde en yakın nöbetçi eczane adres ve telefon bilgileri.",
    url: `${SITE_URL}/nobetci-eczane`,
    type: "website",
  },
};

export default function TurkeyPharmaciesPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Nöbetçi eczaneleri nasıl bulabilirim?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Eczane+ uygulamasında konum izni vererek en yakın 3 nöbetçi eczaneye yol tarifi alabilir, telefonla arayabilir veya listemizden il/ilçe araması yapabilirsiniz."
        }
      },
      {
        "@type": "Question",
        "name": "Eczane+ verileri güncel mi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Evet, eczane verilerimiz resmi belediye açık veri portallarından ve canlı sağlık veri sağlayıcılarından anlık olarak çekilerek güncellenmektedir."
        }
      }
    ]
  };

  return (
    <div className="flex flex-col items-center bg-background px-4 pb-12 pt-6 font-sans flex-grow">
      <main className="w-full max-w-md">
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <h1 className="text-2xl font-black text-emerald-400 mb-2">Türkiye Nöbetçi Eczaneleri</h1>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Tüm Türkiye'deki 81 ilde anlık nöbetçi eczane listelerine ulaşın. Konumunuza en yakın nöbetçi eczaneyi haritada görmek ve yol tarifi almak için ana sayfamızı ziyaret edebilirsiniz.
        </p>

        {/* Action CTA Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="block w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-center text-xs font-black uppercase text-white transition-all shadow-lg shadow-emerald-950/20"
          >
            📍 Konumla En Yakın Eczaneyi Bul
          </Link>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Şehir Listesi</h3>
          {citiesData.map((data) => (
            <Link 
              key={data.city} 
              href={`/${toSlug(data.city)}/nobetci-eczane`}
              className="block p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 transition-all"
            >
              <h2 className="text-sm font-bold text-neutral-200">{data.city} Nöbetçi Eczaneleri</h2>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">{data.districts.length} İLÇE DETAYI</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
