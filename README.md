# GAYIT — Portföy Yönetimi

**Emlak profesyonelleri için portföy yönetimi ve fiyat zekâsı platformu.**

GAYIT Portföy Yönetimi, Türkiye'deki emlak ofisleri ve bağımsız emlak danışmanları için tasarlanan, mobil öncelikli bir iş yönetimi uygulamasıdır.

Amacımız emlakçıların portföylerini kolayca yönetmesini, müşterilerine profesyonel sunumlar hazırlamasını, ofis performansını takip etmesini ve gayrimenkullerin ilan fiyatı geçmişinden anlamlı bilgiler elde etmesini sağlamaktır.

> **GAYIT — Portföy Yönetimi**
>
> Portföyünü yönet. Müşterini doğru mülkle buluştur. Mal sahibine verilerle değer sun.

---

## 1. Projenin Amacı

GAYIT, genel kullanıma açık bir emlak ilan sitesi değildir. Emlak profesyonellerinin kendi iş süreçlerini yönetmeleri için geliştirilen bir yazılım çözümüdür.

Platformun iki temel değer önerisi vardır:

### Portföy Yönetimi

- Satılık ve kiralık gayrimenkulleri tek merkezden yönetme.
- Müşterinin bütçesine ve ihtiyaçlarına göre hızlı filtreleme.
- Birden fazla gayrimenkulü profesyonel bir sunumda birleştirme.
- PDF ve WhatsApp üzerinden paylaşım.
- Emlak ofislerinde danışman, portföy ve satış performansı takibi.

### Fiyat Zekâsı

- Gayrimenkullerin zaman içindeki ilan fiyatlarını takip etme.
- İlandan kaldırılan gayrimenkullerin geçmiş kayıtlarını koruma.
- Daha önce görülen bir gayrimenkul yeniden ilana çıktığında olası eşleşme uyarısı verme.
- Gösterimlerden gelen müşteri geri bildirimlerini kaydetme.
- Mal sahiplerine fiyat geçmişi, gösterim ve geri bildirim verilerini içeren raporlar hazırlama.
- Veriler yeterli olduğunda benzer gayrimenkullere dayalı fiyat aralığı önerileri sunma.

**Ürün yaklaşımı:** Emlakçının veri girişini mümkün olduğunca kolaylaştırmak ve ilk portföy kaydını yaklaşık 30 saniyede tamamlayabilmek.

---

## 2. Hedef Kullanıcılar

### Ofis Sahibi
- Ofisin tüm portföylerini görüntüler.
- Çalışanları ekler, yönetir ve portföyleri danışmanlar arasında devredebilir.
- Satış, kiralama ve performans raporlarını inceler.
- Ofis ayarlarını ve aboneliği yönetir.

### Emlak Danışmanı
- Kendisine atanmış portföyleri yönetir.
- Ofisin ortak havuz olarak işaretlediği portföylere erişebilir.
- Müşteri taleplerini takip eder.
- Gayrimenkul sunumları hazırlar ve gösterim kayıtları oluşturur.

### Bağımsız Emlakçı
- Tek kişilik ofis modeliyle çalışır.
- Hem ofis sahibi hem danışman işlevlerini kullanabilir.

---

## 3. Geliştirme Yol Haritası

Proje üç ana fazda geliştirilecektir.

### Faz 1 — MVP

İlk hedef, günlük emlakçılık işlemlerini kolaylaştıran çalışan bir ürün ortaya çıkarmaktır.

- [ ] Kullanıcı kayıt ve giriş sistemi
- [ ] Ofis oluşturma ve çalışan davet etme
- [ ] Portföy ekleme, düzenleme ve silme
- [ ] Satılık/kiralık, gayrimenkul türü, konum, fiyat, m² ve oda bilgileri
- [ ] Portföy arama ve filtreleme
- [ ] Portföy fotoğrafları
- [ ] Excel/CSV ile toplu veri içe aktarma
- [ ] Portföy durumlarını yönetme
- [ ] PDF gayrimenkul sunumu oluşturma
- [ ] WhatsApp paylaşım bağlantısı
- [ ] Temel ofis ve danışman performans özeti
- [ ] Rol tabanlı erişim ve ofisler arası veri izolasyonu
- [ ] Kullanıcı verilerini dışa aktarma

### Faz 2 — Fiyat Zekâsı ve Müşteri Takibi

- [ ] Gayrimenkul gösterim kayıtları
- [ ] Müşteri geri bildirim etiketleri
- [ ] Mal sahibi için haftalık performans raporları
- [ ] İlan bağlantısı ve fiyat geçmişi takibi
- [ ] İlandan kaldırılma tarihinin takibi
- [ ] Yeniden ilana çıkan gayrimenkuller için olası eşleşme uyarıları
- [ ] Alıcı ve kiracı talep havuzu
- [ ] Müşteri-gayrimenkul eşleştirme sistemi
- [ ] Müşteri görüşme ve takip hatırlatmaları
- [ ] Yetki sözleşmesi bitiş bildirimleri

### Faz 3 — Akıllı Emlak Platformu

- [ ] Benzer gayrimenkullere dayalı değerleme raporları
- [ ] Sesle portföy oluşturma
- [ ] Yapay zekâ destekli ilan ve açıklama oluşturma
- [ ] Bölgesel piyasa eğilimleri
- [ ] Ofisler arası ortak portföy ağı
- [ ] Gelişmiş ofis ve danışman analizleri

*Bu listeler geliştirme hedeflerini gösterir; işaretlenmemiş özellikler tamamlanmış olarak kabul edilmez.*

---

## 4. Portföy Yönetimi

Portföy kayıtları hızlı ve esnek olacak şekilde tasarlanacaktır.

### Temel alanlar
- İlan türü: satılık veya kiralık
- Gayrimenkul türü: daire, villa, arsa, işyeri ve benzeri
- İl, ilçe ve mahalle
- Fiyat
- Brüt metrekare
- Oda sayısı

### Ek bilgiler
- Kat ve bina yaşı
- Isınma ve eşyalı olma durumu
- Krediye uygunluk
- Aidat, cephe ve manzara
- Tapu durumu
- Fotoğraflar ve konum
- Açıklama ve ofis içi notlar
- Yetki başlangıç ve bitiş tarihleri

Portföy durumları aktif, opsiyonlu, satıldı, kiralandı ve yayından kaldırıldı olarak yönetilecektir.

Mal sahibinin iletişim bilgileri ve hassas ofis içi alanlar, genel portföy bilgilerinden ayrı tutulacaktır.

---

## 5. Gayrimenkul Sunumları

GAYIT'ın hedeflerinden biri, emlakçıların müşterilerine birkaç adayı hızlı ve profesyonel biçimde sunabilmesidir.

Sunumlarda şunlar bulunabilir:

- Emlakçının adı, logosu ve iletişim bilgileri
- Gayrimenkulün kapak fotoğrafı ve fotoğraf galerisi
- Fiyat ve temel özellikler
- Konum bilgisi
- Tek veya birden fazla gayrimenkulü karşılaştırmalı sunma
- PDF oluşturma ve WhatsApp üzerinden paylaşma

İç notlar, komisyon bilgileri ve mal sahibinin özel iletişim bilgileri müşteri sunumlarına dahil edilmeyecektir.

İlerleyen aşamada, sunum bağlantılarının görüntülenme bilgileri de desteklenecektir.

---

## 6. Fiyat Geçmişi ve Akıllı Eşleştirme

Fiyat zekâsı, GAYIT'ı yalnızca bir portföy kayıt aracından ayırması hedeflenen temel özelliklerden biridir.

Sistem, uygun veri kaynakları ve yasal kullanım koşulları doğrultusunda:

- İlan fiyatlarını tarihsel olarak kaydetmeyi,
- İlanın ilk ve son görülme tarihlerini takip etmeyi,
- İlandan kaldırılan gayrimenkullerin geçmişini korumayı,
- Yeniden yayımlanan benzer ilanları olası eşleşme olarak belirlemeyi,
- Fiyat değişikliklerini danışmana bildirmeyi hedefler.

**Önemli:** Bir ilanın yayından kalkması, gayrimenkulün satıldığı anlamına gelmez. Satış bilgisi ancak yetkili kullanıcı tarafından doğrulandığında satıldı olarak işaretlenmelidir.

Otomatik veri toplama özellikleri, ilgili ilan kaynaklarının kullanım şartlarına ve teknik erişim izinlerine uygun biçimde geliştirilecektir. Kaynakların kısıtlamalarını aşan veya izinsiz toplu tarama yapan bir sistem hedeflenmemektedir.

---

## 7. Teknik Mimari

Aşağıdaki teknoloji yığını, ürün spesifikasyonunda önerilen başlangıç mimarisidir. Uygulama kodu oluşturulurken kesinleştirilecektir.

| Katman | Önerilen teknoloji |
|---|---|
| Mobil uygulama | React Native + Expo |
| Web yönetim paneli | Next.js — Faz 2 |
| Veritabanı | PostgreSQL |
| Kimlik doğrulama | Supabase Auth |
| Dosya ve fotoğraf depolama | Supabase Storage |
| Yetkilendirme | PostgreSQL Row Level Security (RLS) |
| Zamanlanmış görevler | Supabase Edge Functions / Cron |
| PDF oluşturma | HTML → PDF veya Expo Print |
| Mobil bildirimler | Expo Push Notifications |
| WhatsApp paylaşımı | WhatsApp bağlantıları (`wa.me`) |
| Ödeme | iyzico veya Stripe — entegrasyon aşamasında değerlendirilecek |
| Yapay zekâ | İlgili fazda LLM API entegrasyonu |

---

## 8. Veri Güvenliği ve KVKK

Gayrimenkul portföyleri, müşteri bilgileri ve mal sahibi iletişim bilgileri hassasiyetle ele alınmalıdır.

Temel güvenlik ilkeleri:

- Her ofisin verisi diğer ofislerden tamamen izole edilmelidir.
- Veritabanı erişimi ofis kimliği ve kullanıcı rolü üzerinden sınırlandırılmalıdır.
- Çalışanlar başka danışmanların özel portföylerine yetkisiz erişememelidir.
- Mal sahibi bilgileri yalnızca yetkili kullanıcılar tarafından görüntülenebilmelidir.
- Komisyon tutarları yalnızca ofis yöneticisi tarafından görüntülenebilmelidir.
- Hassas işlemler için denetim kayıtları tutulmalıdır.
- Verilerin dışa aktarılması ve hesap/veri silme süreçleri desteklenmelidir.
- Aktarım ve depolama güvenliği sağlanmalıdır.
- Kişisel verilerin işlenmesine ilişkin aydınlatma, sözleşme ve gizlilik belgeleri hazırlanmalıdır.

İlan sitelerinden alınan fotoğraf ve metinlerin saklanması yerine, tekrar ilan eşleştirmesinde mümkün olduğunda türetilmiş veriler ve görsel parmak izleri kullanılacaktır.

---

## 9. MVP Kabul Kriterleri

İlk sürümün başarılı sayılması için aşağıdaki hedefler esas alınacaktır:

- Yeni bir portföy, altı temel alanla yaklaşık 30 saniyede kaydedilebilmelidir.
- 5.000 portföylük veri kümesinde filtreleme hedefi bir saniyenin altında olmalıdır.
- PDF sunum üretimi için beş saniyelik hedef belirlenmiştir.
- Sunumlar WhatsApp üzerinden paylaşılabilmelidir.
- Mal sahibinin özel bilgileri müşteri sunumlarında görünmemelidir.
- Danışmanlar yetkisiz özel portföylere erişememelidir.
- Bir ofis diğer ofisin verilerine erişememelidir.
- Ofis yöneticisi danışman bazlı satış ve kiralama özetlerini görüntüleyebilmelidir.
- Kullanıcılar verilerini dışa aktarabilmelidir.

Bu maddeler ölçülebilir geliştirme ve test hedefleridir; henüz doğrulanmış performans sonuçları değildir.

---

## 10. Başarı Ölçütleri

Ürünün gerçek kullanım değerini ölçmek için aşağıdaki metrikler izlenecektir:

- Haftalık aktif emlak ofisi sayısı
- Kullanıcı başına haftalık eklenen portföy sayısı
- Oluşturulan ve paylaşılan sunum sayısı
- Hazırlanan mal sahibi raporu sayısı
- Müşteri talepleriyle eşleşen portföy sayısı
- Ücretsiz denemeden ücretli aboneliğe geçiş oranı
- Kullanıcıların uygulamaya devam etme oranı

---

## 11. Fiyatlandırma Yaklaşımı

Başlangıç modeli, ofis başına aylık abonelik ve gerektiğinde çalışan başına ek ücret üzerine kurulacaktır.

İlk aşamada 5 çalışanlı bir ofis için aylık yaklaşık 30–60 USD ve 14–30 günlük deneme süresi ürün spesifikasyonundaki başlangıç hipotezidir. İlk 5–10 emlakçıyla ücretsiz pilot uygulama yapılarak fiyatlandırma gerçek kullanıcı geri bildirimleriyle değerlendirilecektir.

Bu tutarlar kesinleşmiş satış fiyatları değildir.

---

## 12. Geliştirme İlkeleri

1. Önce Faz 1 MVP tamamlanacaktır.
2. Her aşamada çalışan ve test edilebilir kod üretilecektir.
3. Güvenlik ve ofisler arası veri izolasyonunda kısayol alınmayacaktır.
4. Özellikler, kullanıcı onayı ve test sonuçları doğrultusunda aşamalı geliştirilecektir.
5. İlan fiyatı ve değerleme verilerinin kaynağı açıkça belirtilmeli; veri yetersiz olduğunda yanıltıcı sonuç üretilmemelidir.
6. Gereksiz veri girişini azaltmak, ürünün temel tasarım önceliklerinden biri olacaktır.

---

## Proje Durumu

**Mevcut aşama:** Proje deposu ve ürün tanımı.

**İlk geliştirme hedefi:** Faz 1 — MVP.

GAYIT'ın amacı, emlakçıların portföylerini yalnızca kaydettiği değil, müşterilerini daha iyi yönettiği, mal sahiplerine verilerle rapor sunduğu ve günlük işlerini daha verimli yürüttüğü bir platform oluşturmaktır.

**GAYIT — Portföy Yönetimi**  
*Emlak profesyonelleri için akıllı iş yönetimi.*
