# GAYIT — Emlak Portföy ve Ofis Yönetimi

**Emlak ofislerinin portföylerini, müşterilerini, danışmanlarını ve iş takibini tek uygulamada yönetebilmesi için geliştirilen mobil uygulama.**

GAYIT, herkese açık bir emlak ilan sitesi veya ilan pazaryeri değildir. Ofis içinde kullanılan bir yönetim aracıdır. Hedef platformlar Android ve iOS'tur.

> **Önemli durum notu:** Repoda mobil ekranlar, uygulama akışları, Supabase bağlantı kodu, SQL migration taslakları ve sunucu fonksiyonları bulunur. Ancak veritabanı migration'larının gerçek Supabase projesine uygulanması, sunucu fonksiyonlarının deploy edilmesi ve uçtan uca yetki testleri tamamlanmış değildir. Bu nedenle aşağıdaki özellikler “kod/akış hazır” ile “gerçek ortamda doğrulanmış” olarak ayrılmıştır. Üretime hazır olduğu varsayılmamalıdır.

## İçindekiler

- [Kimler kullanır?](#kimler-kullanır)
- [Uygulamada neler yapılabilir?](#uygulamada-neler-yapılabilir)
- [Özelliklerin mevcut durumu](#özelliklerin-mevcut-durumu)
- [Yapılacak işler ve yayın planı](#yapılacak-işler-ve-yayın-planı)
- [Teknik yapı](#teknik-yapı)
- [Kurulum ve çalıştırma](#kurulum-ve-çalıştırma)
- [Proje dosyaları](#proje-dosyaları)
- [Güvenlik notları](#güvenlik-notları)

## Kimler kullanır?

### 1. Süper yönetici
Sistemde yeni emlak ofislerinin açılmasını ve ofis sahibi hesaplarının oluşturulmasını yöneten ayrıcalıklı roldür. Başlangıç süper yöneticisi güvenli bir yönetici işlemiyle tanımlanmalıdır; mobil uygulamada kullanıcı kendisini süper yönetici olarak seçemez.

### 2. Ofis sahibi / yönetici
Ofisin tüm portföylerini ve ekip üyelerini yönetir. Müşterileri, arama taleplerini, eşleşmeleri ve ofis istatistiklerini takip eder.

### 3. Emlak danışmanı
Kendisine atanmış portföyleri ve müşterileri yönetir; müşteri görüşmelerini kaydeder, takip planlar ve uygun portföy eşleşmelerini görür. Veritabanı yetkileri tamamlanıp doğrulandığında başka danışmanların veya başka ofislerin özel kayıtlarına erişememelidir.

## Uygulamada neler yapılabilir?

### Portföy yönetimi
- Satılık ve kiralık gayrimenkulleri tek portföy listesinden takip etme.
- Daire, villa, arsa, iş yeri, müstakil ev ve diğer gayrimenkul türlerini kaydetme.
- İlan başlığı, açıklama, fiyat, oda sayısı, metrekare, adres ve konum bilgilerini tutma.
- Portföyleri oluşturma, düzenleme ve arşivleme.
- Durumları takip etme: **Aktif, Opsiyonlu, Satıldı, Kiralandı, Arşivde**.
- Başlık, adres veya portföy koduna göre arama; satılık/kiralık filtresi ve fiyat sıralaması.
- Portföye birden fazla fotoğraf ekleme ve fotoğrafları görüntüleme/silme.

### Müşteri ve talep yönetimi
- Müşteri adı, telefon numarası, müşteri türü/rolleri ve notlarını kaydetme.
- Bir müşteriye birden fazla gayrimenkul arama talebi ekleme.
- Talepte satılık/kiralık tercihi, gayrimenkul tipi, şehir/ilçe, bütçe ve oda gibi kriterleri tutma.
- Müşteri bilgilerini düzenleme ve müşteri detayını görüntüleme.
- Müşteriye sonraki takip tarihi belirleme.

### Portföy–müşteri eşleştirme
- Kayıtlı müşteri talepleri ile aktif portföyleri kriterlere göre karşılaştırma.
- **Tam eşleşme** ve **alternatif eşleşme** sonuçlarını ayrı gruplarda gösterme.
- Eşleşme puanını ve eşleşme nedenlerini saklama/gösterme.
- Aynı talep ve portföy çifti için yinelenen eşleşme kaydını önlemeye yönelik sunucu işlevi taslağı.
- Yeni müşteri talebi veya yeni portföy oluşturulduğunda eşleştirme işlevini çağırma.

### Müşteri görüşmeleri ve randevular
- Telefon görüşmesi, WhatsApp görüşmesi, toplantı, yer gösterme ve genel not gibi aktiviteleri kaydetme.
- Müşteri geçmişindeki görüşme kayıtlarını takip etme.
- Müşteriyle ilgili randevu oluşturma ve randevuları listeleme.
- Takip tarihini müşteri detayından düzenleme.

### Fotoğraflar, PDF ve paylaşım
- Portföy fotoğraflarını özel depolama alanında tutmak için yükleme ve erişim akışları.
- GAYIT markalı, fiyatı ve gayrimenkul bilgilerini içeren PDF portföy sunumu oluşturma.
- Portföy fotoğraflarını PDF sunumuna ekleme.
- Portföy bilgilerini WhatsApp üzerinden paylaşma.
- Portföy adresini Google Maps aramasında açma.

### Ekip yönetimi ve ofis istatistikleri
- Ofis sahibi tarafından danışman hesabı oluşturma akışı.
- Ekip üyelerini listeleme.
- Danışman üyeliğini devre dışı bırakma ve yeniden etkinleştirme.
- Portföy durumlarının adetlerini görüntüleme.
- Ofis sahibi için danışman bazında portföy adedi ve fiyat toplamlarını takip etme.
- Görüntülenme gibi ölçülmeyen veriler için uydurma rakam göstermek yerine ölçümün kurulmadığını belirtme.

### Bildirimler
- Uygulama içindeki bildirim merkezini açma.
- Bildirimleri okundu olarak işaretleme.
- Yeni eşleşmelerle ilişkili bildirimleri göstermek için veri ve sunucu işlevi taslağı.

## Özelliklerin mevcut durumu

Aşağıdaki durumlar, repodaki kod ve dokümantasyona göre verilmiştir; canlı ortamda uçtan uca çalıştığı anlamına gelmez.

| Alan | Repodaki durum | Gerçek ortamda yapılması gereken |
|---|---|---|
| Mobil arayüz ve gezinme | Ekran akışları mevcut | Android ve iOS cihazlarında kullanılabilirlik testi |
| Giriş ve ilk şifre değişimi | İstemci akışı ve sunucu fonksiyonu taslağı mevcut | Supabase Auth yapılandırması ve gerçek hesaplarla uçtan uca test |
| Ofis oluşturma | Süper yönetici paneli ve Edge Function taslağı mevcut | Güvenli ilk yönetici kurulumu, fonksiyon deploy'u ve test |
| Danışman ekleme | Form ve Edge Function taslağı mevcut | Gerçek kullanıcı oluşturma, fotoğraf yükleme ve yetki testi |
| Portföy yönetimi | CRUD ekranları ve Supabase sorguları mevcut | Migration'ları uygulama ve gerçek veriyle test |
| Fotoğraf deposu | Storage yükleme/silme ve SQL politikası taslakları mevcut | Migration, rol bazlı erişim ve hata senaryolarını test etme |
| PDF / WhatsApp / harita | Uygulama akışları mevcut | Gerçek Android/iOS cihazlarında doğrulama |
| Müşteri CRM ve takip | Ekranlar ve veri erişim akışları mevcut | CRM migration'larını uygulama ve rol testleri |
| Eşleştirme ve bildirim | Edge Function ve istemci akışları mevcut | Fonksiyonu deploy etme; sonuç, yetki ve yinelenen bildirim testleri |
| İstatistikler | Portföy verilerinden hesaplama kodu mevcut | Gerçek ofis verileriyle sonuçları karşılaştırma |
| Güvenlik / ofis izolasyonu | RLS migration taslakları ve test listesi mevcut | Ayrı ofis ve kullanıcılarla doğrudan API testlerini çalıştırma |
| Mağazaya yayın | Tamamlanmadı | Build, gizlilik metni, ikon/görseller, kabul testleri ve mağaza kontrol listesi |

## Yapılacak işler ve yayın planı

Bu liste, uygulamanın gerçekten kullanılabilir ve güvenli bir MVP olarak teslim edilmesi için kalan işleri açıkça gösterir.

### Öncelik 1 — Veritabanı ve güvenlik
- [ ] Supabase projesini kurup migration dosyalarını bağımlılık sırasına göre geçici test ortamında çalıştırmak.
- [ ] Migration 001–010 SQL sonuçlarını ve varsa hataları kontrol etmek.
- [ ] Ofisler arası veri izolasyonunu; ofis sahibi, danışman, devre dışı kullanıcı ve üye olmayan kullanıcı hesaplarıyla test etmek.
- [ ] Portföy fotoğrafı metadata kayıtları ile Storage nesnelerinin aynı ofis ve portföye ait olduğunu doğrulamak; fotoğraf politikalarındaki ek ofis kontrollerini gözden geçirip düzeltmek.
- [ ] CRM talepleri, aktiviteler, randevular ve eşleşmeler için ofis sınırı ve müşteri ataması testlerini çalıştırmak.
- [ ] Bu kontrolleri yalnızca uygulama ekranından değil, doğrudan kimliği doğrulanmış API istekleriyle de denemek.

### Öncelik 2 — Gerçek hesap ve ofis kurulumu
- [ ] İlk süper yöneticiyi güvenli yönetici işlemiyle oluşturmak.
- [ ] Süper yönetici panelini güvenli biçimde barındırmak ve ofis oluşturma fonksiyonuna bağlamak.
- [ ] Kullanıcı adı/şifre ile giriş, ilk giriş şifresi değiştirme, oturum yenileme ve çıkış akışlarını gerçek hesaplarla test etmek.
- [ ] Danışman oluşturma, ilk şifre teslimi, profil fotoğrafı ve üyeliği devre dışı bırakma/yeniden açma akışlarını doğrulamak.
- [ ] Hatalı giriş denemeleri, parola kurtarma ve hesap kilitleme/limit politikalarını kararlaştırmak.

### Öncelik 3 — Portföy ve fotoğraf testleri
- [ ] Portföy ekleme, düzenleme, durum değiştirme, arşivleme, arama ve sıralama işlemlerini gerçek veritabanıyla test etmek.
- [ ] Form hatalarını, internet kesintisini ve art arda kaydetme girişimlerini test etmek.
- [ ] Fotoğraf yükleme/silme, Storage hatası ve metadata hatası senaryolarını test etmek.
- [ ] Kapak fotoğrafı ve fotoğraf sıralama özelliğini değerlendirmek.
- [ ] PDF oluşturma, fotoğrafların PDF'e eklenmesi, WhatsApp paylaşımı ve harita açma işlemlerini gerçek cihazlarda denemek.

### Öncelik 4 — CRM, eşleştirme ve bildirimler
- [ ] Müşteri ve birden fazla arama talebi oluşturma/düzenleme akışını test etmek.
- [ ] Müşteri görüşme geçmişi, takip tarihi ve randevuların kalıcı olarak kaydedildiğini doğrulamak.
- [ ] Eşleştirme Edge Function'ını Supabase'e deploy edip tam/alternatif eşleşmeleri örnek verilerle kontrol etmek.
- [ ] Aynı eşleşmenin tekrar oluşturulmaması ve aynı olay için gereksiz bildirim gönderilmemesi kontrollerini yapmak.
- [ ] Danışmanların yalnızca yetkili oldukları müşteri ve portföylerle işlem yaptığını doğrulamak.

### Öncelik 5 — Yayına hazırlık
- [ ] Android ve iOS geliştirme/üretim derlemelerini almak.
- [ ] TypeScript, Expo bağımlılık kontrolü ve cihaz testlerini sürdürmek.
- [ ] KVKK kapsamındaki veri minimizasyonu, aydınlatma/gizlilik metni, saklama süresi ve hesap/veri silme akışını hazırlamak.
- [ ] Uygulama ikonu, açılış ekranı, ekran görüntüleri ve mağaza açıklamalarını hazırlamak.
- [ ] Yedekleme, hata izleme ve üretim ortamı değişkenlerini yapılandırmak.
- [ ] Pilot bir emlak ofisinde kabul testi yapıp kritik hataları kapatmak.

**Güncel görev listesi ve ayrıntılı teknik adımlar:** [ROADMAP.md](./ROADMAP.md)  
**Doğrudan veritabanı güvenlik testleri:** [RLS_VALIDATION_CHECKLIST.md](./docs/RLS_VALIDATION_CHECKLIST.md)

## Teknik yapı

- **Mobil uygulama:** Expo SDK 58, React Native 0.88, React 19.3, TypeScript.
- **Kimlik doğrulama ve veritabanı:** Supabase Auth ve PostgreSQL.
- **Erişim kontrolü:** PostgreSQL Row Level Security (RLS) politikaları.
- **Dosyalar:** Supabase Storage için özel bucket ve imzalı bağlantılar.
- **Sunucu işlemleri:** Supabase Edge Functions (ofis/danışman oluşturma, ilk giriş şifresi değiştirme, eşleştirme).
- **PDF:** Expo Print ve Expo Sharing.
- **Fotoğraf seçimi:** Expo Image Picker.
- **Paylaşım ve konum:** WhatsApp bağlantısı ve Google Maps bağlantısı.
- **CI:** GitHub Actions ile TypeScript ve Expo bağımlılık tanılama kontrolleri.

## Kurulum ve çalıştırma

Node.js **22.13 veya daha yeni** bir sürüm kullanılması önerilir.

1. Depoyu bilgisayarınıza alın.
2. Bağımlılıkları kurun.
3. `.env.example` dosyasını temel alarak yerel `.env` dosyanızı oluşturun.
4. Supabase proje URL'si ve istemci için uygun publishable/anon anahtarını yapılandırın.
5. Geliştirme komutlarını çalıştırın.

```bash
npm install
npx expo install --fix
npx expo-doctor
npm run typecheck
npx expo start
```

Supabase olmadan veya gerekli migration'lar uygulanmadan tüm ekranların gerçek verilerle çalışacağı varsayılmamalıdır. Veritabanı kurulumuna başlamadan önce [Supabase kurulum notlarını](./docs/SUPABASE_SETUP.md) ve [kullanıcı adıyla giriş dokümanını](./docs/USERNAME_AUTH.md) okuyun.

## Proje dosyaları

- `App.tsx` — mobil uygulamanın ekranları ve ana akışları.
- `ROADMAP.md` — aşamalar, ilerleme ve teslim kriterleri.
- `supabase/migrations/` — veritabanı tabloları ve RLS politikaları için SQL taslakları.
- `supabase/functions/` — sunucu tarafında çalışması planlanan Edge Functions.
- `superadmin/index.html` — süper yönetici ofis oluşturma paneli taslağı.
- `src/lib/supabase.ts` — Supabase istemci yapılandırması.
- `src/lib/usernameAuth.ts` — kullanıcı adıyla giriş yardımcıları.
- `docs/SUPABASE_SETUP.md` — Supabase kurulum ve güvenlik notları.
- `docs/USERNAME_AUTH.md` — kullanıcı adıyla giriş akışı.
- `docs/RLS_VALIDATION_CHECKLIST.md` — doğrudan API üzerinden çalıştırılması gereken güvenlik testleri.
- `.env.example` — yerel ortam değişkenleri şablonu.

## Güvenlik notları

- `.env` dosyasını veya gizli anahtarları Git deposuna eklemeyin.
- Supabase `service_role` anahtarını mobil uygulamaya, web panelinin istemci koduna veya herkese açık bir dosyaya **asla** koymayın. Yalnızca güvenilir sunucu ortamında gizli değişken olarak saklayın.
- Arayüzde bir butonu gizlemek güvenlik sağlamaz; yetki veritabanı politikalarında ve sunucu fonksiyonlarında kontrol edilmelidir.
- Gerçek kullanıcı verisi kullanmadan önce farklı ofislerle RLS ve Storage erişim testleri yapılmalıdır.
- Bu README ürün kapsamını ve geliştirme durumunu anlatır; tek başına güvenlik veya mağaza yayını onayı değildir.

---

**GAYIT — Portföyünü yönet. Ekibini takip et. Müşterilerini unutma. Sunumunu profesyonelleştir.**
