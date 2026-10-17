# GAYIT — Portföy Yönetimi Yol Haritası

> Ürün: emlak ofisleri için özel mobil portföy, ekip ve performans yönetimi. GAYIT genel kullanıma açık ilan pazaryeri değildir.
>
> Hedef platform: Android + iOS. Teknoloji: Expo SDK 58, React Native 0.88, React 19.3, TypeScript. SDK sürümü Expo'nun resmi kararlı sürümü ve paket uyumluluğu kontrol edilerek sabitlenecek.

## Bitiş kriteri

MVP ancak aşağıdaki koşullar sağlandığında tamamlanmış sayılır: kullanıcılar güvenli biçimde giriş yapar; ofis sahibi ofisini ve çalışanlarını yönetebilir; danışman yalnızca yetkili olduğu ofis verilerine ve kendi portföyüne erişir; portföyler kalıcı olarak saklanır; fotoğraflar, PDF/WhatsApp paylaşımı ve harita bağlantıları çalışır; istatistikler gerçek verilerden hesaplanır; Android ve iOS testleri ile güvenlik kontrolleri yapılır.

## 10 aşamalı uygulama planı

### 1. Ürün kapsamı ve teknik temel — COMPLETE
- [x] Ürün kapsamını ve ofis sahibi/danışman rollerini netleştir.
- [x] Expo SDK 58 tabanını kaydet.
- [x] Repo yapısını, bağımlılıkları ve mevcut prototipi denetle.
- [x] Geliştirme, kalite kontrol ve gizli anahtar kurallarını belgele.
- [x] GitHub Actions ile TypeScript ve Expo bağımlılık kontrolü için CI iş akışı ekle.
**Çıkış kriteri:** Herkesin takip edebileceği yol haritası, sabitlenmiş mimari ve çalıştırma talimatları.

### 2. Veri modeli ve güvenlik — IN PROGRESS
- [x] Ofisler, kullanıcı profilleri, ofis üyelikleri, portföyler ve portföy fotoğrafları için ilk şema taslağı.
- [x] Müşteriler, çoklu müşteri talepleri, eşleşme geçmişi, bildirimler, müşteri aktiviteleri ve randevular için migration 003 taslağı.
- [x] CRM tabloları için rol bazlı RLS politikaları ve aynı ofise ait olma doğrulamaları için ilk taslak.
- [x] Mobil ekran akışı ve CRM veri modelini `docs/PRODUCT_FLOWS_AND_DATA_MODEL.md` içinde belgele.
- [x] Örnek ortam dosyası ve güvenli anahtar kullanım notları.
- [x] Migration 001–010 taslaklarını hazırlama; 005 ile CRM aktivite/bildirim yazma izinlerini, 007 ile askıya alma kontrollerini, 008 ile üyelik kimliği değişikliklerini sıkılaştır.\n- [ ] Migration 001–005'i geçici Supabase projesinde sırayla çalıştırıp SQL hatalarını kontrol et.
- [ ] Ofisler arası veri izolasyonu ve CRM rol izinleri için yetki testlerini çalıştır (kontrol listesi: `docs/RLS_VALIDATION_CHECKLIST.md`).
**Çıkış kriteri:** Her ofisin verisi sunucu tarafında ayrılmış, izinler test edilebilir.

### 3. Kimlik doğrulama ve ofis kurulumu — IN PROGRESS
- [x] Kullanıcı adı + şifre giriş ekranı ve oturum başlatma istemci bağlantısı.
- [x] İlk girişte şifre değiştirme ekranı ve sunucu fonksiyonu çağrısı.
- [x] Ofis sahibi için kullanıcı adı, ilk şifre ve profil fotoğrafıyla danışman ekleme formu.
- [x] Danışman hesabı oluşturma Edge Function taslağı.
- [ ] Süperadmin web panelini oluşturup ofis oluşturma fonksiyonuna bağla.
- [ ] Hesap oluşturma ve giriş akışlarını Supabase projesinde uçtan uca test et.
**Çıkış kriteri:** Demo rol seçimi yerine gerçek hesap ve gerçek yetkilendirme.

### 4. Portföy yönetimi (CRUD)
- [x] Portföy oluşturma ve listeleme Supabase veritabanına bağlandı.
- [x] Ürün kararı: tek portföy listesi, üstte Tümü / Satılık / Kiralık hızlı filtresi.
- [x] Portföy detay, düzenleme ve arşivleme akışı eklendi.
- [x] Portföy detayından durum değiştirme (Aktif / Opsiyonlu / Satıldı / Kiralandı / Arşivde).
- [x] Gayrimenkul tipi, fiyat, oda, metrekare, adres ve açıklama alanları forma eklendi; durum ve ofis/portföy kapsamı veritabanında tutuluyor.
- [x] Başlık/adres/kod arama, Satılık/Kiralık filtreleri ve fiyat artan/azalan sıralama.
- [x] Form doğrulaması: zorunlu alanlar, başlık/adres uzunluğu, pozitif güvenli fiyat, 0'dan büyük ve biçimi doğrulanan metrekare; kaydetme sırasında çift gönderimi engelleme.
- [ ] Form hata senaryolarını cihazda ve gerçek Supabase bağlantısıyla test et.
- [ ] Ofis sahibi tüm ofis portföylerini, danışman kendi portföylerini görebilir.
**Çıkış kriteri:** Portföyler uygulama kapatılıp açıldığında kaybolmaz ve rol izinleri uygulanır.

### 5. Fotoğraflar ve profesyonel portföy PDF'i
- [x] Danışman profil fotoğrafı seçimi ve özel Storage bucket'a yükleme için mobil form.
- [x] Ofis kapsamlı profil fotoğrafları için ilk Storage RLS migration taslağı.
- [x] Portföy galerisi için fotoğraf seçme, özel Storage bucket'a yükleme ve imzalı URL ile görüntüleme (migration 004 taslağı).
- [x] Fotoğraf silme ve yükleme/işlem durumu göstergeleri.
- [x] Fotoğraf silmede veritabanı kaydı ile Storage dosyası hatalarını ayır; işlem sırasında tekrar dokunmayı engelle.
- [ ] Storage dosyası silinemezse sahipsiz dosyalar için güvenilir yeniden deneme/temizlik akışı ekle.\n- [ ] Fotoğraf sıralama ve kapak fotoğrafı.
- [x] GAYIT markalı portföy PDF sunumu ve galeri fotoğraflarını ekleme.
- [x] PDF'i cihazda oluşturup paylaşma akışı.\n- [ ] Gerçek iOS/Android cihazlarda PDF ve fotoğraf akışını doğrula.
**Çıkış kriteri:** Gerçek portföy fotoğraflarıyla müşteriye gönderilebilir PDF.

### 6. WhatsApp ve harita/navigasyon
- [x] İlan başlığı, fiyatı ve özelliklerini içeren WhatsApp paylaşımı (bağlantı alanı ayrıca eklenebilir).
- [x] Adresi Google Maps aramasında açma.
- [x] Harita bağlantısı açılamazsa anlaşılır geri bildirim.
- [ ] Doğrudan navigasyon hedefi ve harita uygulaması yoksa web fallback akışını cihazlarda doğrula.
**Çıkış kriteri:** Android ve iOS üzerinde paylaşım ve harita akışları denenmiş.

### 7. Ofis sahibi paneli ve ekip yönetimi
- [x] Danışman hesabı oluşturma isteği sunucu tarafında ofis sahibi rolüyle doğrulanır.
- [x] Çalışan listesi gerçek profiller ve üyeliklerden yükleniyor.
- [x] Danışman ekleme formu Edge Function'a bağlandı; fotoğraf yükleme akışı eklendi.
- [x] Ekip panelinden danışman üyeliğini devre dışı bırakma ve yeniden etkinleştirme kontrolü.
- [x] Ofis portföyleri ve danışman bazlı özetler gerçek verilerden hesaplansın (portföy durumu, danışman portföy adedi ve fiyat toplamı).
**Çıkış kriteri:** Ofis sahibi ekibini ve ofisin tamamını yönetebilir.

### 8. Müşteriler, eşleştirme ve iş takibi
- [x] Müşteri CRM, çoklu talep, eşleşme, bildirim, aktivite ve randevu tabloları için ilk migration taslağı.
- [x] Eşleşme ekranı tasarım kararı: tam eşleşmeler ve açıklamalı alternatifler iki ayrı bölümde gösterilecek.
- [x] İlk müşteri listeleme ve müşteri + arama talebi oluşturma ekranları.
- [x] Müşteri detay/düzenleme ekranı ve aynı müşteriye birden fazla arama talebi ekleme akışı.
- [x] Yeni müşteri/talep kaydında aktif portföyle deterministik eşleştirme için evaluate-matches Edge Function taslağı ve çağrıları eklendi.
- [x] Yeni ilanda aktif müşteri talepleriyle eşleştirme çağrısı eklendi.
- [x] Eşleşme türü (exact / alternative), puan ve kriter gerekçeleri için alanlar eklendi; aynı talep/ilan çifti tekrar oluşturulmaz.
- [x] Bildirim merkezi listesi, okunmadı göstergesi ve okundu işaretleme ekranı eklendi.
- [ ] Edge Function'ı gerçek Supabase projesinde deploy edip yetki/tekrar-bildirim testlerini çalıştır.\n- [x] Eşleştirme fonksiyonunda danışman sorgularını kendi müşterileri ve ilanlarıyla sınırla.\n- [x] Migration 005 ile danışman aktivite düzenleme kapsamını ve bildirim güncelleme kolonlarını daralt.
- [x] create-agent fonksiyonunda devre dışı hesap/ofis kontrolü ekle.
- [x] create-office fonksiyonunda süperadmin rolüne ek olarak güncel hesap durumu kontrolü ekle.
- [x] Avatar Storage politikalarında kullanıcı kontrollü klasör yolunun UUID cast hatası riskini kaldır; üyelik/ofis sahipliğini metin karşılaştırması ve aktif üyelikle doğrula.
- [x] Migration 008 ile mevcut üyeliğin ofis, rol ve bağlı kullanıcı kimliğinin doğrudan API üzerinden değiştirilmesini engelle.
- [x] Migration 009 ile askıya alınmış hesapların ve pasif ofislerin profil fotoğrafı Storage erişimini de engelle.
- [x] Migration 010 ile istemcinin davet kaydına rastgele mevcut profil bağlamasını engelle; davet kabulü/hesap bağlama yalnızca güvenilir sunucu fonksiyonuyla yapılabilir.
- [x] Müşteri görüşme geçmişi: telefon, WhatsApp, toplantı, yer gösterme ve not kaydı.
- [x] Müşteri detayında sonraki takip tarihi düzenleme alanı ve randevu oluşturma/listeleme akışı.

### 9. İstatistikler ve iş takibi
- [x] Aktif, opsiyonlu, satılmış, kiralanmış ve arşivlenmiş portföy sayıları.
- [x] Ofis sahibi için danışman bazlı portföy dağılımı ve fiyat toplamları.
- [x] Görüntülenme/etkileşim metrikleri gerçek ölçüm kaynağı yoksa 'ölçüm kurulmadı' olarak gösterilir.
- [x] Gerçek veri olmayan metrikler için demo rakamı gösterilmez.
**Çıkış kriteri:** Gerçek kayıtlarla tutarlı, rol kapsamına uygun istatistikler.

### 10. Kalite, gizlilik ve mağaza hazırlığı
- [ ] TypeScript ve lint/format kontrolleri.
- [ ] Android ve iOS geliştirme derlemesi.
- [ ] Giriş, izinler, veri izolasyonu, portföy CRUD ve paylaşım için test senaryoları.
- [ ] KVKK için veri minimizasyonu, gizlilik metni ve hesap/veri silme akışı.
- [ ] Uygulama ikonu, açılış ekranı, sürüm numarası ve mağaza varlıkları.
**Çıkış kriteri:** Bilinen kritik hata kalmamış, test sonuçları belgelenmiş.

### 11. MVP yayına hazırlık ve teslim
- [ ] Üretim ortamı değişkenlerini ayarlama; gizli anahtarları repoya koymama.
- [ ] Yedekleme, hata izleme ve temel operasyon dokümantasyonu.
- [ ] Son kabul testi ve bilinen sınırlamaların listesi.
- [ ] Android/iOS build alma ve mağaza gönderim kontrol listesi.
**Çıkış kriteri:** Kurulum ve yayın adımları tekrarlanabilir, ürün gerçek ofislerde pilot kullanıma hazır.

## İlerleme günlüğü

- 2026-10-17: İlk repo/bağımlılık denetimi, GitHub Actions kalite kontrolü ve temel Supabase veri modeli/RLS taslağı eklendi. SQL henüz gerçek Supabase projesinde çalıştırılmadı ve RLS yetki testleri yapılmadı. Başlangıçtaki demo ekranları tamamlanmış ürün olarak sayılmıyor; kalıcı veritabanı, gerçek oturum ve sunucu tarafı rol yetkileri zorunlu bitiş koşullarıdır.
- 2026-10-17: Ürün kararı netleştirildi: aynı mobil uygulamada role göre farklı ekran/veri kapsamı; alt gezinme (Ana Sayfa, Portföy, Müşteriler, Eşleşmeler, Daha Fazla); tam eşleşmeler ve alternatifler ayrı bölümler. Migration 003 ile müşteri CRM/eşleştirme veri modeli ve tasarım dokümanı eklendi. Migration uygulanmadı; UI ve eşleştirme motoru henüz yazılmadı.
- 2026-10-17: Mobil uygulamaya müşteri listesi, müşteri/arama talebi oluşturma formu, başlangıç eşleşme ekranı ve beş sekmeli alt navigasyon eklendi. Ana sayfadaki örnek ekip/görüntülenme değerleri kaldırıldı; görüntülenme verisi yoksa sahte sayı yerine ölçüm kurulmadı durumu gösteriliyor.
- 2026-10-17: Müşteri kartından detay ekranı açılması, temel müşteri bilgilerinin düzenlenmesi, kayıtlı arama taleplerinin görüntülenmesi ve aynı müşteriye birden fazla talep ekleme akışı eklendi.
- 2026-10-17: Portföy düzenleme ve arşivleme akışları; arşivlileri varsayılan listeden gizleme ve arşiv görünümünü aç/kapat; fiyat sıralaması eklendi. Düzenleme formunda mevcut gayrimenkul tipini koruma düzeltmesi yapıldı.
- 2026-10-17: Portföy fotoğraf galerisi eklendi: özel Supabase Storage bucket, ofis/ilan bazlı erişim politikaları, fotoğraf ekleme-silme ve PDF sunumuna fotoğraf dahil etme. Migration 004 henüz gerçek Supabase ortamında uygulanmadı.
- 2026-10-17: İstatistik ekranı gerçek yüklenen portföylerden hesaplanacak şekilde genişletildi: tüm durumlar (arşiv dahil) ve ofis sahibine danışman bazlı portföy adedi/fiyat toplamı. Görüntülenme sayısı uydurulmaz; ölçüm yoksa boş/ölçülmemiş kalır. Gerçek Supabase veri ve cihaz testleri hâlâ gerekli.
- 2026-10-17: Eşleştirme Edge Function'ında danışman kapsamı daraltıldı: danışman yalnızca kendisine atanmış müşteriler ve kendi portföyleri üzerinde eşleştirme çalıştırabilir. RLS kontrol listesine fotoğraf depolama ve eşleştirme kapsam testleri eklendi; gerçek Supabase testleri hâlâ yapılmalı.
- 2026-10-17: Portföy formuna gayrimenkul tipi eklendi. evaluate-matches Edge Function taslağı; işlem türü, il/ilçe, tip, bütçe toleransı, oda ve metrekare kriterlerine göre tam/alternatif eşleşme hesaplayacak şekilde eklendi. Müşteri/talep ve portföy kayıtlarından fonksiyona çağrı bağlandı. Bildirim merkezi, müşteri görüşme geçmişi, takip tarihi ve randevu akışı da eklendi. Migration 003 ve Edge Function gerçek Supabase ortamında henüz uygulanmadı/deploy edilmedi; CI ve gerçek RLS testleri bekleniyor.

## Çalışma kuralları
1. Bir aşama ancak kodu ve çıkış kriteri kontrol edildiğinde tamamlandı olarak işaretlenir.
2. Yapılamayan testler açıkça belirtilir; çalıştırılmamış test başarılı sayılmaz.
3. Supabase `service_role` anahtarı veya başka bir gizli anahtar mobil uygulamaya ya da repoya eklenmez.
4. Önce küçük, doğrulanabilir commit'ler yapılır; sonraki aşamaya geçerken yol haritası güncellenir.

### CRM assignment validation hardening
- Migration 006 adds database-level checks that customer assignments and appointment assignees belong to an active office and have an active profile.
- Customer creator attribution (`created_by`) is immutable after insert.
- Regression checks are recorded in `docs/RLS_VALIDATION_CHECKLIST.md`; migration remains unverified until applied to a disposable Supabase project.

### RLS suspension enforcement
- Migration 007 updates office membership helper functions so disabled profiles and inactive offices fail RLS authorization checks, blocks direct office creation by disabled profiles, and makes customer activity creator attribution immutable.
- Validate stale JWT and direct table API cases using separate sessions in a disposable Supabase project before production.

- 2026-10-17: Portföy kaydetme doğrulaması güçlendirildi: zorunlu alanlar, başlık/adres uzunluğu, fiyatın pozitif ve güvenli tamsayı olması, metrekare için virgüllü ondalık desteği ve geçersiz biçimlerin reddi. Kaydet butonu işlem boyunca devre dışı kalır. Cihaz ve gerçek Supabase testleri henüz yapılmadı.

- 2026-10-17: Fotoğraf silme akışı hata dayanıklılığı açısından iyileştirildi. Önce Storage dosyası silinir; Storage hatasında metadata galeride tutulur ve yeniden deneme mümkün kalır. Dosya silinip metadata silinemezse kullanıcıya bu kısmi durum ayrı bildirilir. Supabase üzerinde hata enjeksiyonu/gerçek cihaz testi henüz yapılmadı.


## Ürün iyileştirme paketi — 2026-10-17

Bu paket test ve canlı ortam doğrulamalarından ayrı geliştirme adımlarıdır.

- [x] Portföy fotoğraflarını mevcut `sort_order` alanıyla sıralama; ilk fotoğrafı kapak fotoğrafı olarak gösterme.
- [x] Ana sayfada bugün ve gecikmiş müşteri takiplerini gösterme; satıra dokunarak müşteri detayına gitme.
- [x] İstatistik ekranından portföy durumları ve fiyat toplamını içeren paylaşılabilir rapor oluşturma.
- [ ] Portföy favorileri ve son görüntülenenler için kalıcı veri modeli.
- [ ] Satış/kiralama işlem kaydı ve komisyon takibi için veri modeli ve ekranlar.
- [ ] Excel/CSV portföy içe aktarma.
- [x] Portföyü CSV metni olarak dışa aktarma/paylaşma.
- [x] Portföy listesinde durum ve fiyat aralığı filtreleri.
- [ ] Ofis logosu/iletişim bilgileriyle PDF şablonunu markalama.
- [ ] Daha kapsamlı il/ilçe/mahalle ve fiyat/oda filtreleri.
- [ ] Ofis başına abonelik, paket ve kullanım limitleri.

Not: Fotoğraf sıralama özelliği Supabase `property_photos` tablosunda `sort_order` güncelleme izni gerektirir. Müşteri takip listesi mevcut `next_follow_up_at` verisini kullanır. Paylaşım raporu gerçek portföy kayıtlarından oluşturulur; görüntülenme veya gerçekleşmiş komisyon gibi tutulmayan metrikler üretilmez.
