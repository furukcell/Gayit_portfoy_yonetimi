# GAYIT — Portföy Yönetimi

**Emlak ofisleri ve danışmanları için mobil portföy ve ekip yönetimi.**

GAYIT genel kullanıma açık bir emlak ilan pazaryeri değildir. Ofis sahiplerinin ekiplerini ve tüm ofis portföyünü, danışmanların ise kendilerine ait portföyleri yönetebilmesi için geliştirilir.

## Teknoloji

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript
- Expo Print + Expo Sharing: PDF çıktısı ve paylaşımı
- Supabase Auth + Postgres + Row Level Security: planlanan kalıcı veri katmanı; henüz uygulama istemcisine bağlanmadı
- Hesap modeli: süperadmin ofis/ofis sahibi hesabı açar; ofis sahibi danışmanları kullanıcı adı, ilk şifre ve fotoğrafla ekler. E-posta ile kendi kendine kayıt olmayacak.
- Google Maps URL ve WhatsApp paylaşımı

SDK 58, 15 Ekim 2026 tarihinde yayımlandı ve React Native 0.88 kullanıyor. Resmî kaynaklar: [SDK 58 duyurusu](https://expo.dev/changelog/sdk-58) · [SDK referansı](https://docs.expo.dev/versions/v58.0.0/).

> Expo Go'nun SDK 58 mağaza sürümü resmî duyuruya göre henüz yayımlanmadığından, geliştirme sırasında development build gerekebilir.

## Durum

Şu an repo bir **mobil prototip** içerir. Ekranlarda örnek portföyler ve örnek istatistikler bulunur. Kalıcı veri, gerçek giriş ve rol yetkilendirmesi tamamlanmış değildir.

- `App.tsx`: mevcut mobil prototip
- `ROADMAP.md`: 10 aşamalı geliştirme planı ve durum
- `supabase/migrations/001_initial_schema.sql`: ilk veritabanı şeması ve RLS politikaları taslağı
- `docs/SUPABASE_SETUP.md`: Supabase kurulum notları
- `docs/USERNAME_AUTH.md`: kullanıcı adıyla giriş mimarisi ve yapılacaklar
- `supabase/functions/create-office/index.ts`: süperadmin kontrollü ofis oluşturma taslağı
- `supabase/functions/create-agent/index.ts`: ofis sahibi kontrollü danışman oluşturma taslağı
- `supabase/functions/complete-first-login/index.ts`: ilk girişte şifre değiştirme taslağı
- `src/lib/supabase.ts` ve `src/lib/usernameAuth.ts`: Supabase istemcisi ve kullanıcı adıyla giriş yardımcıları
- `.env.example`: yerel ortam değişkenleri şablonu

## Kurulum

Node.js 22.13 veya daha yeni sürüm kullanın.

```bash
npm install
npx expo install --fix
npx expo-doctor
npm run typecheck
npx expo start
```

Bu kontroller henüz uzak repo üzerinde çalıştırılmış olarak raporlanmıyor; kodu yerel makinede çalıştırıp sonuçları kontrol edin.

## Yol haritası

MVP'nin 10 aşamasını, çıkış kriterlerini ve ilerleme günlüğünü [ROADMAP.md](./ROADMAP.md) dosyasından takip edin. Supabase şemasını uygulamadan önce [kurulum ve güvenlik notlarını](./docs/SUPABASE_SETUP.md) okuyun.

## Güvenlik

- `.env` dosyası repoya eklenmemelidir.
- Mobil uygulamada Supabase publishable/anon anahtarı kullanılabilir; `service_role` anahtarı kesinlikle istemciye eklenmemelidir.
- Güvenlik yalnızca ekrandaki kontrollerle değil, veritabanı RLS politikalarıyla sağlanmalıdır.
- Üretime geçmeden önce iki ayrı ofis ve farklı rollerde kullanıcılarla veri izolasyonu test edilmelidir.

**GAYIT — Portföyünü yönet. Ekibini takip et. Sunumunu profesyonelleştir.**