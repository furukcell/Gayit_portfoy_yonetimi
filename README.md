# GAYIT — Emlak Portföy ve Ofis Yönetimi

GAYIT, emlak ofislerinin portföylerini, müşterilerini, danışmanlarını ve satış operasyonlarını tek mobil uygulamada yönetmesi için geliştirilen Android/iOS uygulamasıdır. Genel kullanıma açık bir ilan pazaryeri değil, emlak ofislerinin iç operasyon aracıdır.

> **Durum notu (20 Ekim 2026):** Bu README, repodaki uygulama kodunu ve yapılandırma dosyalarını özetler. Bir özelliğin kodda bulunması canlı Firebase projesinde kuralların yayımlandığı veya gerçek cihazda başarıyla test edildiği anlamına gelmez.

## İçindekiler
- [Kullanıcı rolleri](#kullanıcı-rolleri)
- [Özellikler](#özellikler)
- [Son geliştirmeler](#son-geliştirmeler)
- [Teknik mimari](#teknik-mimari)
- [Kurulum ve derleme](#kurulum-ve-derleme)
- [Firebase ilk kurulum kontrol listesi](#firebase-ilk-kurulum-kontrol-listesi)
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

### 6. Performans ve raporlama
- Portföy durum adetleri, aktif müşteri sayısı, bugün/geciken takipler ve önümüzdeki 7 günlük takip özeti.
- Satış/kiralama kayıtlarında ofis ve danışman komisyonlarını saklama.
- Portföy verisini CSV olarak paylaşma ve özet rapor akışları.
- Raporların doğruluğu mevcut veri kayıtlarının eksiksizliğine bağlıdır; kaydedilmemiş işlem veya ölçülmeyen görüntülenme sayıları varsayılmamalıdır.

### 7. Bildirimler ve medya
- Uygulama içi bildirim listesi ve okundu işaretleme akışı.
- Şu anki medya yükleme sağlayıcısı Cloudinary'dir; portföy fotoğrafları ve avatarlar `gayit_portfoy` unsigned upload preset'i ile yüklenir.
- Firebase Storage kodu ve yapılandırması silinmemiştir. İleride Firebase Storage'a geçiş için korunur; uygulama kodu sağlayıcı adaptörü üzerinden çalışmalıdır.
- Cloudinary unsigned upload, istemci tarafında silme işlemini tek başına güvenli biçimde desteklemez. Silme ihtiyacı için güvenli sunucu tarafı imzalı işlem gerekir.
- PDF üretiminde kayıtlı fotoğraf URL'leri kullanılır; URL türüne göre erişim davranışı değişebilir.

## Son geliştirmeler
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

## Bilinen sınırlamalar ve sonraki işler
1. Cloudinary preset ve medya adaptörü gerçek cihazda fotoğraf yükleme/görüntüleme akışlarıyla test edilmeli; unsigned upload için Cloudinary kullanım/limitleri takip edilmeli.
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
