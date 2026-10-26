# GAYIT — Emlak Portföy ve Ofis Yönetimi

GAYIT, emlak ofislerinin portföylerini, müşterilerini, danışmanlarını ve satış operasyonlarını tek mobil uygulamada yönetmesi için geliştirilen Android/iOS uygulamasıdır. Genel kullanıma açık bir ilan pazaryeri değil, emlak ofislerinin iç operasyon aracıdır.

> **Durum notu (21 Ekim 2026):** Bu README, repodaki uygulama kodunu ve yapılandırma dosyalarını özetler. Bir özelliğin kodda bulunması canlı Firebase projesinde kuralların yayımlandığı veya gerçek cihazda başarıyla test edildiği anlamına gelmez.

## İçindekiler
- [Kullanıcı rolleri](#kullanıcı-rolleri)
- [Özellikler](#özellikler)
- [Son geliştirmeler](#son-geliştirmeler)
- [Teknik mimari](#teknik-mimari)
- [Kurulum ve derleme](#kurulum-ve-derleme)
- [Firebase ilk kurulum kontrol listesi](#firebase-ilk-kurulum-kontrol-listesi)
- [Planlanan web paneli ve herkese açık ilan linkleri](#planlanan-web-paneli-ve-herkese-açık-ilan-linkleri)
- [Bilinen sınırlamalar ve sonraki işler](#bilinen-sınırlamalar-ve-sonraki-işler)
- [Güvenlik notları](#güvenlik-notları)

## Kullanıcı rolleri
- **Süperadmin:** Ofis kurulumlarını ve yönetim akışlarını yönetir; bir ofis bağlamında işlem yapabilir.
- **Ofis sahibi:** Ofis portföylerini, müşteri kayıtlarını, danışmanları, işlem kayıtlarını ve ofis raporlarını yönetir.
- **Danışman:** Müşteri ilişkilerini, arama taleplerini, görüşme/takip geçmişini ve portföy çalışmalarını yürütür. Erişim kapsamı Firestore kurallarıyla sınırlandırılmalıdır.

## Özellikler

### 1. Portföy yönetimi
- Satılık/kiralık kayıtlar; gayrimenkul türü, fiyat, oda, alan, adres, açıklama ve durum bilgileri.
- Portföy ekleme, düzenleme, arşivleme ve durum değiştirme.
- Metin araması, satılık/kiralık, durum, fiyat aralığı, şehir, ilçe ve gayrimenkul tipi filtreleri; fiyat sıralaması.
- Bir portföye birden fazla fotoğraf ekleme, sıralama, kapak fotoğrafı belirleme ve silme.
- Favoriler ve son görüntülenen portföyler.
- Excel dosyasından içe aktarma akışı ve CSV içe/dışa aktarma araçları.
- Google Maps'te adres açma, WhatsApp üzerinden ilan paylaşma ve tek portföy için PDF oluşturma.
- **Müşteriye özel birleşik PDF:** Portföy ekranında sunum modunu açıp en az iki ilan seçerek her gayrimenkulün ayrı sayfada yer aldığı tek PDF oluşturma/paylaşma. PDF, mevcut kayıtlı fotoğrafları da eklemeyi dener.

### 2. Müşteri CRM'i
- Müşteri adı, telefon, roller (alıcı, satıcı, kiracı, ev sahibi, yatırımcı), notlar ve atanan danışman.
- Müşteriye birden fazla arama talebi kaydetme: satılık/kiralık, tür, şehir/ilçe, azami bütçe ve oda sayısı.
- Müşteri detayında bilgi düzenleme ve sonraki takip tarihi belirleme.
- Telefon, WhatsApp, toplantı, yer gösterme ve not aktivitesiyle görüşme geçmişi tutma.
- Müşteriye randevu ekleme ve geçmiş randevuları listeleme.
- Ana sayfada bugün ve gecikmiş takipleri gösterme.
- Müşteriyle ilişkilendirilebilen tarih-saat bazlı ajanda kaydı; başlık, not, müşteri bağlantısı ve planlandı/geçmiş durumunu gösterme.
- Ajandada aylık takvimden gün seçme ve saat girme; günlük kayıtlar ile yaklaşan işleri listeleme.

### 3. Portföy–müşteri eşleştirme
- Tam ve alternatif eşleşmeleri ayrı gruplarda gösterme.
- Eşleşme puanı ve gerekçe alanları.
- Yeni müşteri talebi kaydından sonra eşleştirme çalıştırma akışı bulunur. Otomatik sunucu değerlendirmesi, ilgili callable function ve veri şeması canlı projede hazır değilse çalışmayabilir; ücretli Cloud Functions gerektiren akışların dağıtımı doğrulanmalıdır.

### 4. Yer gösterme, teklifler ve işlem kaydı
- Müşteri detayından yer gösterme aktivitesi ve randevu kaydı tutma.
- Gerçekleşen satış/kiralama için portföy, işlem bedeli, tarih, not, ofis komisyonu ve danışman komisyonu alanları.
- İşlem kaydından sonra portföy durumunu satıldı/kiralandı olarak güncelleme akışı.
- Müşteri detayına bağlı teklif takibi: portföy seçme, tutar, not, bekliyor/karşı teklif/kabul/ret durumları ve teklif geçmişi.
- Teklifler Firestore'da `property_offers` koleksiyonuna kaydedilir; canlı rules ve yetki testleri yapılmalıdır. Tekliflerin ayrı bir genel kanban panosu henüz yoktur.

### 5. Danışman ve ofis yönetimi
- Danışmanları listeleme ve üyeliği etkinleştirme/devre dışı bırakma akışları.
- Ofis bazlı portföy ve ekip özeti.
- Ofis sahibi için satış/kiralama ve komisyon kaydı.
- Süperadmin paneli ve ofis bağlamına geçiş akışı.
- Danışman hesabı oluşturma kodu ücretli Cloud Functions kullanmadan Firebase Authentication üzerinden ayrı bir Firebase uygulama oturumu açmayı hedefler. Bunun çalışması için Firebase Authentication sağlayıcısı etkin olmalı, Firestore rules canlı projeye yayımlanmalı ve hesap oluşturma izinleri test edilmelidir.

### 6. Ana sayfa ve günlük planlama
- Saat dilimine göre otomatik karşılama mesajı: günaydın, iyi günler, iyi akşamlar veya iyi geceler.
- Kompakt ofis özeti: portföy, aktif müşteri, bugünkü randevu ve müşteri takip sayıları.
- Günün programı, saat sıralı yaklaşan görüşmeler ve müşteri takipleri.
- Portföy özeti: aktif, satılık ve kiralık kayıtlar ile son eklenen ilanlara hızlı erişim.
- Ana sayfa ajanda kartı ve tam ajanda ekranı aynı `appointments` kayıt kaynağını kullanacak şekilde yapılandırılmıştır. Canlı veritabanı erişimi ve müşteri randevularının otomatik eşleşmesi gerçek ortamda ayrıca doğrulanmalıdır.

### 7. Performans ve raporlama
- Portföy durum adetleri, aktif müşteri sayısı, bugün/geciken takipler ve önümüzdeki 7 günlük takip özeti.
- Satış/kiralama kayıtlarında ofis ve danışman komisyonlarını saklama.
- Portföy verisini CSV olarak paylaşma ve özet rapor akışları.
- Raporların doğruluğu mevcut veri kayıtlarının eksiksizliğine bağlıdır; kaydedilmemiş işlem veya ölçülmeyen görüntülenme sayıları varsayılmamalıdır.

### 8. Bildirimler ve medya
- Uygulama içi bildirim listesi ve okundu işaretleme akışı.
- Şu anki medya yükleme sağlayıcısı Cloudinary'dir; portföy fotoğrafları ve avatarlar `gayit_portfoy` unsigned upload preset'i ile yüklenir.
- Firebase Storage kodu ve yapılandırması silinmemiştir. İleride Firebase Storage'a geçiş için korunur; uygulama kodu sağlayıcı adaptörü üzerinden çalışmalıdır.
- Cloudinary unsigned upload, istemci tarafında silme işlemini tek başına güvenli biçimde desteklemez. Silme ihtiyacı için güvenli sunucu tarafı imzalı işlem gerekir.
- PDF üretiminde kayıtlı fotoğraf URL'leri kullanılır; URL türüne göre erişim davranışı değişebilir.

## Son geliştirmeler
- Ana sayfa yenilendi: daha kompakt KPI kartları, günün programı, takip özeti, portföy dağılımı ve son eklenen ilanlar.
- Ana sayfa karşılama metni cihazın yerel saatine göre otomatik değişir.
- Ajanda ekranında aylık takvim, gün/saat seçimi, yeni iş kaydı ve müşteri ilişkilendirme alanları.
- İlan PDF sunumunda ilan detayları ile fotoğrafları birlikte sunma düzenlemesi; fotoğraf yükleme ve PDF fotoğraf erişimi gerçek cihazda ayrıca doğrulanmalıdır.
- Firebase Auth oturum kalıcılığı için AsyncStorage tabanlı persistence düzenlemesi.
- Uygulama açılışında `assets/images/splash.png` görseli ve uygulama kodunda animasyonlu, altın renkli dönen yükleme göstergesi.
- Danışman oluşturma akışının Cloud Functions olmadan çalışması için istemci tarafı Firebase Authentication + Firestore yazma yolu.
- Ofis sahibi/süperadmin danışman ekleme akışına yönelik Firestore rules düzenlemesi.
- Portföy ekranında çoklu seçim ve müşteriye özel tek PDF sunumu.
- Müşteri detayında portföy bazlı teklif tutarı/durumu/notu kaydetme ve teklif durumunu güncelleme.
- Ana sayfa istatistiklerinde takip ve müşteri göstergeleri.
- Portföy filtreleri, Excel içe aktarma, fotoğraf sıralama ve komisyon kaydı akışları.

Bu geliştirmeler GitHub'a gönderilmiş olsa da bu belge cihaz testinin veya canlı Firebase deploy işleminin yapıldığını iddia etmez.

## Teknik mimari
- **Mobil:** React Native, Expo, TypeScript.
- **Açılış ekranı:** Expo yerel splash görseli + oturum geri yükleme sırasında React Native animasyonlu spinner. Animasyonlu spinner, yerel işletim sistemi splash ekranının parçası değil; JS arayüzü başlatıldıktan sonra görünür.
- **Kimlik doğrulama:** Firebase Authentication; kullanıcı adı tabanlı giriş, Firebase Auth tarafında dahili bir e-posta biçimine eşlenir.
- **Veri:** Firebase Firestore.
- **Medya (şimdilik):** Cloudinary (`EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dxumI0h3`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=gayit_portfoy`). Bu değişkenler sır değildir; API Secret mobil uygulamaya kesinlikle eklenmemelidir.
- **Medya (ileride):** Firebase Storage entegrasyonu `src/lib/firebase.ts` ve `src/lib/firebaseClient.ts` içinde korunur. Cloudinary'den Firebase Storage'a geçerken medya adaptörünün sağlayıcısı değiştirilmelidir; mevcut kayıtlı Cloudinary URL'lerinin taşınması ayrı bir migrasyon işidir.
- **UI/araçlar:** React Native, Expo Print/Sharing, Image Picker, Document Picker ve XLSX.
- **Sunucu işlevleri:** Repoda functions/ içinde callable function kodu vardır. Firebase'in ücretsiz Spark planında ücretli Cloud Functions dağıtımı kullanılamayabileceğinden bu işlevlere bağlı özellikler ayrıca değerlendirilmelidir.
- **Geçiş dosyaları:** supabase/ altındaki SQL dosyaları önceki veri modeli/geçiş referansları olabilir; Firebase'e otomatik uygulanmaz. SQL dosyaları Firestore Rules yerine geçmez.

## Kurulum ve derleme
1. Node.js LTS ve npm kur.
2. Depoyu klonla ve bağımlılıkları kur: npm install
3. EXPO_PUBLIC_FIREBASE_* ortam değişkenlerini CI veya yerel ortamda tanımla: API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID ve APP_ID.
4. Yerel geliştirme: npx expo start
5. TypeScript kontrolü: npm run typecheck
6. APK üretimi, repodaki GitHub Actions/CI iş akışı ve yapılandırılmış Android imzalama sırlarına bağlıdır.

## Cloudinary geçici medya kurulumu

Şu an uygulamanın medya yükleme sağlayıcısı olarak Cloudinary kullanılacak şekilde yapılandırma hazırlanmıştır. Expo projesinde aşağıdaki ortam değişkenleri hem `preview` hem de `production` ortamlarında tanımlı olmalıdır:

- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Yalnızca istemci yüklemesi için oluşturulan unsigned upload preset adı.

Mevcut değerler: cloud name `dxuml0h3`, upload preset `gayit_portfoy`. Bu değerler gizli anahtar değildir. **Cloudinary API Secret veya başka bir özel anahtar mobil uygulama değişkenlerine eklenmemelidir.**

Cloudinary panelinde `gayit_portfoy` preset'i unsigned modda olmalıdır. Güvenlik için izin verilen dosya türlerini görsel formatlarıyla sınırlandırın, mümkünse maksimum dosya boyutu belirleyin ve kullanım/credit ekranını takip edin. Unsigned preset'in adı uygulamada bulunduğundan bu bir erişim kontrolü sayılmaz; preset'e erişen kişiler Cloudinary hesabınızın kullanım kotasını tüketebilir.

**Firebase Storage geçiş notu:** Firebase Storage entegrasyonu `src/lib/firebase.ts` ve `src/lib/firebaseClient.ts` içinde korunur; mevcut geçici sağlayıcı değişikliği bu kodu silmeyi gerektirmez. İleride Firebase Storage'a dönüşte medya sağlayıcısı tek bir adaptör/config üzerinden değiştirilmeli ve Cloudinary'de kayıtlı mevcut URL'ler için ayrıca taşıma planı yapılmalıdır. README'de yazması tek başına yükleme akışının cihazda doğrulandığı anlamına gelmez; Cloudinary yükleme, görüntüleme ve hata senaryoları gerçek APK'da test edilmelidir.

## Firebase ilk kurulum kontrol listesi
- [ ] Firebase projesi ve Android/iOS uygulama kayıtları doğru.
- [ ] Firebase Authentication'da gerekli giriş sağlayıcısı etkin.
- [ ] Firestore veritabanı oluşturulmuş.
- [ ] Güncel firestore.rules canlı projeye yayımlanmış ve ofis izolasyonu test edilmiş.
- [ ] Storage bucket ve güncel storage.rules yayımlanmış.
- [ ] İlk süperadmin kaydı güvenli biçimde oluşturulmuş; kullanıcı uygulama içinden kendi rolünü yükseltemiyor.
- [ ] Danışman oluşturma testi: fotoğraflı/fotoğrafsız, ofis sahibi ve süperadmin senaryoları.
- [ ] Oturum kalıcılığı testi: uygulamayı kapatıp açma, çıkış yapma ve yeniden giriş.
- [ ] Portföy, fotoğraf, müşteri, randevu, işlem ve komisyon verileri gerçek cihazda test edilmiş.
- [ ] GitHub Actions TypeScript ve bağımlılık kontrolleri başarılı.

## Kod incelemesi ve doğrulama durumu
- 20 Ekim 2026 itibarıyla açılış ekranı, kullanıcı oturumu geri yüklenirken çalışan dairesel spinner ve `assets/images/splash.png` bağlantısı koda eklenmiştir.
- GitHub Actions Android release APK derlemesi ve Mobile CI, `5aa6b1d` commit'i için başarılı raporlanmıştır. Bu kontroller TypeScript/derleme hattının geçtiğini gösterir; Firebase canlı bağlantısını veya tüm ekran akışlarını uçtan uca test etmez.
- `firestore.rules` ve `storage.rules` dosyaları repoda mevcuttur. Dosyaların repoda olması, canlı Firebase projesine yayımlandıklarını kanıtlamaz.

## Planlanan web paneli ve herkese açık ilan linkleri

**Öncelikli sonraki geliştirme:** Mobil uygulamanın yanında, aynı emlak ofisi hesabıyla kullanılabilen bir web yönetim paneli hazırlanacak. Panelin amacı mobil uygulamanın yerine geçmek değil; bilgisayardan portföy ve müşteri işlerini yönetmeyi kolaylaştırmak ve ilanları müşterilerle bağlantı üzerinden paylaşabilmektir.

### Hedefler
- **Mobil–web senkronizasyonu:** Mobil uygulama ve web paneli aynı Firebase projesini, Firebase Authentication kimliğini ve Firestore veri kaynağını kullanmalı. Mobilde eklenen/düzenlenen ilan panelde, panelde yapılan değişiklik de mobilde görünmeli. Fotoğraf URL'leri ve portföy durumları da aynı kayıtlarla senkron kalmalı.
- **Web yönetim paneli:** Mobildeki temel portföy yönetimi mantığı korunmalı: ilanları listeleme, arama/filtreleme, detayları görüntüleme, ilan ekleme/düzenleme, fiyat ve durum güncelleme, fotoğraf yönetimi. Müşteri/CRM özellikleri masaüstüne uygun şekilde aşamalı olarak eklenebilir.
- **Herkese açık ilan paylaşımı:** Her ilan için müşteriye WhatsApp veya başka bir kanaldan gönderilebilecek, oturum açmayı gerektirmeyen bir paylaşım linki oluşturulmalı. Link yalnızca özellikle paylaşılabilir olarak işaretlenen ve aktif durumdaki ilanı göstermeli.
- **Güvenli herkese açık görünüm:** Paylaşım sayfasında yalnızca müşteriyle paylaşılması uygun ilan alanları ve fotoğraflar gösterilmeli. Müşteri kayıtları, özel ofis notları, danışman iç notları, komisyonlar, kullanıcı kimlikleri ve diğer ofis ilanları kesinlikle açığa çıkmamalı. Paylaşım sayfası ofis içi yönetim panelinden ayrı bir salt-okunur görünüm olmalı.
- **Kısa Firebase Hosting adresi:** Hedef, `gayit.web.app` gibi kısa ve kolay paylaşılabilir bir adres kullanmak. Bu adresin kullanılabilirliği Firebase projesinin Hosting site/proje kimliğine bağlıdır; gerekirse uygun kısa bir Hosting site kimliği seçilmeli. Alan adı ve Hosting yapılandırması uygunluğu doğrulandıktan sonra yapılmalı.
- **Responsive tasarım:** Panel masaüstünde rahat kullanılmalı; telefon ve tablet ekranlarında da temel işlemler bozulmadan çalışmalı.
- **Yetkilendirme:** Giriş gerektiren panel sayfaları mevcut ofis/rol yetkilerini uygulamalı. Her ofis yalnızca kendi verisini görebilmeli. İlanı herkese açık paylaşmak, ofis içi verilerin tamamını herkese açmak anlamına gelmemeli.

### Uygulama sırası
1. [ ] Mevcut Firestore portföy şemasını, ofis izolasyonunu ve mobil uygulamanın okuma/yazma akışlarını incele.
2. [ ] Web uygulaması için mimari ve teknoloji seçimini yap; mevcut Firebase yapılandırmasını güvenli biçimde yeniden kullan. Mobil uygulamayı kıracak ayrı veya kopya bir ilan veritabanı oluşturma.
3. [ ] Firebase Authentication ile giriş ve rol/ofis bazlı erişim kontrolünü kur.
4. [ ] Web portföy listesi, arama/filtreler, ilan ekleme/düzenleme ve fotoğraf yönetimini geliştir.
5. [ ] Her ilan için tahmin edilmesi zor bir paylaşım kimliği kullanan herkese açık ilan detay sayfasını oluştur; yalnızca izin verilen alanları sun.
6. [ ] Firestore Rules ve gerekiyorsa sunucu tarafı paylaşım erişimini, oturum açmış/oturum açmamış kullanıcılar ve farklı ofisler arasında pozitif-negatif testlerle doğrula.
7. [ ] Firebase Hosting'i yapılandır; kısa `*.web.app` adresini ve dağıtım akışını doğrula.
8. [ ] Senkronizasyon testleri yap: mobilde ilan oluştur/düzenle, web panelinde kontrol et; webde değiştir, mobilde kontrol et; fotoğraf, fiyat, durum, arşivleme ve paylaşım bağlantısını test et.
9. [ ] Güvenlik ve gerçek cihaz/tarayıcı kontrolleri başarılı olduktan sonra canlıya al.

### Kabul kriterleri
- [ ] Mobilde oluşturulan ilan, sayfa yenilendikten sonra web panelinde doğru ofis altında görünür.
- [ ] Web panelinde yapılan ilan değişiklikleri mobil uygulamada aynı kayıt üzerinden görünür.
- [ ] Herkese açık link oturum açmadan açılır ve yalnızca paylaşılmasına izin verilen ilan bilgilerini gösterir.
- [ ] Link, müşteri/CRM kayıtlarını veya ofis içi özel alanları açığa çıkarmaz.
- [ ] Başka bir ofisin ilanları ve kayıtları panel kullanıcısına gösterilmez.
- [ ] Hosting adresi, HTTPS, fotoğraf yükleme/görüntüleme ve mobil paylaşım akışı doğrulanır.

**Durum:** Planlama aşamasında; bu bölüm yapılacak işleri tarif eder, web panelinin geliştirildiği veya Firebase Hosting'e dağıtıldığı anlamına gelmez.
## Bilinen sınırlamalar ve sonraki işler
1. Cloudinary preset ve medya adaptörü gerçek cihazda fotoğraf yükleme/görüntüleme akışlarıyla test edilmeli; unsigned upload için Cloudinary kullanım/limitleri takip edilmeli. Android'de `Unsupported FormDataPart implementation` hatası görüldüğü için yükleme düzeltmesi gerçek APK'da doğrulanmadan başarılı kabul edilmemeli.
2. Firebase Storage kodu kaldırılmadı. İleride `EXPO_PUBLIC_MEDIA_PROVIDER=firebase` gibi açık bir sağlayıcı seçimiyle Firebase Storage'a dönüş planlanmalı; mevcut Cloudinary URL'leri için veri taşıma planı hazırlanmalı.
3. Firebase Authentication ve Firestore canlı projede yapılandırılmalı; ofisler arası veri izolasyonu ve rol izinleri için pozitif/negatif yetki testleri çalıştırılmalı.
4. Danışman oluşturma, oturum kalıcılığı, şifre değiştirme ve devre dışı bırakılan hesabın erişimi gerçek cihazda doğrulanmalı.
5. Ücretli Cloud Functions'a bağlı eşleştirme/ofis oluşturma gibi akışlar Spark planı kısıtlarıyla yeniden ele alınmalı; gerekli fonksiyonların dağıtımı ve izinleri doğrulanmalı.
6. Yer gösterme kayıtlarını belirli portföyle ilişkilendirme ve ayrı bir teklif kanban panosu geliştirme.
7. Danışman performans raporları gerçekleşen işlem, komisyon, yeni müşteri, takip, randevu ve teklif verileriyle tutarlı hesaplanmalı.
8. Excel içe aktarma ve birleşik PDF akışları gerçek dosya ve fotoğraflarla test edilmeli.
9. Üretim öncesinde yedekleme, veri dışa aktarma, gizlilik ve kişisel veri saklama politikaları gözden geçirilmeli.

## Güvenlik notları
- Firebase istemci anahtarları istemci uygulamalarında bulunabilir; asıl erişim denetimi Firestore/Storage rules ile sağlanmalıdır.
- Süperadmin ayrıcalığı yalnızca güvenilir biçimde tanımlanmış kayıtlarla verilmelidir.
- Firebase Auth kullanıcısı oluşturma işlemiyle profil/üyelik yazımı arasında hata olursa kısmi kayıt oluşabilir; bu durumlar denetlenmelidir.
- Gerçek ev sahibi iletişim bilgileri müşteriye gönderilen PDF sunumlarına dahil edilmemelidir.
- Gerçek müşteri verileriyle test yaparken kişisel verileri ve erişim izinlerini koru.
