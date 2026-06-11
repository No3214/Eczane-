import { Metadata } from "next";
import { fromSlug, toSlug } from "@/lib/slugs";
import citiesData from "@/data/tr-cities-districts.json";
import Link from "next/link";
import { ChevronLeft, Phone, MapPin, Navigation } from "lucide-react";
import { notFound } from "next/navigation";
import { IzmirProvider } from "@/lib/providers/izmir-provider";
import { CollectApiProvider } from "@/lib/providers/collectapi-provider";
import { SupabaseProvider } from "@/lib/providers/supabase-provider";
import { MockProvider } from "@/lib/providers/mock-provider";
import { normalizePharmacy } from "@/lib/pharmacy-normalizer";
import { Pharmacy } from "@/types/pharmacy";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nobetci-plus.vercel.app";

const providers = [
  new IzmirProvider(),
  new CollectApiProvider(),
  new SupabaseProvider(),
  new MockProvider()
].sort((a, b) => a.priority - b.priority);

async function getPharmacies(city: string, district: string): Promise<Pharmacy[]> {
  const input = { city, district };
  for (const provider of providers) {
    if (provider.canHandle(input)) {
      try {
        const results = await provider.fetch(input);
        if (results.length > 0) {
          return results.map(r => normalizePharmacy(r, provider.name as any));
        }
      } catch (err) {
        console.error(`SSR Provider ${provider.name} failed:`, err);
      }
    }
  }
  return [];
}

interface Props {
  params: Promise<{ city: string; district: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, district } = await params;
  const cityName = fromSlug(city);
  const districtName = fromSlug(district);
  return {
    title: `${districtName} Nöbetçi Eczaneleri | Eczane+`,
    description: `${cityName} ili ${districtName} ilçesindeki tüm nöbetçi eczaneler. En güncel ${districtName} nöbetçi eczane telefon, adres ve harita bilgisi.`,
    alternates: {
      canonical: `${SITE_URL}/${city}/${district}/nobetci-eczane`,
    },
    openGraph: {
      title: `${districtName} Nöbetçi Eczaneleri | Eczane+`,
      description: `${cityName} ili ${districtName} ilçesi nöbetçi eczane rehberi.`,
      url: `${SITE_URL}/${city}/${district}/nobetci-eczane`,
      type: "website",
    },
  };
}

export default async function DistrictPharmaciesPage({ params }: Props) {
  const { city, district } = await params;
  const cityName = fromSlug(city);
  const districtName = fromSlug(district);

  // Validate city & district
  const cityData = citiesData.find(c => c.city.toLowerCase() === cityName.toLowerCase());
  if (!cityData) {
    notFound();
  }
  const hasDistrict = cityData.districts.some(d => toSlug(d) === toSlug(districtName));
  if (!hasDistrict) {
    notFound();
  }

  const pharmacies = await getPharmacies(cityName, districtName);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${districtName} nöbetçi eczaneleri nerede?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${districtName} ilçesinde şu an nöbetçi olan eczanelerin tam listesi, telefon numaraları ve adres bilgileri sayfamızda listelenmektedir.`
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

        <Link href={`/${city}/nobetci-eczane`} className="text-emerald-500 text-xs font-bold mb-4 flex items-center gap-1 hover:underline">
          <ChevronLeft className="h-4 w-4" /> {cityName} İlçeleri
        </Link>
        
        <h1 className="text-2xl font-black text-emerald-400 mb-2">{districtName} Nöbetçi Eczane</h1>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          {cityName} ilinin {districtName} ilçesinde nöbetçi olan eczanelerin güncel adres ve telefon listesi aşağıdadır. Lütfen yola çıkmadan önce eczaneyi arayarak nöbet durumunu teyit edin.
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

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Eczane Listesi</h3>
          
          {pharmacies.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
              <p className="text-xs text-neutral-400 font-semibold">Bu ilçe için şu an aktif nöbetçi eczane kaydı bulunamadı.</p>
            </div>
          ) : (
            pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 hover:border-neutral-700 transition-all"
              >
                <h3 className="font-black text-neutral-100 text-lg leading-tight">{pharmacy.name}</h3>
                
                {pharmacy.warning_message && (
                  <p className="text-[10px] text-amber-500/80 font-bold mt-2 flex items-center gap-1 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                    ⚠️ {pharmacy.warning_message}
                  </p>
                )}

                <p className="mt-3 text-xs text-neutral-400 font-medium leading-relaxed">
                  {pharmacy.address}
                </p>

                {pharmacy.source_label && (
                  <div className="mt-2 text-[9px] text-neutral-500 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Kaynak: {pharmacy.source_label}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a
                    href={`tel:${pharmacy.phone.replace(/\s+/g, "")}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 py-3 text-xs font-bold text-neutral-200 transition-all"
                  >
                    <Phone className="h-4 w-4" /> Ara
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/95 hover:bg-emerald-500 py-3 text-xs font-bold text-white transition-all shadow-md"
                  >
                    <Navigation className="h-4 w-4" /> Yol Tarifi
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
