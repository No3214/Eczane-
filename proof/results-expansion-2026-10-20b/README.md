# Eczane sonuç listesi düzeltmesi — kanıt dizini

Bu ek paket, tamamlanmış yerel komutların kaynak ve çıktı bağını korur. Yeni bir runtime kabulü üretmek için testler yeniden çalıştırılmadı.

- [Makine özeti](verification.json) kapsam, sonuçlar ve açık kabul sınırları.
- [Komut kayıtları](commands.json) özgün receipt değerlerini, özgün JSON SHA256'larını, zamanları, çıkış kodlarını ve log özetlerini birlikte taşır. Her log burada ham baytlarıyla saklanmıştır; boş ağ kayıtlarının ortak SHA256'sı komut kaydındadır.
- [Son kaynak](source-publication.json), [npm/strict kaynak sürümü](source-npm-types.json), [parent kırmızı kaynak](source-parent-red.json), [sürüm bağı](validation-source-binding.json) ve [kaynak kökeni](source-provenance.json).
- [Bağımsız inceleme](independent-review/README.md) son kaynakta 11/11 davranış vakasını doğrular. Bu, tam npm'deki aynı 11 vakanın tekrarıdır.
- [Parent kırmızı çıktı](logs/final-tests-parent-red.log): son 11 test aynı kalırken yayımlanmış parent sayfa kodu 7 başarısız / 4 başarılı.
- [Tam npm çıktı](logs/final-npm-test.log), [strict çıktı](logs/final-strict-types.log), [webpack build](logs/webpack-production-build.log), [build sonrası lint](logs/postbuild-lint.log).
- [Bekleyen sorgu ara kırmızı testi](logs/pending-query-red.log) ve [ara TypeScript hatası](logs/strict-types.log) saklanır; final aday sonucu olarak gösterilmez.
- [Playwright keşfi](logs/playwright-discovery.log) yalnız test listesidir; tarayıcı yürütmesi değildir.
- [Kayıtlı çalıştırıcı](harness/run_gate.py.txt) ve [ağ koruması](harness/offline-guard.cjs.txt) metin arşividir. Orijinal çalışma dizini ve ortam yolları receipt içinde korunur; doğrudan portable kurulum betiği sayılmaz.
- [Dosya özetleri](EVIDENCE_INDEX.json) kendisi dışındaki bu paket dosyalarını sabitler.

Son adayın yerel tarayıcı yürütmesi, hosted CI, gerçek sağlayıcı güncelliği, PWA ve native paylaşım kabulü bu paketten çıkarılmaz. Yeni yayın için uzak commit/dal/PR ve tam ağacın ayrıca geri okunması gerekir.
