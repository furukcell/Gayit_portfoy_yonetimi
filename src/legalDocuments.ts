export const LEGAL_VERSION = '2026-10-20-v1';
export type LegalDocumentKey = 'privacy' | 'terms' | 'about';

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, { title: string; body: string }> = {
 privacy: { title: 'KVKK Aydınlatma Metni', body: `GAYIT · KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ
Son güncelleme: 20 Ekim 2026

1. VERİ SORUMLUSU
6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu Faruk Kurtuluş'tur. GAYIT, FK Digital ürünüdür. İletişim: destek.fkdigital@gmail.com.

2. AMAÇ VE KAPSAM
Bu metin, GAYIT Emlak Portföy ve Ofis Yönetimi uygulaması kullanılırken kişisel verilerin işlenmesine ilişkin bilgilendirme sağlar.

3. İŞLENEBİLECEK VERİLER
Kullanıma bağlı olarak ad-soyad, kullanıcı adı ve hesap kimliği; telefon ve e-posta; profil fotoğrafı; oturum, yetki ve güvenlik kayıtları; ofis üyeliği; portföy/ilan bilgileri; müşteri adları, telefonları, talepleri ve notları; randevu, teklif, işlem kayıtları; yüklenen dosya ve görseller işlenebilir.

4. İŞLEME AMAÇLARI
Veriler; hesap ve oturum yönetimi, ofis ve rol yetkilendirmesi, portföy ve müşteri süreçleri, ilan-müşteri eşleştirmesi, randevu/teklif/işlem takibi, rapor ve PDF sunumu hazırlama, profil ve medya özellikleri, destek, güvenlik ve hukuki yükümlülükler için işlenebilir.

5. TOPLAMA YÖNTEMİ VE HUKUKİ SEBEPLER
Veriler uygulama formları, kullanıcı işlemleri, ofis yöneticilerinin hesap tanımlamaları ve elektronik altyapı aracılığıyla toplanabilir. İşlemenin niteliğine göre sözleşmenin kurulması veya ifası, hukuki yükümlülük, bir hakkın tesisi/kullanılması/korunması ya da temel haklara zarar vermemek kaydıyla meşru menfaat gibi KVKK'da yer alan hukuki sebepler uygulanabilir. Açık rıza gereken ayrı bir işlem varsa ayrıca alınmalıdır. Bu aydınlatma metni tek başına açık rıza değildir.

6. AKTARIM
Veriler, gerekli olduğu ölçüde yetkili ofis yöneticileri ve kullanıcılarla, kimlik doğrulama/veritabanı/dosya depolama gibi teknik hizmet sağlayıcılarıyla ve kanunen yetkili kurumlarla paylaşılabilir. Sağlayıcı yapılandırmasına bağlı olarak yurt dışına aktarım gündeme gelebilir; böyle bir durumda KVKK'nın yürürlükteki aktarım şartlarına uyulmalıdır.

7. SAKLAMA VE GÜVENLİK
Veriler, amaç için gerekli süre ve uygulanabilir yasal saklama süreleri boyunca tutulur; şartları oluştuğunda silinir, yok edilir veya anonimleştirilir. Erişim yetkilendirmesi ve teknik/organizasyonel önlemler uygulanması hedeflenir. Hiçbir elektronik sistem için mutlak güvenlik garantisi verilemez.

8. HAKLARINIZ
KVKK'nın 11. maddesi kapsamındaki haklarınız için destek.fkdigital@gmail.com adresine başvurabilirsiniz. Başvurular, mevzuattaki usul ve süreler doğrultusunda değerlendirilir.

9. GÜNCELLEME
İşlevler veya mevzuat değiştikçe metin güncellenebilir. İşlevler veya mevzuat değiştikçe metin güncellenebilir.` },
 terms: { title: 'Kullanım Sözleşmesi', body: `GAYIT · KULLANIM SÖZLEŞMESİ
Son güncelleme: 20 Ekim 2026

1. TARAFLAR VE KONU
Bu sözleşme, GAYIT Emlak Portföy ve Ofis Yönetimi uygulamasını kullanan kişi ile uygulamanın sorumlusu Faruk Kurtuluş arasındaki kullanım koşullarını düzenler. GAYIT, FK Digital ürünüdür. İletişim: destek.fkdigital@gmail.com.

2. HİZMETİN KAPSAMI
GAYIT; emlak portföyü, müşteri talepleri, ekip yönetimi, ilan-müşteri eşleştirmesi, randevu ve teklif takibi ile rapor/PDF sunumu oluşturma işlevleri sağlar. Özellikler teknik koşullara göre değişebilir.

3. HESAP GÜVENLİĞİ
Kullanıcı, hesabının ve parolasının gizliliğinden sorumludur; hesabını başkasına kullandırmamalı ve yalnızca kendisine verilen rol ve yetkiler kapsamında işlem yapmalıdır.

4. KULLANICI SORUMLULUKLARI
Kullanıcı, girdiği portföy, müşteri, iletişim, fotoğraf ve diğer içeriklerin doğru ve hukuka uygun olmasını sağlamalıdır. Üçüncü kişilere ait verileri kaydetmeden önce gerekli bilgilendirme ve hukuki şartları yerine getirmeli; bu verileri yalnızca meşru amaçlarla kullanmalıdır. Yetkisiz erişim veya hukuka aykırı paylaşım yapılamaz.

5. GİZLİLİK
Kişisel verilerin işlenmesi KVKK Aydınlatma Metni'nde açıklanır. Bu sözleşmenin kabulü, ayrıca açık rıza gereken işlemler için tek başına açık rıza yerine geçmez.

6. FİKRİ HAKLAR VE HİZMET
Uygulamanın yazılımı, tasarımı ve marka unsurları ilgili hak sahiplerine aittir. Mevzuatın izin verdiği kullanım dışında kopyalama, dağıtma veya tersine mühendislik yapılamaz. Bakım ve geliştirme için özellikler değişebilir; kesintisiz veya hatasız çalışma garanti edilmez.

7. HESABIN KISITLANMASI
Güvenlik riski, yetkisiz kullanım, sözleşmeye aykırılık veya hukuki zorunluluk hâlinde gerekli ve ölçülü erişim kısıtlamaları uygulanabilir.

8. SORUMLULUK VE İLETİŞİM
Kullanıcı, uygulamaya girdiği içerik ve yaptığı işlemlerden sorumludur. Emredici mevzuattan doğan haklar saklıdır. Sorular için destek.fkdigital@gmail.com adresine yazabilirsiniz. Sözleşme güncellenirse güncel sürüm uygulamada yayımlanır; önemli değişikliklerde yeniden kabul istenebilir.

Kullanım Sözleşmesi'ni okudum ve koşullarını kabul ediyorum.

` },
 about: { title: 'GAYIT Hakkında', body: `GAYIT
Emlak Portföy ve Ofis Yönetimi

Emlak operasyonlarınız tek yerde.

GAYIT, gayrimenkul profesyonellerinin günlük iş akışlarını daha düzenli yönetmesine yardımcı olmak için tasarlanmıştır. Portföyleri, müşteri taleplerini ve ekip çalışmalarını tek bir çalışma alanında bir araya getirir.

ÖNE ÇIKAN ÖZELLİKLER
• Portföy ve ilan yönetimi
• Müşteri kayıtları ve ihtiyaç takibi
• Müşteri talebi ile portföy eşleştirmeleri
• Danışman ve ekip yönetimi
• Randevu, teklif ve işlem takibi
• Portföy raporları ve PDF sunumları

AMACIMIZ
Tekrarlayan işleri azaltmak, bilgilere kolay ulaşmak ve emlak ofislerinin günlük operasyonlarını anlaşılır hâle getirmek.

GAYIT, FK Digital ürünüdür.
Destek: destek.fkdigital@gmail.com

© 2026 FK Digital. Tüm hakları saklıdır.` }
};
