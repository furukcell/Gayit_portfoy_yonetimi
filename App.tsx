import React, { useEffect, useMemo, useState } from 'react';
import { palette, styles } from './src/theme/appStyles';
import AnimatedSplash from './src/components/AnimatedSplash';
import { Stat, Feature } from './src/components/DashboardPrimitives';
import type { Role, Tab, Customer, PropertyStatus, PropertyPhoto, Property } from './src/types/property';
import { initialProperties } from './src/data/initialProperties';
import { findImportColumn as find, normalizeImportHeader as normalize } from './src/utils/importHelpers';
import PropertyRow from './src/components/PropertyRow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL_DOCUMENTS, LEGAL_VERSION, type LegalDocumentKey } from './src/legalDocuments';
import { changeInitialPassword, changePasswordWithCurrent, restoreUsernameSession, signInWithUsername } from './src/lib/usernameAuth';
import {
  Alert, Linking, Modal, Pressable, ScrollView, Share, StatusBar, KeyboardAvoidingView, Platform,
  Text, TextInput, View, Image, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { getFirebaseClient } from './src/lib/firebaseClient';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { getFirebaseApp, getFirebaseAuth } from './src/lib/firebase';
import { signOut } from 'firebase/auth';
import SuperadminPanel from './src/SuperadminPanel';


export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Immersive sticky: hide Android system navigation controls and let a swipe reveal them temporarily.
    // Use only APIs supported by the installed expo-navigation-bar version.
    void NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);
  const [role, setRole] = useState<Role>('owner');
  const [authenticated, setAuthenticated] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalReady, setLegalReady] = useState(false);
  const [legalReadPrivacy, setLegalReadPrivacy] = useState(false);
  const [legalAcceptTerms, setLegalAcceptTerms] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentKey | null>(null);
  const [legalGateBusy, setLegalGateBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [superadminOfficeMode, setSuperadminOfficeMode] = useState(false);
  const [superOfficeName, setSuperOfficeName] = useState('');
  const [superOwnerName, setSuperOwnerName] = useState('');
  const [superOwnerUsername, setSuperOwnerUsername] = useState('');
  const [superOwnerPassword, setSuperOwnerPassword] = useState('');
  const [superCreateBusy, setSuperCreateBusy] = useState(false);
  const [superResult, setSuperResult] = useState('');
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [agentAvatarUri, setAgentAvatarUri] = useState<string | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{name:string; username:string; role:string; status:string; avatarPath:string|null; avatarUrl:string|null; id:string}[]>([]);
  const [teamStatusBusyId, setTeamStatusBusyId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [customerEditBusy, setCustomerEditBusy] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerNotes, setEditCustomerNotes] = useState('');
  const [editFollowUpAt, setEditFollowUpAt] = useState('');
  const [customerRequirements, setCustomerRequirements] = useState<any[]>([]);
  const [customerRequirementsLoading, setCustomerRequirementsLoading] = useState(false);
  const [customerActivities, setCustomerActivities] = useState<any[]>([]);
  const [activitySummary, setActivitySummary] = useState('');
  const [activityType, setActivityType] = useState<'call'|'whatsapp'|'meeting'|'property_viewing'|'note'>('note');
  const [activityBusy, setActivityBusy] = useState(false);
  const [customerAppointments, setCustomerAppointments] = useState<any[]>([]);
  const [customerOffers, setCustomerOffers] = useState<any[]>([]);
  const [offerPropertyId, setOfferPropertyId] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerStatus, setOfferStatus] = useState<'pending'|'countered'|'accepted'|'rejected'>('pending');
  const [offerNotes, setOfferNotes] = useState('');
  const [offerBusy, setOfferBusy] = useState(false);
  const [appointmentTitle, setAppointmentTitle] = useState('Müşteri görüşmesi');
  const [appointmentStartsAt, setAppointmentStartsAt] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [appointmentBusy, setAppointmentBusy] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerRoles, setCustomerRoles] = useState<string[]>(['buyer']);
  const [customerNotes, setCustomerNotes] = useState('');
  const [requirementIntent, setRequirementIntent] = useState<'sale'|'rent'>('sale');
  const [requirementType, setRequirementType] = useState('apartment');
  const [requirementCity, setRequirementCity] = useState('Muğla');
  const [requirementDistrict, setRequirementDistrict] = useState('');
  const [requirementMaxPrice, setRequirementMaxPrice] = useState('');
  const [requirementRooms, setRequirementRooms] = useState('');
  const [customerBusy, setCustomerBusy] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertyBusy, setPropertyBusy] = useState(false);
  const [propertyStatusBusy, setPropertyStatusBusy] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [offerStatusBusyId, setOfferStatusBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selected, setSelected] = useState<Property | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Tümü' | 'Satılık' | 'Kiralık'>('Tümü');
  const [quickTypeFilter, setQuickTypeFilter] = useState('Tümü');
  const [quickCityFilter, setQuickCityFilter] = useState('Tümü');
  const [quickDistrictFilter, setQuickDistrictFilter] = useState('Tümü');
  const [quickDropdown, setQuickDropdown] = useState<null | 'type' | 'city' | 'district'>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Tümü' | PropertyStatus>('Tümü');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [recentPropertyIds, setRecentPropertyIds] = useState<string[]>([]);
  const [portfolioPresentationMode, setPortfolioPresentationMode] = useState(false);
  const [selectedPresentationIds, setSelectedPresentationIds] = useState<string[]>([]);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionPropertyId, setTransactionPropertyId] = useState('');
  const [transactionFinalPrice, setTransactionFinalPrice] = useState('');
  const [transactionOfficeCommission, setTransactionOfficeCommission] = useState('');
  const [transactionAgentCommission, setTransactionAgentCommission] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0,10));
  const [transactionNotes, setTransactionNotes] = useState('');
  const [transactionBusy, setTransactionBusy] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvImportText, setCsvImportText] = useState('');
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatarPath, setProfileAvatarPath] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelPreviewCount, setExcelPreviewCount] = useState(0);
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [rooms, setRooms] = useState('3+1');
  const [area, setArea] = useState('');
  const [kind, setKind] = useState<'Satılık' | 'Kiralık'>('Satılık');
  const [propertyType, setPropertyType] = useState('apartment');
  const [description, setDescription] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [balcony, setBalcony] = useState('Belirtilmedi');
  const [parking, setParking] = useState('Belirtilmedi');
  const [heating, setHeating] = useState('Belirtilmedi');
  const [cooling, setCooling] = useState('Belirtilmedi');
  const [occupancyPermit, setOccupancyPermit] = useState('Belirtilmedi');
  const [elevator, setElevator] = useState('Belirtilmedi');
  const [nearbyAmenities, setNearbyAmenities] = useState('');
  const [buildingAge, setBuildingAge] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [ownerContactName, setOwnerContactName] = useState('');
  const [ownerContactPhone, setOwnerContactPhone] = useState('');
  const [selectedOwnerContact, setSelectedOwnerContact] = useState<{ name: string; phone: string } | null>(null);
  const [pendingPhotoUris, setPendingPhotoUris] = useState<{ uri: string; mimeType?: string | null; fileName?: string | null }[]>([]);

  useEffect(() => {
    let cancelled = false;
    setSelectedOwnerContact(null);
    if (!selected?.id) return;
    void (async () => {
      const client = getFirebaseClient();
      const { data } = await client.from('properties').select('owner_contact_name,owner_contact_phone').eq('id', selected.id).maybeSingle();
      if (!cancelled && data) setSelectedOwnerContact({ name: data.owner_contact_name || '', phone: data.owner_contact_phone || '' });
    })();
    return () => { cancelled = true; };
  }, [selected?.id]);

  useEffect(() => {
    let cancelled = false;
    const checkLegalAcceptance = async () => {
      if (!authenticated) { setLegalReady(false); setLegalAccepted(false); return; }
      const uid = getFirebaseAuth().currentUser?.uid;
      if (!uid) { setLegalReady(true); setLegalAccepted(false); return; }
      setLegalReady(false);
      try {
        const stored = await AsyncStorage.getItem('gayit_legal_acceptance_' + uid);
        if (!cancelled) setLegalAccepted(stored === LEGAL_VERSION);
      } catch { if (!cancelled) setLegalAccepted(false); }
      finally { if (!cancelled) setLegalReady(true); }
    };
    void checkLegalAcceptance();
    return () => { cancelled = true; };
  }, [authenticated]);

  const confirmLegalAcceptance = async () => {
    if (!legalReadPrivacy || !legalAcceptTerms || legalGateBusy) return;
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) { Alert.alert('Oturum bulunamadı', 'Devam etmek için yeniden giriş yap.'); return; }
    setLegalGateBusy(true);
    try {
      await AsyncStorage.setItem('gayit_legal_acceptance_' + uid, LEGAL_VERSION);
      setLegalAccepted(true); setLegalDocument(null);
    } catch { Alert.alert('Kaydedilemedi', 'Kabul kaydı bu cihazda saklanamadı. Lütfen tekrar dene.'); }
    finally { setLegalGateBusy(false); }
  };

  const roleProperties = useMemo(() => properties, [properties]);
  const visibleProperties = useMemo(() => properties.filter(p => {
    const searchMatch = `${p.title} ${p.address} ${p.id}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'));
    const minPrice = minPriceFilter.trim() ? Number(minPriceFilter.replace(/[^0-9]/g, '')) : null;
    const maxPrice = maxPriceFilter.trim() ? Number(maxPriceFilter.replace(/[^0-9]/g, '')) : null;
    const statusMatch = statusFilter === 'Tümü' || p.status === statusFilter;
    const city = (p.address.split(',').map(part => part.trim()).filter(Boolean).slice(-1)[0] || '').toLocaleLowerCase('tr-TR');
    const district = (p.district || p.address.split(',').map(part => part.trim()).filter(Boolean).slice(-2)[0] || '').toLocaleLowerCase('tr-TR');
    const typeMatch = quickTypeFilter === 'Tümü' || propertyTypeLabel(p.propertyType) === quickTypeFilter;
    const cityMatch = quickCityFilter === 'Tümü' || city === quickCityFilter.toLocaleLowerCase('tr-TR');
    const districtMatch = quickDistrictFilter === 'Tümü' || district === quickDistrictFilter.toLocaleLowerCase('tr-TR');
    const minMatch = minPrice === null || p.price >= minPrice;
    const maxMatch = maxPrice === null || p.price <= maxPrice;
    return searchMatch && (showArchived ? p.status === 'Arşivde' : p.status !== 'Arşivde') && (filter === 'Tümü' || p.kind === filter) && typeMatch && cityMatch && districtMatch && statusMatch && minMatch && maxMatch && (!favoritesOnly || favoriteIds.includes(p.id)) && (!recentOnly || recentPropertyIds.includes(p.id));
  }).sort((a,b) => sortBy === 'priceAsc' ? a.price-b.price : sortBy === 'priceDesc' ? b.price-a.price : sortBy === 'newest' ? 0 : 0), [properties, role, search, filter, quickTypeFilter, quickCityFilter, quickDistrictFilter, sortBy, showArchived, statusFilter, minPriceFilter, maxPriceFilter, favoritesOnly, favoriteIds, recentOnly, recentPropertyIds]);

  const saveTransaction = async () => {
    if (transactionBusy) return;
    const finalPrice = Number(transactionFinalPrice.replace(/[^0-9]/g,''));
    const officeCommission = Number(transactionOfficeCommission.replace(/[^0-9]/g,'') || 0);
    const agentCommission = Number(transactionAgentCommission.replace(/[^0-9]/g,'') || 0);
    if (!transactionPropertyId || !Number.isSafeInteger(finalPrice) || finalPrice <= 0) { Alert.alert('Eksik bilgi','Portföy seç ve gerçekleşen satış/kiralama bedelini gir.'); return; }
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(transactionDate) || officeCommission < 0 || agentCommission < 0 || officeCommission + agentCommission > finalPrice) { Alert.alert('Bilgileri kontrol et','Tarih YYYY-AA-GG olmalı; komisyonlar negatif olamaz ve toplamı işlem bedelini aşamaz.'); return; }
    setTransactionBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data:userResult,error:userError } = await firebaseClient.auth.getUser();
      if(userError||!userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const property = properties.find(p=>p.id===transactionPropertyId);
      if(!property) throw new Error('Seçilen portföy bulunamadı.');
      const { error } = await firebaseClient.from('property_transactions').insert({
        office_id:officeId, property_id:property.id, agent_id:userResult.user.id,
        transaction_type:property.kind==='Kiralık'?'rent':'sale', final_price:finalPrice,
        office_commission:officeCommission, agent_commission:agentCommission,
        closed_on:transactionDate, notes:transactionNotes.trim(), created_by:userResult.user.id,
      });
      if(error) throw error;
      await getFirebaseClient().from('properties').update({status:property.kind==='Kiralık'?'rented':'sold'}).eq('id',property.id).eq('office_id',officeId);
      await loadProperties(officeId);
      setTransactionModalOpen(false); setTransactionPropertyId(''); setTransactionFinalPrice(''); setTransactionOfficeCommission(''); setTransactionAgentCommission(''); setTransactionNotes('');
      Alert.alert('İşlem kaydedildi','Satış/kiralama ve komisyon kaydı oluşturuldu.');
    } catch(error) { Alert.alert('İşlem kaydedilemedi',error instanceof Error?error.message:'Firebase Firestore kurallarını ve ofis yetkilerini kontrol et.'); }
    finally { setTransactionBusy(false); }
  };

  const loadRecentViews = async () => {
    if (!officeId) return;
    try {
      const { data, error } = await getFirebaseClient().from('property_recent_views').select('property_id,viewed_at').eq('office_id',officeId).order('viewed_at',{ascending:false}).limit(50);
      if (error) throw error;
      setRecentPropertyIds([...new Set<string>((data||[]).map((row:any)=>String(row.property_id)))]);
    } catch {
      // The rest of the portfolio remains usable before migration 011 is applied.
    }
  };
  const openProperty = (property: Property) => {
    setSelected(property); setPropertyPhotos([]);
    void loadPropertyPhotos(property.id);
    if (!officeId) return;
    void (async()=>{
      try {
        const firebaseClient=getFirebaseClient();
        const {data:userResult}=await firebaseClient.auth.getUser();
        if(!userResult.user) return;
        const {error}=await firebaseClient.from('property_recent_views').upsert(
          {office_id:officeId,property_id:property.id,user_id:userResult.user.id,viewed_at:new Date().toISOString()},
          {onConflict:'office_id,property_id,user_id'}
        );
        if(error) return;
        setRecentPropertyIds(ids=>[property.id,...ids.filter(id=>id!==property.id)].slice(0,50));
      } catch { /* Recent-view tracking must not block opening a property. */ }
    })();
  };

  const loadFavorites = async () => {
    if (!officeId) return;
    try {
      const { data, error } = await getFirebaseClient().from('property_favorites').select('property_id').eq('office_id', officeId);
      if (error) throw error;
      setFavoriteIds((data || []).map((row: any) => row.property_id));
    } catch {
      Alert.alert('Favoriler yüklenemedi','Firebase Firestore kurallarını ve Storage kurulumunu kontrol et.');
    }
  };
  const toggleFavorite = async (property: Property) => {
    if (!officeId) return;
    const firebaseClient = getFirebaseClient();
    const { data: userResult, error: userError } = await firebaseClient.auth.getUser();
    if (userError || !userResult.user) { Alert.alert('Oturum gerekli','Favori kaydetmek için tekrar giriş yap.'); return; }
    const isFavorite = favoriteIds.includes(property.id);
    try {
      if (isFavorite) {
        const { error } = await firebaseClient.from('property_favorites').delete().eq('office_id',officeId).eq('property_id',property.id).eq('user_id',userResult.user.id);
        if (error) throw error;
        setFavoriteIds(ids=>ids.filter(id=>id!==property.id));
      } else {
        const { error } = await firebaseClient.from('property_favorites').insert({office_id:officeId,property_id:property.id,user_id:userResult.user.id});
        if (error) throw error;
        setFavoriteIds(ids=>[...ids,property.id]);
      }
    } catch (error) { Alert.alert('Favori kaydedilemedi',error instanceof Error?error.message:'Firebase 011 migration dosyasını ve yetkileri kontrol et.'); }
  };

  const pickPortfolioSpreadsheet = async () => {
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

  const importPortfolioCsv = async () => {
    if (csvImportBusy) return;
    const source = csvImportText.trim();
    if (!source) { Alert.alert('CSV verisi gerekli','CSV içeriğini buraya yapıştır.'); return; }
    const parseLine = (line: string) => {
      const values:string[]=[]; let value=''; let quoted=false;
      for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'&&quoted&&line[i+1]==='"'){value+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===';'&&!quoted){values.push(value);value='';}else value+=char;}
      values.push(value); return values.map(v=>v.trim());
    };
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

  const exportPortfolioCsv = async () => {
    const escapeCsv = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const headers = ['Portföy başlığı','Tür','İlan tipi','Fiyat','Oda','Alan','İlçe','Adres','Durum','Danışman','Açıklama'];
    const rows = roleProperties.map(p => [
      p.title, p.propertyType ? propertyTypeLabel(p.propertyType) : '',
      p.kind, p.price, p.rooms, p.area, p.district, p.address, p.status, p.agent, p.description
    ]);
    const csv = '\\uFEFF' + [headers, ...rows].map(row => row.map(escapeCsv).join(';')).join('\\r\\n');
    try { await Share.share({ title: 'GAYIT portföy CSV', message: csv }); }
    catch (error) { Alert.alert('Dışa aktarılamadı', error instanceof Error ? error.message : 'CSV raporu hazırlanamadı.'); }
  };

  const sharePortfolioReport = async () => {
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

  const openMap = async (p: Property) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`;
    try { await Linking.openURL(url); } catch { Alert.alert('Harita açılamadı', 'Adresin geçerli olduğundan emin olun.'); }
  };
  const shareWhatsApp = async (p: Property) => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText(p))}`;
    try { await Linking.openURL(url); } catch { await Share.share({ message: shareText(p) }); }
  };
  const loadPropertyPhotos = async (propertyId: string) => {
    setPhotosBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('property_photos').select('id,storage_path,sort_order').eq('property_id', propertyId).order('sort_order', { ascending: true });
      if (error) throw error;
      const photos: PropertyPhoto[] = await Promise.all((data || []).map(async (row: any) => {
        const { data: signed, error: signError } = await firebaseClient.storage.from('property-photos').createSignedUrl(row.storage_path, 60 * 60);
        if (signError) throw signError;
        return { id: row.id, storagePath: row.storage_path, url: signed.signedUrl, sortOrder: row.sort_order || 0 };
      }));
      setPropertyPhotos(photos);
    } catch (error) {
      setPropertyPhotos([]);
      Alert.alert('Fotoğraflar yüklenemedi', 'Firebase Firestore kurallarını ve Storage izinlerini kontrol edin.');
    } finally { setPhotosBusy(false); }
  };

  const addPropertyPhoto = async () => {
    if (!selected) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Galeri izni gerekli', 'İlan fotoğrafı seçmek için galeri izni vermelisin.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setPhotosBusy(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const ext = asset.mimeType === 'image/png' ? 'png' : 'jpg';
      const storagePath = officeId + '/' + selected.id + '/' + Date.now() + '.' + ext;
      const firebaseClient = getFirebaseClient();
      const { error: uploadError } = await firebaseClient.storage.from('property-photos').upload(storagePath, blob, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;
      const { error: rowError } = await firebaseClient.from('property_photos').insert({ property_id: selected.id, office_id: officeId, storage_path: storagePath, sort_order: propertyPhotos.length });
      if (rowError) { await firebaseClient.storage.from('property-photos').remove([storagePath]); throw rowError; }
      await loadPropertyPhotos(selected.id);
    } catch (error) { Alert.alert('Fotoğraf yüklenemedi', error instanceof Error ? error.message : 'Firebase Storage hizmetinin etkin olduğunu ve kuralların yayınlandığını kontrol edin.'); }
    finally { setPhotosBusy(false); }
  };

  const movePropertyPhoto = async (photo: PropertyPhoto, direction: -1 | 1) => {
    if (!selected || photosBusy) return;
    const current = [...propertyPhotos].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = current.findIndex(item => item.id === photo.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setPhotosBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      // Persist sequential sort_order values; index 0 is the cover photo.
      for (let i = 0; i < reordered.length; i++) {
        const { error } = await firebaseClient.from('property_photos')
          .update({ sort_order: i }).eq('id', reordered[i].id).eq('property_id', selected.id);
        if (error) throw error;
      }
      setPropertyPhotos(reordered.map((item, i) => ({ ...item, sortOrder: i })));
    } catch (error) {
      await loadPropertyPhotos(selected.id);
      Alert.alert('Sıralama kaydedilemedi', error instanceof Error ? error.message : 'Fotoğraf sırası güncellenemedi.');
    } finally {
      setPhotosBusy(false);
    }
  };

  const removePropertyPhoto = async (photo: PropertyPhoto) => {
    if (!selected || photosBusy) return;
    const propertyId = selected.id;
    Alert.alert('Fotoğrafı sil', 'Bu fotoğraf ilandan kaldırılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        if (photosBusy) return;
        setPhotosBusy(true);
        try {
          const firebaseClient = getFirebaseClient();
          // Delete the object first. If Storage rejects the operation, keep its
          // metadata row so the user can retry from the gallery.
          const { error: storageError } = await firebaseClient.storage.from('property-photos').remove([photo.storagePath]);
          if (storageError) {
            await loadPropertyPhotos(propertyId);
            Alert.alert('Fotoğraf silinemedi', 'Dosya depolamadan silinemedi; kayıt galeride bırakıldı, böylece tekrar deneyebilirsin. Firebase Storage izinlerini kontrol et.');
            return;
          }
          const { error: rowError } = await firebaseClient.from('property_photos')
            .delete().eq('id', photo.id).eq('property_id', propertyId);
          if (rowError) {
            await loadPropertyPhotos(propertyId);
            Alert.alert('Fotoğraf dosyası silindi', 'Depolama dosyası silindi ancak fotoğraf kaydı kaldı. Galeriyi yenileyip tekrar deneyebilirsin.');
            return;
          }
          setPropertyPhotos(current => current.filter(item => item.id !== photo.id));
          await loadPropertyPhotos(propertyId);
        } catch (error) {
          Alert.alert('Fotoğraf silinemedi', error instanceof Error ? error.message : 'Silme işlemi tamamlanamadı. Tekrar deneyin.');
        } finally {
          setPhotosBusy(false);
        }
      }}
    ]);
  };
  const createPdf = async (p: Property) => {
    try {
      const firebaseClient = getFirebaseClient();
      const uid = getFirebaseAuth().currentUser?.uid;
      const { data: profile } = uid ? await firebaseClient.from('profiles').select('full_name,phone,email,avatar_path').eq('id', uid).maybeSingle() : { data: null as any };
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
        ? '<img class="hero-photo" src="' + heroPhoto + '" alt="Gayrimenkul fotoğrafı" />'
        : '<div class="hero-placeholder"><span>GAYIT</span><small>GAYRİMENKUL PORTFÖYÜ</small></div>';
      const galleryHtml = galleryPhotos.map((url, index) =>
        '<div class="thumb"><img src="' + url + '" alt="İlan fotoğrafı ' + (index + 2) + '" /></div>'
      ).join('');
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
      .logo{width:13mm;height:13mm;border-radius:3mm;background:#d3aa62;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18pt;font-weight:bold}
      .brand-name{font-size:22pt;line-height:1;font-weight:800;letter-spacing:.4px;color:#10283f}
      .brand-sub{font-size:7.5pt;letter-spacing:1.5px;color:#728397;margin-top:1mm}
      .motto{text-align:right;font-size:8pt;line-height:1.45;color:#10283f;white-space:nowrap}
      .codebox{border-left:1px solid #cdd5de;padding-left:4mm;margin-left:4mm;text-align:right;min-width:31mm}
      .codebox small{display:block;color:#8190a0;font-size:7pt;margin-bottom:1mm}
      .codebox strong{font-size:8pt;overflow-wrap:anywhere}
      .hero-row{display:grid;grid-template-columns:1.65fr 1fr;gap:2mm;height:88mm}
      .hero-visual{position:relative;border-radius:3mm;overflow:hidden;background:#e9eef2;min-width:0}
      .hero-photo{width:100%;height:100%;object-fit:cover;display:block}
      .hero-placeholder{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#dce5eb,#f5f7f8);color:#10283f}
      .hero-placeholder span{font-size:25pt;font-weight:800;letter-spacing:2px}.hero-placeholder small{letter-spacing:2px;color:#78899a}
      .hero-chip{position:absolute;left:4mm;top:4mm;border-radius:20px;background:#10283f;color:#fff;padding:2mm 4mm;font-size:8pt;font-weight:bold}
      .hero-location{position:absolute;bottom:0;left:0;right:0;padding:4mm;background:linear-gradient(transparent,rgba(4,17,27,.9));color:#fff;font-size:8pt;font-weight:bold}
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
      .thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:2mm;margin-top:2.5mm;height:28mm}
      .thumb{overflow:hidden;border-radius:2mm;background:#e8edf1}
      .thumb img{width:100%;height:100%;object-fit:cover;display:block}
      .more-photos{display:flex;align-items:center;justify-content:center;text-align:center;color:#10283f;background:#eef2f5;font-size:9pt;font-weight:bold}
      .content-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:3.5mm;margin-top:4mm}
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
      .footer{margin:4mm -9mm 0;padding:4mm 9mm;background:#0c2336;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:4mm;border-top:2mm solid #d9b16a}
      .footer-brand{font-size:13pt;font-weight:800;letter-spacing:.5px}.footer-sub{font-size:6.5pt;color:#9eb5c5;letter-spacing:1px}
      .footer-note{text-align:center;color:#d4dee6;font-size:7pt;flex:1}
      .footer-code{text-align:right;font-size:7pt;color:#d4dee6;overflow-wrap:anywhere;max-width:35mm}
      @media print{.sheet{margin:0}.panel,.contact,.hero-row,.thumbs{break-inside:avoid}}
      </style></head><body><main class="sheet">
      <header class="masthead"><div class="brand"><div class="logo">⌂</div><div><div class="brand-name">GAYIT</div><div class="brand-sub">GAYRİMENKUL SUNUMU</div></div></div><div class="motto">Doğru portföy,<br/>doğru müşteri.</div><div class="codebox"><small>PORTFÖY KODU</small><strong>${code}</strong></div></header>
      <section class="hero-row"><div class="hero-visual">${heroHtml}<div class="hero-chip">${htmlEscape(p.kind)}</div><div class="hero-location">${htmlEscape(p.address)}</div></div>
      <div class="hero-info"><span class="status">${htmlEscape(p.status)}</span><h1>${htmlEscape(p.title)}</h1><div class="subtitle">${htmlEscape((p.description || '').split(/[.!?]/)[0] || propertyTypeLabel(p.propertyType))}</div><div class="gold-line"></div><div class="rent-label">${p.kind === 'Kiralık' ? 'AYLIK KİRA BEDELİ' : 'İSTENEN SATIŞ FİYATI'}</div><div class="price">${money(p.price)}</div><div class="price-caption">İlan fiyatı</div><div class="mini-specs"><div class="mini-spec"><b>${htmlEscape(p.rooms || '—')}</b><small>Oda sayısı</small></div><div class="mini-spec"><b>${htmlEscape(p.area || '—')}</b><small>Alan</small></div><div class="mini-spec"><b>${htmlEscape(propertyTypeLabel(p.propertyType))}</b><small>Emlak tipi</small></div><div class="mini-spec"><b>${htmlEscape(p.kind)}</b><small>İşlem türü</small></div></div></div></section>
      ${galleryHtml ? '<section class="thumbs">' + galleryHtml + (photosForPdf.length > 5 ? '<div class="thumb more-photos">+' + (photosForPdf.length - 5) + '<br/>fotoğraf</div>' : '') + '</section>' : ''}
      <section class="content-grid"><div class="left-col"><article class="panel"><h2><span class="symbol">▤</span> Gayrimenkul hakkında</h2><div class="description">${htmlEscape(p.description || 'Detaylı bilgi ve gösterim için danışmanımızla iletişime geçebilirsiniz.')}</div></article>
      <article class="panel"><h2><span class="symbol">✦</span> Öne çıkan özellikler</h2><div class="feature-list"><div class="feature"><span>Alan</span><b>${htmlEscape(p.area || 'Belirtilmedi')}</b></div><div class="feature"><span>Oda sayısı</span><b>${htmlEscape(p.rooms || 'Belirtilmedi')}</b></div><div class="feature"><span>Emlak tipi</span><b>${htmlEscape(propertyTypeLabel(p.propertyType))}</b></div><div class="feature"><span>İşlem türü</span><b>${htmlEscape(p.kind)}</b></div><div class="feature"><span>Durum</span><b>${htmlEscape(p.status)}</b></div><div class="feature"><span>Bölge</span><b>${htmlEscape(p.district || locationShort || 'Belirtilmedi')}</b></div><div class="feature"><span>Bina yaşı</span><b>${htmlEscape(p.buildingAge ? p.buildingAge + ' yıl' : 'Belirtilmedi')}</b></div><div class="feature"><span>Bulunduğu kat</span><b>${htmlEscape(p.floorNumber || 'Belirtilmedi')}</b></div><div class="feature"><span>Toplam kat</span><b>${htmlEscape(p.totalFloors || 'Belirtilmedi')}</b></div><div class="feature"><span>Banyo</span><b>${htmlEscape(p.bathrooms || 'Belirtilmedi')}</b></div><div class="feature"><span>Balkon</span><b>${htmlEscape(p.balcony || 'Belirtilmedi')}</b></div><div class="feature"><span>Otopark</span><b>${htmlEscape(p.parking || 'Belirtilmedi')}</b></div><div class="feature"><span>Isıtma</span><b>${htmlEscape(p.heating || 'Belirtilmedi')}</b></div><div class="feature"><span>Soğutma</span><b>${htmlEscape(p.cooling || 'Belirtilmedi')}</b></div><div class="feature"><span>İskan</span><b>${htmlEscape(p.occupancyPermit || 'Belirtilmedi')}</b></div><div class="feature"><span>Asansör</span><b>${htmlEscape(p.elevator || 'Belirtilmedi')}</b></div></div></article><article class="panel"><h2><span class="symbol">⌖</span> Yakın çevre</h2><div class="description">${htmlEscape(p.nearbyAmenities || 'Yakın çevre bilgisi belirtilmedi.')}</div></article></div>
      <div class="right-col"><article class="panel"><h2><span class="symbol">●</span> Konum</h2><div class="address-text">${htmlEscape(p.address)}</div><div class="map-placeholder"><div class="map-lines"></div><div class="map-label"><div class="map-pin">●</div>${htmlEscape(locationShort || 'Konum bilgisi')}</div></div><div class="muted" style="font-size:7pt;margin-top:2mm">Kesin konum için danışmanınızdan bilgi alabilirsiniz.</div></article></div></section>
      <section class="contact">${agentAvatarHtml}<div><div class="contact-label">DANIŞMAN</div><div class="agent-name">${htmlEscape(agentDisplayName)}</div><div class="contact-note">${agentPhone ? 'Telefon: ' + htmlEscape(agentPhone) : ''}${agentPhone && agentEmail ? ' · ' : ''}${agentEmail ? 'E-posta: ' + htmlEscape(agentEmail) : ''}${!agentPhone && !agentEmail ? 'Bu portföy hakkında detaylı bilgi ve gösterim için danışmanınızla iletişime geçebilirsiniz.' : ''}</div></div></section>
      <footer class="footer"><div><div class="footer-brand">⌂ GAYIT</div><div class="footer-sub">GAYRİMENKUL SUNUMU</div></div><div class="footer-note">Bu portföy GAYIT Portföy Yönetimi ile oluşturulmuştur.</div><div class="footer-code">PORTFÖY KODU<br/><b>${code}</b></div></footer>
      </main></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Gayrimenkul sunumunu paylaş' });
      else Alert.alert('PDF hazır', 'PDF dosyası oluşturuldu: ' + file.uri);
    } catch (error) {
      Alert.alert('PDF oluşturulamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    }
  };
  const createMultiPropertyPdf = async () => {
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
  const loadProperties = async (targetOfficeId: string) => {
    setPropertiesLoading(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('properties').select('*').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Portföyler yüklenemedi.');
      const rows = data || [];
      const ids = [...new Set(rows.map((row: any) => row.owner_agent_id))];
      const { data: profiles } = ids.length ? await firebaseClient.from('profiles').select('id,full_name').in('id', ids) : { data: [] as any[] };
      const names = new Map((profiles || []).map((profile: any) => [profile.id, profile.full_name]));
      const mapped: Property[] = rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        address: row.address,
        district: row.district || '',
        price: Number(row.price),
        rooms: row.rooms || '',
        area: row.area_m2 ? String(row.area_m2) + ' m²' : '',
        propertyType: row.property_type || 'apartment',
        kind: row.listing_type === 'rent' ? 'Kiralık' : 'Satılık',
        status: row.status === 'optioned' ? 'Opsiyonlu' : row.status === 'sold' ? 'Satıldı' : row.status === 'rented' ? 'Kiralandı' : row.status === 'archived' ? 'Arşivde' : 'Aktif',
        agent: names.get(row.owner_agent_id) || 'Danışman',
        ownerAgentId: row.owner_agent_id,
        views: 0,
        createdAt: new Date(row.created_at).toLocaleDateString('tr-TR'),
        description: row.description || '',
        bathrooms: row.bathrooms == null ? '' : String(row.bathrooms),
        balcony: row.balcony || 'Belirtilmedi', parking: row.parking || 'Belirtilmedi',
        heating: row.heating || 'Belirtilmedi', cooling: row.cooling || 'Belirtilmedi',
        occupancyPermit: row.occupancy_permit || 'Belirtilmedi', elevator: row.elevator || 'Belirtilmedi',
        nearbyAmenities: row.nearby_amenities || '',
        buildingAge: row.building_age == null ? '' : String(row.building_age),
        floorNumber: row.floor_number == null ? '' : String(row.floor_number),
        totalFloors: row.total_floors == null ? '' : String(row.total_floors),
      }));
      setProperties(mapped);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const loadCustomers = async (targetOfficeId: string) => {
    setCustomersLoading(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('customers').select('id,full_name,phone,roles,assigned_agent_id,notes,is_active,next_follow_up_at,customer_requirements(id)').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Müşteriler yüklenemedi. Migration 003 uygulanmış olmalı.');
      const rows = data || [];
      const ids = [...new Set(rows.map((row: any) => row.assigned_agent_id))];
      const { data: profiles } = ids.length ? await firebaseClient.from('profiles').select('id,full_name').in('id', ids) : { data: [] as any[] };
      const names = new Map((profiles || []).map((profile: any) => [profile.id, profile.full_name]));
      setCustomers(rows.map((row: any) => ({ id: row.id, fullName: row.full_name, phone: row.phone || '', roles: row.roles || [], assignedAgent: names.get(row.assigned_agent_id) || 'Danışman', assignedAgentId: row.assigned_agent_id, notes: row.notes || '', active: row.is_active, nextFollowUpAt: row.next_follow_up_at || null, requirementCount: Array.isArray(row.customer_requirements) ? row.customer_requirements.length : 0 })));
    } finally { setCustomersLoading(false); }
  };

  const loadMatches = async (targetOfficeId: string) => {
    setMatchesLoading(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('matches').select('id,status,match_kind,match_score,match_reasons,created_at,properties(id,title,price,listing_type,district,rooms),customers(id,full_name,phone)').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Eşleşmeler yüklenemedi. Migration 003 uygulanmış olmalı.');
      setMatches(data || []);
    } finally { setMatchesLoading(false); }
  };

  const loadNotifications = async (targetOfficeId: string) => {
    setNotificationsLoading(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('notifications')
        .select('id,notification_type,title,body,match_id,customer_id,property_id,read_at,created_at')
        .eq('office_id', targetOfficeId).order('created_at', { ascending: false }).limit(100);
      if (error) throw new Error('Bildirimler yüklenemedi. Migration 003 uygulanmış olmalı.');
      setNotifications(data || []);
    } catch (error) {
      Alert.alert('Bildirimler yüklenemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally { setNotificationsLoading(false); }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const firebaseClient = getFirebaseClient();
      const { error } = await firebaseClient.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
      if (error) throw error;
      setNotifications(current => current.map(n => n.id === notificationId ? {...n, read_at: new Date().toISOString()} : n));
    } catch (error) {
      Alert.alert('Bildirim güncellenemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    }
  };

  const loadTeamMembers = async (targetOfficeId: string) => {
    const firebaseClient = getFirebaseClient();
    const { data, error } = await firebaseClient
      .from('office_members')
      .select('role,status,profiles(id,full_name,username,avatar_path)')
      .eq('office_id', targetOfficeId)
      .in('status', ['active', 'disabled']);
    if (error) throw new Error('Ekip bilgileri yüklenemedi.');
    const mapped = await Promise.all((data || []).map(async (row: any) => {
      const avatarPath = row.profiles?.avatar_path || null;
      let avatarUrl: string | null = null;
      if (avatarPath) {
        const { data: signed } = await firebaseClient.storage.from('avatars').createSignedUrl(avatarPath, 3600);
        avatarUrl = signed?.signedUrl || null;
      }
      return {
        id: row.profiles?.id || row.user_id || '',
        name: row.profiles?.full_name || 'İsimsiz danışman',
        username: row.profiles?.username || '',
        role: row.role,
        status: row.status,
        avatarPath,
        avatarUrl,
      };
    }));
    setTeamMembers(mapped);
  };

  const toggleAgentStatus = (person: {id:string; name:string; role:string; status:string}) => {
    if (person.role !== 'agent' || !person.id || !officeId) return;
    const nextStatus = person.status === 'active' ? 'disabled' : 'active';
    const actionLabel = nextStatus === 'disabled' ? 'devre dışı bırakmak' : 'yeniden etkinleştirmek';
    Alert.alert(
      nextStatus === 'disabled' ? 'Danışmanı devre dışı bırak' : 'Danışmanı yeniden etkinleştir',
      `${person.name} hesabını ${actionLabel} istediğine emin misin? ${nextStatus === 'disabled' ? 'Bu üyelikle ofis verilerine erişimi engellenecek.' : 'Danışman tekrar giriş yapabilecek.'}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Onayla', style: 'destructive', onPress: async () => {
          setTeamStatusBusyId(person.id);
          try {
            const firebaseClient = getFirebaseClient();
            const { error } = await firebaseClient
              .from('office_members')
              .update({ status: nextStatus })
              .eq('office_id', officeId)
              .eq('user_id', person.id)
              .eq('role', 'agent');
            if (error) throw error;
            await loadTeamMembers(officeId);
            Alert.alert('Ekip güncellendi', nextStatus === 'disabled' ? 'Danışmanın ofis erişimi kapatıldı.' : 'Danışmanın ofis erişimi yeniden açıldı.');
          } catch (error) {
            Alert.alert('İşlem tamamlanamadı', error instanceof Error ? error.message : 'Üyelik durumu güncellenemedi.');
          } finally {
            setTeamStatusBusyId(null);
          }
        }},
      ],
    );
  };

  const loadCustomerOffers = async (targetOfficeId: string, customerId: string) => {
    try {
      const { data, error } = await getFirebaseClient().from('property_offers').select('*').eq('office_id', targetOfficeId).eq('customer_id', customerId).order('created_at', { ascending: false });
      if (error) throw error;
      setCustomerOffers(data || []);
    } catch (error) {
      setCustomerOffers([]);
      Alert.alert('Teklifler yüklenemedi', error instanceof Error ? error.message : 'Teklif kayıtları alınamadı; property_offers tablosunu kontrol edin.');
    }
  };

  const addCustomerActivityForOffer = async (summary: string) => {
    if (!selectedCustomer) return;
    const { error } = await getFirebaseClient().from('customer_activities').insert({
      office_id: officeId, customer_id: selectedCustomer.id, created_by: getFirebaseAuth().currentUser?.uid || null,
      activity_type: 'note', summary, occurred_at: new Date().toISOString()
    });
    if (error) throw error;
  };

  const addCustomerOffer = async () => {
    const amount = Number(offerAmount.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!selectedCustomer || !offerPropertyId || !offerAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Eksik bilgi', 'Portföy seç ve geçerli teklif tutarı gir.');
      return;
    }
    setOfferBusy(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await getFirebaseClient().from('property_offers').insert({
        office_id: officeId, customer_id: selectedCustomer.id, property_id: offerPropertyId,
        amount, status: offerStatus, notes: offerNotes.trim() || null,
        created_by: getFirebaseAuth().currentUser?.uid || null, created_at: now, updated_at: now
      }).select('*').single();
      if (error) throw error;
      setCustomerOffers(current => [data, ...current]);
      await addCustomerActivityForOffer('Teklif kaydedildi: ' + (properties.find(p => p.id === offerPropertyId)?.title || 'Portföy') + ' · ' + money(amount) + ' · ' + offerStatus);
      setOfferAmount(''); setOfferNotes(''); setOfferStatus('pending');
      Alert.alert('Teklif kaydedildi', 'Teklif müşteri geçmişine eklendi.');
    } catch (error) {
      Alert.alert('Teklif kaydedilemedi', error instanceof Error ? error.message : 'Teklif kaydı oluşturulamadı. Veri tabanı şemasını kontrol edin.');
    } finally { setOfferBusy(false); }
  };

  const updateOfferStatus = async (offer: any, status: 'pending'|'countered'|'accepted'|'rejected') => {
    if (offerStatusBusyId) return;
    setOfferStatusBusyId(offer.id);
    try {
      const { error } = await getFirebaseClient().from('property_offers').update({ status, updated_at: new Date().toISOString() }).eq('id', offer.id).eq('office_id', officeId);
      if (error) throw error;
      setCustomerOffers(current => current.map(item => item.id === offer.id ? { ...item, status, updated_at: new Date().toISOString() } : item));
    } catch (error) {
      Alert.alert('Teklif güncellenemedi', error instanceof Error ? error.message : 'Teklif durumu güncellenemedi.');
    } finally { setOfferStatusBusyId(null); }
  };

  const openCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerOffers([]); setOfferPropertyId(''); setOfferAmount(''); setOfferNotes('');
    await loadCustomerOffers(officeId, customer.id);
    setEditCustomerName(customer.fullName);
    setEditCustomerPhone(customer.phone);
    setEditCustomerNotes(customer.notes);
    setEditFollowUpAt(customer.nextFollowUpAt ? new Date(customer.nextFollowUpAt).toISOString().slice(0,16).replace('T',' ') : '');
    setCustomerDetailOpen(true);
    setCustomerRequirementsLoading(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('customer_requirements')
        .select('id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,must_have,notes,is_active,created_at')
        .eq('customer_id', customer.id).order('created_at', { ascending: false });
      if (error) throw error;
      setCustomerRequirements(data || []);
      const { data: activities, error: activityError } = await firebaseClient.from('customer_activities')
        .select('id,activity_type,summary,occurred_at,created_by')
        .eq('customer_id', customer.id).order('occurred_at', { ascending: false }).limit(50);
      if (activityError) throw activityError;
      setCustomerActivities(activities || []);
      const { data: appointments, error: appointmentError } = await firebaseClient.from('appointments')
        .select('id,title,starts_at,ends_at,location,notes,status')
        .eq('customer_id', customer.id).order('starts_at', { ascending: true }).limit(50);
      if (appointmentError) throw appointmentError;
      setCustomerAppointments(appointments || []);
    } catch (error) {
      setCustomerRequirements([]);
      Alert.alert('Talepler yüklenemedi', error instanceof Error ? error.message : 'Müşteri talepleri yüklenemedi.');
    } finally {
      setCustomerRequirementsLoading(false);
    }
  };

  const addCustomerAppointment = async () => {
    if (!selectedCustomer || !appointmentStartsAt.trim()) {
      Alert.alert('Tarih eksik', 'Randevu tarih ve saatini YYYY-MM-DD SS:DD biçiminde gir.');
      return;
    }
    const parsedDate = new Date(appointmentStartsAt.trim().replace(' ', 'T') + (appointmentStartsAt.trim().length === 16 ? ':00' : ''));
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Tarih hatalı', 'Randevu tarih ve saatini YYYY-MM-DD SS:DD biçiminde gir.');
      return;
    }
    setAppointmentBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('appointments').insert({
        office_id: officeId, customer_id: selectedCustomer.id, assigned_agent_id: selectedCustomer.assignedAgentId,
        title: appointmentTitle.trim() || 'Müşteri görüşmesi', starts_at: parsedDate.toISOString(),
        notes: appointmentNotes.trim(), status: 'scheduled',
      }).select('id,title,starts_at,ends_at,location,notes,status').single();
      if (error) throw error;
      setCustomerAppointments(current => [...current, data].sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));
      setAppointmentStartsAt(''); setAppointmentNotes('');
      Alert.alert('Randevu oluşturuldu', 'Randevu müşteri detayına kaydedildi.');
    } catch (error) {
      Alert.alert('Randevu oluşturulamadı', error instanceof Error ? error.message : 'Randevu kaydedilemedi.');
    } finally { setAppointmentBusy(false); }
  };

  const addCustomerActivity = async () => {
    if (!selectedCustomer || !activitySummary.trim()) {
      Alert.alert('Not eksik', 'Görüşme veya takip notunu yaz.');
      return;
    }
    setActivityBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data: userResult, error: userError } = await firebaseClient.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı.');
      const { data, error } = await firebaseClient.from('customer_activities').insert({
        office_id: officeId, customer_id: selectedCustomer.id, created_by: userResult.user.id,
        activity_type: activityType, summary: activitySummary.trim(), occurred_at: new Date().toISOString(),
      }).select('id,activity_type,summary,occurred_at,created_by').single();
      if (error) throw error;
      setCustomerActivities(current => [data, ...current]);
      setActivitySummary('');
      Alert.alert('Kayıt eklendi', 'Müşteri görüşme geçmişine eklendi.');
    } catch (error) {
      Alert.alert('Kayıt eklenemedi', error instanceof Error ? error.message : 'Aktivite kaydedilemedi.');
    } finally { setActivityBusy(false); }
  };

  const addRequirementForSelectedCustomer = async () => {
    if (!selectedCustomer) return;
    const maxPrice = Number(requirementMaxPrice.replace(/[^0-9]/g, ''));
    if (!requirementDistrict.trim() && !requirementCity.trim() && !requirementMaxPrice.trim() && !requirementRooms.trim()) {
      Alert.alert('Arama kriteri eksik', 'En azından konum, bütçe veya oda kriterlerinden birini gir.');
      return;
    }
    setCustomerEditBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('customer_requirements').insert({
        office_id: officeId, customer_id: selectedCustomer.id, intent: requirementIntent,
        property_type: requirementType, city: requirementCity.trim(), district: requirementDistrict.trim(),
        max_price: maxPrice > 0 ? maxPrice : null,
        rooms: requirementRooms.trim() ? [requirementRooms.trim()] : [], is_active: true,
      }).select('id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,must_have,notes,is_active,created_at').single();
      if (error) throw error;
      setCustomerRequirements(current => [data, ...current]);
      const { error: matchingError } = await firebaseClient.functions.invoke('evaluate-matches', { body: { officeId, customerId: selectedCustomer.id } });
      await loadMatches(officeId);
      await loadCustomers(officeId);
      if (matchingError) Alert.alert('Eşleştirme beklemede', 'Talep kaydedildi ancak otomatik eşleştirme çalışmadı. Edge Function ve migration kurulumu kontrol edilmeli.');
      setRequirementIntent('sale'); setRequirementType('apartment'); setRequirementCity('Muğla');
      setRequirementDistrict(''); setRequirementMaxPrice(''); setRequirementRooms('');
      Alert.alert('Talep eklendi', 'Müşteriye yeni arama talebi kaydedildi.');
    } catch (error) {
      Alert.alert('Talep eklenemedi', error instanceof Error ? error.message : 'Arama talebi kaydedilemedi.');
    } finally { setCustomerEditBusy(false); }
  };

  const updateCustomer = async () => {
    if (!selectedCustomer || !editCustomerName.trim()) {
      Alert.alert('Eksik bilgi', 'Müşteri adı boş bırakılamaz.');
      return;
    }
    if (editFollowUpAt.trim() && Number.isNaN(new Date(editFollowUpAt.trim().replace(' ', 'T') + (editFollowUpAt.trim().length === 16 ? ':00' : '')).getTime())) {
      Alert.alert('Tarih hatalı', 'Takip tarihini YYYY-MM-DD SS:DD biçiminde gir.');
      return;
    }
    setCustomerEditBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { error } = await firebaseClient.from('customers').update({
        full_name: editCustomerName.trim(),
        phone: editCustomerPhone.trim(),
        notes: editCustomerNotes.trim(),
        next_follow_up_at: editFollowUpAt.trim() ? new Date(editFollowUpAt.trim().replace(' ', 'T') + (editFollowUpAt.trim().length === 16 ? ':00' : '')).toISOString() : null,
      }).eq('id', selectedCustomer.id).eq('office_id', officeId);
      if (error) throw error;
      await loadCustomers(officeId);
      setSelectedCustomer((current: any) => current ? {...current, fullName: editCustomerName.trim(), phone: editCustomerPhone.trim(), notes: editCustomerNotes.trim(), nextFollowUpAt: editFollowUpAt.trim() || null} : current);
      Alert.alert('Kaydedildi', 'Müşteri bilgileri güncellendi.');
    } catch (error) {
      Alert.alert('Güncellenemedi', error instanceof Error ? error.message : 'Müşteri bilgileri kaydedilemedi.');
    } finally {
      setCustomerEditBusy(false);
    }
  };

  const saveCustomer = async () => {
    if (!customerName.trim()) { Alert.alert('Eksik bilgi', 'Müşterinin adını gir.'); return; }
    if (customerRoles.length === 0) { Alert.alert('Müşteri türü', 'En az bir müşteri rolü seç.'); return; }
    setCustomerBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data: userResult, error: userError } = await firebaseClient.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const { data: customer, error } = await firebaseClient.from('customers').insert({ office_id: officeId, assigned_agent_id: userResult.user.id, created_by: userResult.user.id, full_name: customerName.trim(), phone: customerPhone.trim(), roles: customerRoles, notes: customerNotes.trim() }).select('id').single();
      if (error || !customer) throw new Error(error?.message || 'Müşteri kaydedilemedi. Migration 003 ve RLS ayarlarını kontrol et.');
      const maxPrice = Number(requirementMaxPrice.replace(/[^0-9]/g, ''));
      const hasRequirement = !!(requirementIntent !== 'sale' || requirementDistrict.trim() || requirementMaxPrice.trim() || requirementRooms.trim() || requirementType !== 'apartment' || requirementCity.trim() !== 'Muğla');
      if (hasRequirement) {
        const { error: requirementError } = await firebaseClient.from('customer_requirements').insert({ office_id: officeId, customer_id: customer.id, intent: requirementIntent, property_type: requirementType, city: requirementCity.trim(), district: requirementDistrict.trim(), max_price: maxPrice > 0 ? maxPrice : null, rooms: requirementRooms.trim() ? [requirementRooms.trim()] : [], is_active: true });
        if (requirementError) throw new Error('Müşteri kaydedildi ancak arama talebi kaydedilemedi: ' + requirementError.message);
      }
      await loadCustomers(officeId);
      let matchWarning = '';
      if (hasRequirement) {
        const { error: matchingError } = await firebaseClient.functions.invoke('evaluate-matches', { body: { officeId, customerId: customer.id } });
        if (matchingError) matchWarning = ' Eşleştirme şu an çalışmadı; Edge Function ve migration kurulumu kontrol edilmeli.';
        else await loadMatches(officeId);
      }
      setCustomerModalOpen(false); setCustomerName(''); setCustomerPhone(''); setCustomerRoles(['buyer']); setCustomerNotes(''); setRequirementIntent('sale'); setRequirementType('apartment'); setRequirementCity('Muğla'); setRequirementDistrict(''); setRequirementMaxPrice(''); setRequirementRooms('');
      Alert.alert('Müşteri kaydedildi', hasRequirement ? 'Müşteri ve arama talebi kaydedildi.' + matchWarning : 'Müşteri kaydedildi. İstersen daha sonra arama talebi ekleyebilirsin.');
    } catch (error) { Alert.alert('Müşteri kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.'); }
    finally { setCustomerBusy(false); }
  };

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      setAuthBusy(true);
      try {
        const result = await restoreUsernameSession();
        if (!result || cancelled) return;
        setRole(result.role);
        if (result.role !== 'superadmin') {
          setOfficeId(result.officeId);
          await Promise.all([
            loadProperties(result.officeId),
            loadCustomers(result.officeId),
            loadMatches(result.officeId),
            loadNotifications(result.officeId),
            ...(result.role === 'owner' ? [loadTeamMembers(result.officeId)] : []),
          ]);
          if (cancelled) return;
          setMustChangePassword(result.mustChangePassword);
        }
        if (!cancelled) setAuthenticated(true);
      } catch (error) {
        if (!cancelled) setAuthError('Oturum kontrol edilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.');
      } finally {
        if (!cancelled) setAuthBusy(false);
      }
    };
    void restoreSession();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async () => {
    setAuthBusy(true); setAuthError('');
    try {
      const result = await signInWithUsername(loginUsername, loginPassword);
      setRole(result.role);
      if (result.role === 'superadmin') {
        setAuthenticated(true);
        setLoginPassword('');
        return;
      }
      setOfficeId(result.officeId);
      await loadProperties(result.officeId);
      await loadCustomers(result.officeId);
      await loadMatches(result.officeId);
      await loadNotifications(result.officeId);
      if (result.role === 'owner') await loadTeamMembers(result.officeId);
      setMustChangePassword(result.mustChangePassword);
      setAuthenticated(true);
      setLoginPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Giriş yapılamadı.');
    } finally { setAuthBusy(false); }
  };

  const handleInitialPasswordChange = async () => {
    setAuthError('');
    if (newPassword !== confirmPassword) { setAuthError('Şifreler eşleşmiyor.'); return; }
    setAuthBusy(true);
    try {
      await changeInitialPassword(newPassword);
      setMustChangePassword(false); setNewPassword(''); setConfirmPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Şifre değiştirilemedi.');
    } finally { setAuthBusy(false); }
  };

  const openProfile = async () => {
    const uid = getFirebaseAuth().currentUser?.uid; if (!uid) { Alert.alert('Oturum bulunamadı', 'Lütfen yeniden giriş yap.'); return; }
    setProfileBusy(true);
    try { const client = getFirebaseClient(); const { data, error } = await client.from('profiles').select('phone,email,avatar_path').eq('id', uid).maybeSingle(); if (error) throw new Error('Profil bilgileri alınamadı.');
      setProfilePhone(data?.phone || ''); setProfileEmail(data?.email || ''); setProfileAvatarPath(data?.avatar_path || null); setProfileAvatarUri(null);
      if (data?.avatar_path) { const { data: signed } = await client.storage.from('avatars').createSignedUrl(data.avatar_path, 3600); setProfileAvatarUrl(signed?.signedUrl || null); } else setProfileAvatarUrl(null); setProfileModalOpen(true);
    } catch (error) { Alert.alert('Profil açılamadı', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); } finally { setProfileBusy(false); }
  };
  const chooseProfileAvatar = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { Alert.alert('Fotoğraf izni gerekli', 'Profil fotoğrafı seçmek için galeri izni vermelisin.'); return; } const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.82 }); if (!result.canceled && result.assets[0]) setProfileAvatarUri(result.assets[0].uri); };
  const handleProfilePasswordChange = async () => {
    if (!currentPassword || !profileNewPassword || !profileConfirmPassword) { Alert.alert('Eksik bilgi', 'Tüm şifre alanlarını doldur.'); return; }
    if (profileNewPassword.length < 10) { Alert.alert('Şifre kısa', 'Yeni şifre en az 10 karakter olmalı.'); return; }
    if (profileNewPassword !== profileConfirmPassword) { Alert.alert('Şifreler eşleşmiyor', 'Yeni şifre ve tekrar alanları aynı olmalı.'); return; }
    if (currentPassword === profileNewPassword) { Alert.alert('Yeni şifre gerekli', 'Yeni şifren mevcut şifrenle aynı olamaz.'); return; }
    setPasswordBusy(true);
    try {
      await changePasswordWithCurrent(currentPassword, profileNewPassword);
      setCurrentPassword(''); setProfileNewPassword(''); setProfileConfirmPassword('');
      Alert.alert('Şifre değiştirildi', 'Hesap şifren başarıyla güncellendi.');
    } catch (error) { Alert.alert('Şifre değiştirilemedi', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); }
    finally { setPasswordBusy(false); }
  };

  const saveProfile = async () => {
    const uid = getFirebaseAuth().currentUser?.uid; if (!uid) { Alert.alert('Oturum bulunamadı', 'Lütfen yeniden giriş yap.'); return; }
    if (profileEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())) { Alert.alert('E-posta hatalı', 'Geçerli bir e-posta adresi gir.'); return; }
    setProfileBusy(true); try { const client = getFirebaseClient(); let avatarPath = profileAvatarPath;
      if (profileAvatarUri) { const response = await fetch(profileAvatarUri); const blob = await response.blob(); const ext = profileAvatarUri.toLowerCase().split('?')[0].endsWith('.png') ? 'png' : 'jpg'; avatarPath = (officeId || uid) + '/' + uid + '-profile-' + Date.now() + '.' + ext; const { error: uploadError } = await client.storage.from('avatars').upload(avatarPath, blob, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false }); if (uploadError) throw new Error('Fotoğraf yüklenemedi. Firebase Storage kurallarını kontrol et.'); }
      const { error } = await client.from('profiles').update({ phone: profilePhone.trim(), email: profileEmail.trim(), avatar_path: avatarPath || null, updated_at: new Date().toISOString() }).eq('id', uid); if (error) throw new Error('Profil kaydedilemedi. Firestore profil güncelleme kurallarını kontrol et.');
      setProfileAvatarPath(avatarPath || null); setProfileAvatarUri(null); if (avatarPath) { const { data: signed } = await client.storage.from('avatars').createSignedUrl(avatarPath, 3600); setProfileAvatarUrl(signed?.signedUrl || null); }
      Alert.alert('Profil kaydedildi', 'Profil bilgilerin güncellendi ve PDF sunumlarında kullanılacak.'); setProfileModalOpen(false);
    } catch (error) { Alert.alert('Profil kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); } finally { setProfileBusy(false); }
  };

  const chooseAgentAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Fotoğraf izni gerekli', 'Danışman fotoğrafı seçmek için galeri izni vermelisin.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.82 });
    if (!result.canceled && result.assets[0]) setAgentAvatarUri(result.assets[0].uri);
  };

  const createAgent = async () => {
    if (!agentName.trim() || !agentUsername.trim() || !agentPassword) { Alert.alert('Eksik bilgi', 'Danışman adı, kullanıcı adı ve ilk şifre zorunlu.'); return; }
    if (agentPassword.length < 10) { Alert.alert('Şifre çok kısa', 'İlk şifre en az 10 karakter olmalı.'); return; }
    setAgentBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      let avatarPath: string | null = null;
      if (agentAvatarUri) {
        const response = await fetch(agentAvatarUri);
        const blob = await response.blob();
        const ext = agentAvatarUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
        avatarPath = officeId + '/agent-' + Date.now() + '.' + ext;
        const { error: uploadError } = await firebaseClient.storage.from('avatars').upload(avatarPath, blob, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false });
        if (uploadError) throw new Error('Fotoğraf yüklenemedi. Firebase Storage hizmetinin etkin olduğunu ve kuralların yayınlandığını kontrol edin.');
      }
      // Create the agent with a secondary Firebase app so the current owner/superadmin
      // session is not replaced. This path works without paid Cloud Functions.
      const mainApp = getFirebaseApp();
      const secondaryApp = initializeApp(mainApp.options, 'agent-creation-' + Date.now());
      let agentUid = '';
      try {
        const secondaryAuth = (await import('firebase/auth')).getAuth(secondaryApp);
        const credential = await createUserWithEmailAndPassword(
          secondaryAuth,
          agentUsername.trim().toLowerCase() + '@accounts.gayit.invalid',
          agentPassword
        );
        agentUid = credential.user.uid;
        const db = getFirestore(mainApp);
        const now = new Date().toISOString();
        await setDoc(doc(db, 'profiles', agentUid), {
          username: agentUsername.trim().toLowerCase(),
          full_name: agentName.trim(),
          office_id: officeId,
          avatar_path: avatarPath,
          account_status: 'active',
          must_change_password: true,
          created_at: now
        });
        await setDoc(doc(db, 'office_members', agentUid), {
          office_id: officeId,
          role: 'agent',
          status: 'active',
          created_at: now,
          created_by: getFirebaseAuth().currentUser?.uid || ''
        });
      } finally {
        await deleteApp(secondaryApp).catch(() => {});
      }
      await loadTeamMembers(officeId);
      Alert.alert('Danışman eklendi', agentName.trim() + ' için hesap oluşturuldu. İlk girişte şifresini değiştirmesi gerekecek.');
      setAgentModalOpen(false); setAgentName(''); setAgentUsername(''); setAgentPassword(''); setAgentAvatarUri(null);
    } catch (error) {
      Alert.alert('Hesap oluşturulamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally { setAgentBusy(false); }
  };

  const handleSignOut = async () => {
    const { getFirebaseClient } = await import('./src/lib/firebaseClient');
    await getFirebaseClient().auth.signOut();
    setAuthenticated(false); setMustChangePassword(false); setLoginPassword(''); setNewPassword(''); setConfirmPassword(''); setSuperadminOfficeMode(false);
  };

  const updatePropertyStatus = async (nextStatus: PropertyStatus) => {
    if (!selected || propertyStatusBusy) return;
    if (role === 'agent' && selected.ownerAgentId !== getFirebaseAuth().currentUser?.uid) { Alert.alert('İşlem yetkisi yok', 'Yalnızca kendi ilanlarının durumunu değiştirebilirsin.'); return; }
    const statusMap: Record<PropertyStatus, string> = { 'Aktif': 'active', 'Opsiyonlu': 'optioned', 'Satıldı': 'sold', 'Kiralandı': 'rented', 'Arşivde': 'archived' };
    setPropertyStatusBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { error } = await firebaseClient.from('properties').update({ status: statusMap[nextStatus] }).eq('id', selected.id).eq('office_id', officeId);
      if (error) throw error;
      setProperties(current => current.map(p => p.id === selected.id ? {...p, status: nextStatus} : p));
      setSelected((current: Property | null) => current && current.id === selected.id ? {...current, status: nextStatus} : current);
      Alert.alert('Durum güncellendi', 'İlan durumu: ' + nextStatus);
      await loadProperties(officeId);
    } catch (error) {
      Alert.alert('Güncellenemedi', error instanceof Error ? error.message : 'İlan durumu değiştirilemedi.');
    } finally { setPropertyStatusBusy(false); }
  };

  const openPropertyEditor = (p: Property) => {
    const currentUid = getFirebaseAuth().currentUser?.uid;
    if (role === 'agent' && p.ownerAgentId !== currentUid) { Alert.alert('Düzenleme yetkisi yok', 'Ofis ilanlarını görebilirsin ancak yalnızca kendi eklediğin ilanları düzenleyebilirsin.'); return; }
    setPendingPhotoUris([]);
    setEditingPropertyId(p.id);
    setTitle(p.title); setAddress(p.address); setPrice(String(p.price)); setArea(p.area.replace(/[^0-9.]/g, ''));
    setKind(p.kind); setRooms(p.rooms || '3+1'); setDescription(p.description || '');
    setBathrooms(p.bathrooms || ''); setBalcony(p.balcony || 'Belirtilmedi');
    setParking(p.parking || 'Belirtilmedi'); setHeating(p.heating || 'Belirtilmedi');
    setCooling(p.cooling || 'Belirtilmedi'); setOccupancyPermit(p.occupancyPermit || 'Belirtilmedi');
    setElevator(p.elevator || 'Belirtilmedi'); setNearbyAmenities(p.nearbyAmenities || '');
    setBuildingAge(p.buildingAge || ''); setFloorNumber(p.floorNumber || ''); setTotalFloors(p.totalFloors || '');
    // Contact fields are loaded separately from the private property record.
    void (async () => {
      const client = getFirebaseClient();
      const { data } = await client.from('properties').select('owner_contact_name,owner_contact_phone').eq('id', p.id).maybeSingle();
      setOwnerContactName(data?.owner_contact_name || '');
      setOwnerContactPhone(data?.owner_contact_phone || '');
    })();
    setPropertyType(p.propertyType || 'apartment'); setSelected(null); setAddOpen(true);
  };

  const archiveProperty = async () => {
    if (!selected || archiveBusy) return;
    if (role === 'agent' && selected.ownerAgentId !== getFirebaseAuth().currentUser?.uid) { Alert.alert('İşlem yetkisi yok', 'Yalnızca kendi ilanlarını arşivleyebilirsin.'); return; }
    Alert.alert('Portföyü arşivle', 'Bu ilan aktif portföy listesinden çıkarılacak. Devam edilsin mi?', [
      {text:'Vazgeç',style:'cancel'},
      {text:'Arşivle',style:'destructive',onPress:async()=>{
        if (archiveBusy) return;
        setArchiveBusy(true);
        try {
          const firebaseClient=getFirebaseClient();
          const {error}=await firebaseClient.from('properties').update({status:'archived'}).eq('id',selected.id).eq('office_id',officeId);
          if(error) throw error;
          setSelected(null); await loadProperties(officeId);
          Alert.alert('Arşivlendi','Portföy arşivlendi.');
        } catch(error) { Alert.alert('Arşivlenemedi',error instanceof Error?error.message:'Tekrar deneyin.'); }
        finally { setArchiveBusy(false); }
      }}
    ]);
  };

  const choosePropertyPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Galeri izni gerekli', 'İlan fotoğrafı seçmek için galeri izni vermelisin.'); return; }
    const remaining = Math.max(0, 12 - pendingPhotoUris.length);
    if (remaining === 0) { Alert.alert('Fotoğraf sınırı', 'Bir ilana en fazla 12 fotoğraf ekleyebilirsin.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.82 });
    if (result.canceled) return;
    setPendingPhotoUris(current => [...current, ...result.assets.map(asset => ({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName }))].slice(0, 12));
  };

  const uploadPendingPropertyPhotos = async (propertyId: string) => {
    if (!pendingPhotoUris.length) return;
    const firebaseClient = getFirebaseClient();
    const { data: existing, error: listError } = await firebaseClient.from('property_photos').select('id').eq('property_id', propertyId);
    if (listError) throw new Error('Mevcut ilan fotoğrafları kontrol edilemedi: ' + listError.message);
    let sortOrder = (existing || []).length;
    for (const photo of pendingPhotoUris) {
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const isPng = photo.mimeType === 'image/png' || (photo.fileName || '').toLowerCase().endsWith('.png');
      const ext = isPng ? 'png' : 'jpg';
      const storagePath = officeId + '/' + propertyId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      const { error: uploadError } = await firebaseClient.storage.from('property-photos').upload(storagePath, blob, { contentType: isPng ? 'image/png' : 'image/jpeg', upsert: false });
      if (uploadError) throw new Error('Fotoğraf depolamaya yüklenemedi: ' + uploadError.message);
      const { error: rowError } = await firebaseClient.from('property_photos').insert({ property_id: propertyId, office_id: officeId, storage_path: storagePath, sort_order: sortOrder });
      if (rowError) {
        await firebaseClient.storage.from('property-photos').remove([storagePath]);
        throw new Error('Fotoğraf kaydı oluşturulamadı: ' + rowError.message);
      }
      sortOrder += 1;
    }
    setPendingPhotoUris([]);
  };

  const saveProperty = async () => {
    if (propertyBusy) return;
    if (editingPropertyId) { const existing = properties.find(p => p.id === editingPropertyId); if (role === 'agent' && existing?.ownerAgentId !== getFirebaseAuth().currentUser?.uid) { Alert.alert('Düzenleme yetkisi yok', 'Yalnızca kendi ilanlarını düzenleyebilirsin.'); return; } }
    const cleanTitle = title.trim();
    const cleanAddress = address.trim();
    const priceDigits = price.replace(/[^0-9]/g, '');
    const numericPrice = Number(priceDigits);
    const normalizedArea = area.trim().replace(',', '.');
    const numericArea = Number(normalizedArea);
    if (!cleanTitle || !cleanAddress || !price.trim() || !area.trim()) {
      Alert.alert('Eksik bilgi', 'İlan başlığı, açık adres, fiyat ve metrekare zorunludur.');
      return;
    }
    if (cleanTitle.length < 4 || cleanTitle.length > 120) {
      Alert.alert('Başlığı kontrol et', 'İlan başlığı 4–120 karakter arasında olmalı.');
      return;
    }
    if (cleanAddress.length < 8 || cleanAddress.length > 250) {
      Alert.alert('Adresi kontrol et', 'Açık adres 8–250 karakter arasında olmalı.');
      return;
    }
    if (!/^\d+$/.test(priceDigits) || !Number.isSafeInteger(numericPrice) || numericPrice <= 0) {
      Alert.alert('Fiyatı kontrol et', 'Fiyat sıfırdan büyük, geçerli bir TL tutarı olmalı. Örnek: 4250000');
      return;
    }
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(area.trim()) || !Number.isFinite(numericArea) || numericArea <= 0 || numericArea > 1000000) {
      Alert.alert('Metrekareyi kontrol et', 'Metrekare sıfırdan büyük olmalı. Ondalık değer için virgül kullanabilirsin (ör. 145,5).');
      return;
    }
    setPropertyBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data: userResult, error: userError } = await firebaseClient.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const parts = address.split(',').map((part) => part.trim());
      const payload = {
        title: cleanTitle, address: cleanAddress,
        district: parts.length > 1 ? parts[parts.length - 2] : '',
        city: parts.length > 0 ? parts[parts.length - 1] : '',
        price: numericPrice, rooms, property_type: propertyType, area_m2: numericArea,
        listing_type: kind === 'Kiralık' ? 'rent' : 'sale', description: description.trim(),
        bathrooms: bathrooms.trim() ? Number(bathrooms) : null, balcony, parking, heating, cooling,
        occupancy_permit: occupancyPermit, elevator, nearby_amenities: nearbyAmenities.trim() || null,
        building_age: buildingAge.trim() ? Number(buildingAge) : null,
        floor_number: floorNumber.trim() ? Number(floorNumber) : null,
        total_floors: totalFloors.trim() ? Number(totalFloors) : null,
        owner_contact_name: ownerContactName.trim() || null,
        owner_contact_phone: ownerContactPhone.trim() || null,
      };
      let savedId = editingPropertyId;
      if (editingPropertyId) {
        const {error}=await firebaseClient.from('properties').update(payload).eq('id',editingPropertyId).eq('office_id',officeId);
        if(error) throw error;
      } else {
        const {data:inserted,error}=await firebaseClient.from('properties').insert({
          ...payload, office_id:officeId, owner_agent_id:userResult.user.id, created_by:userResult.user.id, status:'active',
        }).select('id').single();
        if(error || !inserted) throw new Error('Portföy kaydedilemedi. Ofis yetkilerini ve veritabanı kurulumunu kontrol et.');
        savedId=inserted.id;
      }
      if (savedId && pendingPhotoUris.length) {
        try { await uploadPendingPropertyPhotos(savedId); }
        catch (photoError) { Alert.alert('İlan kaydedildi, fotoğraf yüklemesi tamamlanmadı', photoError instanceof Error ? photoError.message : 'Fotoğrafları ilan detayından tekrar ekleyebilirsin.'); }
      }
      await loadProperties(officeId);
      if(savedId && !editingPropertyId) {
        const {error:matchingError}=await firebaseClient.functions.invoke('evaluate-matches',{body:{officeId,propertyId:savedId}});
        if(!matchingError) await loadMatches(officeId);
        else Alert.alert('Eşleştirme beklemede','Portföy kaydedildi ancak eşleştirme çalışmadı. Edge Function ve migration kurulumu kontrol edilmeli.');
      }
      setAddOpen(false); setEditingPropertyId(null);
      setTitle(''); setAddress(''); setPrice(''); setArea(''); setDescription(''); setPropertyType('apartment'); setPendingPhotoUris([]); setOwnerContactName(''); setOwnerContactPhone('');
      Alert.alert(editingPropertyId?'Portföy güncellendi':'Portföy eklendi',editingPropertyId?'Değişiklikler kaydedildi.':'Yeni portföy kaydedildi.');
    } catch (error) {
      Alert.alert('Portföy kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally {
      setPropertyBusy(false);
    }
  };

  const handleCreateOfficeAsSuperadmin = async () => {
    if (!superOfficeName.trim() || !superOwnerName.trim() || !superOwnerUsername.trim() || superOwnerPassword.length < 10) {
      setSuperResult('Tüm alanları doldur. Ofis sahibi şifresi en az 10 karakter olmalı.');
      return;
    }
    setSuperCreateBusy(true); setSuperResult('');
    try {
      const functions = getFunctions(getFirebaseApp(), 'europe-west1');
      const createOfficeCall = httpsCallable(functions, 'createOffice');
      const response:any = await createOfficeCall({
        officeName: superOfficeName.trim(),
        ownerFullName: superOwnerName.trim(),
        ownerUsername: superOwnerUsername.trim().toLowerCase(),
        ownerPassword: superOwnerPassword
      });
      if (!response.data?.success) throw new Error('Ofis oluşturulamadı.');
      setSuperResult('Ofis oluşturuldu: ' + response.data.office.name + ' · Ofis sahibi kullanıcı adı: ' + response.data.owner.username);
      setSuperOfficeName(''); setSuperOwnerName(''); setSuperOwnerUsername(''); setSuperOwnerPassword('');
    } catch (error) {
      setSuperResult(error instanceof Error ? error.message : 'Ofis oluşturulamadı. Cloud Function dağıtımını kontrol et.');
    } finally { setSuperCreateBusy(false); }
  };

  const handleSuperadminLogout = async () => {
    try { await signOut(getFirebaseAuth()); } catch {}
    setAuthenticated(false); setRole('owner'); setLoginUsername(''); setLoginPassword(''); setSuperResult('');
  };

  if (authenticated && role === 'superadmin') {
    return <SuperadminPanel
      onLogout={handleSuperadminLogout}
      onEnterOffice={async (office) => {
        setOfficeId(office.id);
        setSuperadminOfficeMode(true);
        setRole('owner');
        setTab('home');
        await loadProperties(office.id);
        await loadCustomers(office.id);
        await loadMatches(office.id);
        await loadNotifications(office.id);
        await loadTeamMembers(office.id);
      }}
    />;
  }

  if (!authenticated || mustChangePassword) {
    if (authBusy && !mustChangePassword) return <AnimatedSplash />;
    return <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      <StatusBar barStyle="dark-content" />

      <Modal visible={authenticated && legalReady && !legalAccepted} animationType="slide" onRequestClose={()=>{}}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><View style={{width:40}}/><Text style={styles.modalHeaderTitle}>GAYIT · İlk kullanım</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage}>
            <Text style={styles.eyebrow}>DEVAM ETMEDEN ÖNCE</Text>
            <Text style={styles.pageTitle}>Bilgilendirme ve kullanım koşulları</Text>
            <Text style={styles.pageSub}>İlk kullanımda aşağıdaki metinleri incele. KVKK aydınlatması ile sözleşme kabulü ayrı işlemlerdir.</Text>
            <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('privacy')}><Ionicons name="shield-checkmark-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>KVKK Aydınlatma Metni</Text><Text style={styles.teamRole}>Kişisel verilerin işlenmesine ilişkin bilgilendirme.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
            <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('terms')}><Ionicons name="document-text-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Kullanım Sözleşmesi</Text><Text style={styles.teamRole}>GAYIT kullanım koşulları.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
            <Pressable onPress={()=>setLegalReadPrivacy(v=>!v)} style={{flexDirection:'row',alignItems:'flex-start',gap:10,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:legalReadPrivacy?palette.green:palette.line,borderRadius:13,marginTop:18}}>
              <Ionicons name={legalReadPrivacy?'checkbox':'square-outline'} size={22} color={legalReadPrivacy?palette.green:palette.muted}/>
              <Text style={{flex:1,fontSize:12,lineHeight:18,color:palette.ink}}>KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin işlenmesine ilişkin bilgilendirildim.</Text>
            </Pressable>
            <Pressable onPress={()=>setLegalAcceptTerms(v=>!v)} style={{flexDirection:'row',alignItems:'flex-start',gap:10,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:legalAcceptTerms?palette.green:palette.line,borderRadius:13,marginTop:10}}>
              <Ionicons name={legalAcceptTerms?'checkbox':'square-outline'} size={22} color={legalAcceptTerms?palette.green:palette.muted}/>
              <Text style={{flex:1,fontSize:12,lineHeight:18,color:palette.ink}}>Kullanım Sözleşmesi'ni okudum ve koşullarını kabul ediyorum.</Text>
            </Pressable>
            <Pressable disabled={!legalReadPrivacy||!legalAcceptTerms||legalGateBusy} onPress={confirmLegalAcceptance} style={[styles.saveButton,{opacity:!legalReadPrivacy||!legalAcceptTerms||legalGateBusy?0.45:1}]}><Ionicons name="checkmark-circle-outline" size={20} color="#fff"/><Text style={styles.saveButtonText}>{legalGateBusy?'Kaydediliyor…':'Onayla ve GAYIT’a devam et'}</Text></Pressable>
            <Text style={{fontSize:10,lineHeight:15,color:palette.muted,textAlign:'center',marginTop:6}}>Kabul kaydı bu cihazda kullanıcı hesabına özel saklanır. Metin sürümü değişirse yeniden inceleme istenebilir.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={legalDocument !== null} animationType="slide" onRequestClose={()=>setLegalDocument(null)}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><Pressable onPress={()=>setLegalDocument(null)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle} numberOfLines={1}>{legalDocument ? LEGAL_DOCUMENTS[legalDocument].title : ''}</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage}><Text style={styles.pageTitle}>{legalDocument ? LEGAL_DOCUMENTS[legalDocument].title : ''}</Text><Text style={{fontSize:12,lineHeight:20,color:palette.ink}}>{legalDocument ? LEGAL_DOCUMENTS[legalDocument].body : ''}</Text>{legalDocument==='about'&&<Text style={{fontSize:11,fontWeight:'800',color:palette.navy,textAlign:'center',marginTop:22}}>© 2026 FK Digital. Tüm hakları saklıdır.</Text>}{legalDocument==='privacy'&&<Text style={{fontSize:10,lineHeight:15,color:palette.muted,marginTop:18}}>Bu metin genel taslaktır; gerçek veri akışları ve teknik hizmet yapılandırması doğrulanarak hukuki incelemeden geçirilmelidir.</Text>}</ScrollView>
        </SafeAreaView>
      </Modal>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.authBrandMark}><Ionicons name="business" size={32} color={palette.gold}/></View>
        <Text style={styles.authBrand}>GAYIT<Text style={styles.brandDot}>.</Text></Text>
        <Text style={styles.brandSub}>PORTFÖY YÖNETİMİ</Text>
        <Text style={styles.authTitle}>{mustChangePassword ? 'Yeni şifreni belirle' : 'Tekrar hoş geldin'}</Text>
        <Text style={styles.authSubtitle}>{mustChangePassword ? 'Güvenliğin için ilk giriş şifreni değiştirmen gerekiyor.' : 'Ofis yöneticinin verdiği kullanıcı adı ve şifreyle giriş yap.'}</Text>
        {mustChangePassword ? <>
          <Text style={styles.fieldLabel}>Yeni şifre (en az 10 karakter)</Text>
          <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="Yeni şifren" placeholderTextColor={palette.muted}/>
          <Text style={styles.fieldLabel}>Yeni şifre tekrar</Text>
          <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="Yeni şifreni tekrar gir" placeholderTextColor={palette.muted}/>
          <Pressable disabled={authBusy} onPress={handleInitialPasswordChange} style={[styles.authSubmit,authBusy&&{opacity:0.6}]}><Text style={styles.authSubmitText}>{authBusy?'İşleniyor...':'Şifreyi değiştir'}</Text></Pressable>
        </> : <>
          <Text style={styles.fieldLabel}>Kullanıcı adı</Text>
          <TextInput value={loginUsername} onChangeText={setLoginUsername} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Kullanıcı adın" placeholderTextColor={palette.muted}/>
          <Text style={styles.fieldLabel}>Şifre</Text>
          <TextInput value={loginPassword} onChangeText={setLoginPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="Şifren" placeholderTextColor={palette.muted} onSubmitEditing={handleLogin}/>
          <Pressable disabled={authBusy} onPress={handleLogin} style={[styles.authSubmit,authBusy&&{opacity:0.6}]}><Text style={styles.authSubmitText}>{authBusy?'Giriş yapılıyor...':'Giriş yap'}</Text></Pressable>
          <Text style={styles.authHint}>Hesap oluşturmak için ofis yöneticinle iletişime geç.</Text>
        </>}
        {!!authError && <View style={styles.authError}><Ionicons name="alert-circle-outline" size={18} color={palette.red}/><Text style={styles.authErrorText}>{authError}</Text></View>}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topbar}>
        <View><Text style={styles.brand}>GAYIT<Text style={styles.brandDot}>.</Text></Text><Text style={styles.brandSub}>PORTFÖY YÖNETİMİ</Text></View>
        <Pressable onPress={handleSignOut} style={styles.signOutButton}><Ionicons name="log-out-outline" size={17} color={palette.navy}/><Text style={styles.signOutText}>Çıkış</Text></Pressable>
      </View>

      <View style={styles.body}>
        {tab === 'home' && <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{role === 'owner' ? 'OFİS YÖNETİMİ' : 'ÇALIŞMA ALANIM'}</Text>
          <Text style={styles.pageTitle}>{role === 'owner' ? 'Ofis özeti' : 'Portföyüm'}</Text>
          <Text style={styles.pageSub}>{role === 'owner' ? 'Ekibin ve portföyün tek bakışta.' : 'İlanlarını, performansını ve fırsatlarını yönet.'}</Text>
          <View style={styles.hero}><View style={{ flex: 1 }}><Text style={styles.heroKicker}>GAYIT İŞ ASİSTANI</Text><Text style={styles.heroTitle}>{role === 'owner' ? 'Ofisin kontrol altında.' : 'İyi portföy, doğru sunum.'}</Text><Text style={styles.heroBody}>{role === 'owner' ? 'Ekibin performansını izle, kararlarını veriye dayandır.' : 'Portföyünü hızlıca paylaş, müşterine profesyonel sun.'}</Text></View><View style={styles.heroIcon}><Ionicons name={role === 'owner' ? 'business' : 'key'} size={30} color={palette.gold}/></View></View>
          <Pressable onPress={()=>setTab('customers')} style={{marginTop:16,marginBottom:4,padding:15,borderRadius:16,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><Text style={styles.sectionTitle}>Bugünün müşteri takipleri</Text><Ionicons name="chevron-forward" size={17} color={palette.muted}/></View>
            {customers.filter(c=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()<=new Date(new Date().toDateString()).getTime()+24*60*60*1000).sort((a,b)=>new Date(a.nextFollowUpAt||0).getTime()-new Date(b.nextFollowUpAt||0).getTime()).slice(0,3).map(c=><Pressable key={c.id} onPress={()=>openCustomerDetail(c)} style={{paddingVertical:9,borderTopWidth:1,borderTopColor:palette.line,flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:34,height:34,borderRadius:11,backgroundColor:palette.goldSoft,alignItems:'center',justifyContent:'center'}}><Ionicons name="calendar-outline" size={17} color={palette.navy}/></View><View style={{flex:1}}><Text style={styles.teamName}>{c.fullName}</Text><Text style={styles.teamMeta}>{new Date(c.nextFollowUpAt||'').toLocaleString('tr-TR',{dateStyle:'medium',timeStyle:'short'})}</Text></View><Ionicons name="chevron-forward" size={15} color={palette.muted}/></Pressable>)}
            {!customers.some(c=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()<=new Date(new Date().toDateString()).getTime()+24*60*60*1000)&&<Text style={styles.pageSub}>Bugün veya gecikmiş takip yok. Müşteri detayından takip tarihi ekleyebilirsin.</Text>}
          </Pressable>
          <View style={styles.statGrid}>
            <Stat icon="business-outline" label={role === 'owner' ? 'Toplam portföy' : 'Portföyüm'} value={String(role === 'owner' ? properties.length : properties.filter(p => p.agent === 'Sen').length)} note="Aktif kayıtlar" />
            <Stat icon="eye-outline" label="Görüntülenme" value="—" note="Ölçüm kurulmadı" />
            <Stat icon="checkmark-circle-outline" label="Aktif ilan" value={String(roleProperties.filter(p=>p.status==='Aktif').length)} note="Yayındaki portföy" />
            <Stat icon="people-outline" label={role === 'owner' ? 'Danışmanlar' : 'Müşteriler'} value={String(role === 'owner' ? teamMembers.filter(m=>m.role==='agent').length : customers.length)} note="Gerçek kayıtlar" />
          </View>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{role === 'owner' ? 'Son portföy hareketleri' : 'Portföyümden'}</Text><Pressable onPress={()=>setTab('portfolio')}><Text style={styles.link}>Tümünü gör</Text></Pressable></View>
          {roleProperties.slice(0,3).map(p=><PropertyRow key={p.id} property={p} money={money} onPress={()=>openProperty(p)} />)}
          <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Portföy ve ekip kayıtları Firebase Firestore üzerinden yüklenir. Otomatik eşleştirme için Firebase Functions dağıtılmış olmalıdır; görüntülenme analitiği henüz etkin değil.</Text></View>
        </ScrollView>}

        {tab === 'portfolio' && <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>GAYIT · PORTFÖY</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Portföyler</Text><Text style={styles.pageSub}>{role === 'owner' ? 'Ofisteki tüm gayrimenkuller' : 'Sana ait gayrimenkuller'}</Text></View><View style={{flexDirection:'row',gap:8}}><Pressable onPress={()=>{setPortfolioPresentationMode(v=>!v);setSelectedPresentationIds([]);}} style={[styles.addButton,{backgroundColor:portfolioPresentationMode?palette.green:palette.navy2}]}><Ionicons name="documents-outline" size={22} color="#fff"/></Pressable><Pressable onPress={()=>setAddOpen(true)} style={styles.addButton}><Ionicons name="add" size={25} color="#fff"/></Pressable></View></View>
          <View style={styles.search}><Ionicons name="search-outline" size={19} color={palette.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="İlan, adres veya kod ara" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
          <Text style={[styles.sectionTitle,{marginTop:12,marginBottom:8}]}>Hızlı ilan bul</Text>
          <View style={{flexDirection:'row',gap:8}}>
            {([{key:'type' as const,label:quickTypeFilter==='Tümü'?'Gayrimenkul tipi':quickTypeFilter},{key:'city' as const,label:quickCityFilter==='Tümü'?'Şehir':quickCityFilter},{key:'district' as const,label:quickDistrictFilter==='Tümü'?'Mahalle / ilçe':quickDistrictFilter}]).map(item=><Pressable key={item.key} onPress={()=>setQuickDropdown(item.key)} style={{flex:1,minHeight:44,paddingHorizontal:9,borderRadius:11,borderWidth:1,borderColor:palette.line,backgroundColor:palette.white,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text numberOfLines={1} style={{fontSize:12,color:palette.ink,flexShrink:1}}>{item.label}</Text><Ionicons name="chevron-down" size={16} color={palette.muted}/></Pressable>)}
          </View>
          {(quickTypeFilter!=='Tümü'||quickCityFilter!=='Tümü'||quickDistrictFilter!=='Tümü')&&<Pressable onPress={()=>{setQuickTypeFilter('Tümü');setQuickCityFilter('Tümü');setQuickDistrictFilter('Tümü');}} style={{alignSelf:'flex-start',marginTop:7,paddingVertical:4}}><Text style={{fontSize:12,color:palette.green,fontWeight:'600'}}>Hızlı filtreleri temizle</Text></Pressable>}
          <Modal visible={quickDropdown!==null} transparent animationType="fade" onRequestClose={()=>setQuickDropdown(null)}>
            <Pressable onPress={()=>setQuickDropdown(null)} style={{flex:1,backgroundColor:'rgba(10,22,36,0.45)',justifyContent:'flex-end'}}>
              <Pressable onPress={()=>{}} style={{backgroundColor:palette.white,borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,maxHeight:'72%'}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><Text style={{fontSize:18,fontWeight:'700',color:palette.navy}}>{quickDropdown==='type'?'Gayrimenkul tipi':quickDropdown==='city'?'Şehir seç':'Mahalle / ilçe seç'}</Text><Pressable onPress={()=>setQuickDropdown(null)}><Ionicons name="close" size={23} color={palette.ink}/></Pressable></View>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {['Tümü',...(quickDropdown==='type'?['Daire','Villa','Arsa','İş yeri','Müstakil ev','Diğer']:quickDropdown==='city'?Array.from(new Set(properties.map(p=>p.address.split(',').map(part=>part.trim()).filter(Boolean).slice(-1)[0]).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'tr')):Array.from(new Set(properties.map(p=>p.district||p.address.split(',').map(part=>part.trim()).filter(Boolean).slice(-2)[0]).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'tr')))].map(option=>{
                    const active=quickDropdown==='type'?quickTypeFilter===option:quickDropdown==='city'?quickCityFilter===option:quickDistrictFilter===option;
                    return <Pressable key={option} onPress={()=>{if(quickDropdown==='type')setQuickTypeFilter(option);else if(quickDropdown==='city'){setQuickCityFilter(option);setQuickDistrictFilter('Tümü');}else setQuickDistrictFilter(option);setQuickDropdown(null);}} style={{paddingVertical:13,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:active?palette.goldSoft:palette.white}}><Text style={{fontSize:15,color:palette.ink}}>{option}</Text>{active&&<Ionicons name="checkmark-circle" size={19} color={palette.green}/>}</Pressable>
                  })}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
          <View style={styles.filters}>{(['Tümü','Satılık','Kiralık'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={[styles.filter,filter===f&&styles.filterOn]}><Text style={[styles.filterText,filter===f&&styles.filterTextOn]}>{f}</Text></Pressable>)}</View>
          <View style={[styles.filters,{marginTop:10}]}>{([{key:'newest',label:'En yeni'},{key:'priceAsc',label:'Fiyat ↑'},{key:'priceDesc',label:'Fiyat ↓'}] as const).map(opt=><Pressable key={opt.key} onPress={()=>setSortBy(opt.key)} style={[styles.filter,sortBy===opt.key&&styles.filterOn]}><Text style={[styles.filterText,sortBy===opt.key&&styles.filterTextOn]}>{opt.label}</Text></Pressable>)}</View>
          <Pressable onPress={()=>{setRecentOnly(v=>!v);setFavoritesOnly(false);}} style={[styles.filter,{alignSelf:'flex-start',marginTop:8},recentOnly&&styles.filterOn]}><Text style={[styles.filterText,recentOnly&&styles.filterTextOn]}>{recentOnly?'Son görüntülenenler gösteriliyor':'◷ Son görüntülenenler'}</Text></Pressable>
          <Pressable onPress={()=>setFavoritesOnly(v=>!v)} style={[styles.filter,{alignSelf:'flex-start',marginTop:8},favoritesOnly&&styles.filterOn]}><Text style={[styles.filterText,favoritesOnly&&styles.filterTextOn]}>{favoritesOnly?'♥ Favoriler gösteriliyor':'♡ Yalnızca favorilerim'}</Text></Pressable>
          <Text style={[styles.sectionTitle,{marginTop:14,marginBottom:8}]}>Fiyat aralığı</Text>
          <View style={{flexDirection:'row',gap:10}}>
            <View style={[styles.search,{flex:1,marginTop:0}]}><TextInput value={minPriceFilter} onChangeText={setMinPriceFilter} keyboardType="numeric" placeholder="En düşük ₺" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
            <View style={[styles.search,{flex:1,marginTop:0}]}><TextInput value={maxPriceFilter} onChangeText={setMaxPriceFilter} keyboardType="numeric" placeholder="En yüksek ₺" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
          </View>
          <Text style={[styles.sectionTitle,{marginTop:14,marginBottom:8}]}>İlan durumu</Text>
          <View style={styles.filters}>{(['Tümü','Aktif','Opsiyonlu','Satıldı','Kiralandı'] as const).map(status=><Pressable key={status} onPress={()=>setStatusFilter(status)} style={[styles.filter,statusFilter===status&&styles.filterOn]}><Text style={[styles.filterText,statusFilter===status&&styles.filterTextOn]}>{status}</Text></Pressable>)}</View>
          <Pressable onPress={()=>setShowArchived(v=>!v)} style={[styles.filter,{alignSelf:'flex-start',marginTop:10},showArchived&&styles.filterOn]}><Text style={[styles.filterText,showArchived&&styles.filterTextOn]}>{showArchived ? 'Arşivden çıkış · Aktif portföyleri göster' : 'Arşivlenmiş portföyleri göster'}</Text></Pressable>
          {portfolioPresentationMode && <View style={{backgroundColor:palette.goldSoft,borderRadius:14,padding:13,marginBottom:12}}><Text style={styles.teamName}>Müşteriye özel sunum</Text><Text style={styles.pageSub}>Listeden en az 2 portföy seç. Seçilen ilanlar tek PDF dosyasında, her biri ayrı sayfada hazırlanır.</Text><Text style={[styles.teamRole,{marginTop:6}]}>{selectedPresentationIds.length} portföy seçildi</Text><Pressable disabled={selectedPresentationIds.length<2} onPress={createMultiPropertyPdf} style={[styles.saveButton,{marginTop:10,opacity:selectedPresentationIds.length<2?0.45:1}]}><Text style={styles.saveButtonText}>Tek PDF oluştur ve paylaş</Text><Ionicons name="share-outline" size={19} color="#fff"/></Pressable></View>}<Text style={styles.resultCount}>{propertiesLoading ? 'Portföyler yükleniyor…' : `${visibleProperties.length} portföy`}</Text>

          {visibleProperties.map(p=><View key={p.id} style={{flexDirection:'row',alignItems:'center',gap:4}}>{portfolioPresentationMode&&<Pressable onPress={()=>setSelectedPresentationIds(ids=>ids.includes(p.id)?ids.filter(id=>id!==p.id):[...ids,p.id])} style={{width:38,height:48,alignItems:'center',justifyContent:'center',marginBottom:11}}><Ionicons name={selectedPresentationIds.includes(p.id)?'checkbox':'square-outline'} size={24} color={selectedPresentationIds.includes(p.id)?palette.green:palette.muted}/></Pressable>}<View style={{flex:1}}><PropertyRow property={p} money={money} onPress={()=>portfolioPresentationMode?setSelectedPresentationIds(ids=>ids.includes(p.id)?ids.filter(id=>id!==p.id):[...ids,p.id]):openProperty(p)} /></View>{!portfolioPresentationMode&&<Pressable onPress={()=>toggleFavorite(p)} accessibilityLabel={favoriteIds.includes(p.id)?'Favorilerden çıkar':'Favorilere ekle'} style={{width:40,height:48,alignItems:'center',justifyContent:'center',backgroundColor:palette.white,borderRadius:12,borderWidth:1,borderColor:palette.line,marginBottom:11}}><Ionicons name={favoriteIds.includes(p.id)?'heart':'heart-outline'} size={20} color={favoriteIds.includes(p.id)?palette.red:palette.muted}/></Pressable>}</View>)}
          {!visibleProperties.length && <View style={styles.empty}><Ionicons name="file-tray-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Portföy bulunamadı</Text><Text style={styles.pageSub}>Aramanı değiştir veya yeni ilan ekle.</Text></View>}
        </ScrollView>}

        {tab === 'customers' && <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>GAYIT · MÜŞTERİLER</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Müşteriler</Text><Text style={styles.pageSub}>{role === 'owner' ? 'Ofis müşterileri ve talepleri' : 'Sana atanmış müşteriler ve talepleri'}</Text></View><Pressable onPress={()=>setCustomerModalOpen(true)} style={styles.addButton}><Ionicons name="person-add-outline" size={22} color="#fff"/></Pressable></View>
          <View style={styles.search}><Ionicons name="search-outline" size={19} color={palette.muted}/><TextInput value={customerSearch} onChangeText={setCustomerSearch} placeholder="Müşteri adı veya telefon ara" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
          <Text style={styles.resultCount}>{customersLoading ? 'Müşteriler yükleniyor…' : `${customers.length} müşteri`}</Text>
          {customers.filter(c => `${c.fullName} ${c.phone}`.toLocaleLowerCase('tr-TR').includes(customerSearch.toLocaleLowerCase('tr-TR'))).map(c=><Pressable key={c.id} onPress={()=>openCustomerDetail(c)} style={styles.customerCard}><View style={styles.customerAvatar}><Ionicons name="person-outline" size={22} color={palette.navy}/></View><View style={{flex:1}}><Text style={styles.teamName}>{c.fullName}</Text><Text style={styles.teamMeta}>{c.phone || 'Telefon eklenmemiş'}</Text><Text style={styles.customerRoles}>{c.roles.map(r=>({buyer:'Alıcı',seller:'Satıcı',tenant:'Kiracı',landlord:'Ev sahibi',investor:'Yatırımcı'} as Record<string,string>)[r] || r).join(' · ')}</Text><Text style={styles.teamRole}>{c.requirementCount} arama talebi · {c.assignedAgent}</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>)}
          {!customersLoading && !customers.length && <View style={styles.empty}><Ionicons name="people-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz müşteri yok</Text><Text style={styles.pageSub}>İlk müşterini ekle; ister aynı anda arama kriterlerini de kaydet.</Text><Pressable style={styles.saveButton} onPress={()=>setCustomerModalOpen(true)}><Text style={styles.saveButtonText}>İlk müşteriyi ekle</Text></Pressable></View>}
        </ScrollView>}

        {tab === 'matches' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>GAYIT · AKILLI EŞLEŞME</Text><Text style={styles.pageTitle}>Eşleşmeler</Text><Text style={styles.pageSub}>Tam eşleşmeleri ve esnek alternatifleri ayrı takip et.</Text>
          <View style={styles.matchSection}><Text style={styles.sectionTitle}>Tam eşleşmeler</Text><Text style={styles.pageSub}>Kayıtlı zorunlu kriterleri karşılayan ilanlar.</Text></View>
          {matches.filter((m:any)=>m.match_kind==='exact').map((m:any)=><View key={m.id} style={styles.matchCard}><View style={{flex:1}}><Text style={styles.teamName}>{m.customers?.full_name || 'Müşteri'}</Text><Text style={styles.teamRole}>{m.properties?.title || 'İlan'} · {m.properties?.district || 'Konum belirtilmemiş'}</Text><Text style={styles.teamMeta}>{m.properties?.listing_type==='rent'?'Kiralık':'Satılık'} · {money(Number(m.properties?.price || 0))}</Text><Text style={styles.customerRoles}>{(m.match_reasons || []).join(' · ') || 'Eşleşme gerekçesi eklenmemiş'}</Text></View><View style={styles.matchScore}><Text style={styles.matchScoreText}>{m.match_score == null ? '—' : `${m.match_score}%`}</Text></View></View>)}
          <View style={styles.matchSection}><Text style={styles.sectionTitle}>Alternatifler</Text><Text style={styles.pageSub}>Kriterleri tam karşılamayan fakat makul alternatif olabilecek ilanlar; farklar gerekçelerde açıklanır.</Text></View>
          {matches.filter((m:any)=>m.match_kind==='alternative').map((m:any)=><View key={m.id} style={styles.matchCard}><View style={{flex:1}}><Text style={styles.teamName}>{m.customers?.full_name || 'Müşteri'}</Text><Text style={styles.teamRole}>{m.properties?.title || 'Alternatif ilan'}</Text><Text style={styles.customerRoles}>{(m.match_reasons || []).join(' · ')}</Text></View></View>)}
          {!matchesLoading && !matches.length && <View style={styles.empty}><Ionicons name="git-compare-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz eşleşme yok</Text><Text style={styles.pageSub}>Eşleşmeler kayıtlı müşteri talepleri ve aktif portföyler üzerinden hesaplanır. İlk kurulumda migration 003 ve evaluate-matches Edge Function deploy edilmiş olmalı.</Text></View>}
          {matchesLoading && <Text style={styles.pageSub}>Eşleşmeler yükleniyor…</Text>}
        </ScrollView>}

        {tab === 'more' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>GAYIT · ARAÇLAR</Text><Text style={styles.pageTitle}>Daha Fazla</Text><Text style={styles.pageSub}>Daha seyrek kullandığın ofis ve çalışma araçları.</Text>
          <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('about')}><Ionicons name="information-circle-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>GAYIT hakkında</Text><Text style={styles.teamRole}>Uygulama, özellikler ve destek bilgileri.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('privacy')}><Ionicons name="shield-checkmark-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>KVKK aydınlatma metni</Text><Text style={styles.teamRole}>Kişisel verilerin işlenmesine ilişkin bilgilendirme.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('terms')}><Ionicons name="document-text-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Kullanım sözleşmesi</Text><Text style={styles.teamRole}>Uygulama kullanım koşullarını görüntüle.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          {superadminOfficeMode && <Pressable style={styles.moreCard} onPress={()=>{setSuperadminOfficeMode(false);setRole('superadmin');setTab('home');setOfficeId('');}}><Ionicons name="shield-checkmark-outline" size={23} color={palette.gold}/><View style={{flex:1}}><Text style={styles.teamName}>Süperadmin ana üsse dön</Text><Text style={styles.teamRole}>Ofis yönetiminden çıkıp tüm ofislerin kontrol merkezine dön.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>}
          {role === 'owner' && <Pressable style={styles.moreCard} onPress={()=>setTab('team')}><Ionicons name="people-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Ekip yönetimi</Text><Text style={styles.teamRole}>Danışmanları ve ofis üyelerini yönet.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>}
          <Pressable style={styles.moreCard} onPress={async()=>{setNotificationsOpen(true);await loadNotifications(officeId);}}><Ionicons name="notifications-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Bildirim merkezi {notifications.filter(n=>!n.read_at).length ? '('+notifications.filter(n=>!n.read_at).length+')' : ''}</Text><Text style={styles.teamRole}>Yeni eşleşmeler ve sistem bildirimleri.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={()=>{setTab('portfolio');setRecentOnly(true);setFavoritesOnly(false);void loadRecentViews();}}><Ionicons name="time-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Son görüntülenen portföyler</Text><Text style={styles.teamRole}>Son açtığın ilanları hızlıca bul.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={()=>setCsvImportOpen(true)}><Ionicons name="cloud-upload-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Excel / CSV ile portföy içe aktar</Text><Text style={styles.teamRole}>GAYIT CSV içeriğini yapıştırarak toplu kayıt oluştur.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={openProfile}><Ionicons name="person-circle-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Profilim</Text><Text style={styles.teamRole}>Profil fotoğrafı, cep telefonu ve e-posta adresini düzenle.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={exportPortfolioCsv}><Ionicons name="download-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Portföyü CSV olarak dışa aktar</Text><Text style={styles.teamRole}>Excel uyumlu tabloyu paylaş; yalnızca erişebildiğin portföyler eklenir.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          {role==='owner'&&<Pressable style={styles.moreCard} onPress={()=>{setTransactionPropertyId(properties[0]?.id||'');setTransactionModalOpen(true);}}><Ionicons name="cash-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Satış ve komisyon kaydı</Text><Text style={styles.teamRole}>Gerçekleşen işlemi, ofis ve danışman komisyonunu kaydet.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>}
          <Pressable style={styles.moreCard} onPress={()=>setTab('stats')}><Ionicons name="bar-chart-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>{role==='owner'?'Ofis istatistikleri':'Performansım'}</Text><Text style={styles.teamRole}>Portföy ve operasyon özetleri.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={handleSignOut}><Ionicons name="log-out-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Oturumu kapat</Text><Text style={styles.teamRole}>GAYIT hesabından çıkış yap.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
        </ScrollView>}

        {tab === 'team' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>EKİP YÖNETİMİ</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Danışmanlar</Text><Text style={styles.pageSub}>Ofis ekibinin portföy ve performans özeti.</Text></View><Pressable onPress={()=>setAgentModalOpen(true)} style={styles.addButton}><Ionicons name="person-add-outline" size={22} color="#fff"/></Pressable></View>
          {teamMembers.map((person)=><View key={person.id || person.username} style={[styles.teamCard,person.status==='disabled'&&{opacity:0.72}]}><View style={styles.avatar}>{person.avatarUrl ? <Image source={{uri:person.avatarUrl}} style={styles.avatarImage}/> : <Text style={styles.avatarText}>{person.name.split(/\s+/).map((part:string)=>part[0]).slice(0,2).join('').toLocaleUpperCase('tr-TR')}</Text>}</View><View style={{flex:1}}><Text style={styles.teamName}>{person.name}</Text><Text style={styles.teamRole}>{person.role === 'owner' ? 'Ofis sahibi' : 'Gayrimenkul danışmanı'}{person.role==='agent' ? (person.status==='disabled'?' · Devre dışı':' · Aktif') : ''}</Text><Text style={styles.teamMeta}>@{person.username || 'kullanıcı adı yok'}</Text></View>{person.role==='agent'&&<Pressable disabled={teamStatusBusyId===person.id} onPress={()=>toggleAgentStatus(person)} style={[styles.memberStatusButton,person.status==='disabled'&&styles.memberStatusButtonOn,teamStatusBusyId===person.id&&{opacity:0.5}]}><Text style={[styles.memberStatusButtonText,person.status==='disabled'&&styles.memberStatusButtonTextOn]}>{teamStatusBusyId===person.id?'…':person.status==='active'?'Devre dışı bırak':'Etkinleştir'}</Text></Pressable>}</View>)}
          {!teamMembers.length && <View style={styles.empty}><Ionicons name="people-outline" size={30} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz ekip üyesi yok</Text><Text style={styles.pageSub}>Sağ üstteki butondan ilk danışmanını ekleyebilirsin.</Text></View>}
          <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Ekip üyeleri oturum açmış ofisin veritabanından yüklenir. Firebase Functions dağıtılmış ve Firebase yapılandırması tamamlanmış olmalıdır.</Text></View>        </ScrollView>}

        {tab === 'stats' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>PERFORMANS ANALİZİ</Text><Text style={styles.pageTitle}>{role === 'owner' ? 'Ofis istatistikleri' : 'Performansım'}</Text><Text style={styles.pageSub}>Portföy ve görüntülenme metrikleri.</Text>
          <Pressable onPress={sharePortfolioReport} style={[styles.saveButton,{marginTop:14,marginBottom:16}]}><Ionicons name="share-outline" size={19} color="#fff"/><Text style={styles.saveButtonText}>Portföy raporunu paylaş</Text></Pressable>
          <View style={styles.bigMetric}><Text style={styles.metricLabel}>Toplam portföy değeri</Text><Text style={styles.metricValue}>{money(roleProperties.reduce((sum,p)=>sum+p.price,0))}</Text><Text style={styles.metricFoot}>Satılık ve kiralık ilanların fiyat toplamı; piyasa değeri değildir.</Text></View>
          <View style={styles.statGrid}><Stat icon="home-outline" label="Satılık" value={String(roleProperties.filter(p=>p.kind==='Satılık').length)} note="İlan adedi"/><Stat icon="key-outline" label="Kiralık" value={String(roleProperties.filter(p=>p.kind==='Kiralık').length)} note="İlan adedi"/><Stat icon="people-outline" label="Müşteriler" value={String(customers.filter(c=>c.active).length)} note="Aktif kayıt"/><Stat icon="checkmark-done-outline" label="Tamamlanan" value={String(roleProperties.filter(p=>p.status==='Satıldı'||p.status==='Kiralandı').length)} note="Satış/kiralama"/><Stat icon="calendar-outline" label="Bugünkü takip" value={String(customers.filter(c=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).toDateString()===new Date().toDateString()).length)} note="Müşteri takibi"/><Stat icon="alert-circle-outline" label="Geciken takip" value={String(customers.filter(c=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()<Date.now()&&new Date(c.nextFollowUpAt).toDateString()!==new Date().toDateString()).length)} note="Takip bekliyor"/></View>
          <Text style={styles.sectionTitle}>Satış fırsatı kontrolü</Text><View style={styles.moreCard}><Ionicons name="time-outline" size={22} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Takip bekleyen müşteri</Text><Text style={styles.teamRole}>{customers.filter(c=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()<=Date.now()).length} müşteri için takip tarihi geçmiş veya bugün. Ana sayfadaki takip listesinden müşteriyi açıp sonraki adımı kaydet.</Text></View></View><View style={styles.moreCard}><Ionicons name="calendar-outline" size={22} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Önümüzdeki 7 günün takipleri</Text><Text style={styles.teamRole}>{customers.filter(c=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()>=Date.now()&&new Date(c.nextFollowUpAt).getTime()<=Date.now()+7*24*60*60*1000).length} takip önümüzdeki 7 gün içinde. Müşteri detayından takip tarihini yönet.</Text></View></View><Text style={styles.sectionTitle}>İlan durumları</Text>
          {(['Aktif','Opsiyonlu','Satıldı','Kiralandı','Arşivde'] as PropertyStatus[]).map(status=>{const count=roleProperties.filter(p=>p.status===status).length;return <View key={status} style={styles.progressRow}><Text style={styles.progressLabel}>{status}</Text><View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${roleProperties.length ? count/roleProperties.length*100 : 0}%`,backgroundColor:status==='Aktif'?palette.green:status==='Opsiyonlu'?palette.gold:status==='Arşivde'?palette.muted:palette.navy2}]}/></View><Text style={styles.progressCount}>{count}</Text></View>})}
          {role==='owner'&&<><Text style={styles.sectionTitle}>Danışman bazlı portföy</Text><Text style={styles.pageSub}>Yalnızca veritabanından yüklenen portföy kayıtları sayılır. Görüntülenme verisi ölçülmediği için dahil edilmez.</Text>
          {teamMembers.filter(person=>person.role==='agent').map(person=>{const agentProperties=roleProperties.filter(p=>p.ownerAgentId===person.id);const activeCount=agentProperties.filter(p=>p.status==='Aktif'||p.status==='Opsiyonlu').length;const totalValue=agentProperties.reduce((sum,p)=>sum+p.price,0);return <View key={person.id} style={styles.teamCard}><View style={{flex:1}}><Text style={styles.teamName}>{person.name}</Text><Text style={styles.teamRole}>{agentProperties.length} portföy · {activeCount} aktif/opsiyonlu</Text><Text style={styles.teamMeta}>Fiyat toplamı: {money(totalValue)}</Text></View></View>})}
          {!teamMembers.some(person=>person.role==='agent')&&<View style={styles.empty}><Text style={styles.pageSub}>Danışman verisi bulunamadı.</Text></View>}</>}
        </ScrollView>}
      </View>

      <View style={styles.bottomNav}>{([{key:'home',label:'Ana Sayfa',icon:'grid-outline'},{key:'portfolio',label:'Portföy',icon:'business-outline'},{key:'customers',label:'Müşteriler',icon:'people-outline'},{key:'matches',label:'Eşleşme',icon:'git-compare-outline'},{key:'more',label:'Daha Fazla',icon:'menu-outline'}] as {key:Tab;label:string;icon:keyof typeof Ionicons.glyphMap}[]).map(item=><Pressable key={item.key} onPress={()=>{setTab(item.key);if(item.key==='portfolio'){loadFavorites();loadRecentViews();}}} style={styles.navItem}><View style={[styles.navIcon,tab===item.key&&styles.navIconOn]}><Ionicons name={item.icon} size={20} color={tab===item.key?palette.gold:palette.muted}/></View><Text style={[styles.navLabel,tab===item.key&&styles.navLabelOn]}>{item.label}</Text></Pressable>)}</View>

      <Modal visible={transactionModalOpen} animationType="slide" onRequestClose={()=>{if(!transactionBusy)setTransactionModalOpen(false);}}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><Pressable disabled={transactionBusy} onPress={()=>setTransactionModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={21} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Satış / kiralama kaydı</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageSub}>Gerçekleşmiş bir işlemi kaydet. Kayıt sonrası portföy durumu satıldı/kiralandı olarak güncellenir.</Text>
            <Text style={styles.fieldLabel}>Portföy</Text>
            {properties.filter(p=>p.status!=='Arşivde').map(p=><Pressable key={p.id} onPress={()=>{setTransactionPropertyId(p.id);setTransactionFinalPrice(String(p.price));}} style={[styles.moreCard,{marginTop:7,borderColor:transactionPropertyId===p.id?palette.gold:palette.line,borderWidth:transactionPropertyId===p.id?2:1}]}><Ionicons name={transactionPropertyId===p.id?'radio-button-on':'radio-button-off'} size={19} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>{p.title}</Text><Text style={styles.teamRole}>{p.kind} · {money(p.price)}</Text></View></Pressable>)}
            <Text style={styles.fieldLabel}>Gerçekleşen bedel (TL)</Text><TextInput value={transactionFinalPrice} onChangeText={setTransactionFinalPrice} keyboardType="numeric" style={styles.input} placeholder="Örn. 4250000" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Ofis komisyonu (TL)</Text><TextInput value={transactionOfficeCommission} onChangeText={setTransactionOfficeCommission} keyboardType="numeric" style={styles.input} placeholder="0" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Danışman komisyonu (TL)</Text><TextInput value={transactionAgentCommission} onChangeText={setTransactionAgentCommission} keyboardType="numeric" style={styles.input} placeholder="0" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>İşlem tarihi (YYYY-AA-GG)</Text><TextInput value={transactionDate} onChangeText={setTransactionDate} autoCapitalize="none" style={styles.input} placeholder="2026-10-17" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Notlar</Text><TextInput value={transactionNotes} onChangeText={setTransactionNotes} multiline style={[styles.input,{minHeight:85,textAlignVertical:'top'}]} placeholder="İşleme ait notlar" placeholderTextColor={palette.muted}/>
            <Pressable disabled={transactionBusy} onPress={saveTransaction} style={[styles.saveButton,{marginTop:20,opacity:transactionBusy?0.6:1}]}><Text style={styles.saveButtonText}>{transactionBusy?'Kaydediliyor…':'İşlemi kaydet'}</Text></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={csvImportOpen} animationType="slide" onRequestClose={()=>{if(!csvImportBusy)setCsvImportOpen(false);}}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><Pressable disabled={csvImportBusy} onPress={()=>setCsvImportOpen(false)} style={styles.roundButton}><Ionicons name="close" size={21} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>CSV portföy aktarımı</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageSub}>GAYIT'ın dışa aktardığı CSV içeriğini başlık satırıyla birlikte yapıştır. Ayraç noktalı virgül (;) olmalı. Aktarım mevcut ilanları silmez.</Text>
            <Pressable onPress={pickPortfolioSpreadsheet} style={[styles.moreCard,{marginTop:16,marginBottom:8,borderColor:palette.green,borderWidth:1}]}><Ionicons name="document-attach-outline" size={24} color={palette.green}/><View style={{flex:1}}><Text style={styles.teamName}>Excel / CSV dosyası seç</Text><Text style={styles.teamRole}>.xlsx, .xls veya .csv dosyasını telefondan seç; sütunlar otomatik eşleştirilir.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>{!!excelFileName && <View style={styles.notice}><Ionicons name="checkmark-circle" size={18} color={palette.green}/><Text style={styles.noticeText}>{excelFileName} · {excelPreviewCount} ilan satırı okundu.</Text></View>}<TextInput value={csvImportText} onChangeText={setCsvImportText} multiline textAlignVertical="top" autoCapitalize="none" placeholder={'Portföy başlığı;Tür;İlan tipi;Fiyat;Oda;Alan;İlçe;Adres;Durum;Danışman;Açıklama'} placeholderTextColor={palette.muted} style={[styles.input,{minHeight:230,marginTop:18}]}/>
            <Text style={styles.noticeText}>Her satır yeni portföy oluşturur. Bu sürüm CSV metnini yapıştırır; dosya seçimi ve mevcut kayıtları güncelleme desteklenmez.</Text>
            <Pressable disabled={csvImportBusy} onPress={importPortfolioCsv} style={[styles.saveButton,{marginTop:20,opacity:csvImportBusy?0.6:1}]}><Text style={styles.saveButtonText}>{csvImportBusy?'Aktarılıyor…':'Portföyleri içe aktar'}</Text></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!selected} animationType="slide" onRequestClose={()=>{setSelected(null);setPropertyPhotos([]);}}>
        {selected && <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}><View style={styles.modalHeader}><Pressable onPress={()=>{setSelected(null);setPropertyPhotos([]);}} style={styles.roundButton}><Ionicons name="chevron-down" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>İlan detayı</Text><Text style={styles.code}>{selected.id}</Text></View>
          <ScrollView contentContainerStyle={styles.modalPage}><View style={styles.propertyHero}><View style={styles.houseIcon}><Ionicons name="home" size={52} color={palette.navy2}/></View><View style={styles.statusPill}><Text style={styles.statusText}>{selected.status}</Text></View></View>
          <View style={{marginBottom:18}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><Text style={styles.sectionTitle}>İlan fotoğrafları ({propertyPhotos.length})</Text><Pressable onPress={addPropertyPhoto} disabled={photosBusy} style={[styles.pdfButton,{flex:0,paddingHorizontal:14,paddingVertical:9}]}><Ionicons name="add-circle-outline" size={18} color={palette.navy}/><Text style={styles.pdfButtonText}>{photosBusy ? 'İşleniyor…' : 'Fotoğraf ekle'}</Text></Pressable></View>
  {photosBusy && propertyPhotos.length===0 ? <Text style={styles.noticeText}>Fotoğraflar yükleniyor…</Text> : propertyPhotos.length===0 ? <Text style={styles.noticeText}>Henüz fotoğraf eklenmedi. Galeriden fotoğraf seçerek ilana ekleyebilirsin.</Text> : <View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}>{[...propertyPhotos].sort((a,b)=>a.sortOrder-b.sortOrder).map((photo,index)=><View key={photo.id} style={{width:'48%',height:174,borderRadius:12,overflow:'hidden',backgroundColor:palette.line}}><Image source={{uri:photo.url}} style={{width:'100%',height:145}} resizeMode="cover"/>{index===0&&<View style={{position:'absolute',left:6,top:6,backgroundColor:palette.gold,borderRadius:7,paddingHorizontal:7,paddingVertical:4}}><Text style={{fontSize:9,fontWeight:'900',color:palette.navy}}>KAPAK</Text></View>}<View style={{height:29,flexDirection:'row',alignItems:'center',justifyContent:'space-around',backgroundColor:palette.white}}><Pressable disabled={photosBusy||index===0} onPress={()=>movePropertyPhoto(photo,-1)} style={{paddingHorizontal:8,opacity:index===0||photosBusy?0.3:1}}><Ionicons name="chevron-back" size={16} color={palette.navy}/></Pressable><Text style={{fontSize:9,color:palette.muted}}>{index===0?'Kapak fotoğrafı':String(index+1)+'. fotoğraf'}</Text><Pressable disabled={photosBusy||index===propertyPhotos.length-1} onPress={()=>movePropertyPhoto(photo,1)} style={{paddingHorizontal:8,opacity:index===propertyPhotos.length-1||photosBusy?0.3:1}}><Ionicons name="chevron-forward" size={16} color={palette.navy}/></Pressable><Pressable disabled={photosBusy} onPress={()=>removePropertyPhoto(photo)} style={{paddingHorizontal:8,opacity:photosBusy?0.4:1}}><Ionicons name="trash-outline" size={15} color={palette.red}/></Pressable></View></View>)}</View>}
</View>
<Text style={styles.eyebrow}>{propertyTypeLabel(selected.propertyType).toLocaleUpperCase('tr-TR')} · {selected.kind.toLocaleUpperCase('tr-TR')}</Text><Text style={styles.detailTitle}>{selected.title}</Text><View style={styles.addressLine}><Ionicons name="location-outline" size={18} color={palette.muted}/><Text style={styles.addressText}>{selected.address}</Text></View><Text style={styles.detailPrice}>{money(selected.price)}{selected.kind==='Kiralık'?<Text style={styles.perMonth}> / ay</Text>:null}</Text>
          <View style={styles.featureRow}><Feature icon="bed-outline" label="Oda" value={selected.rooms}/><Feature icon="resize-outline" label="Alan" value={selected.area}/><Feature icon="eye-outline" label="Görüntülenme" value={String(selected.views)}/></View>
          <View style={styles.shareRow}><Pressable style={styles.pdfButton} onPress={()=>openPropertyEditor(selected)}><Ionicons name="create-outline" size={20} color={palette.navy}/><Text style={styles.pdfButtonText}>Düzenle</Text></Pressable><Pressable style={[styles.pdfButton,{borderColor:'#DCA6A6'}]} onPress={archiveProperty}><Ionicons name="archive-outline" size={20} color="#A13D3D"/><Text style={[styles.pdfButtonText,{color:'#A13D3D'}]}>Arşivle</Text></Pressable></View>
          <Text style={styles.sectionTitle}>İlan durumunu yönet</Text><View style={styles.kindRow}>{(['Aktif','Opsiyonlu','Satıldı','Kiralandı'] as PropertyStatus[]).map(status=><Pressable key={status} disabled={propertyStatusBusy} onPress={()=>updatePropertyStatus(status)} style={[styles.kindButton,selected.status===status&&styles.kindButtonOn,propertyStatusBusy&&{opacity:0.55}]}><Text style={[styles.kindText,selected.status===status&&styles.kindTextOn]}>{propertyStatusBusy&&selected.status!==status?'Güncelleniyor…':status}</Text></Pressable>)}</View>
          <Text style={styles.sectionTitle}>Açıklama</Text><Text style={styles.description}>{selected.description || 'Açıklama eklenmemiş.'}</Text>
          <Text style={styles.sectionTitle}>Konum ve paylaşım</Text><Pressable style={styles.mapButton} onPress={()=>openMap(selected)}><Ionicons name="navigate-circle-outline" size={23} color="#fff"/><View style={{flex:1}}><Text style={styles.mapButtonTitle}>Google Maps'te yol tarifi</Text><Text style={styles.mapButtonSub}>Adresi haritada aç ve navigasyonu başlat</Text></View><Ionicons name="open-outline" size={18} color="#fff"/></Pressable>
          <View style={styles.shareRow}><Pressable style={styles.whatsappButton} onPress={()=>shareWhatsApp(selected)}><Ionicons name="logo-whatsapp" size={21} color="#fff"/><Text style={styles.actionButtonText}>WhatsApp</Text></Pressable><Pressable style={styles.pdfButton} onPress={()=>createPdf(selected)}><Ionicons name="document-text-outline" size={21} color={palette.navy}/><Text style={styles.pdfButtonText}>PDF sunumu</Text></Pressable></View>
          {!!selectedOwnerContact?.phone && <Pressable style={[styles.mapButton,{marginTop:12,backgroundColor:'#16805D'}]} onPress={()=>Linking.openURL('tel:'+selectedOwnerContact.phone.replace(/[^+0-9]/g,''))}><Ionicons name="call-outline" size={22} color="#fff"/><View style={{flex:1}}><Text style={styles.mapButtonTitle}>{selectedOwnerContact.name || 'Ev sahibi'}</Text><Text style={styles.mapButtonSub}>{selectedOwnerContact.phone} · Aramak için dokun</Text></View><Ionicons name="chevron-forward" size={18} color="#fff"/></Pressable>}
          <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>PDF sunumu; ilan fotoğrafları, fiyat, temel özellikler ve danışman bilgisini içerir. Fotoğraflar ilan kaydından alınır.</Text></View>
        </ScrollView></SafeAreaView>}
      </Modal>

      <Modal visible={customerModalOpen} animationType="slide" onRequestClose={()=>setCustomerModalOpen(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><Pressable onPress={()=>setCustomerModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Yeni müşteri</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>Müşteri bilgileri</Text><Text style={styles.pageSub}>Birden fazla müşteri rolü seçebilir, arama kriterlerini hemen ekleyebilirsin.</Text>
            <Text style={styles.fieldLabel}>Ad soyad *</Text><TextInput value={customerName} onChangeText={setCustomerName} style={styles.input} placeholder="Örn. Ayşe Yılmaz" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Telefon</Text><TextInput value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" style={styles.input} placeholder="05xx xxx xx xx" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Müşteri rolleri (birden fazla seçilebilir)</Text><View style={styles.kindRow}>{([{key:'buyer',label:'Alıcı'},{key:'seller',label:'Satıcı'},{key:'tenant',label:'Kiracı'}]).map(r=><Pressable key={r.key} onPress={()=>setCustomerRoles(old=>old.includes(r.key)?old.filter(x=>x!==r.key):[...old,r.key])} style={[styles.kindButton,customerRoles.includes(r.key)&&styles.kindButtonOn]}><Text style={[styles.kindText,customerRoles.includes(r.key)&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
            <View style={[styles.kindRow,{marginTop:8}]}>{([{key:'landlord',label:'Ev sahibi'},{key:'investor',label:'Yatırımcı'}]).map(r=><Pressable key={r.key} onPress={()=>setCustomerRoles(old=>old.includes(r.key)?old.filter(x=>x!==r.key):[...old,r.key])} style={[styles.kindButton,customerRoles.includes(r.key)&&styles.kindButtonOn]}><Text style={[styles.kindText,customerRoles.includes(r.key)&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
            <Text style={styles.sectionTitle}>Arama kriterleri (isteğe bağlı)</Text><Text style={styles.fieldLabel}>İşlem türü</Text><View style={styles.kindRow}>{([{key:'sale',label:'Satılık'},{key:'rent',label:'Kiralık'}] as const).map(r=><Pressable key={r.key} onPress={()=>setRequirementIntent(r.key)} style={[styles.kindButton,requirementIntent===r.key&&styles.kindButtonOn]}><Text style={[styles.kindText,requirementIntent===r.key&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Gayrimenkul tipi</Text><View style={styles.kindRow}>{([{key:'apartment',label:'Daire'},{key:'villa',label:'Villa'},{key:'land',label:'Arsa'},{key:'commercial',label:'İş yeri'}]).map(r=><Pressable key={r.key} onPress={()=>setRequirementType(r.key)} style={[styles.kindButton,requirementType===r.key&&styles.kindButtonOn]}><Text style={[styles.kindText,requirementType===r.key&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>İl</Text><TextInput value={requirementCity} onChangeText={setRequirementCity} style={styles.input} placeholder="Muğla" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>İlçe</Text><TextInput value={requirementDistrict} onChangeText={setRequirementDistrict} style={styles.input} placeholder="Bodrum" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Azami bütçe (TL)</Text><TextInput value={requirementMaxPrice} onChangeText={setRequirementMaxPrice} keyboardType="numeric" style={styles.input} placeholder="5000000" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Oda sayısı (ör. 3+1)</Text><TextInput value={requirementRooms} onChangeText={setRequirementRooms} style={styles.input} placeholder="Fark etmezse boş bırak" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Notlar</Text><TextInput value={customerNotes} onChangeText={setCustomerNotes} style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholder="İletişim ve müşteri hakkında notlar" placeholderTextColor={palette.muted}/>
            <Pressable disabled={customerBusy} onPress={saveCustomer} style={[styles.saveButton,customerBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{customerBusy?'Kaydediliyor...':'Müşteriyi kaydet'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={customerDetailOpen} animationType="slide" onRequestClose={()=>setCustomerDetailOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}><Pressable onPress={()=>setCustomerDetailOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Müşteri detayları</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>{selectedCustomer?.fullName || 'Müşteri'}</Text>
            <Text style={styles.pageSub}>Müşteri bilgilerini düzenle ve kayıtlı arama taleplerini incele.</Text>
            <Text style={styles.fieldLabel}>Ad soyad *</Text><TextInput value={editCustomerName} onChangeText={setEditCustomerName} style={styles.input} placeholder="Ad soyad" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Telefon</Text><TextInput value={editCustomerPhone} onChangeText={setEditCustomerPhone} keyboardType="phone-pad" style={styles.input} placeholder="Telefon" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Sonraki takip (YYYY-MM-DD SS:DD)</Text><TextInput value={editFollowUpAt} onChangeText={setEditFollowUpAt} style={styles.input} placeholder="2026-10-20 14:00" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Notlar</Text><TextInput value={editCustomerNotes} onChangeText={setEditCustomerNotes} style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholder="Müşteri notları" placeholderTextColor={palette.muted}/>
            <Pressable disabled={customerEditBusy} onPress={updateCustomer} style={[styles.saveButton,customerEditBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{customerEditBusy?'Kaydediliyor...':'Müşteri bilgilerini kaydet'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable>
            <View style={styles.matchSection}><Text style={styles.sectionTitle}>Randevular</Text><Text style={styles.pageSub}>Bu müşteri için görüşme veya yer gösterme planla.</Text></View>
            <Text style={styles.fieldLabel}>Randevu başlığı</Text><TextInput value={appointmentTitle} onChangeText={setAppointmentTitle} style={styles.input} placeholder="Müşteri görüşmesi" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Tarih ve saat (YYYY-MM-DD SS:DD)</Text><TextInput value={appointmentStartsAt} onChangeText={setAppointmentStartsAt} style={styles.input} placeholder="2026-10-20 14:00" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Randevu notu</Text><TextInput value={appointmentNotes} onChangeText={setAppointmentNotes} style={styles.input} placeholder="Görüşme ayrıntısı (isteğe bağlı)" placeholderTextColor={palette.muted}/>
            <Pressable disabled={appointmentBusy} onPress={addCustomerAppointment} style={[styles.saveButton,appointmentBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{appointmentBusy?'Kaydediliyor...':'Randevu oluştur'}</Text><Ionicons name="calendar-outline" size={21} color="#fff"/></Pressable>
            {customerAppointments.map((a:any)=><View key={a.id} style={styles.matchCard}><View style={{flex:1}}><Text style={styles.teamName}>{a.title}</Text><Text style={styles.teamRole}>{new Date(a.starts_at).toLocaleString('tr-TR')}</Text><Text style={styles.teamMeta}>{a.status==='scheduled'?'Planlandı':a.status==='completed'?'Tamamlandı':a.status==='cancelled'?'İptal edildi':'Gelmedi'}{a.notes?' · '+a.notes:''}</Text></View></View>)}
            {!customerAppointments.length && <Text style={styles.pageSub}>Henüz randevu yok.</Text>}
            <View style={styles.matchSection}><Text style={styles.sectionTitle}>Görüşme ve takip geçmişi</Text><Text style={styles.pageSub}>Telefon, WhatsApp, toplantı ve notları kaydet.</Text></View>
            <View style={styles.kindRow}>{([{key:'call',label:'Arama'},{key:'whatsapp',label:'WhatsApp'},{key:'meeting',label:'Toplantı'},{key:'property_viewing',label:'Yer gösterme'},{key:'note',label:'Not'}] as const).map(a=><Pressable key={a.key} onPress={()=>setActivityType(a.key)} style={[styles.kindButton,activityType===a.key&&styles.kindButtonOn]}><Text style={[styles.kindText,activityType===a.key&&styles.kindTextOn]}>{a.label}</Text></Pressable>)}</View>
            <TextInput value={activitySummary} onChangeText={setActivitySummary} style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholder="Görüşme sonucu, müşterinin geri bildirimi veya sonraki adım" placeholderTextColor={palette.muted}/>
            <Pressable disabled={activityBusy} onPress={addCustomerActivity} style={[styles.saveButton,activityBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{activityBusy?'Kaydediliyor...':'Görüşme kaydet'}</Text><Ionicons name="add-circle-outline" size={21} color="#fff"/></Pressable>
            {customerActivities.map((a:any)=><View key={a.id} style={styles.matchCard}><View style={{flex:1}}><Text style={styles.teamName}>{({call:'Telefon görüşmesi',whatsapp:'WhatsApp',meeting:'Toplantı',property_viewing:'Yer gösterme',note:'Not',email:'E-posta',other:'Diğer'} as Record<string,string>)[a.activity_type] || 'Müşteri aktivitesi'}</Text><Text style={styles.teamRole}>{a.summary}</Text><Text style={styles.teamMeta}>{new Date(a.occurred_at).toLocaleString('tr-TR')}</Text></View></View>)}
            {!customerActivities.length && <Text style={styles.pageSub}>Henüz görüşme kaydı yok.</Text>}
            <View style={styles.matchSection}><Text style={styles.sectionTitle}>Teklif takibi</Text><Text style={styles.pageSub}>Müşteri ve portföy bazında teklifleri kaydet, kabul veya ret durumunu izle.</Text></View>
             <Text style={styles.fieldLabel}>Portföy seç</Text>
             {properties.filter(p=>p.status!=='Arşivde').map(p=><Pressable key={p.id} onPress={()=>setOfferPropertyId(p.id)} style={[styles.kindButton,{marginBottom:7,flexDirection:'row',justifyContent:'space-between'},offerPropertyId===p.id&&styles.kindButtonOn]}><Text style={[styles.kindText,offerPropertyId===p.id&&styles.kindTextOn]}>{p.title} · {money(p.price)}</Text><Ionicons name={offerPropertyId===p.id?'radio-button-on':'radio-button-off'} size={17} color={offerPropertyId===p.id?'#fff':palette.muted}/></Pressable>)}
             <Text style={styles.fieldLabel}>Teklif tutarı (TL)</Text><TextInput value={offerAmount} onChangeText={setOfferAmount} keyboardType="decimal-pad" style={styles.input} placeholder="Örn. 4250000" placeholderTextColor={palette.muted}/>
             <Text style={styles.fieldLabel}>Durum</Text><View style={styles.kindRow}>{([{key:'pending',label:'Bekliyor'},{key:'countered',label:'Karşı teklif'},{key:'accepted',label:'Kabul'},{key:'rejected',label:'Reddedildi'}] as const).map(s=><Pressable key={s.key} onPress={()=>setOfferStatus(s.key)} style={[styles.kindButton,offerStatus===s.key&&styles.kindButtonOn]}><Text style={[styles.kindText,offerStatus===s.key&&styles.kindTextOn]}>{s.label}</Text></Pressable>)}</View>
             <Text style={styles.fieldLabel}>Not</Text><TextInput value={offerNotes} onChangeText={setOfferNotes} style={styles.input} placeholder="Pazarlık ve ödeme şartları" placeholderTextColor={palette.muted}/>
             <Pressable disabled={offerBusy} onPress={addCustomerOffer} style={[styles.saveButton,offerBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{offerBusy?'Kaydediliyor...':'Teklifi kaydet'}</Text><Ionicons name="pricetag-outline" size={20} color="#fff"/></Pressable>
             {customerOffers.map((offer:any)=><View key={offer.id} style={styles.matchCard}><View style={{flex:1}}><Text style={styles.teamName}>{properties.find(p=>p.id===offer.property_id)?.title || 'Portföy'} · {money(Number(offer.amount)||0)}</Text><Text style={styles.teamRole}>{({pending:'Bekliyor',countered:'Karşı teklif',accepted:'Kabul edildi',rejected:'Reddedildi'} as Record<string,string>)[offer.status]||offer.status} · {new Date(offer.created_at).toLocaleString('tr-TR')}</Text>{offer.notes?<Text style={styles.teamMeta}>{offer.notes}</Text>:null}</View><View style={{gap:5}}>{offer.status!=='accepted'&&<Pressable onPress={()=>updateOfferStatus(offer,'accepted')} style={styles.memberStatusButtonOn}><Text style={styles.memberStatusButtonTextOn}>Kabul</Text></Pressable>}{offer.status!=='rejected'&&<Pressable onPress={()=>updateOfferStatus(offer,'rejected')} style={styles.memberStatusButton}><Text style={styles.memberStatusButtonText}>Reddet</Text></Pressable>}</View></View>)}
             {!customerOffers.length&&<Text style={styles.pageSub}>Bu müşteri için henüz teklif kaydı yok.</Text>}
             <View style={styles.matchSection}><Text style={styles.sectionTitle}>Arama talepleri</Text><Text style={styles.pageSub}>Bu müşterinin kayıtlı gayrimenkul kriterleri.</Text></View>
            {customerRequirementsLoading && <Text style={styles.pageSub}>Talepler yükleniyor…</Text>}
            {!customerRequirementsLoading && customerRequirements.map((r:any)=><View key={r.id} style={styles.matchCard}><View style={{flex:1}}><Text style={styles.teamName}>{r.intent==='rent'?'Kiralık arıyor':'Satılık arıyor'} · {({apartment:'Daire',villa:'Villa',land:'Arsa',commercial:'İş yeri',house:'Ev',other:'Diğer',any:'Tümü'} as Record<string,string>)[r.property_type] || r.property_type}</Text><Text style={styles.teamRole}>{[r.city,r.district,r.neighborhood].filter(Boolean).join(' · ') || 'Konum fark etmez'}</Text><Text style={styles.teamMeta}>{r.max_price ? 'Azami '+money(Number(r.max_price)) : 'Bütçe belirtilmemiş'}{r.rooms?.length ? ' · '+r.rooms.join(', ') : ''}</Text>{!r.is_active && <Text style={styles.customerRoles}>Pasif talep</Text>}</View></View>)}
            {!customerRequirementsLoading && !customerRequirements.length && <View style={styles.empty}><Ionicons name="search-outline" size={28} color={palette.muted}/><Text style={styles.teamName}>Henüz arama talebi yok</Text><Text style={styles.pageSub}>Aşağıdan bu müşteri için ilk talebi ekleyebilirsin.</Text></View>}
            <View style={styles.matchSection}><Text style={styles.sectionTitle}>Yeni arama talebi ekle</Text><Text style={styles.pageSub}>Aynı müşteriye birden fazla farklı talep kaydedebilirsin.</Text></View>
            <Text style={styles.fieldLabel}>İşlem türü</Text><View style={styles.kindRow}>{([{key:'sale',label:'Satılık'},{key:'rent',label:'Kiralık'}] as const).map(r=><Pressable key={r.key} onPress={()=>setRequirementIntent(r.key)} style={[styles.kindButton,requirementIntent===r.key&&styles.kindButtonOn]}><Text style={[styles.kindText,requirementIntent===r.key&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Gayrimenkul tipi</Text><View style={styles.kindRow}>{([{key:'any',label:'Fark etmez'},{key:'apartment',label:'Daire'},{key:'villa',label:'Villa'},{key:'land',label:'Arsa'},{key:'commercial',label:'İş yeri'}]).map(r=><Pressable key={r.key} onPress={()=>setRequirementType(r.key)} style={[styles.kindButton,requirementType===r.key&&styles.kindButtonOn]}><Text style={[styles.kindText,requirementType===r.key&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>İl</Text><TextInput value={requirementCity} onChangeText={setRequirementCity} style={styles.input} placeholder="Muğla" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>İlçe</Text><TextInput value={requirementDistrict} onChangeText={setRequirementDistrict} style={styles.input} placeholder="Milas, Bodrum..." placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Azami bütçe (TL)</Text><TextInput value={requirementMaxPrice} onChangeText={setRequirementMaxPrice} keyboardType="numeric" style={styles.input} placeholder="5000000" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Oda sayısı</Text><TextInput value={requirementRooms} onChangeText={setRequirementRooms} style={styles.input} placeholder="3+1 (isteğe bağlı)" placeholderTextColor={palette.muted}/>
            <Pressable disabled={customerEditBusy} onPress={addRequirementForSelectedCustomer} style={[styles.saveButton,customerEditBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{customerEditBusy?'Kaydediliyor...':'Bu müşteriye talep ekle'}</Text><Ionicons name="add-circle-outline" size={21} color="#fff"/></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={notificationsOpen} animationType="slide" onRequestClose={()=>setNotificationsOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}><Pressable onPress={()=>setNotificationsOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Bildirim merkezi</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage}>
            <Text style={styles.pageTitle}>Bildirimler</Text><Text style={styles.pageSub}>Eşleşme ve operasyon bildirimlerini buradan takip et.</Text>
            {notificationsLoading && <Text style={styles.pageSub}>Bildirimler yükleniyor…</Text>}
            {!notificationsLoading && notifications.map(n=><Pressable key={n.id} onPress={()=>!n.read_at&&markNotificationRead(n.id)} style={[styles.matchCard,!n.read_at&&{borderColor:palette.gold, borderWidth:1}]}><View style={{flex:1}}><Text style={styles.teamName}>{n.title}</Text><Text style={styles.teamRole}>{n.body || 'Bildirim ayrıntısı yok.'}</Text><Text style={styles.teamMeta}>{new Date(n.created_at).toLocaleString('tr-TR')}{n.read_at?' · Okundu':' · Okunmadı'}</Text></View>{!n.read_at&&<Ionicons name="ellipse" size={10} color={palette.gold}/>}</Pressable>)}
            {!notificationsLoading && !notifications.length && <View style={styles.empty}><Ionicons name="notifications-outline" size={30} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz bildirim yok</Text><Text style={styles.pageSub}>Yeni eşleşmeler oluştuğunda bildirimler burada görünür.</Text></View>}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={profileModalOpen} animationType="slide" onRequestClose={()=>{if(!profileBusy)setProfileModalOpen(false);}}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><Pressable disabled={profileBusy} onPress={()=>setProfileModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Profilim</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled"><Text style={styles.pageTitle}>İletişim bilgilerin</Text><Text style={styles.pageSub}>Bu bilgiler gayrimenkul PDF sunumlarında danışman iletişimi olarak gösterilir.</Text>
            <Pressable onPress={chooseProfileAvatar} style={styles.avatarPicker}>{(profileAvatarUri || profileAvatarUrl) ? <Image source={{uri:profileAvatarUri || profileAvatarUrl || undefined}} style={{width:86,height:86,borderRadius:43}}/> : <Ionicons name="camera-outline" size={30} color={palette.navy}/>}<Text style={styles.avatarPickerText}>{profileAvatarUri ? 'Yeni fotoğraf seçildi · değiştirmek için dokun' : 'Profil fotoğrafı seç / değiştir'}</Text></Pressable>
            <Text style={styles.fieldLabel}>Cep telefonu</Text><TextInput value={profilePhone} onChangeText={setProfilePhone} keyboardType="phone-pad" style={styles.input} placeholder="05xx xxx xx xx" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>E-posta adresi</Text><TextInput value={profileEmail} onChangeText={setProfileEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="ornek@eposta.com" placeholderTextColor={palette.muted}/>
            <Pressable disabled={profileBusy} onPress={saveProfile} style={[styles.saveButton,profileBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{profileBusy?'Kaydediliyor…':'Profili kaydet'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable><Text style={styles.noticeText}>PDF oluşturulurken kayıtlı profil fotoğrafın, telefonun ve e-posta adresin otomatik alınır. Boş alanlar PDF'de gösterilmez.</Text>
            <View style={{height:1,backgroundColor:palette.line,marginVertical:24}} />
            <Text style={styles.pageTitle}>Şifre değiştir</Text><Text style={styles.pageSub}>Hesap güvenliğin için mevcut şifreni doğrula. Yeni şifre en az 10 karakter olmalı.</Text>
            <Text style={styles.fieldLabel}>Mevcut şifre</Text><TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Mevcut şifren" placeholderTextColor={palette.muted} />
            <Text style={styles.fieldLabel}>Yeni şifre</Text><TextInput value={profileNewPassword} onChangeText={setProfileNewPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="En az 10 karakter" placeholderTextColor={palette.muted} />
            <Text style={styles.fieldLabel}>Yeni şifre (tekrar)</Text><TextInput value={profileConfirmPassword} onChangeText={setProfileConfirmPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Yeni şifreni tekrar gir" placeholderTextColor={palette.muted} />
            <Pressable disabled={passwordBusy} onPress={handleProfilePasswordChange} style={[styles.saveButton,{marginTop:14},passwordBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{passwordBusy?'Şifre güncelleniyor…':'Şifreyi değiştir'}</Text><Ionicons name="lock-closed-outline" size={20} color="#fff" /></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={agentModalOpen} animationType="slide" onRequestClose={()=>setAgentModalOpen(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
          <View style={styles.modalHeader}><Pressable onPress={()=>setAgentModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Danışman ekle</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>Yeni danışman hesabı</Text>
            <Text style={styles.pageSub}>Danışman e-posta kullanmadan kullanıcı adı ve ilk şifresiyle giriş yapacak.</Text>
            <Pressable onPress={chooseAgentAvatar} style={styles.avatarPicker}>
              {agentAvatarUri ? <Text style={styles.avatarPickerText}>Fotoğraf seçildi ✓</Text> : <><Ionicons name="camera-outline" size={26} color={palette.navy}/><Text style={styles.avatarPickerText}>Profil fotoğrafı seç</Text></>}
            </Pressable>
            <Text style={styles.fieldLabel}>Ad soyad *</Text><TextInput value={agentName} onChangeText={setAgentName} style={styles.input} placeholder="Örn. Ayşe Yılmaz" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Kullanıcı adı * (3-32 karakter)</Text><TextInput value={agentUsername} onChangeText={setAgentUsername} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="ornek.ayse" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>İlk şifre * (en az 10 karakter)</Text><TextInput value={agentPassword} onChangeText={setAgentPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="İlk giriş şifresi" placeholderTextColor={palette.muted}/>
            <Pressable disabled={agentBusy} onPress={createAgent} style={[styles.saveButton,agentBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{agentBusy?'Hesap oluşturuluyor...':'Danışman hesabını oluştur'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable>
            <Text style={styles.noticeText}>Fotoğraf yüklemek için Firebase Storage etkin olmalı ve Storage kuralları yayınlanmalıdır. Danışman hesabı oluşturmak için Firebase Functions dağıtılmış olmalıdır.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={addOpen} animationType="slide" onRequestClose={()=>{setAddOpen(false);setEditingPropertyId(null);}}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}><View style={styles.modalHeader}><Pressable onPress={()=>{setAddOpen(false);setEditingPropertyId(null);}} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>{editingPropertyId ? "Portföyü düzenle" : "Yeni portföy"}</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled"><Text style={styles.pageTitle}>{editingPropertyId ? 'Portföy bilgilerini düzenle' : 'Gayrimenkul ekle'}</Text><Text style={styles.pageSub}>{editingPropertyId ? 'Değişiklikleri kaydettiğinde portföy güncellenecek.' : 'İlan bilgilerini girerek portföyünü oluştur.'}</Text>
            <Text style={styles.fieldLabel}>İlan başlığı *</Text><TextInput value={title} onChangeText={setTitle} placeholder="Örn. Deniz manzaralı 3+1 daire" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Açık adres *</Text><TextInput value={address} onChangeText={setAddress} placeholder="Mahalle, ilçe, il" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>İlan türü</Text><View style={styles.kindRow}>{(['Satılık','Kiralık'] as const).map(k=><Pressable key={k} onPress={()=>setKind(k)} style={[styles.kindButton,kind===k&&styles.kindButtonOn]}><Text style={[styles.kindText,kind===k&&styles.kindTextOn]}>{k}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Gayrimenkul tipi</Text><View style={styles.kindRow}>{([{key:'apartment',label:'Daire'},{key:'villa',label:'Villa'},{key:'land',label:'Arsa'},{key:'commercial',label:'İş yeri'},{key:'house',label:'Müstakil ev'},{key:'other',label:'Diğer'}]).map(t=><Pressable key={t.key} onPress={()=>setPropertyType(t.key)} style={[styles.kindButton,propertyType===t.key&&styles.kindButtonOn]}><Text style={[styles.kindText,propertyType===t.key&&styles.kindTextOn]}>{t.label}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Fiyat (TL) *</Text><TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="4250000" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Oda sayısı</Text><View style={styles.kindRow}>{['1+1','2+1','3+1','4+1','5+1'].map(r=><Pressable key={r} onPress={()=>setRooms(r)} style={[styles.roomButton,rooms===r&&styles.kindButtonOn]}><Text style={[styles.kindText,rooms===r&&styles.kindTextOn]}>{r}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Metrekare *</Text><TextInput value={area} onChangeText={setArea} keyboardType="numeric" placeholder="145" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Banyo sayısı</Text><TextInput value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" placeholder="Örn. 2" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Balkon</Text><View style={styles.kindRow}>{['Var','Yok','Belirtilmedi'].map(v=><Pressable key={v} onPress={()=>setBalcony(v)} style={[styles.kindButton,balcony===v&&styles.kindButtonOn]}><Text style={[styles.kindText,balcony===v&&styles.kindTextOn]}>{v}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Otopark</Text><View style={styles.kindRow}>{['Açık','Kapalı','Açık ve kapalı','Yok','Belirtilmedi'].map(v=><Pressable key={v} onPress={()=>setParking(v)} style={[styles.kindButton,parking===v&&styles.kindButtonOn]}><Text style={[styles.kindText,parking===v&&styles.kindTextOn]}>{v}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Isıtma</Text><View style={styles.kindRow}>{['Doğalgaz','Kombi','Merkezi','Yerden ısıtma','Klima','Soba','Yok','Belirtilmedi'].map(v=><Pressable key={v} onPress={()=>setHeating(v)} style={[styles.kindButton,heating===v&&styles.kindButtonOn]}><Text style={[styles.kindText,heating===v&&styles.kindTextOn]}>{v}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Soğutma</Text><View style={styles.kindRow}>{['Klima','Merkezi soğutma','Yok','Belirtilmedi'].map(v=><Pressable key={v} onPress={()=>setCooling(v)} style={[styles.kindButton,cooling===v&&styles.kindButtonOn]}><Text style={[styles.kindText,cooling===v&&styles.kindTextOn]}>{v}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>İskan durumu</Text><View style={styles.kindRow}>{['Var','Yok','Başvuru sürecinde','Belirtilmedi'].map(v=><Pressable key={v} onPress={()=>setOccupancyPermit(v)} style={[styles.kindButton,occupancyPermit===v&&styles.kindButtonOn]}><Text style={[styles.kindText,occupancyPermit===v&&styles.kindTextOn]}>{v}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Asansör</Text><View style={styles.kindRow}>{['Var','Yok','Belirtilmedi'].map(v=><Pressable key={v} onPress={()=>setElevator(v)} style={[styles.kindButton,elevator===v&&styles.kindButtonOn]}><Text style={[styles.kindText,elevator===v&&styles.kindTextOn]}>{v}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Bina yaşı (yıl)</Text><TextInput value={buildingAge} onChangeText={setBuildingAge} keyboardType="number-pad" placeholder="Örn. 5" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Bulunduğu kat</Text><TextInput value={floorNumber} onChangeText={setFloorNumber} keyboardType="number-pad" placeholder="Örn. 2" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Toplam kat sayısı</Text><TextInput value={totalFloors} onChangeText={setTotalFloors} keyboardType="number-pad" placeholder="Örn. 5" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Yakın çevrede neler var?</Text><TextInput value={nearbyAmenities} onChangeText={setNearbyAmenities} placeholder="Örn. okul, market, hastane, sahil, toplu taşıma" style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Açıklama</Text><TextInput value={description} onChangeText={setDescription} placeholder="Gayrimenkul hakkında kısa bilgi" style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholderTextColor={palette.muted}/>
            <View style={{marginTop:18,padding:14,borderRadius:12,borderWidth:1,borderColor:palette.line,backgroundColor:'#FFFDF8'}}><Text style={[styles.fieldLabel,{marginBottom:4}]}>Ev sahibi bilgileri · Özel</Text><Text style={styles.noticeText}>Bu bilgiler müşteri PDF sunumuna eklenmez.</Text><Text style={styles.fieldLabel}>Ev sahibinin adı</Text><TextInput value={ownerContactName} onChangeText={setOwnerContactName} placeholder="Ad soyad" style={styles.input} placeholderTextColor={palette.muted}/><Text style={styles.fieldLabel}>Ev sahibinin telefonu</Text><TextInput value={ownerContactPhone} onChangeText={setOwnerContactPhone} placeholder="05xx xxx xx xx" keyboardType="phone-pad" style={styles.input} placeholderTextColor={palette.muted}/></View>
            <View style={{marginTop:18,marginBottom:8}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><Text style={styles.fieldLabel}>İlan fotoğrafları ({pendingPhotoUris.length}/12)</Text><Pressable onPress={choosePropertyPhotos} disabled={propertyBusy||pendingPhotoUris.length>=12} style={[styles.pdfButton,{flex:0,paddingHorizontal:12,paddingVertical:8,opacity:propertyBusy||pendingPhotoUris.length>=12?0.5:1}]}><Ionicons name="images-outline" size={18} color={palette.navy}/><Text style={styles.pdfButtonText}>Galeriden seç</Text></Pressable></View><Text style={styles.noticeText}>İlanı kaydetmeden önce birden fazla fotoğraf seçebilirsin. Fotoğraflar kaydetme sırasında yüklenir; mevcut ilan fotoğrafları detay ekranından da eklenebilir.</Text>{pendingPhotoUris.length>0&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:10}}>{pendingPhotoUris.map((photo,index)=><View key={photo.uri+index} style={{width:'31%',height:116,borderRadius:10,overflow:'hidden',backgroundColor:palette.line}}><Image source={{uri:photo.uri}} style={{width:'100%',height:116}} resizeMode="cover"/><Pressable onPress={()=>setPendingPhotoUris(current=>current.filter((_,i)=>i!==index))} style={{position:'absolute',right:5,top:5,backgroundColor:'#fff',borderRadius:14,padding:4}}><Ionicons name="close" size={16} color={palette.red}/></Pressable></View>)}</View>}</View>
            <Pressable disabled={propertyBusy} onPress={saveProperty} style={[styles.saveButton,propertyBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{propertyBusy?'Kaydediliyor...':editingPropertyId ? 'Değişiklikleri kaydet' : 'Portföye kaydet'}</Text><Ionicons name={propertyBusy?"time-outline":"checkmark-circle-outline"} size={21} color="#fff"/></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
