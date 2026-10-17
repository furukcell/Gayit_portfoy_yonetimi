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
- [ ] Migration 001–003'ü geçici Supabase projesinde sırayla çalıştırıp SQL hatalarını kontrol et.
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
- [ ] Portföy detay, düzenleme, arşivleme ve durum değiştirme.
- [ ] Gayrimenkul tipi, fiyat, oda, metrekare, adres, açıklama ve durum alanlarını formda tamamlama.
- [ ] Arama, filtreleme, sıralama ve form doğrulama.
- [ ] Ofis sahibi tüm ofis portföylerini, danışman kendi portföylerini görebilir.
**Çıkış kriteri:** Portföyler uygulama kapatılıp açıldığında kaybolmaz ve rol izinleri uygulanır.

### 5. Fotoğraflar ve profesyonel portföy PDF'i
- [x] Danışman profil fotoğrafı seçimi ve özel Storage bucket'a yükleme için mobil form.
- [x] Ofis kapsamlı profil fotoğrafları için ilk Storage RLS migration taslağı.
- [ ] Portföy galerisi için fotoğraf seçme ve güvenli yükleme.
- [ ] Fotoğraf sıralama, kapak fotoğrafı ve yükleme durumları.
- [ ] GAYIT markalı, okunaklı, çok sayfalı PDF portföy sunumu.
- [ ] PDF'i cihazda önizleme/kaydetme/paylaşma ve hataları ele alma.
**Çıkış kriteri:** Gerçek portföy fotoğraflarıyla müşteriye gönderilebilir PDF.

### 6. WhatsApp ve harita/navigasyon
- [ ] İlan başlığı, fiyatı, özellikleri ve bağlantısını içeren WhatsApp paylaşımı.
- [ ] Adresi Google Maps aramasında açma.
- [ ] Navigasyonu başlatma bağlantısı ve harita uygulaması yoksa web fallback.
- [ ] Eksik/hatalı adres için anlaşılır geri bildirim.
**Çıkış kriteri:** Android ve iOS üzerinde paylaşım ve harita akışları denenmiş.

### 7. Ofis sahibi paneli ve ekip yönetimi
- [x] Danışman hesabı oluşturma isteği sunucu tarafında ofis sahibi rolüyle doğrulanır.
- [x] Çalışan listesi gerçek profiller ve üyeliklerden yükleniyor.
- [x] Danışman ekleme formu Edge Function'a bağlandı; fotoğraf yükleme akışı eklendi.
- [ ] Danışmanları devre dışı bırakma ve üyelik yönetimi.
- [ ] Ofis portföyleri ve danışman bazlı özetler gerçek verilerden hesaplansın.
**Çıkış kriteri:** Ofis sahibi ekibini ve ofisin tamamını yönetebilir.

### 8. Müşteriler, eşleştirme ve iş takibi
- [x] Müşteri CRM, çoklu talep, eşleşme, bildirim, aktivite ve randevu tabloları için ilk migration taslağı.
- [x] Eşleşme ekranı tasarım kararı: tam eşleşmeler ve açıklamalı alternatifler iki ayrı bölümde gösterilecek.
- [x] İlk müşteri listeleme ve müşteri + arama talebi oluşturma ekranları; daha fazla rol/talep düzenleme ve detay akışı sürüyor.
- [ ] Yeni müşteri/talep kaydında aktif portföyle deterministik eşleştirme.
- [ ] Yeni/ güncellenen ilanda aktif müşteri talepleriyle eşleştirme.
- [ ] Eşleşme gerekçeleri, tekrar bildirimini önleme ve bildirim merkezi. Eşleşme ekranı için başlangıç görünümü eklendi; otomatik eşleştirme henüz çalışmıyor.
- [ ] Müşteri görüşme geçmişi, takip tarihi ve randevu ekranları.

### 9. İstatistikler ve iş takibi
- [ ] Aktif, opsiyonlu, satılmış ve kiralanmış portföy sayıları.
- [ ] Danışman bazlı portföy dağılımı ve fiyat toplamları.
- [ ] Görüntülenme/etkileşim metrikleri yalnızca gerçek ölçüm kaynağı varsa gösterilir.
- [ ] Veri yoksa demo rakamı göstermek yerine boş durum.
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
- 2026-10-17: Mobil uygulamaya müşteri listesi, müşteri/arama talebi oluşturma formu, başlangıç eşleşme ekranı ve beş sekmeli alt navigasyon eklendi. Ana sayfadaki örnek ekip/görüntülenme değerleri kaldırıldı; görüntülenme verisi yoksa sahte sayı yerine ölçüm kurulmadı durumu gösteriliyor. Otomatik eşleştirme, müşteri detay/düzenleme ve bildirim motoru hâlâ yapılacak.

## Çalışma kuralları
1. Bir aşama ancak kodu ve çıkış kriteri kontrol edildiğinde tamamlandı olarak işaretlenir.
2. Yapılamayan testler açıkça belirtilir; çalıştırılmamış test başarılı sayılmaz.
3. Supabase `service_role` anahtarı veya başka bir gizli anahtar mobil uygulamaya ya da repoya eklenmez.
4. Önce küçük, doğrulanabilir commit'ler yapılır; sonraki aşamaya geçerken yol haritası güncellenir.
