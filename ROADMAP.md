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
- [x] Supabase/Postgres Row Level Security (RLS) politikalarının ilk taslağı.
- [x] Örnek ortam dosyası ve güvenli anahtar kullanım notları.
- [ ] Şemayı geçici Supabase projesinde çalıştırıp SQL hatalarını kontrol et.
- [ ] Ofisler arası veri izolasyonu için yetki testlerini çalıştır (kontrol listesi: `docs/RLS_VALIDATION_CHECKLIST.md`).
**Çıkış kriteri:** Her ofisin verisi sunucu tarafında ayrılmış, izinler test edilebilir.

### 3. Kimlik doğrulama ve ofis kurulumu
- [ ] E-posta ile kayıt/giriş/çıkış ve oturumun korunması.
- [ ] İlk kullanıcı için ofis oluşturma ve ofis sahibi rolü.
- [ ] Davet bağlantısı/kodu ile danışman ekleme.
- [ ] Bekleyen davet, pasif üyelik ve hata durumları.
**Çıkış kriteri:** Demo rol seçimi yerine gerçek hesap ve gerçek yetkilendirme.

### 4. Portföy yönetimi (CRUD)
- [ ] Portföy oluşturma, listeleme, detay, düzenleme ve arşivleme.
- [ ] Satılık/kiralık, fiyat, oda, metrekare, adres, açıklama ve durum alanları.
- [ ] Arama, filtreleme, sıralama ve form doğrulama.
- [ ] Ofis sahibi tüm ofis portföylerini, danışman kendi portföylerini görebilir.
**Çıkış kriteri:** Portföyler uygulama kapatılıp açıldığında kaybolmaz ve rol izinleri uygulanır.

### 5. Fotoğraflar ve profesyonel portföy PDF'i
- [ ] Galeriden fotoğraf seçme ve güvenli yükleme.
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
- [ ] Çalışan listesi, rol ve üyelik durumu.
- [ ] Danışman davet etme, devre dışı bırakma ve ofis üyeliği yönetimi.
- [ ] Ofis portföyleri ve danışman bazlı özetler.
- [ ] Sahip yetkilerini sunucu tarafında doğrulama.
**Çıkış kriteri:** Ofis sahibi ekibini ve ofisin tamamını yönetebilir.

### 8. İstatistikler ve iş takibi
- [ ] Aktif, opsiyonlu, satılmış ve kiralanmış portföy sayıları.
- [ ] Danışman bazlı portföy dağılımı ve fiyat toplamları.
- [ ] Görüntülenme/etkileşim metrikleri yalnızca gerçek ölçüm kaynağı varsa gösterilir.
- [ ] Veri yoksa demo rakamı göstermek yerine boş durum.
**Çıkış kriteri:** Gerçek kayıtlarla tutarlı, rol kapsamına uygun istatistikler.

### 9. Kalite, gizlilik ve mağaza hazırlığı
- [ ] TypeScript ve lint/format kontrolleri.
- [ ] Android ve iOS geliştirme derlemesi.
- [ ] Giriş, izinler, veri izolasyonu, portföy CRUD ve paylaşım için test senaryoları.
- [ ] KVKK için veri minimizasyonu, gizlilik metni ve hesap/veri silme akışı.
- [ ] Uygulama ikonu, açılış ekranı, sürüm numarası ve mağaza varlıkları.
**Çıkış kriteri:** Bilinen kritik hata kalmamış, test sonuçları belgelenmiş.

### 10. MVP yayına hazırlık ve teslim
- [ ] Üretim ortamı değişkenlerini ayarlama; gizli anahtarları repoya koymama.
- [ ] Yedekleme, hata izleme ve temel operasyon dokümantasyonu.
- [ ] Son kabul testi ve bilinen sınırlamaların listesi.
- [ ] Android/iOS build alma ve mağaza gönderim kontrol listesi.
**Çıkış kriteri:** Kurulum ve yayın adımları tekrarlanabilir, ürün gerçek ofislerde pilot kullanıma hazır.

## İlerleme günlüğü

- 2026-10-17: 10 aşamalı MVP planı oluşturuldu; ilk repo/bağımlılık denetimi, GitHub Actions kalite kontrolü ve Supabase veri modeli/RLS taslağı eklendi. SQL henüz gerçek Supabase projesinde çalıştırılmadı ve RLS yetki testleri yapılmadı. Başlangıçtaki demo ekranları tamamlanmış ürün olarak sayılmıyor; kalıcı veritabanı, gerçek oturum ve sunucu tarafı rol yetkileri zorunlu bitiş koşullarıdır.

## Çalışma kuralları
1. Bir aşama ancak kodu ve çıkış kriteri kontrol edildiğinde tamamlandı olarak işaretlenir.
2. Yapılamayan testler açıkça belirtilir; çalıştırılmamış test başarılı sayılmaz.
3. Supabase `service_role` anahtarı veya başka bir gizli anahtar mobil uygulamaya ya da repoya eklenmez.
4. Önce küçük, doğrulanabilir commit'ler yapılır; sonraki aşamaya geçerken yol haritası güncellenir.
