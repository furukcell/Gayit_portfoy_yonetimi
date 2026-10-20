import React, { useEffect, useMemo, useState } from 'react';
import { palette, styles } from './src/theme/appStyles';
import AnimatedSplash from './src/components/AnimatedSplash';
import { Stat, Feature } from './src/components/DashboardPrimitives';
import type { Role, Tab, Customer, PropertyStatus, PropertyPhoto, Property } from './src/types/property';
import { initialProperties } from './src/data/initialProperties';
import { escapeCsvCell as escapeCsv, findImportColumn as find, parseSemicolonCsvLine as parseLine } from './src/utils/importHelpers';
import PropertyRow from './src/components/PropertyRow';
import CustomersScreen from './src/screens/CustomersScreen';
import TeamScreen from './src/screens/TeamScreen';
import StatsScreen from './src/screens/StatsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import PropertyFormModal from './src/components/PropertyFormModal';
import PortfolioOperationModals from './src/components/PortfolioOperationModals';
import CustomerDetailModal from './src/components/CustomerDetailModal';
import ProfileModal from './src/components/ProfileModal';
import AgentModal from './src/components/AgentModal';
import NotificationsModal from './src/components/NotificationsModal';
import PropertyDetailModal from './src/components/PropertyDetailModal';
import CustomerCreateModal from './src/components/CustomerCreateModal';
import LegalAcceptanceModal from './src/components/LegalAcceptanceModal';
import LegalDocumentModal from './src/components/LegalDocumentModal';
import { createPropertyPdf, createMultiPropertyPdf as createMultiPropertyPdfService } from './src/services/pdfService';
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
  const pdfDependencies = {
    Alert, getFirebaseClient, getFirebaseAuth, htmlEscape, propertyTypeLabel, money, Print, Sharing,
    properties, selectedPresentationIds, setPortfolioPresentationMode, setSelectedPresentationIds,
  };
  const createPdf = async (p: Property) => createPropertyPdf(p, pdfDependencies);
  const createMultiPropertyPdf = async () => createMultiPropertyPdfService(pdfDependencies);

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

      <LegalAcceptanceModal
        authenticated={authenticated}
        legalReady={legalReady}
        legalAccepted={legalAccepted}
        setLegalDocument={setLegalDocument}
        legalReadPrivacy={legalReadPrivacy}
        setLegalReadPrivacy={setLegalReadPrivacy}
        legalAcceptTerms={legalAcceptTerms}
        setLegalAcceptTerms={setLegalAcceptTerms}
        legalGateBusy={legalGateBusy}
        confirmLegalAcceptance={confirmLegalAcceptance}
        styles={styles}
        palette={palette}
      />
      <LegalDocumentModal legalDocument={legalDocument} setLegalDocument={setLegalDocument} styles={styles} palette={palette} />

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

        <PortfolioScreen visible={tab === 'portfolio'} styles={styles} palette={palette} role={role} portfolioPresentationMode={portfolioPresentationMode} setPortfolioPresentationMode={setPortfolioPresentationMode} setSelectedPresentationIds={setSelectedPresentationIds} selectedPresentationIds={selectedPresentationIds} setAddOpen={setAddOpen} search={search} setSearch={setSearch} quickTypeFilter={quickTypeFilter} quickCityFilter={quickCityFilter} quickDistrictFilter={quickDistrictFilter} setQuickDropdown={setQuickDropdown} quickDropdown={quickDropdown} properties={properties} setQuickTypeFilter={setQuickTypeFilter} setQuickCityFilter={setQuickCityFilter} setQuickDistrictFilter={setQuickDistrictFilter} filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} recentOnly={recentOnly} setRecentOnly={setRecentOnly} favoritesOnly={favoritesOnly} setFavoritesOnly={setFavoritesOnly} minPriceFilter={minPriceFilter} setMinPriceFilter={setMinPriceFilter} maxPriceFilter={maxPriceFilter} setMaxPriceFilter={setMaxPriceFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} showArchived={showArchived} setShowArchived={setShowArchived} createMultiPropertyPdf={createMultiPropertyPdf} propertiesLoading={propertiesLoading} visibleProperties={visibleProperties} money={money} openProperty={openProperty} toggleFavorite={toggleFavorite} favoriteIds={favoriteIds} />

        <CustomersScreen
          visible={tab === 'customers'}
          role={role}
          customers={customers}
          customersLoading={customersLoading}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          openCustomerDetail={openCustomerDetail}
          openAddCustomer={() => setCustomerModalOpen(true)}
        />

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

        <TeamScreen visible={tab === 'team'} teamMembers={teamMembers} teamStatusBusyId={teamStatusBusyId} onAddAgent={() => setAgentModalOpen(true)} onToggleAgentStatus={toggleAgentStatus} />

        <StatsScreen visible={tab === 'stats'} role={role} roleProperties={roleProperties} customers={customers} teamMembers={teamMembers} money={money} onSharePortfolioReport={sharePortfolioReport} />
      </View>

      <View style={styles.bottomNav}>{([{key:'home',label:'Ana Sayfa',icon:'grid-outline'},{key:'portfolio',label:'Portföy',icon:'business-outline'},{key:'customers',label:'Müşteriler',icon:'people-outline'},{key:'matches',label:'Eşleşme',icon:'git-compare-outline'},{key:'more',label:'Daha Fazla',icon:'menu-outline'}] as {key:Tab;label:string;icon:keyof typeof Ionicons.glyphMap}[]).map(item=><Pressable key={item.key} onPress={()=>{setTab(item.key);if(item.key==='portfolio'){loadFavorites();loadRecentViews();}}} style={styles.navItem}><View style={[styles.navIcon,tab===item.key&&styles.navIconOn]}><Ionicons name={item.icon} size={20} color={tab===item.key?palette.gold:palette.muted}/></View><Text style={[styles.navLabel,tab===item.key&&styles.navLabelOn]}>{item.label}</Text></Pressable>)}</View>

      <PortfolioOperationModals transactionModalOpen={transactionModalOpen} setTransactionModalOpen={setTransactionModalOpen} transactionBusy={transactionBusy} setTransactionPropertyId={setTransactionPropertyId} transactionPropertyId={transactionPropertyId} properties={properties} setTransactionFinalPrice={setTransactionFinalPrice} transactionFinalPrice={transactionFinalPrice} money={money} transactionOfficeCommission={transactionOfficeCommission} setTransactionOfficeCommission={setTransactionOfficeCommission} transactionAgentCommission={transactionAgentCommission} setTransactionAgentCommission={setTransactionAgentCommission} transactionDate={transactionDate} setTransactionDate={setTransactionDate} transactionNotes={transactionNotes} setTransactionNotes={setTransactionNotes} saveTransaction={saveTransaction} csvImportOpen={csvImportOpen} setCsvImportOpen={setCsvImportOpen} csvImportBusy={csvImportBusy} pickPortfolioSpreadsheet={pickPortfolioSpreadsheet} excelFileName={excelFileName} excelPreviewCount={excelPreviewCount} csvImportText={csvImportText} setCsvImportText={setCsvImportText} importPortfolioCsv={importPortfolioCsv} />


      <PropertyDetailModal selected={selected} setSelected={setSelected} setPropertyPhotos={setPropertyPhotos} propertyPhotos={propertyPhotos} photosBusy={photosBusy} addPropertyPhoto={addPropertyPhoto} movePropertyPhoto={movePropertyPhoto} removePropertyPhoto={removePropertyPhoto} propertyTypeLabel={propertyTypeLabel} money={money} openPropertyEditor={openPropertyEditor} archiveProperty={archiveProperty} propertyStatusBusy={propertyStatusBusy} updatePropertyStatus={updatePropertyStatus} openMap={openMap} shareWhatsApp={shareWhatsApp} createPdf={createPdf} selectedOwnerContact={selectedOwnerContact} />

      <CustomerCreateModal customerModalOpen={customerModalOpen} setCustomerModalOpen={setCustomerModalOpen} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} customerRoles={customerRoles} setCustomerRoles={setCustomerRoles} requirementIntent={requirementIntent} setRequirementIntent={setRequirementIntent} requirementType={requirementType} setRequirementType={setRequirementType} requirementCity={requirementCity} setRequirementCity={setRequirementCity} requirementDistrict={requirementDistrict} setRequirementDistrict={setRequirementDistrict} requirementMaxPrice={requirementMaxPrice} setRequirementMaxPrice={setRequirementMaxPrice} requirementRooms={requirementRooms} setRequirementRooms={setRequirementRooms} customerNotes={customerNotes} setCustomerNotes={setCustomerNotes} customerBusy={customerBusy} saveCustomer={saveCustomer} />

      <CustomerDetailModal customerDetailOpen={customerDetailOpen} setCustomerDetailOpen={setCustomerDetailOpen} selectedCustomer={selectedCustomer} editCustomerName={editCustomerName} setEditCustomerName={setEditCustomerName} editCustomerPhone={editCustomerPhone} setEditCustomerPhone={setEditCustomerPhone} editFollowUpAt={editFollowUpAt} setEditFollowUpAt={setEditFollowUpAt} editCustomerNotes={editCustomerNotes} setEditCustomerNotes={setEditCustomerNotes} customerEditBusy={customerEditBusy} updateCustomer={updateCustomer} appointmentTitle={appointmentTitle} setAppointmentTitle={setAppointmentTitle} appointmentStartsAt={appointmentStartsAt} setAppointmentStartsAt={setAppointmentStartsAt} appointmentNotes={appointmentNotes} setAppointmentNotes={setAppointmentNotes} appointmentBusy={appointmentBusy} addCustomerAppointment={addCustomerAppointment} customerAppointments={customerAppointments} activityType={activityType} setActivityType={setActivityType} activitySummary={activitySummary} setActivitySummary={setActivitySummary} activityBusy={activityBusy} addCustomerActivity={addCustomerActivity} properties={properties} offerPropertyId={offerPropertyId} setOfferPropertyId={setOfferPropertyId} offerAmount={offerAmount} setOfferAmount={setOfferAmount} offerStatus={offerStatus} setOfferStatus={setOfferStatus} offerNotes={offerNotes} setOfferNotes={setOfferNotes} offerBusy={offerBusy} addCustomerOffer={addCustomerOffer} customerOffers={customerOffers} updateOfferStatus={updateOfferStatus} customerRequirementsLoading={customerRequirementsLoading} customerRequirements={customerRequirements} requirementIntent={requirementIntent} setRequirementIntent={setRequirementIntent} requirementType={requirementType} setRequirementType={setRequirementType} requirementCity={requirementCity} setRequirementCity={setRequirementCity} requirementDistrict={requirementDistrict} setRequirementDistrict={setRequirementDistrict} requirementMaxPrice={requirementMaxPrice} setRequirementMaxPrice={setRequirementMaxPrice} requirementRooms={requirementRooms} setRequirementRooms={setRequirementRooms} addRequirementForSelectedCustomer={addRequirementForSelectedCustomer} money={money} />

      <NotificationsModal notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} notificationsLoading={notificationsLoading} notifications={notifications} markNotificationRead={markNotificationRead} />

      <ProfileModal profileModalOpen={profileModalOpen} setProfileModalOpen={setProfileModalOpen} profileBusy={profileBusy} chooseProfileAvatar={chooseProfileAvatar} profileAvatarUri={profileAvatarUri} profileAvatarUrl={profileAvatarUrl} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileEmail={profileEmail} setProfileEmail={setProfileEmail} saveProfile={saveProfile} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword} profileNewPassword={profileNewPassword} setProfileNewPassword={setProfileNewPassword} profileConfirmPassword={profileConfirmPassword} setProfileConfirmPassword={setProfileConfirmPassword} passwordBusy={passwordBusy} handleProfilePasswordChange={handleProfilePasswordChange} />

      <AgentModal agentModalOpen={agentModalOpen} setAgentModalOpen={setAgentModalOpen} chooseAgentAvatar={chooseAgentAvatar} agentAvatarUri={agentAvatarUri} agentName={agentName} setAgentName={setAgentName} agentUsername={agentUsername} setAgentUsername={setAgentUsername} agentPassword={agentPassword} setAgentPassword={setAgentPassword} agentBusy={agentBusy} createAgent={createAgent} />

      <PropertyFormModal addOpen={addOpen} setAddOpen={setAddOpen} editingPropertyId={editingPropertyId} setEditingPropertyId={setEditingPropertyId} title={title} setTitle={setTitle} address={address} setAddress={setAddress} kind={kind} setKind={setKind} propertyType={propertyType} setPropertyType={setPropertyType} price={price} setPrice={setPrice} rooms={rooms} setRooms={setRooms} area={area} setArea={setArea} bathrooms={bathrooms} setBathrooms={setBathrooms} balcony={balcony} setBalcony={setBalcony} parking={parking} setParking={setParking} heating={heating} setHeating={setHeating} cooling={cooling} setCooling={setCooling} occupancyPermit={occupancyPermit} setOccupancyPermit={setOccupancyPermit} elevator={elevator} setElevator={setElevator} buildingAge={buildingAge} setBuildingAge={setBuildingAge} floorNumber={floorNumber} setFloorNumber={setFloorNumber} totalFloors={totalFloors} setTotalFloors={setTotalFloors} nearbyAmenities={nearbyAmenities} setNearbyAmenities={setNearbyAmenities} description={description} setDescription={setDescription} ownerContactName={ownerContactName} setOwnerContactName={setOwnerContactName} ownerContactPhone={ownerContactPhone} setOwnerContactPhone={setOwnerContactPhone} pendingPhotoUris={pendingPhotoUris} setPendingPhotoUris={setPendingPhotoUris} choosePropertyPhotos={choosePropertyPhotos} propertyBusy={propertyBusy} saveProperty={saveProperty} />
    </SafeAreaView>
  );
}
