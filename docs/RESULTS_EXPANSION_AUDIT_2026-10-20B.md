# Sonuç listesini genişletme düzeltmesi — 20 Ekim 2026, devam B

**Karar: READY_FOR_HUMAN_REVIEW.** Ana sayfadaki “Tüm Eczaneleri Göster” düğmesi artık mevcut sonuç listesini genişletiyor. Önceki kod her zaman ilk üç kartı gösteriyor ve bu düğmeyle il/ilçe seçicisini açıyordu. Düzeltme yeni bir sağlayıcı isteği üretmeden tüm kayıtları gösteriyor; kullanıcı aynı düğmeyle ilk üç sonuca dönebiliyor.

Başlangıç commit'i `ca89bca7ccdc2b9b7aa5bbcd3750cb6d13f9c28f`, tam Git ağacı `d75304671f83d2592f100040317a02c166480063`. Bu belge yerel adayın hazırlanma ve doğrulama kaydıdır. Yeni commit'in uzak geri okuması ve hosted CI sonucu koordinatörün yayın kaydında ayrıca doğrulanacaktır.

## Davranış ve kapsam

- İlk görünüm sağlayıcının mevcut sırasındaki ilk üç kaydı korur; genişletme kayıtları silmez, yeniden sıralamaz veya tekrar sorgulamaz.
- GPS yenilemesi ve gönderilen il/ilçe araması listeyi ilk üç sonuca döndürür. GPS ya da eczane yanıtı beklenirken genişletme düğmesi devre dışıdır; eski liste bu arada tekrar genişletilip yeni sorguya taşınamaz.
- Büyük yazı tercihini değiştirmek ve il/ilçe seçicisini arama göndermeden açıp kapatmak genişletilmiş görünümü korur.
- Düğme `aria-expanded` durumunu ve geri dönüş etiketini sunar. GPS bilgi satırı tüm sonuçların gösterildiğini belirtir; çok sayıda kartta animasyon gecikmesi büyümez. Haritanın mevcut üç işaretçi davranışı korunur.
- Sıfır, bir veya üç kayıt olduğunda genişletme düğmesi yoktur.

Üretim değişikliği yalnızca [ana sayfadadır](../app/page.tsx). [11 vakalık gerçek sayfa testi](../tests/home-results.test.tsx), gerçek hook'ları, onboarding, seçici ve kartları kullanır; dış önbellek, hava durumu bileşeni, açılmayan dinamik harita ve HTTP sınırları yerel test çiftleriyle ayrılır. [Yeni tarayıcı akışı](../tests/results.spec.ts) gerçek manuel onboarding ve ikinci ilçe aramasını yerel yanıtlarla sınar. Mevcut kartın ekran dışındaki QR resmi yalnızca bilinen HTTPS adresi/yolu ve `image` kaynak türü için yerel bir SVG ile karşılanır; diğer beklenmeyen dış istekler engellenir ve testi başarısız yapar. Bu resim bir QR doğruluk testi değildir.

Sağlayıcılar, veri güncelliği/uyarı politikası, paylaşım davranışı, harita sözleşmesi, bağımlılıklar, lockfile ve CI yapılandırması değiştirilmedi. Önceki raporlar ve kanıtlar korundu.

## Taze doğrulama

Aşağıdaki yürütmeler bu devam turunda, 20 Ekim 2026 UTC'de yapıldı. Paketleme sırasında uygulama testleri yeniden çalıştırılmadı; tamamlanmış kayıtların log ve kaynak özetleri denetlendi.

| Kontrol | Sonuç | Kanıt |
| --- | --- | --- |
| Yayımlanmış parent sayfası + son 11 testin aynı baytları | **7 başarısız / 4 başarılı**, beklenen exit 1 | [Parent kırmızı kayıt](../proof/results-expansion-2026-10-20b/logs/final-tests-parent-red.log) |
| Tam `npm test` | **130 Vitest / 19 dosya + 15 Node handler**, exit 0 | [Tam test kaydı](../proof/results-expansion-2026-10-20b/logs/final-npm-test.log) |
| Bağımsız gerçek sayfa testi | **11/11**, exit 0; 100 kaynak dosyası değişmedi | [Bağımsız inceleme](../proof/results-expansion-2026-10-20b/independent-review/README.md) |
| Strict TypeScript | **Başarılı**, exit 0 | [Komut ve kaynak kaydı](../proof/results-expansion-2026-10-20b/commands.json) |
| `npm run build -- --webpack` | **Başarılı**; TypeScript ve 8 statik sayfa üretimi tamamlandı | [Üretim derlemesi](../proof/results-expansion-2026-10-20b/logs/webpack-production-build.log) |
| Derleme sonrası `npm run lint` | **0 hata / 3 mevcut uyarı**, exit 0 | [Lint kaydı](../proof/results-expansion-2026-10-20b/logs/postbuild-lint.log) |
| Playwright keşfi `--list` | 3 dosyada **12 test listelendi**; yeni akış mevcut üç tarayıcı projesinde bulundu | [Yalnız keşif kaydı](../proof/results-expansion-2026-10-20b/logs/playwright-discovery.log) |

11 yeni sayfa vakası 130 Vitest sonucunun içindedir. Bağımsız 11/11 aynı vakaların tekrarıdır; ek benzersiz test sayısı olarak toplanmaz. Üç mevcut lint uyarısı il/ilçe sayfasındaki kullanılmayan `MapPin`, karttaki kullanılmayan `getWhatsappUrl` ve eski provider testindeki kullanılmayan `vi` içindir.

İlk dar düzeltmede bekleyen GPS/yanıt sırasında yeniden genişletme vakası **1 başarısız / 10 başarılı** verdi; düğmenin bekleme durumunda devre dışı bırakılmasıyla giderildi. Bir ara TypeScript kontrolü, Testing Library sorgularına eklenen desteklenmeyen üç `exact` seçeneği nedeniyle exit 2 verdi. Seçenekler test dosyasından çıkarıldı; string ad eşleştirmesi ve davranış iddiaları korunarak strict kontrol geçti. Bu başarısız ara kayıtlar [kanıt paketinde](../proof/results-expansion-2026-10-20b/README.md) tutulur.

### Son kaynakla bağ

Tam npm ve bağımsız strict TypeScript komutları `c3c83b8a2f6f7e7e3ba11eaed7313c78fe62501e0afe44297291ae6d9a210b84` kaynak manifesti üzerinde tamamlandı. Sonrasında yalnızca henüz çalıştırılmamış `tests/results.spec.ts` dosyasına mevcut QR görseli için dar yerel yanıt eklendi. Uygulama kodu, 130 Vitest vakası ve 15 Node handler testinin baytları değişmedi.

Son yayın kaynak manifesti `970bb4485087fe8d1b3e8cc8c786b76bea80826425280c37d71a3b7eb29d76e2` üzerindeki üretim derlemesi TypeScript aşamasıyla birlikte, derleme sonrası lint ve bağımsız 11 vakalık sayfa testi başarılıdır. [Kaynak bağlama kaydı](../proof/results-expansion-2026-10-20b/validation-source-binding.json) iki manifest arasındaki tek değişikliği açıkça belirtir. Playwright keşfi önceki ara manifestte yapılmıştır; keşiften tarayıcı yürütmesi veya son adayda hosted başarı çıkarılmaz.

## Kaynak bütünlüğü ve sınırlar

Tam parent ağacı 480 yaprak girdiden oluşur. Yerelde 155 yayımlanmış dosya doğrulanarak kullanıldı; çalışma kopyasına aktarılmayan 325 tarihsel/ajan girdisi tam başlangıç ağacında korunur. Mevcut dosyalar arasında yalnız `app/page.tsx` değişmiştir. Test edilen kaynak manifesti 100 dosyayı kapsar; sonradan eklenen bu rapor ve kanıtlar uygulama kabul sayısına katılmaz. [Kaynak kökeni](../proof/results-expansion-2026-10-20b/source-provenance.json) ve [makine doğrulaması](../proof/results-expansion-2026-10-20b/verification.json) kapsamı sabitler.

Yerel komutlar sağlayıcı kimlik bilgilerini devralmayan ortam ve süreç düzeyinde Node ağ korumasıyla çalıştı; kayıtlı dış ağ girişimi **0**. Bağımlılık veya tarayıcı kurulmadı. Bu sonuç bütün işletim sistemi, alt süreç veya hosted CI için genel ağ/maliyet ölçümü değildir.

**Açık kabul:** Yeni Playwright akışı yerelde tarayıcıda çalıştırılmadı; üç tarayıcı için gerçek yürütme sonucu ayrıca gerekir. JSDOM, görsel yerleşim, gerçek native paylaşım, dışa aktarılan görsel pikseli, kurulu PWA ve canlı nöbet bilgisinin güncelliğini doğrulamaz. Varsayılan yerel Turbopack yeniden denenmedi; bu turun taze build sonucu açıkça webpack içindir. Hook'ların cevap yarışı ve önbellek/güncellik davranışı bu görünüm düzeltmesiyle yeniden tasarlanmadı.

Mevcut draft PR #2 için hazırlanan değişiklikler, merge veya dağıtım kabulü değildir. Önceki commit'in hosted 9/9 sonucu son adayın yeni 12 testine taşınmaz.
