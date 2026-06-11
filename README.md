# Eczane+ (Nöbetçi+) — Güven Skorlu Acil Durum Eczane Asistanı 🏥

Eczane+, acil durumlarda reklamlarla, karmaşık arayüzlerle veya yavaş yüklenen haritalarla vakit kaybetmeden konumunuza en yakın nöbetçi eczaneye en az dokunuşla ulaşmanızı sağlayan, güven-öncelikli bir mobil sağlık rota asistanıdır.

---

## 🚀 Öne Çıkan Özellikler

- **Sade & Reklamsız:** Kullanıcıyı reklama boğmayan, tamamen amaca odaklı minimalist arayüz.
- **Acil Durum Modu (Büyük Yazı):** Yaşlı veya kriz anındaki kullanıcılar için tek dokunuşla butonları büyüten ve okumayı kolaylaştıran özel mod.
- **Konumla En Yakın Eczane:** GPS koordinatlarını alarak en yakın 3 eczaneyi anında listeleme ve harita üzerinde gösterme.
- **Katlanabilir Harita (React Leaflet):** İhtiyaç duyulduğunda açılabilen, kullanıcı ve eczane konumlarını işaretleyen entegre harita paneli.
- **İlaç Kutusu / Reçete Tarayıcı:** Tesseract.js (WASM OCR) entegrasyonu sayesinde ilaç kutusunun fotoğrafını çekerek veya yükleyerek otomatik prospektüs sorgulama.
- **Paylaşılabilir Bilgi Kartları:** Eczane adı, açık adresi, telefonu ve harita yönlendirme QR kodunu içeren resimli kartlar üreterek WhatsApp/Panoya kopyalama desteği.
- **Offline-First (Dexie.js & localStorage):** İnternet bağlantısı koptuğunda dahi son aranan eczaneleri ve prospektüsleri IndexedDB üzerinden anında görüntüleme.
- **PWA Desteği:** Serwist (Workbox) tabanlı, çevrimdışı fallback sayfası (`offline.html`) olan ve versioned caching uygulayan güçlü servis işçisi (service worker).

---

## 🛡️ Güven ve KVKK Yaklaşımı

Eczane+ olarak kullanıcı verilerinin güvenliğine ve gizliliğine en üst düzeyde önem veriyoruz:
1. **Sessiz Konum İsteme Yok:** Uygulama açılışında kullanıcı onboarding onayını vermedikçe konum talebi yapılmaz. Hata bildirim ekranında (`ReportDialog`) kullanıcının açık rızasını belirten onay kutusu (checkbox) işaretlenmedikçe geolocation servisleri tetiklenmez.
2. **Kişisel Veri Saklanmaz:** Kullanıcının koordinatları hiçbir uzak sunucuya kaydedilmez. Sadece en yakın eczaneleri listelemek için anlık olarak istemci tarafında işlenir.
3. **Güvenli Yönetici Paneli:** `/api/reports` admin endpoint'lerinde herhangi bir varsayılan (hardcoded) şifre barındırılmaz. Ortam değişkenlerinde `ADMIN_SECRET_KEY` tanımlı değilse admin paneli 503 "Admin paneli yapılandırılmamış." hatası vererek kendini tamamen kilitler.

---

## 🔌 Veri Sağlayıcı (Provider) Mimarisi

Sistemde esnek ve hata payı olmayan zincirleme (chain) bir veri mimarisi kuruludur:
1. **İzmir Resmi Açık Veri (`IzmirProvider` - Öncelik: 10):** İzmir Büyükşehir Belediyesi'nin resmi açık veri portalından doğrudan çekilen en güncel nöbet listesi.
2. **CollectAPI (`CollectApiProvider` - Öncelik: 20):** Tüm Türkiye geneli nöbetçi eczane bilgilerini getiren ticari API (API Anahtarı gerektirir).
3. **Supabase (`SupabaseProvider` - Öncelik: 30):** Yedeklenmiş veya önbelleğe alınmış eczane kayıtlarını sorgulayan veritabanı.
4. **Mock Fallback (`MockProvider` - Öncelik: 100):** API sınırları aşıldığında veya bağlantı koptuğunda uygulamanın çökmesini önleyen demo veri sağlayıcısı.

> [!NOTE]
> Demo verileri kullanıldığında kayıtlara otomatik olarak `Demo veri` etiketi eklenir ve kullanıcının güvenliği için "Yola çıkmadan önce resmi kaynaklardan teyit edin." uyarısı gösterilir.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18+)
- npm

### Kurulum Adımları
1. Bağımlılıkları yükleyin:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Çevre değişkenlerini ayarlayın:
   `.env.example` dosyasını kopyalayarak `.env` veya `.env.local` oluşturun ve gerekli anahtarları doldurun.
   ```bash
   cp .env.example .env
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

---

## 🌍 Çevre Değişkenleri (Environment Variables)

Doldurulması gereken değişkenler:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase projenizin API URL'i.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonim API anahtarınız.
- `COLLECTAPI_KEY`: CollectAPI üzerinden Türkiye geneli veri çekmek için gerekli API key (`apikey xxx` formatında).
- `ADMIN_SECRET_KEY`: Hata bildirimlerini yönetmek amacıyla admin paneline girişte kullanılan güçlü şifre.
- `NOMINATIM_CONTACT_EMAIL`: Ters jeokodlama (konumdan adres çözümleme) işlemleri için Nominatim'e gönderilen iletişim e-postası.
- `NEXT_PUBLIC_FEATURE_TAXI_AFFILIATE`: Eczane kartlarında taksi çağırma linkini aktif etmek için `true` (varsayılan: `false`).

---

## ⚡ SEO ve Rota Stratejisi

Arama motorlarının nöbetçi eczaneleri indeksleyebilmesi için dinamik sunucu taraflı (SSR) rotalar eklenmiştir:
- `/nobetci-eczane`: Türkiye geneli şehir seçim listesi.
- `/[city]/nobetci-eczane`: Şehre ait ilçelerin listesi.
- `/[city]/[district]/nobetci-eczane`: İlgili ilçe için aktif nöbetçi eczanelerin sunucu tarafında oluşturulan (SSR) statik listesi.

Her SEO sayfasında canonical adresler, OpenGraph meta etiketleri ve arama sonuçlarında doğrudan görünmek üzere **JSON-LD FAQPage** şemaları yer almaktadır.

---

## 🧪 Test ve Doğrulama

Tüm testleri vitest ile çalıştırmak için:
```bash
npm run test
```
*Toplam 72 adet unit test başarıyla geçmektedir.*

---

## 🗺️ Yol Haritası (Roadmap)
- [x] OSRM tabanlı canlı rota çizimi ve neon harita görselleştirmesi.
- [x] Çevrimdışı veritabanı önbelleği (Dexie.js).
- [x] Kamera/Resim ile reçete ve ilaç kutusu OCR taraması.
- [x] Resimli acil eczane kartları üretimi ve paylaşımı.
- [x] iOS/Android benzeri native touch-draggable alt drawer panelleri (Vaul).
- [x] 81 il ve ilçeyi destekleyen searchable combobox altyapısı.
- [x] SEO uyumlu SSR sayfa yapısı ve Schema.org entegrasyonu.
- [ ] OSRM entegrasyonu V2 (Eczaneye kaç dakika uzaklıkta olduğunuzu gösteren canlı süre sayacı).
