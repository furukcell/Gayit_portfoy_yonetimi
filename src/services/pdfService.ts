import type { Property } from '../types/property';
import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getFirebaseClient } from '../lib/firebaseClient';
import { getFirebaseAuth } from '../lib/firebase';

type PdfDependencies = {
  htmlEscape: (value: any) => string;
  propertyTypeLabel: (value: any) => string;
  money: (value: any) => string;
  properties: Property[];
  selectedPresentationIds: string[];
  setPortfolioPresentationMode: (value: boolean) => void;
  setSelectedPresentationIds: (value: string[]) => void;
};

export const createPropertyPdf = async (p: Property, deps: PdfDependencies) => {
  const { htmlEscape, propertyTypeLabel, money } = deps;
    try {
      const firebaseClient = getFirebaseClient();
      const uid = getFirebaseAuth().currentUser?.uid;
      const { data: profile } = uid ? await firebaseClient.from('profiles').select('full_name,phone,email,avatar_path').eq('id', uid).maybeSingle() : { data: null as any };
      let officeName = '';
      let officeLogoUrl: string | null = null;
      if (uid) {
        const { data: membership } = await firebaseClient.from('office_members').select('office_id').eq('user_id', uid).eq('status', 'active').limit(1).maybeSingle();
        if (membership?.office_id) {
          const { data: office } = await firebaseClient.from('offices').select('name,logo_url').eq('id', membership.office_id).maybeSingle();
          officeName = String(office?.name || '').trim();
          officeLogoUrl = office?.logo_url || null;
        }
      }
      const brandName = officeName || 'GAYIT';
      const brandSubtitle = officeName ? 'GAYRİMENKUL' : 'GAYRİMENKUL SUNUMU';
      const brandMark = officeLogoUrl ? `<img src="${htmlEscape(officeLogoUrl)}" alt="${htmlEscape(brandName)}" />` : '⌂';
      let agentAvatarUrl: string | null = null;
      if (profile?.avatar_path) { const { data: avatar } = await firebaseClient.storage.from('avatars').createSignedUrl(profile.avatar_path, 3600); agentAvatarUrl = avatar?.signedUrl || null; }
      const agentDisplayName = profile?.full_name || p.agent || 'GAYIT danışman ekibi';
      const agentPhone = profile?.phone || '';
      const agentEmail = profile?.email || '';
      const { data: photoRows, error: photoError } = await firebaseClient.from('property_photos')
        .select('storage_path,sort_order').eq('property_id', p.id).order('sort_order', { ascending: true }).limit(12);
      if (photoError) throw new Error('İlan fotoğrafları alınamadı.');
      const photosForPdf = await Promise.all((photoRows || []).map(async (photo: any) => {
        const { data, error } = await firebaseClient.storage.from('property-photos')
          .createSignedUrl(photo.storage_path, 60 * 60);
        if (error) throw new Error('Bir ilan fotoğrafı açılamadı.');
        return data.signedUrl as string;
      }));
      const heroPhoto = photosForPdf[0];
      const galleryPhotos = photosForPdf.slice(1, 5);
      const heroHtml = heroPhoto
        ? '<img class="photo-featured" src="' + heroPhoto + '" alt="Gayrimenkul fotoğrafı" />'
        : '<div class="photo-placeholder"><span>GAYIT</span><small>GAYRİMENKUL PORTFÖYÜ</small></div>';
      const galleryHtml = galleryPhotos.map((url, index) =>
        '<div class="thumb"><img src="' + url + '" alt="İlan fotoğrafı ' + (index + 2) + '" /></div>'
      ).join('');
      const photoLayoutHtml = '<section class="photo-layout"><div class="photo-main">' + heroHtml + '</div>' +
        (galleryPhotos.length ? '<div class="photo-thumbs">' + galleryHtml + '</div>' : '') +
        (photosForPdf.length > 5 ? '<div class="photo-count">+' + (photosForPdf.length - 5) + ' fotoğraf daha</div>' : '') +
        '</section>';
      const locationParts = (p.address || '').split(',').map((part: string) => part.trim()).filter(Boolean);
      const locationShort = locationParts.slice(-2).join(' / ');
      const code = htmlEscape(String(p.id || '').slice(0, 18).toUpperCase());
      const agentAvatarHtml = agentAvatarUrl ? '<img class="agent-photo" src="' + agentAvatarUrl + '" alt="Danışman" />' : '<div class="agent-mark">' + htmlEscape(agentDisplayName.split(/\s+/).map((part: string) => part[0]).slice(0,2).join('').toLocaleUpperCase('tr-TR')) + '</div>';
      const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
      @page{size:A4;margin:0}
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff;color:#10263a;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{font-size:9pt;line-height:1.38}
      .sheet{width:210mm;min-height:297mm;padding:8mm 9mm 0;margin:0 auto;position:relative;background:#fff}
      .masthead{display:flex;align-items:center;justify-content:space-between;gap:6mm;margin-bottom:5mm}
      .brand{display:flex;align-items:center;gap:3mm;min-width:0}
      .logo{width:13mm;height:13mm;border-radius:3mm;background:#d3aa62;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18pt;font-weight:bold;overflow:hidden;flex-shrink:0}.logo img{width:100%;height:100%;object-fit:contain;background:#fff}
      .brand-name{font-size:22pt;line-height:1;font-weight:800;letter-spacing:.4px;color:#10283f}
      .brand-sub{font-size:7.5pt;letter-spacing:1.5px;color:#728397;margin-top:1mm}
      .motto{text-align:right;font-size:8pt;line-height:1.45;color:#10283f;white-space:nowrap}
      .codebox{border-left:1px solid #cdd5de;padding-left:4mm;margin-left:4mm;text-align:right;min-width:31mm}
      .codebox small{display:block;color:#8190a0;font-size:7pt;margin-bottom:1mm}
      .codebox strong{font-size:8pt;overflow-wrap:anywhere}
      .hero-row{display:grid;grid-template-columns:1.12fr 1fr;gap:3mm;min-height:88mm}
      .hero-visual{position:relative;border-radius:3mm;overflow:hidden;background:#e9eef2;min-width:0}
      .photo-featured{width:100%;height:100%;object-fit:cover;display:block}
      .photo-placeholder{height:100%;min-height:65mm;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#dce5eb,#f5f7f8);color:#10283f}
      .photo-placeholder span{font-size:25pt;font-weight:800;letter-spacing:2px}.photo-placeholder small{letter-spacing:2px;color:#78899a}
      .featured-panel{border-radius:3mm;background:#f3f6f9;padding:4mm;min-width:0}
      .featured-title{font-size:11pt;font-weight:800;color:#10283f;margin:0 0 3mm}
      .featured-items{display:grid;grid-template-columns:1fr 1fr;gap:2mm}
      .featured-item{background:#fff;border-left:1mm solid #d9b16a;border-radius:1.5mm;padding:2.5mm;font-size:8pt;min-width:0}
      .featured-item span{display:block;color:#718195;font-size:7pt;margin-bottom:1mm}
      .featured-item b{display:block;color:#10283f;font-size:9pt;overflow-wrap:anywhere}
      .photo-layout{display:grid;grid-template-columns:1.6fr 1fr;gap:2.5mm;margin-top:4mm;position:relative;break-inside:avoid;page-break-inside:avoid;min-height:67mm}
      .photo-main{height:67mm;overflow:hidden;border-radius:3mm;background:#e9eef2;min-width:0}
      .photo-thumbs{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(2,1fr);gap:2mm;min-width:0;min-height:0}
      .thumb{overflow:hidden;border-radius:2mm;background:#e8edf1;min-height:0}
      .thumb img{width:100%;height:100%;min-height:0;object-fit:cover;display:block}
      .photo-count{position:absolute;right:2mm;bottom:2mm;background:rgba(12,35,54,.88);color:#fff;padding:1.5mm 2.5mm;border-radius:2mm;font-size:7pt}
      .hero-info{background:#0c2336;color:#fff;border-radius:3mm;padding:5mm 4.5mm;display:flex;flex-direction:column;min-width:0;overflow:hidden}
      .status{align-self:flex-end;background:#d9b16a;color:#10283f;padding:1.5mm 3.5mm;border-radius:20px;font-size:7.5pt;font-weight:bold}
      .hero-info h1{font-size:19pt;line-height:1.12;margin:3mm 0 2mm;overflow-wrap:anywhere}
      .subtitle{font-size:8pt;color:#cbd7e0;min-height:8mm}
      .gold-line{width:15mm;height:1mm;background:#d9b16a;margin:3mm 0}
      .rent-label{font-size:8pt;color:#d4dde4}
      .price{font-size:23pt;line-height:1.15;font-weight:800;color:#e4bd73;margin:1mm 0 3mm;overflow-wrap:anywhere}
      .price-caption{font-size:7pt;color:#b6c5d1}
      .mini-specs{display:grid;grid-template-columns:1fr 1fr;gap:2mm;margin-top:auto}
      .mini-spec{border:1px solid #315065;border-radius:2.5mm;padding:2.5mm 2mm;min-width:0}
      .mini-spec b{display:block;font-size:10pt;color:#fff}
      .mini-spec small{display:block;color:#bdcbd5;font-size:7pt;margin-top:1mm}
      
      .content-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:3.5mm;margin-top:4mm;align-items:start}
      .left-col,.right-col{display:flex;flex-direction:column;gap:3mm;min-width:0}
      .panel{background:#f3f6f9;border-radius:2.5mm;padding:4mm;page-break-inside:avoid;break-inside:avoid}
      .panel h2{font-size:10.5pt;margin:0 0 2.5mm;color:#10283f;display:flex;align-items:center;gap:2mm}
      .panel h2 .symbol{font-size:12pt;color:#bd8e42}
      .description{font-size:8.5pt;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
      .feature-list{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm}
      .feature{background:#fff;border-radius:1.5mm;padding:2mm 2.5mm;display:flex;justify-content:space-between;align-items:center;gap:2mm;font-size:7.5pt}
      .feature span{color:#637386}.feature b{color:#10283f;text-align:right}
      .address-text{font-size:8.5pt;line-height:1.5;color:#53677b;overflow-wrap:anywhere}
      .map-placeholder{height:26mm;border-radius:2mm;margin-top:3mm;overflow:hidden;background:#e6edf0;position:relative;display:flex;align-items:center;justify-content:center;text-align:center;color:#758899}
      .map-lines{position:absolute;inset:0;background:linear-gradient(28deg,transparent 44%,#fff 45%,#fff 47%,transparent 48%),linear-gradient(145deg,transparent 35%,#fff 36%,#fff 39%,transparent 40%),linear-gradient(80deg,transparent 62%,#fff 63%,#fff 65%,transparent 66%);opacity:.9}
      .map-label{position:relative;background:#fffE;padding:2mm 4mm;border-radius:2mm;font-size:7.5pt}
      .map-pin{font-size:14pt;color:#c74e42}
      .contact{display:grid;grid-template-columns:18mm 1fr;gap:3mm;align-items:center;background:#f3f6f9;border-radius:2.5mm;padding:3.5mm 4mm;margin-top:3.5mm;page-break-inside:avoid;break-inside:avoid}
      .agent-mark{height:17mm;width:17mm;border-radius:2mm;background:#dce5eb;color:#10283f;display:flex;align-items:center;justify-content:center;font-size:17pt;font-weight:bold}
      .agent-photo{height:17mm;width:17mm;border-radius:50%;object-fit:cover}.contact-label{font-size:7pt;letter-spacing:1.2px;color:#bd8e42;font-weight:bold}
      .agent-name{font-size:11pt;font-weight:bold;margin:1mm 0;color:#10283f}
      .contact-note{font-size:7.5pt;color:#627487}
      .footer{margin:4mm -9mm 0;padding:4mm 9mm;background:#0c2336;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:4mm;border-top:2mm solid #d9b16a;page-break-inside:avoid;break-inside:avoid}
      .footer-brand{font-size:13pt;font-weight:800;letter-spacing:.5px}.footer-sub{font-size:6.5pt;color:#9eb5c5;letter-spacing:1px}
      .footer-note{text-align:center;color:#d4dee6;font-size:7pt;flex:1}
      .footer-code{text-align:right;font-size:7pt;color:#d4dee6;overflow-wrap:anywhere;max-width:35mm}
      @media print{.sheet{margin:0}.panel,.contact,.hero-row,.thumbs{break-inside:avoid}}
      </style></head><body><main class="sheet">
      <header class="masthead"><div class="brand"><div class="logo">${brandMark}</div><div><div class="brand-name">${htmlEscape(brandName)}</div><div class="brand-sub">${htmlEscape(brandSubtitle)}</div></div></div><div class="motto">Doğru portföy,<br/>doğru müşteri.</div><div class="codebox"><small>PORTFÖY KODU</small><strong>${code}</strong></div></header>
      <section class="hero-row"><div class="featured-panel"><div class="featured-title">✦ ÖNE ÇIKAN ÖZELLİKLER</div><div class="featured-items">
      <div class="featured-item"><span>Gayrimenkul tipi</span><b>${htmlEscape(propertyTypeLabel(p.propertyType))}</b></div>
      <div class="featured-item"><span>İşlem türü</span><b>${htmlEscape(p.kind)}</b></div>
      <div class="featured-item"><span>Oda sayısı</span><b>${htmlEscape(p.rooms || 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Alan</span><b>${htmlEscape(p.area || 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Bina yaşı</span><b>${htmlEscape(p.buildingAge ? p.buildingAge + ' yıl' : 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Bulunduğu kat</span><b>${htmlEscape(p.floorNumber || 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Banyo</span><b>${htmlEscape(p.bathrooms || 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Balkon</span><b>${htmlEscape(p.balcony || 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Otopark</span><b>${htmlEscape(p.parking || 'Belirtilmedi')}</b></div>
      <div class="featured-item"><span>Isıtma</span><b>${htmlEscape(p.heating || 'Belirtilmedi')}</b></div>
      </div></div>
      <div class="hero-info"><span class="status">${htmlEscape(p.status)}</span><h1>${htmlEscape(p.title)}</h1><div class="subtitle">${htmlEscape((p.description || '').split(/[.!?]/)[0] || propertyTypeLabel(p.propertyType))}</div><div class="gold-line"></div><div class="rent-label">${p.kind === 'Kiralık' ? 'AYLIK KİRA BEDELİ' : 'İSTENEN SATIŞ FİYATI'}</div><div class="price">${money(p.price)}</div><div class="price-caption">İlan fiyatı</div><div class="mini-specs"><div class="mini-spec"><b>${htmlEscape(p.rooms || '—')}</b><small>Oda sayısı</small></div><div class="mini-spec"><b>${htmlEscape(p.area || '—')}</b><small>Alan</small></div><div class="mini-spec"><b>${htmlEscape(propertyTypeLabel(p.propertyType))}</b><small>Emlak tipi</small></div><div class="mini-spec"><b>${htmlEscape(p.kind)}</b><small>İşlem türü</small></div></div></div></section>
      ${photoLayoutHtml}
      <section class="content-grid"><div class="left-col"><article class="panel"><h2><span class="symbol">▤</span> Gayrimenkul hakkında</h2><div class="description">${htmlEscape(p.description || 'Detaylı bilgi ve gösterim için danışmanımızla iletişime geçebilirsiniz.')}</div></article>
      <article class="panel"><h2><span class="symbol">✦</span> Öne çıkan özellikler</h2><div class="feature-list"><div class="feature"><span>Alan</span><b>${htmlEscape(p.area || 'Belirtilmedi')}</b></div><div class="feature"><span>Oda sayısı</span><b>${htmlEscape(p.rooms || 'Belirtilmedi')}</b></div><div class="feature"><span>Emlak tipi</span><b>${htmlEscape(propertyTypeLabel(p.propertyType))}</b></div><div class="feature"><span>İşlem türü</span><b>${htmlEscape(p.kind)}</b></div><div class="feature"><span>Durum</span><b>${htmlEscape(p.status)}</b></div><div class="feature"><span>Bölge</span><b>${htmlEscape(p.district || locationShort || 'Belirtilmedi')}</b></div><div class="feature"><span>Bina yaşı</span><b>${htmlEscape(p.buildingAge ? p.buildingAge + ' yıl' : 'Belirtilmedi')}</b></div><div class="feature"><span>Bulunduğu kat</span><b>${htmlEscape(p.floorNumber || 'Belirtilmedi')}</b></div><div class="feature"><span>Toplam kat</span><b>${htmlEscape(p.totalFloors || 'Belirtilmedi')}</b></div><div class="feature"><span>Banyo</span><b>${htmlEscape(p.bathrooms || 'Belirtilmedi')}</b></div><div class="feature"><span>Balkon</span><b>${htmlEscape(p.balcony || 'Belirtilmedi')}</b></div><div class="feature"><span>Otopark</span><b>${htmlEscape(p.parking || 'Belirtilmedi')}</b></div><div class="feature"><span>Isıtma</span><b>${htmlEscape(p.heating || 'Belirtilmedi')}</b></div><div class="feature"><span>Soğutma</span><b>${htmlEscape(p.cooling || 'Belirtilmedi')}</b></div><div class="feature"><span>İskan</span><b>${htmlEscape(p.occupancyPermit || 'Belirtilmedi')}</b></div><div class="feature"><span>Asansör</span><b>${htmlEscape(p.elevator || 'Belirtilmedi')}</b></div></div></article><article class="panel"><h2><span class="symbol">⌖</span> Yakın çevre</h2><div class="description">${htmlEscape(p.nearbyAmenities || 'Yakın çevre bilgisi belirtilmedi.')}</div></article></div>
      <div class="right-col"><article class="panel"><h2><span class="symbol">●</span> Konum</h2><div class="address-text">${htmlEscape(p.address)}</div><div class="map-placeholder"><div class="map-lines"></div><div class="map-label"><div class="map-pin">●</div>${htmlEscape(locationShort || 'Konum bilgisi')}</div></div><div class="muted" style="font-size:7pt;margin-top:2mm">Kesin konum için danışmanınızdan bilgi alabilirsiniz.</div></article></div></section>
      <section class="contact">${agentAvatarHtml}<div><div class="contact-label">DANIŞMAN</div><div class="agent-name">${htmlEscape(agentDisplayName)}</div><div class="contact-note">${agentPhone ? 'Telefon: ' + htmlEscape(agentPhone) : ''}${agentPhone && agentEmail ? ' · ' : ''}${agentEmail ? 'E-posta: ' + htmlEscape(agentEmail) : ''}${!agentPhone && !agentEmail ? 'Bu portföy hakkında detaylı bilgi ve gösterim için danışmanınızla iletişime geçebilirsiniz.' : ''}</div></div></section>
      <footer class="footer"><div><div class="footer-brand">${htmlEscape(brandName)}</div><div class="footer-sub">${htmlEscape(brandSubtitle)}</div></div><div class="footer-note">Bu portföy ${htmlEscape(brandName)} tarafından hazırlanmıştır.</div><div class="footer-code">PORTFÖY KODU<br/><b>${code}</b></div></footer>
      </main></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Gayrimenkul sunumunu paylaş' });
      else Alert.alert('PDF hazır', 'PDF dosyası oluşturuldu: ' + file.uri);
    } catch (error) {
      Alert.alert('PDF oluşturulamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    }
  };

export const createMultiPropertyPdf = async (deps: PdfDependencies) => {
  const { htmlEscape, propertyTypeLabel, money, properties, selectedPresentationIds, setPortfolioPresentationMode, setSelectedPresentationIds } = deps;
    const selectedProperties = properties.filter(p => selectedPresentationIds.includes(p.id));
    if (selectedProperties.length < 2) {
      Alert.alert('Portföy seç', 'Müşteriye sunmak için en az iki portföy seç.');
      return;
    }
    try {
      const client = getFirebaseClient();
      const pages = await Promise.all(selectedProperties.map(async p => {
        const { data: photoRows, error } = await client.from('property_photos')
          .select('storage_path,sort_order').eq('property_id', p.id).order('sort_order', { ascending: true }).limit(6);
        if (error) throw new Error(p.title + ' fotoğrafları alınamadı.');
        const urls = await Promise.all((photoRows || []).map(async (photo: any) => {
          const { data, error: urlError } = await client.storage.from('property-photos').createSignedUrl(photo.storage_path, 3600);
          if (urlError) throw new Error('Bir portföy fotoğrafı açılamadı.');
          return data.signedUrl as string;
        }));
        const gallery = urls.map(url => '<img src="' + url + '" />').join('');
        return '<section class="property"><div class="brand"><small>GAYIT · MÜŞTERİYE ÖZEL PORTFÖY SEÇKİSİ</small><h1>' + htmlEscape(p.title) + '</h1><div>' + htmlEscape(p.address) + '</div></div>' +
          (gallery ? '<div class="gallery">' + gallery + '</div>' : '') +
          '<div class="price">' + money(p.price) + (p.kind === 'Kiralık' ? ' / ay' : '') + '</div>' +
          '<div class="specs">' + [p.kind, propertyTypeLabel(p.propertyType), p.rooms || 'Oda belirtilmedi', p.area || 'Alan belirtilmedi', p.district || ''].filter(Boolean).map(v => '<span>' + htmlEscape(v) + '</span>').join('') + '</div>' +
          '<h2>Gayrimenkul hakkında</h2><p>' + htmlEscape(p.description || 'Detaylı bilgi için danışmanınızla iletişime geçebilirsiniz.') + '</p>' +
          '<p class="muted">Portföy kodu: ' + htmlEscape(p.id) + ' · Danışman: ' + htmlEscape(p.agent || 'GAYIT danışman ekibi') + '</p></section>';
      }));
      const html = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#17283b;font-size:11pt}.property{page-break-after:always;break-after:page}.property:last-child{page-break-after:auto;break-after:auto}.brand{background:#10243a;color:white;padding:24px;border-radius:12px}.brand small{color:#e8c98f;letter-spacing:1.5px}.brand h1{font-size:23pt;margin:12px 0}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:18px 0}.gallery img{width:100%;height:170px;object-fit:cover;border-radius:8px}.price{font-size:25pt;font-weight:bold;color:#10243a;margin:22px 0}.specs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}.specs span{padding:8px;background:#f4f6f9;border:1px solid #e3e8ef;border-radius:7px}h2{font-size:14pt;color:#10243a}.muted{color:#778597;font-size:9pt}</style></head><body>' + pages.join('') + '</body></html>';
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Müşteriye özel portföy sunumunu paylaş' });
      else Alert.alert('PDF hazır', 'PDF dosyası oluşturuldu: ' + file.uri);
      setPortfolioPresentationMode(false);
      setSelectedPresentationIds([]);
    } catch (error) {
      Alert.alert('Sunum oluşturulamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    }
  };
