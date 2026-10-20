# Türkçe alan önbelleği — CI bulgusu ve takip düzeltmesi

**Durum: yerel doğrulama tamamlandı; yeni commit üzerinde stock CI kabulü bekleniyor.** Bu kayıt, `a19404206966f7abe4ea6a37f8bba62eb91d5c1f` commit'inin gerçek tarayıcı kabulünde ortaya çıkan Dexie/Türkçe alan sorgusu hatasını düzeltir. Önceki C kaynak ve kanıtları korunmuştur.

## Gerçek hata ve neden

[39445094023 numaralı CI çalışması](https://github.com/No3214/Eczane-/actions/runs/39445094023) **12 geçti /3 başarısız** sonuçlandı: yeni `cache-area.spec.ts` Chromium, Firefox ve WebKit'te ilk deneme ve iki tekrarında başarısız oldu. Toplam 9 başarısız denemenin son çevrimdışı Konak aramasında 75. satır `TEST QUERY KONAK` beklerken boş kart listesi aldı. 78/79. satırlardaki ilçe sırası ve `unexpectedRequests=[]` assertion'larına ulaşılmadı. Bu sonuç “15 geçti” olarak değerlendirilmedi. Tam 574 yaprak, 102 kaynak dosya, gerçek checkout `ec32f472edecceacfb9c5ac750869dc4bc7bfdcd` ve artifact digest'i doğrulandı. [Başarısız çalışma özeti](../proof/turkish-cache-2026-10-20c/hosted-parent/hosted-acceptance.json), [hata/trace kayıtları](../proof/turkish-cache-2026-10-20c/hosted-parent/failure-evidence.json).

Kurulu **Dexie4.4.3** `equalsIgnoreCase` sorgusunun kendi collection range metadata'sında `İzmir` için alt sınır `İZMIR`, üst sınır `i\u0307zmir` oluşur; alt sınır üstten büyüktür. `izmir` sorgusunun `IZMIR..izmir` aralığı da depolanan `İzmir` anahtarını dışarıda bırakır. [Gerçek kurulu paket diagnostik çıktısı](../proof/turkish-cache-2026-10-20c/evidence/dexie-range.json) paket/modül hash'lerini önce ve sonra eşleştirir. Node'da IndexedDB olmadığından yalnızca metod içermeyen boş bir IDBKeyRange varlık nesnesi kullanıldı; veritabanı açılmadı ve gerçek IndexedDB exception'ı çalıştırılmadı. İlk MissingAPI denemesi de saklandı. Hosted trace'lerde `Dexie read error:` öneki görülür; minify edilmiş hata nesneleri tam exception türünü göstermez. Range diagnostik kanıtı ve trace gözlemi bu nedenle ayrı tutulur.

Eski birim mock'u `equalsIgnoreCase` işlemini Türkçe locale ile taklit ediyordu; bu, gerçek Dexie indeks davranışı değildi ve tarayıcıda görülen hatayı gizledi.

## Değişiklik

Yalnızca alan tabanlı çevrimdışı fallback, `db.pharmacies.toArray()` ile önbellek kayıtlarını alır ve mevcut `scopedRows` üzerinden geçirir. Böylece kayıt şekli/sonlu koordinatlar doğrulanır; **şehir ve ilçe birlikte**, trim ve `toLocaleLowerCase('tr-TR')` ile eşleşir. Okuma sonrasındaki güncel istek ve mounted kontrolü korunur. Başka şehrin aynı adlı ilçesi kabul edilmez. GPS fallback, atomik localStorage zarfı ve anlamlı boş snapshot davranışı değişmez.

Unit mock artık filtrelenmemiş depolama satırlarını döndürür; sahte indeks harf dönüşümü kaldırılmıştır. Üç İzmir yazım biçimi (`İzmir`, `izmir`, boşluklu `İZMİR`) ile bozuk kayıtlar/koordinatlar, başka şehir ve başka ilçe birlikte denenir. Bir ek vaka `IĞDIR/ARALIK` ile Türkçe noktasız `ı` eşleşmesini denetler. Önceki 23 regresyon korunur; toplam **27** olur. [Kaynak farkı](../proof/turkish-cache-2026-10-20c/evidence/source-delta.diff).

Bu çözüm, browser snapshot eşleşmediğinde yapılan alan fallback'inde tüm önbellek için **O(n) okuma/filtreleme ve O(n) geçici bellek** kullanır. Büyük önbellekler için süre/bellek ölçümü yapılmadı. Normalize edilmiş indeks anahtarı ileride şema geçişiyle değerlendirilebilir; bu dar düzeltmede schema veya migration yoktur.

## Nihai yerel doğrulama

Nihai kaynak manifesti `aa300dfdfe5743fb87e10fd7340e8d39005425949a22ff99676eef1151389712`: **102/102 dosya** her güncel komutun öncesinde/sonrasında eşleşti. [Komut fişleri ve ham loglar](../proof/turkish-cache-2026-10-20c/commands.json).

| Kontrol | Bu takip kaynaklarındaki sonuç |
|---|---|
| Uygulama yazarı odaklı regresyon | **38/38**: 27 ownership/cache +11 Home |
| Tam `npm test` | **157 Vitest /20 dosya +15 Node paylaşım testi**, exit0 |
| Strict TypeScript | `tsc --noEmit --incremental false`, exit0 |
| ESLint | 0 hata, önceden var olan 3 unused-import uyarısı |
| Ağ koruması | Bütün komutlarda 0 engellenmiş dış bağlantı girişimi |
| Yeni stock build ve15 tarayıcı vakası | **Yayın sonrası CI bekleniyor** |

Parent hook ile yeni filtrelenmemiş read-contract mock'unun 10 fail/17 pass sonucu ayrıca kaydedildi. Bu secondary red, kaldırılan indexed mock metodlarına yapılan eski çağrıdan etkilenir; gerçek Dexie/IndexedDB bug reprodüksiyonu olarak kullanılmaz. Birincil negatif kanıt, gerçek hosted tarayıcı çalışmasıdır. Yeni 27 testin aynı byte'ları düzeltmeden sonra geçti. [Kaynak/test kanıt bağı](../proof/turkish-cache-2026-10-20c/validation-source-binding.json).

Önceki C'nin 153+15 testi, bağımsız root34 sonucu ve yardımcılı yerel build'i bu yeni ağacın doğrulaması sayılmaz. Bu takipte root/bağımsız incelemeci kaynak farkını inceledi; odaklı38 sonucu uygulama yazarınındır. Yeni yerel build veya tarayıcı kurulum/çalıştırması yapılmadı; aynı stock workflow yeni commit üzerinde build+start ve değişmemiş15 tarayıcı vakasıyla kabulü sağlamalıdır.

## Korunan sınırlar

`tests/cache-area.spec.ts` SHA256 `50bd583e099b6277ef9b8214181fda96c3df249d6746a260cd025fe0d6a398c8` değişmedi. Bütün diğer browser testleri, Playwright/workflow, timeout/retry, `lib/db.ts`, package ve lock bytes aynı. Next16.4.1/Sharp0.35.5 korunuyor; bu takipte bağımlılık kurulumu veya ağ çağrısı yapılmadı. Parent CI'nın gerçek `npm ci` çıktısı **15 vulnerabilities (3 moderate,11 high,1 critical)** idi; bu yalnızca o çalışmanın aggregate sayısıdır. Tam `npm audit` otomatik incelemede reddedilmiş ve yeniden denenmemiştir. Bütün uyarıların kapandığı veya15 benzersiz kullanılabilir çalışma zamanı açığı olduğu iddia edilmez.

Test eczane verileri sentetiktir; canlı nöbet listesi güncelliği/TTL, gerçek QR, doğal görüntü paylaşımı ve PWA yaşam döngüsü bu akışın kapsamında değildir. Mevcut örneklerin dış istekleri nedeniyle tüm CI çevrimdışı değildir. Mounted bir geç GPS izninin daha yeni manuel niyete üstün gelmesi, başlamış DB yazısının iptal edilmesi ve eski kartların bekleme sırasında görünmesi önceki kapsam sınırları olarak kalır.

Yayımlama deltasında yalnızca iki mevcut kod/test dosyası değişir, bu rapor ve `proof/turkish-cache-2026-10-20c` eklenir. **572 ilgisiz mevcut yaprak** ve **325 yerelde açılmayan yaprak** korunur; silme yoktur. Eski C raporu ve kanıt paketi değişmez.
