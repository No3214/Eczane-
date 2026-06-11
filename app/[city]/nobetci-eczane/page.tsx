import { Metadata } from "next";
import { fromSlug, toSlug } from "@/lib/slugs";
import citiesData from "@/data/tr-cities-districts.json";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nobetci-plus.vercel.app";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = fromSlug(city);
  return {
    title: `${cityName} Nöbetçi Eczaneleri | Eczane+`,
    description: `${cityName} ilindeki tüm nöbetçi eczaneler. En yakın ${cityName} nöbetçi eczane adres, telefon ve harita bilgileri.`,
    alternates: {
      canonical: `${SITE_URL}/${city}/nobetci-eczane`,
    },
    openGraph: {
      title: `${cityName} Nöbetçi Eczaneleri | Eczane+`,
      description: `${cityName} ilindeki anlık nöbetçi eczane rehberi.`,
      url: `${SITE_URL}/${city}/nobetci-eczane`,
      type: "website",
    },
  };
}

export default async function CityPharmaciesPage({ params }: Props) {
  const { city } = await params;
  const cityName = fromSlug(city);
  const cityData = citiesData.find(c => c.city.toLowerCase() === cityName.toLowerCase());

  if (!cityData) {
    notFound();
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${cityName} nöbetçi eczanelerine nasıl ulaşabilirim?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${cityName} ilindeki nöbetçi eczane listesine, ilçenizi seçerek veya konum izni vererek en yakın eczaneyi görerek ulaşabilirsiniz.`
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

        <Link href="/nobetci-eczane" className="text-emerald-500 text-xs font-bold mb-4 flex items-center gap-1 hover:underline">
          <ChevronLeft className="h-4 w-4" /> Tüm Şehirler
        </Link>
        
        <h1 className="text-2xl font-black text-emerald-400 mb-2">{cityName} Nöbetçi Eczane</h1>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          {cityName} ilindeki tüm nöbetçi eczanelerin listesi. İlçe seçerek o bölgedeki nöbetçi eczaneleri inceleyebilirsiniz. GPS konumunuzu kullanarak en yakın eczaneye yol tarifi almak için uygulamamızı açın.
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

        {cityData && (
          <div>
            <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-wider pl-1">{cityName} İlçeleri</h3>
            <div className="grid grid-cols-2 gap-2">
              {cityData.districts.map(district => (
                <Link
                  key={district}
                  href={`/${city}/${toSlug(district)}/nobetci-eczane`}
                  className="px-3.5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:border-emerald-500/50 hover:text-white transition-all block text-center"
                >
                  {district}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
