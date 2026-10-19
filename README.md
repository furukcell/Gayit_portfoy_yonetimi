# GAYIT — Emlak Portföy ve Ofis Yönetimi

**Emlak ofislerinin portföylerini, müşterilerini, danışmanlarını ve iş takibini tek uygulamada yönetebilmesi için geliştirilen mobil uygulama.**

GAYIT, herkese açık bir emlak ilan sitesi veya ilan pazaryeri değildir. Ofis içinde kullanılan bir yönetim aracıdır. Hedef platformlar Android ve iOS'tur.

> **Firebase geçiş durumu (2026-10-19):** Mobil uygulama Firebase Auth, Firestore ve Storage istemcisine taşındı; ofis/danışman oluşturma ve eşleştirme için Firebase callable Functions eklendi. TypeScript ve fonksiyon kontrolleri GitHub Actions üzerinden doğrulanıyor. Ancak Firebase proje yapılandırması, Functions/rules dağıtımı, Firebase Secrets ve gerçek cihazda uçtan uca testler tamamlanmadan uygulama üretime hazır sayılmaz. Eski `supabase/` SQL dosyaları geçiş referansı olarak durur; otomatik veri aktarımı yapılmaz.

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

## Yeni portföy iş akışları (2026-10-17)

Bu geliştirme paketi PR #1 ile `main` dalına birleştirildi. Kod akışları repoda mevcut olsa da aşağıdaki veritabanı özellikleri için migration 011'in Supabase ortamına ayrıca uygulanması ve gerçek kullanıcılarla doğrulanması gerekir.

### Portföy listesi ve galeri
- Portföy fotoğraflarının sırasını değiştirme; ilk fotoğraf kapak olarak işaretlenir.
- Portföy durumuna göre filtreleme ve minimum/maksimum fiyat aralığı.
- Portföyü favorilere ekleme ve yalnızca favorileri listeleme.
- Son görüntülenen portföyleri listeleme ve hızlı erişim.

### Takip, rapor ve aktarım
- Ana sayfada bugünün ve gecikmiş müşteri takipleri.
- Portföy durum adetleri ve fiyat toplamlarından metin raporu üretip paylaşma.
- Portföy listesini CSV metni olarak dışa aktarma/paylaşma.
- CSV metnini uygulamaya yapıştırarak birden fazla yeni portföyü toplu içe aktarma. Bu sürüm dosya seçmez ve var olan kayıtları güncellemez.

### Satış/kiralama ve komisyon
- Gerçekleşen satış veya kiralama kaydı.
- İşlem bedeli, işlem tarihi, notlar, ofis komisyonu ve danışman komisyonu alanları.
- Kayıt sonrasında portföy durumunu satıldı/kiralandı olarak güncelleme akışı.
- Favoriler, son görüntülenenler, işlem kayıtları ve ofis logo/iletişim sütunları için SQL: `supabase/migrations/011_favorites_and_transactions.sql`.

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
| Favoriler / son görüntülenenler | Uygulama akışı ve migration 011 mevcut | Migration'ı uygulama; RLS ve ofis sınırı testleri |
| CSV içe/dışa aktarma | Metin yapıştırma ve paylaşım akışı mevcut | Gerçek verilerle test; dosya seçimi ve mevcut kayıtları güncelleme henüz yok |
| Satış/kiralama ve komisyon | Kayıt ekranı ve migration 011 mevcut | Veritabanı ve komisyon yetkilerini doğrulama |
| Ofis markalı PDF | Migration 011'de logo/iletişim alanları hazır | Ayar ekranı ve PDF bağlantısı henüz tamamlanmadı |
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
- **Kimlik doğrulama:** Firebase Authentication (E-posta/Şifre; kullanıcı adı iç e-posta biçimine dönüştürülür).
- **Veritabanı ve erişim kontrolü:** Cloud Firestore ve `firestore.rules`.
- **Dosyalar:** Firebase Storage ve `storage.rules` ile ofis bazlı erişim.
- **Sunucu işlemleri:** Firebase callable Functions (`createOffice`, `createAgent`, `setAgentStatus`, `evaluateMatches`).
- **PDF:** Expo Print ve Expo Sharing.
- **Fotoğraf seçimi:** Expo Image Picker.
- **Paylaşım ve konum:** WhatsApp bağlantısı ve Google Maps bağlantısı.
- **CI:** GitHub Actions ile TypeScript ve Expo bağımlılık tanılama kontrolleri.

## Kurulum ve çalıştırma

Node.js **22.13 veya daha yeni** bir sürüm kullanılması önerilir.

1. Depoyu bilgisayarınıza alın.
2. Bağımlılıkları kurun.
3. `.env.example` dosyasını temel alarak yerel `.env` dosyanızı oluşturun.
4. `.env.example` içindeki altı `EXPO_PUBLIC_FIREBASE_*` değişkenini Firebase Console > Project settings > Your apps bölümünden doldurun.
5. Geliştirme komutlarını çalıştırın.

```bash
npm install
npx expo install --fix
npx expo-doctor
npm run typecheck
npx expo start
```

### Android APK üretme

Repoda iki derleme seçeneği yapılandırılmıştır:

**Codemagic (imzalı test APK'sı)**

- `codemagic.yaml` içindeki `gayit` Android keystore referansı Codemagic hesabındaki mevcut GAYIT keystore kaydıyla aynı olmalıdır.
- Codemagic ortam değişkenlerine `docs/FIREBASE_SETUP.md` içinde listelenen altı Firebase istemci değişkenini ekleyin.
- Workflow, Expo'nun native Android projesini yeniden oluşturur, TypeScript kontrolü yapar ve release APK'sını üretir.
- Build sonucu `android/app/build/outputs/apk/release/*.apk` artifact olarak sunulur.
- Workflow imzalama değişkenlerini Codemagic'in Android keystore bağlantısından (`CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`) kullanır. Keystore bağlantısı kurulmamışsa imzalı APK üretimi başarısız olur.

**EAS Build**

Önce EAS hesabına giriş yapın ve proje bağlantısını kurun; EAS ortam değişkenlerine de aynı altı Firebase istemci değişkenini tanımlayın. Ardından:

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

`preview` profili cihaza kurulabilen APK, `production` profili ise mağaza yüklemesi için AAB üretmek üzere tanımlanmıştır. EAS projesi/kimlik bilgileri ve ortam değişkenleri hesapta yapılandırılmadan build'in başarılı olacağı garanti edilmez.

**Not:** Build'in başarılı olması Supabase migration'larının uygulandığını veya gerçek kullanıcı akışlarının test edildiğini kanıtlamaz. Yayından önce [RLS güvenlik kontrol listesini](./docs/RLS_VALIDATION_CHECKLIST.md) uygulayın.


Supabase olmadan veya gerekli migration'lar uygulanmadan tüm ekranların gerçek verilerle çalışacağı varsayılmamalıdır. Veritabanı kurulumuna başlamadan önce [Supabase kurulum notlarını](./docs/SUPABASE_SETUP.md) ve [kullanıcı adıyla giriş dokümanını](./docs/USERNAME_AUTH.md) okuyun.

## Proje dosyaları

- `App.tsx` — mobil uygulamanın ekranları ve ana akışları.
- `ROADMAP.md` — aşamalar, ilerleme ve teslim kriterleri.
- `supabase/` — eski veri modelini anlamak için bırakılan geçiş referansları; aktif uygulama bağlantısı değildir.
- `functions/` — Firebase callable Functions.
- `superadmin/index.html` — süper yönetici ofis oluşturma paneli taslağı.
- `src/lib/firebase.ts` ve `src/lib/firebaseClient.ts` — Firebase istemci yapılandırması ve veri erişimi.
- `src/lib/usernameAuth.ts` — kullanıcı adıyla giriş yardımcıları.
- `docs/FIREBASE_SETUP.md` — Firebase kurulum ve güvenlik notları.
- `docs/USERNAME_AUTH.md` — kullanıcı adıyla giriş akışı.
- `docs/RLS_VALIDATION_CHECKLIST.md` — doğrudan API üzerinden çalıştırılması gereken güvenlik testleri.
- `.env.example` — yerel ortam değişkenleri şablonu.

## Güvenlik notları

- `.env` dosyasını veya gizli anahtarları Git deposuna eklemeyin.
- Firebase Admin SDK service-account anahtarlarını mobil uygulamaya veya Git deposuna **asla** koymayın.
- Arayüzde bir butonu gizlemek güvenlik sağlamaz; yetki veritabanı politikalarında ve sunucu fonksiyonlarında kontrol edilmelidir.
- Gerçek kullanıcı verisi kullanmadan önce farklı ofislerle Firestore Rules ve Storage erişim testleri yapılmalıdır.
- Eski Supabase kayıtları Firestore'a otomatik taşınmaz; canlı veri varsa ayrı bir dışa aktarma/aktarım ve doğrulama adımı gerekir.
- CSV aktarımı yeni portföy oluşturur; mevcut portföyleri güncellemez. İçe aktarmadan önce başlık, adres ve fiyat alanlarını kontrol edin.
- Bu README ürün kapsamını ve geliştirme durumunu anlatır; tek başına güvenlik veya mağaza yayını onayı değildir.

---

**GAYIT — Portföyünü yönet. Ekibini takip et. Müşterilerini unutma. Sunumunu profesyonelleştir.**
