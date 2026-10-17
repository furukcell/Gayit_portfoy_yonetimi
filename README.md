# GAYIT — Portföy Yönetimi

**Emlak ofisleri ve danışmanları için mobil portföy ve ekip yönetimi uygulaması.**

GAYIT genel kullanıma açık bir emlak ilan pazaryeri değildir. Emlak ofislerinin kendi gayrimenkul kayıtlarını, danışmanlarını, sunumlarını ve performanslarını yönetmesine yardımcı olacak bir mobil iş aracıdır.

## Teknoloji

- Expo SDK 58
- React Native 0.88
- React 19.3
- TypeScript
- Expo Print + Expo Sharing (PDF sunumu)
- Google Maps URL (adresle harita ve navigasyon)
- WhatsApp paylaşım bağlantısı

Resmî SDK 58 belgeleri: https://docs.expo.dev/versions/v58.0.0/

## Uygulama rolleri

### Ofis sahibi
- Ofis portföyünü görüntüleme
- Danışman listesi ve özet performans
- Ofis istatistikleri
- İlan detaylarını görüntüleme, paylaşma ve PDF sunumu oluşturma

### Emlak danışmanı
- Kendi portföylerini görüntüleme ve filtreleme
- Yeni portföy kaydı oluşturma
- Kendi performans özetini görüntüleme
- İlanı WhatsApp üzerinden paylaşma
- PDF sunumu oluşturma
- Adresi Google Maps'te açma ve navigasyonu başlatma

## Şu anki durum

Mevcut uygulama, kullanıcı akışlarını göstermek için örnek veriler kullanan mobil prototiptir. Rol seçici, ofis özeti, portföy listesi, ilan detay ekranı, yeni portföy formu, ekip ve istatistik ekranları bulunur.

- Yeni portföy ekleme uygulama çalışırken bellekte tutulur; henüz kalıcı veritabanı bağlantısı yoktur.
- Ekip ve performans rakamları demo verisidir.
- PDF sunumu temel metin ve gayrimenkul alanlarını içerir; fotoğraf ve ofis markalaması daha sonra eklenecektir.
- Harita, girilen adresi Google Maps'te açar; konum doğruluğu adres metnine bağlıdır.
- WhatsApp paylaşımı, ilan metnini paylaşım bağlantısıyla açar.
- Giriş, ofis daveti, rol tabanlı sunucu yetkilendirmesi ve çoklu cihaz senkronizasyonu henüz yapılmamıştır.

## Kurulum

Node.js 22.13 veya daha yenisi önerilir.

```bash
npm install
npx expo install --fix
npx expo-doctor
npx expo start
```

SDK 58 için Expo Go'nun mağaza sürümü henüz yayımlanmamış olabileceğinden, gerekirse bir development build kullanın. SDK 58 sürüm notları: https://expo.dev/changelog/sdk-58

## Yol haritası

1. [x] Mobil prototip ve rol bazlı ekran taslağı
2. [x] Yeni portföy formu ve yerel demo akışı
3. [x] WhatsApp paylaşımı, PDF çıktısı ve Google Maps bağlantısı
4. [ ] Supabase kimlik doğrulama ve kalıcı veritabanı
5. [ ] Ofis oluşturma, danışman davet etme ve gerçek rol izinleri
6. [ ] Portföy fotoğrafları ve dosya depolama
7. [ ] Gerçek gösterim, müşteri, satış ve kiralama olaylarından istatistik üretme
8. [ ] Ofis logosu ve danışman bilgileriyle markalı PDF şablonu
9. [ ] Veri yedekleme, KVKK süreçleri ve güvenlik testleri

## Önemli veri güvenliği ilkesi

Her ofisin kayıtları sunucu tarafında ofis kimliği ve rol bazlı kurallarla izole edilmelidir. Sadece arayüzde kayıtları gizlemek yetkilendirme yerine geçmez. Üretime geçmeden önce veritabanı politikaları ve erişim testleri tamamlanmalıdır.

**GAYIT — Portföy Yönetimi**  
*Portföyünü yönet. Ekibini takip et. Sunumunu profesyonelleştir.*
