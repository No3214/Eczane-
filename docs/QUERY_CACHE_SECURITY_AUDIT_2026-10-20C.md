# Eczane: sorgu sahipliği, bölge önbelleği ve hedefli bağımlılık güncellemesi

## Sonuç ve kabul durumu

Bu aday, geç dönen eski aramanın yeni sonuçları bozmasını ve çevrimdışı durumda başka ilçenin önbelleğinin gösterilmesini düzeltir. Next.js ile eşleşen ESLint yapılandırması 16.2.9'dan 16.4.1'e, Sharp 0.34.5'ten 0.35.5'e yükseltildi. Tam yerel test zinciri 153 Vitest testi ve 15 paylaşım işleyicisi testiyle geçti; bağımsız inceleme aynı 34 odaklı testi yeniden geçirdi. Kaynak ve kilit dosyası sabittir. [Makine özeti](../proof/query-cache-2026-10-20c/verification.json)

Ara kaynak üzerindeki standart yerel derleme bu ortamda TypeScript alt sürecinin boş yakalanan çıktısı nedeniyle durdu. Gerçek TypeScript çıktısını yalnız miras alınan standart çıktı dosya tanıtıcılarına ileten dar bir doğrulama yardımcısıyla yerel webpack derlemesi geçti. Bu sonuç açıkça yardımcıyla yapılan yerel derlemedir; yardımcı olmadan GitHub CI derlemesi ve yeni 15 tarayıcı kabulünün geçmesi ayrıca gerekir. Önceki kaynağın 12 tarayıcı başarısı yeni adayın kabulü sayılmaz. [Komutlar ve ham sonuçlar](../proof/query-cache-2026-10-20c/commands.json)

## Yeniden üretilen hata ve değişen davranış

Yayımlanmış başlangıçta, eski bir ağ yanıtı veya IndexedDB okuması yeni aramanın sonuçlarını, hata durumunu ve yükleniyor durumunu sonradan değiştirebiliyordu. Son görüntülenen eczaneler tek bir global dizi halinde okunuyor, etkin şehir/ilçe ile eşleşmeleri gerekmiyordu. GPS geri dönüşü de global veritabanından herhangi bir bölgenin satırlarını seçebiliyordu. [Başlangıç hook'u](../proof/query-cache-2026-10-20c/evidence/usePharmacies.parent.ts.txt)

İlk 22 regresyon testi, değiştirilmemiş yayımlanmış başlangıç hook'unda 18 başarısızlık ve 4 başarı üretti; ilk adayda 22/22 geçti. Bağımsız inceleme, sayfadan ayrıldıktan sonra saklanmış GPS callback'inin yeniden çağrılabildiğini buldu. Eklenen 23. test, ara C hook'unda 1 başarısızlık / 22 başarı verdi; aynı 23 test dosyası yaşam döngüsü korumasıyla 23/23 geçti. Yeni test StrictMode etki tekrarından sonra normal aramayı da doğrular. İlk 22 testin satırları ve beklentileri değiştirilmedi. Ertelenmiş yanıt, JSON gövdesi, veritabanı okuması ve yazma tamamlanması ayrı ayrı kontrol edilir; her aşamanın farklı kaynak manifesti korunur. [Sürüm bağı](../proof/query-cache-2026-10-20c/validation-source-binding.json)

[usePharmacies](../lib/hooks/usePharmacies.ts) her aramaya artan bir kimlik verir. Ağ yanıtından, JSON çözümlemesinden ve asenkron önbellek okumasından sonra yalnız güncel kimlik durumu değiştirebilir; yalnız güncel arama yükleniyor durumunu bitirir. Bileşenin kaldırılması bekleyen kimlikleri geçersiz kılar ve mounted bayrağını kapatır; kaldırıldıktan sonra saklanmış işlev tekrar çağrılırsa ağ veya önbellek işlemi başlatılmaz. Etki kurulumunda bayrak yeniden açılır, böylece StrictMode tekrarında normal aramalar çalışır.

Tarayıcı önbelleği artık sürüm, sorgu kimliği ve satırları tek localStorage değeri içinde tutar. Manuel sorgularda şehir ve ilçe birlikte, Türkçe harf dönüşümü ve kenar boşluğu temizliğiyle eşleşmelidir. Eşleşen kayıt bulunamayan başarısız yeni arama eski kartları temizler. GPS için yalnız aynı koordinatlara bağlı yeni biçim anlık görüntü kullanılabilir. Eşleşen boş anlık görüntü eski veritabanı satırlarını yeniden canlandırmaz. Bozuk temel satır alanları ve localStorage okuma/yazma hataları ayrıca ele alınır; depolama kotası dolması başarılı çevrimiçi yanıtı çevrimdışı hataya dönüştürmez. Başarısız HTTP durum kodu, gövde success=true dese de çevrimiçi başarı sayılmaz.

Eski manuel dizi biçimi, eski bölge etiketi ve satırların kendi şehir/ilçe alanları birlikte doğrulanırsa okunabilir. Eski GPS dizisinde sorgu ile satırların tek yazmada kaydedildiği kanıtlanamadığı için bu biçim kullanılmaz. Koordinatların tam eşleşmesi bilinçli olarak dar tutuldu; konum değişince yeni çevrimiçi sonuç gerekir. Bekleyen yeni arama sırasında eski kartların görünür kalması mevcut Home davranışıdır. Taşıma isteği iptal edilmez; güncelken başlamış bir veritabanı yazması tamamlanabilir. Bileşen hâlâ açıkken geciken bir GPS niyetinin daha yeni manuel seçimle sıralanması bu partinin kapsamı dışındadır. Önbellek süresi, nöbet güncelliği, sağlayıcı metadatası ve PWA davranışı bu değişikliğin doğruladığı alanlar değildir. [İnceleme sınırları](../proof/query-cache-2026-10-20c/evidence/cache-review-notes.md)

## Hedefli güvenlik güncellemesi

Next.js bakım ekibinin [14 Ekim 2026 güvenlik duyurusu](https://nextjs.org/blog/nextjs-security-update-october-14-2026), 16.4.1 ve ilgili görüntü işleme düzeltmesi için Sharp 0.35.5 sürümlerini bildiriyor. Başlangıçtaki 16.2.9 ve 0.34.5 bu sürümlerin altındaydı. Bu çalışma, bakım ekibinin düzeltme yolunu izler; üretimde sömürülebilirliği kanıtlayan bir saldırı testi değildir. [Birincil kaynak ve edinim kaydı](../proof/query-cache-2026-10-20c/evidence/security-upgrade-research.json)

| Paket / yol | Başlangıç → aday | Rol ve kapsam |
|---|---|---|
| Doğrudan `next` | 16.2.9 → 16.4.1 | Uygulamanın üretim çerçevesi; bakım ekibinin hedef sürümü |
| `next` üzerinden `sharp` | 0.34.5 → 0.35.5 | Görüntü işleme bağımlılığı; yerel native modülün yüklenmesi doğrulandı, üretim özelliğinin etkinliği ayrıca kanıtlanmadı |
| Geliştirme `eslint-config-next` | 16.2.9 → 16.4.1 | Çerçeveyle yapılandırma uyumu; üretim çalışma yolu olduğu iddia edilmez |
| React / React DOM | 19.2.4 → 19.2.4 | Mevcut sürümler korundu |
| ESLint | 9.39.4 → 9.39.4 | Mevcut uyumlu ana sürüm korundu |

Kilit dosyası 647 paket kaydından 648 kayda geçti; framework ve gereken geçişli paketlerin değişimleri ayrı listelendi. İlgisiz doğrudan paket yükseltmesi veya `npm audit fix --force` uygulanmadı. Kamuya açık Next referans paketleri proje manifesti/kilit dosyası olmadan ayrı klasöre indirildi. Projenin aday kilidi ve kendi bağımlılık kurulumu yalnız `--offline --ignore-scripts --no-audit --no-fund` ile üretildi; kurulumdan önceki ve sonraki kilit SHA-256 değeri aynıdır: `fb935c07a027102acb5247aaa2c758e803e756d3d6e40943d1431805c6eabca4`. [Kilit farkı](../proof/query-cache-2026-10-20c/evidence/dependency-lock-delta.json)

Önceki CI'nin 19 npm uyarısı, 19 ayrı sömürülebilir kusur olarak yorumlanmadı. Tam proje `npm audit` çağrısının yükseltilmiş izin isteği, bağımlılık metadatasının dış servise aktarımı gerekçesiyle otomatik onay incelemesince reddedildi; reddedilen yükleme yeniden denenmedi. Sonraki kamuya açık referans paketlerini indirme işlemi farklı ve daha dar bir işlemdi. Tam advisory grafiği bu çalışmada alınmadığından tüm 19 uyarının kapandığı veya kalan sayının sıfır olduğu iddia edilmez. [Ret kaydı](../proof/query-cache-2026-10-20c/evidence/npm-audit-rejection.json)

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Aynı 22 yeni test, değiştirilmemiş başlangıç hook'u | 18 başarısız / 4 başarılı; beklenen kırmızı kanıt |
| Son 23 test dosyası, ara C hook'u → nihai hook | 1 başarısız / 22 başarılı → 23/23 başarılı |
| Son aday tam `npm test` | 153 Vitest / 20 dosya + 15 Node işleyicisi başarılı |
| Kök ajan bağımsız odaklı tekrar | 34/34 başarılı |
| Katı TypeScript, incremental kapalı | Başarılı |
| ESLint | 0 hata; daha önce mevcut 3 kullanılmayan import uyarısı |
| Standart yerel webpack derlemesi, ara kaynak | Ortamın boş TypeScript alt süreç çıktısında durdu; son kaynak stok hosted kabulünü bekler |
| Dar stdio yardımcılı yerel webpack derlemesi | Başarılı; stok derleme diye sunulmaz |
| Playwright keşfi | 15 test / 4 dosya / 3 masaüstü tarayıcı; yerel tarayıcı çalıştırması yapılmadı |
| Kaynak bütünlüğü | 102 dosyanın test öncesi/sonrası özetleri aynı |

Yeni [tarayıcı senaryosu](../tests/cache-area.spec.ts), gerçek Home, manuel seçim, localStorage ve IndexedDB ile Konak/Bornova geçişlerini yapar. Sentetik API yanıtlarıyla önce Konak kaydedilir, kayıtlı olmayan Bornova çevrimdışı aramasında kart gösterilmemesi istenir; Bornova çevrimiçi kaydedildikten sonra çevrimdışı Konak araması gerçekten IndexedDB'deki Konak satırını seçmelidir. Servis çalışanı engellenir, bilinen QR görüntüsü yerel olarak karşılanır ve beklenmeyen istekler testi başarısız yapar. Bu bir tam PWA çevrimdışı yaşam döngüsü testi değildir.

Ara kaynaktaki yerel derleme tanısında `tsc --showConfig` doğrudan çalıştı. Aynı Node alt süreç çıktısı ağ koruması varken de yokken de boş kaldı. Çocuk süreç fd1 için socket ve `Writable` gördü; normal stream yazıları kaybolurken aynı tanıtıcıya `fs.writeSync` yazıları ulaştı. Yardımcı yalnız tam TypeScript CLI dosya yolunda, bu gözlenen stdio durumunda devreye girer; yeni bağlantı açmaz, var olan fd1/fd2'ye gerçek baytları iletir. Aynı JSON kontrolü 0 bayttan 4.426 bayta geçti ve strict=true olarak çözüldü. Gerçek CLI çocuğunda HTTPS ret kontrolü her iki durumda da geçti. Uygulama kontrollerinde harici istek girişimi yoktu; iki bilinçli tanı isteği bağlantı açılmadan engellendi. Bu gözlem genel bir Node sürüm kusuru olarak ileri sürülmez. [Tanı ve kontroller](../proof/query-cache-2026-10-20c/evidence/stdio-bridge-controls.json)

## Kaynak kökeni ve yayın sınırı

Başlangıç commit'i `ccc6e4590ecf50a0326280cdfdfb0ec0de32f9f8`, ağacı `326e48fe1c7022bbb2c282ef6664f10363506c34` idi. 511 yaprak girdinin 186'sı yerelde Git blob özetleriyle doğrulandı; kopyalanmayan 325 tarihsel girdi uzaktaki tam ağaçta korunmalıdır. Mevcut dosyalardan yalnız `lib/hooks/usePharmacies.ts`, `package.json` ve `package-lock.json` değişti. İki test dosyası ve bu rapor/kanıt paketi eklendi. [Kaynak kökeni](../proof/query-cache-2026-10-20c/evidence/parent-source-binding.json) ve [son 102 dosya manifesti](../proof/query-cache-2026-10-20c/source-publication.json) kapsamı sabitler.

Bu paket uzaktan commit, birleştirme veya dağıtım yapmaz. Yayından sonra gerçek yeni ağaçtaki stok CI derlemesi ve 15 tarayıcı testi ayrıca doğrulanmalıdır; yardımcı kodu uygulamaya veya CI çalışma ortamına yüklenmez.
