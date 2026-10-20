import { Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { getFirebaseClient } from '../lib/firebaseClient';

type CsvDependencies = {
  Alert: typeof Alert;
  Share: typeof Share;
  DocumentPicker: typeof DocumentPicker;
  XLSX: typeof XLSX;
  find: (row: Record<string, unknown>, candidates: string[]) => string;
  parseLine: (line: string) => string[];
  escapeCsv: (value: unknown) => string;
  setCsvImportText: (value: string) => void;
  setExcelFileName: (value: string) => void;
  setExcelPreviewCount: (value: number) => void;
  csvImportBusy: boolean;
  csvImportText: string;
  officeId: string;
  setCsvImportBusy: (value: boolean) => void;
  loadProperties: (officeId: string) => Promise<void>;
  setCsvImportOpen: (value: boolean) => void;
  roleProperties: any[];
  propertyTypeLabel: (value: any) => string;
  money: (value: number) => string;
};

export const pickPortfolioSpreadsheet = async (deps: CsvDependencies) => {
  const { Alert, find, setCsvImportText, setExcelFileName, setExcelPreviewCount } = deps;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','text/csv','text/comma-separated-values'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array', cellDates: false });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('Dosyada okunabilir sayfa bulunamadı.');
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '', raw: false });
      if (!rows.length) throw new Error('Excel sayfasında başlık ve ilan satırları bulunamadı.');
      
      
      const mapped=rows.map(row=>({title:find(row,['ilan adi','ilan başlığı','portföy başlığı','başlık','title']),type:find(row,['gayrimenkul tipi','emlak tipi','tür','tip','property type']),listing:find(row,['ilan tipi','satılık kiralık','işlem tipi','listing type']),price:find(row,['fiyat','istenen fiyat','satış fiyatı','kira','price','bedel']),rooms:find(row,['oda','oda sayısı','rooms']),area:find(row,['m2','m²','metrekare','alan','net m2','brüt m2','area']),district:find(row,['ilçe','mahalle','semt','district']),city:find(row,['şehir','il','city']),address:find(row,['adres','açık adres','konum','address']),description:find(row,['açıklama','detay','description','notlar']),status:find(row,['durum','ilan durumu','status'])})).filter(row=>Object.values(row).some(v=>String(v).trim()));
      if(!mapped.length)throw new Error('İlan satırı bulunamadı. İlk satır sütun başlıkları olmalı.');
      const csv=['Portföy başlığı;Tür;İlan tipi;Fiyat;Oda;Alan;İlçe;Adres;Durum;Danışman;Açıklama',...mapped.map(r=>[r.title,r.type,r.listing,r.price,r.rooms,r.area,r.district,[r.address,r.city].filter(Boolean).join(', '),r.status,'',r.description].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';'))].join('\n');
      setCsvImportText(csv);setExcelFileName(asset.name);setExcelPreviewCount(mapped.length);Alert.alert('Excel okundu',mapped.length+' satır bulundu. Aktarmadan önce veriyi kontrol et.');
    }catch(error){Alert.alert('Dosya okunamadı',error instanceof Error?error.message:'Excel dosyası okunurken hata oluştu.');}
  };

export const importPortfolioCsv = async (deps: CsvDependencies) => {
  const { Alert, csvImportBusy, csvImportText, parseLine, officeId, setCsvImportBusy, loadProperties, setCsvImportOpen, setCsvImportText } = deps;
    if (csvImportBusy) return;
    const source = csvImportText.trim();
    if (!source) { Alert.alert('CSV verisi gerekli','CSV içeriğini buraya yapıştır.'); return; }
    const lines=source.replace(/^\\uFEFF/,'').split(/\\r?\\n/).filter(line=>line.trim().length>0);
    if(lines.length<2){Alert.alert('CSV biçimi hatalı','Başlık satırı ve en az bir portföy satırı gerekli.');return;}
    const payloads=lines.slice(1).map(parseLine).map(row=>{
      const price=Number((row[3]||'').replace(/[^0-9]/g,''));
      const area=Number((row[5]||'').replace(',','.').replace(/[^0-9.]/g,''));
      const typeText=(row[1]||'').toLocaleLowerCase('tr-TR');
      const statusText=(row[8]||'Aktif').toLocaleLowerCase('tr-TR');
      return {title:(row[0]||'').slice(0,160),property_type:typeText.includes('villa')?'villa':typeText.includes('arsa')?'land':typeText.includes('iş yeri')?'commercial':typeText.includes('müstakil')?'house':'apartment',listing_type:(row[2]||'').toLocaleLowerCase('tr-TR').includes('kir')?'rent':'sale',price,rooms:row[4]||'',area_m2:Number.isFinite(area)&&area>0?area:null,district:row[6]||'',address:row[7]||'',status:statusText.includes('opsiyon')?'optioned':statusText.includes('satıldı')?'sold':statusText.includes('kiralandı')?'rented':statusText.includes('arşiv')?'archived':'active',description:row[10]||'',city:'Türkiye',office_id:officeId};
    });
    if(payloads.some(p=>!p.title||p.title.length<3||!p.address||!Number.isSafeInteger(p.price)||p.price<=0)){Alert.alert('Satırları kontrol et','Her satırda başlık, adres ve pozitif tam sayı fiyat bulunmalı.');return;}
    setCsvImportBusy(true);
    try{
      const firebaseClient=getFirebaseClient();const {data:userResult,error:userError}=await firebaseClient.auth.getUser();
      if(userError||!userResult.user)throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const {error}=await firebaseClient.from('properties').insert(payloads.map(p=>({...p,owner_agent_id:userResult.user.id,created_by:userResult.user.id})));
      if(error)throw error;
      await loadProperties(officeId);setCsvImportOpen(false);setCsvImportText('');
      Alert.alert('Aktarım tamamlandı',`${payloads.length} portföy kaydı eklendi.`);
    }catch(error){Alert.alert('Aktarım yapılamadı',error instanceof Error?error.message:'CSV verileri kaydedilemedi.');}
    finally{setCsvImportBusy(false);}
  };

export const exportPortfolioCsv = async (deps: CsvDependencies) => {
  const { roleProperties, propertyTypeLabel, escapeCsv, Share, Alert } = deps;

    const headers = ['Portföy başlığı','Tür','İlan tipi','Fiyat','Oda','Alan','İlçe','Adres','Durum','Danışman','Açıklama'];
    const rows = roleProperties.map(p => [
      p.title, p.propertyType ? propertyTypeLabel(p.propertyType) : '',
      p.kind, p.price, p.rooms, p.area, p.district, p.address, p.status, p.agent, p.description
    ]);
    const csv = '\\uFEFF' + [headers, ...rows].map(row => row.map(escapeCsv).join(';')).join('\\r\\n');
    try { await Share.share({ title: 'GAYIT portföy CSV', message: csv }); }
    catch (error) { Alert.alert('Dışa aktarılamadı', error instanceof Error ? error.message : 'CSV raporu hazırlanamadı.'); }
  };

export const sharePortfolioReport = async (deps: CsvDependencies) => {
  const { roleProperties, money, Share, Alert } = deps;
    const rows = roleProperties.map(p => `• ${p.title} | ${p.kind} | ${money(p.price)} | ${p.status} | ${p.address}`);
    const report = [
      'GAYIT · PORTFÖY RAPORU',
      new Date().toLocaleDateString('tr-TR'),
      '',
      `Toplam portföy: ${roleProperties.length}`,
      `Aktif: ${roleProperties.filter(p => p.status === 'Aktif').length}`,
      `Opsiyonlu: ${roleProperties.filter(p => p.status === 'Opsiyonlu').length}`,
      `Satıldı: ${roleProperties.filter(p => p.status === 'Satıldı').length}`,
      `Kiralandı: ${roleProperties.filter(p => p.status === 'Kiralandı').length}`,
      `Fiyat toplamı: ${money(roleProperties.reduce((sum, p) => sum + p.price, 0))}`,
      '',
      'PORTFÖY LİSTESİ',
      ...rows,
    ].join('\\n');
    try { await Share.share({ title: 'GAYIT Portföy Raporu', message: report }); }
    catch (error) { Alert.alert('Rapor paylaşılamadı', error instanceof Error ? error.message : 'Rapor oluşturulamadı.'); }
  };
