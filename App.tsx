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
import { pickPortfolioSpreadsheet as pickPortfolioSpreadsheetService, importPortfolioCsv as importPortfolioCsvService, exportPortfolioCsv as exportPortfolioCsvService, sharePortfolioReport as sharePortfolioReportService } from './src/services/portfolioCsvService';
import { loadPropertyPhotos as loadPropertyPhotosService, addPropertyPhoto as addPropertyPhotoService, movePropertyPhoto as movePropertyPhotoService, removePropertyPhoto as removePropertyPhotoService } from './src/services/propertyPhotoService';
import { loadProperties as loadPropertiesService, loadCustomers as loadCustomersService, loadMatches as loadMatchesService, loadNotifications as loadNotificationsService, markNotificationRead as markNotificationReadService, loadTeamMembers as loadTeamMembersService } from './src/services/officeDataService';
import { loadCustomerOffers as loadCustomerOffersService, addCustomerOffer as addCustomerOfferService, updateOfferStatus as updateOfferStatusService, openCustomerDetail as openCustomerDetailService, addCustomerAppointment as addCustomerAppointmentService, addCustomerActivity as addCustomerActivityService, addRequirementForSelectedCustomer as addRequirementForSelectedCustomerService, updateCustomer as updateCustomerService, saveCustomer as saveCustomerService } from './src/services/customerService';
import { handleLogin as handleLoginService, handleInitialPasswordChange as handleInitialPasswordChangeService, openProfile as openProfileService, chooseProfileAvatar as chooseProfileAvatarService, handleProfilePasswordChange as handleProfilePasswordChangeService, saveProfile as saveProfileService, chooseAgentAvatar as chooseAgentAvatarService, createAgent as createAgentService, handleSignOut as handleSignOutService } from './src/services/accountActionsService';
import { updatePropertyStatus as updatePropertyStatusService, openPropertyEditor as openPropertyEditorService, archiveProperty as archivePropertyService, choosePropertyPhotos as choosePropertyPhotosService, uploadPendingPropertyPhotos as uploadPendingPropertyPhotosService, saveProperty as savePropertyService } from './src/services/propertyActionsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL_DOCUMENTS, LEGAL_VERSION, type LegalDocumentKey } from './src/legalDocuments';
import { restoreUsernameSession } from './src/lib/usernameAuth';
import {
  Alert, Linking, Modal, Pressable, ScrollView, Share, StatusBar, KeyboardAvoidingView, Platform,
  Text, TextInput, View, Image, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { getFirebaseClient } from './src/lib/firebaseClient';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseAuth } from './src/lib/firebase';
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

  const csvDependencies = {
    Alert, Share, find, parseLine, escapeCsv, setCsvImportText,
    setExcelFileName, setExcelPreviewCount, csvImportBusy, csvImportText, officeId,
    setCsvImportBusy, loadProperties, setCsvImportOpen, roleProperties, propertyTypeLabel, money,
  };
  const pickPortfolioSpreadsheet = async () => pickPortfolioSpreadsheetService(csvDependencies);
  const importPortfolioCsv = async () => importPortfolioCsvService(csvDependencies);
  const exportPortfolioCsv = async () => exportPortfolioCsvService(csvDependencies);
  const sharePortfolioReport = async () => sharePortfolioReportService(csvDependencies);

  const openMap = async (p: Property) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`;
    try { await Linking.openURL(url); } catch { Alert.alert('Harita açılamadı', 'Adresin geçerli olduğundan emin olun.'); }
  };
  const shareWhatsApp = async (p: Property) => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText(p))}`;
    try { await Linking.openURL(url); } catch { await Share.share({ message: shareText(p) }); }
  };
  const propertyPhotoDependencies = { selected, officeId, propertyPhotos, photosBusy, setPhotosBusy, setPropertyPhotos };
  const loadPropertyPhotos = async (propertyId: string) => loadPropertyPhotosService(propertyId, propertyPhotoDependencies);
  const addPropertyPhoto = async () => addPropertyPhotoService(propertyPhotoDependencies);
  const movePropertyPhoto = async (photo: PropertyPhoto, direction: -1 | 1) => movePropertyPhotoService(photo, direction, propertyPhotoDependencies);
  const removePropertyPhoto = async (photo: PropertyPhoto) => removePropertyPhotoService(photo, propertyPhotoDependencies);

  const pdfDependencies = {
    htmlEscape, propertyTypeLabel, money, properties, selectedPresentationIds,
    setPortfolioPresentationMode, setSelectedPresentationIds,
  };
  const createPdf = async (p: Property) => createPropertyPdf(p, pdfDependencies);
  const createMultiPropertyPdf = async () => createMultiPropertyPdfService(pdfDependencies);

  const officeDataDependencies = {
    setPropertiesLoading, setProperties, setCustomersLoading, setCustomers,
    setMatchesLoading, setMatches, setNotificationsLoading, setNotifications, setTeamMembers,
  };
  const loadProperties = async (targetOfficeId: string) => loadPropertiesService(targetOfficeId, officeDataDependencies);
  const loadCustomers = async (targetOfficeId: string) => loadCustomersService(targetOfficeId, officeDataDependencies);
  const loadMatches = async (targetOfficeId: string) => loadMatchesService(targetOfficeId, officeDataDependencies);
  const loadNotifications = async (targetOfficeId: string) => loadNotificationsService(targetOfficeId, officeDataDependencies);
  const markNotificationRead = async (notificationId: string) => markNotificationReadService(notificationId, officeDataDependencies);
  const loadTeamMembers = async (targetOfficeId: string) => loadTeamMembersService(targetOfficeId, officeDataDependencies);

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

  const customerActionDependencies = {
    selectedCustomer, setSelectedCustomer, officeId, properties, money,
    offerAmount, setOfferAmount, offerPropertyId, setOfferPropertyId, offerStatus, setOfferStatus, offerNotes, setOfferNotes,
    offerBusy, setOfferBusy, offerStatusBusyId, setOfferStatusBusyId, setCustomerOffers,
    setEditCustomerName, setEditCustomerPhone, setEditCustomerNotes, setEditFollowUpAt, setCustomerDetailOpen,
    setCustomerRequirementsLoading, setCustomerRequirements, setCustomerActivities, setCustomerAppointments,
    appointmentStartsAt, setAppointmentBusy, appointmentTitle, appointmentNotes, setAppointmentStartsAt, setAppointmentNotes,
    activitySummary, setActivityBusy, activityType, setActivitySummary,
    requirementMaxPrice, requirementDistrict, requirementCity, requirementRooms, requirementIntent, requirementType,
    setCustomerEditBusy, setRequirementIntent, setRequirementType, setRequirementCity, setRequirementDistrict, setRequirementMaxPrice, setRequirementRooms,
    loadMatches, loadCustomers,
    customerName, customerRoles, setCustomerBusy, customerPhone, customerNotes,
    setCustomerModalOpen, setCustomerName, setCustomerPhone, setCustomerRoles, setCustomerNotes,
  };
  const loadCustomerOffers = async (targetOfficeId: string, customerId: string) => loadCustomerOffersService(targetOfficeId, customerId, customerActionDependencies);
  const addCustomerOffer = async () => addCustomerOfferService(customerActionDependencies);
  const updateOfferStatus = async (offer: any, status: 'pending'|'countered'|'accepted'|'rejected') => updateOfferStatusService(offer, status, customerActionDependencies);
  const openCustomerDetail = async (customer: Customer) => openCustomerDetailService(customer, customerActionDependencies);
  const addCustomerAppointment = async () => addCustomerAppointmentService(customerActionDependencies);
  const addCustomerActivity = async () => addCustomerActivityService(customerActionDependencies);
  const addRequirementForSelectedCustomer = async () => addRequirementForSelectedCustomerService(customerActionDependencies);
  const updateCustomer = async () => updateCustomerService(customerActionDependencies);
  const saveCustomer = async () => saveCustomerService(customerActionDependencies);

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

  const accountActionDependencies = {
    setAuthBusy, setAuthError, loginUsername, loginPassword, setRole, setAuthenticated, setLoginPassword, setOfficeId,
    loadProperties, loadCustomers, loadMatches, loadNotifications, loadTeamMembers, setMustChangePassword,
    newPassword, confirmPassword, setNewPassword, setConfirmPassword,
    setProfileBusy, setProfilePhone, setProfileEmail, setProfileAvatarPath, setProfileAvatarUri, setProfileAvatarUrl, setProfileModalOpen,
    currentPassword, profileNewPassword, profileConfirmPassword, setCurrentPassword, setProfileNewPassword, setProfileConfirmPassword, setPasswordBusy,
    profileEmail, profileAvatarPath, profileAvatarUri, profilePhone,
    setAgentAvatarUri, agentName, agentUsername, agentPassword, officeId, agentAvatarUri, setAgentBusy, setAgentModalOpen, setAgentName, setAgentUsername, setAgentPassword,
    setSuperadminOfficeMode,
  };
  const handleLogin = async () => handleLoginService(accountActionDependencies);
  const handleInitialPasswordChange = async () => handleInitialPasswordChangeService(accountActionDependencies);
  const openProfile = async () => openProfileService(accountActionDependencies);
  const chooseProfileAvatar = async () => chooseProfileAvatarService(accountActionDependencies);
  const handleProfilePasswordChange = async () => handleProfilePasswordChangeService(accountActionDependencies);
  const saveProfile = async () => saveProfileService(accountActionDependencies);
  const chooseAgentAvatar = async () => chooseAgentAvatarService(accountActionDependencies);
  const createAgent = async () => createAgentService(accountActionDependencies);
  const handleSignOut = async () => handleSignOutService(accountActionDependencies);

  const propertyActionDependencies = {
    selected, propertyStatusBusy, role, officeId, setPropertyStatusBusy, setProperties, setSelected, loadProperties,
    setPendingPhotoUris, setEditingPropertyId, setTitle, setAddress, setPrice, setArea, setKind, setRooms, setDescription,
    setBathrooms, setBalcony, setParking, setHeating, setCooling, setOccupancyPermit, setElevator, setNearbyAmenities,
    setBuildingAge, setFloorNumber, setTotalFloors, setOwnerContactName, setOwnerContactPhone, setPropertyType, setAddOpen,
    archiveBusy, setArchiveBusy, pendingPhotoUris, propertyBusy, editingPropertyId, properties, title, address, price, area,
    rooms, propertyType, kind, description, bathrooms, balcony, parking, heating, cooling, occupancyPermit, elevator,
    nearbyAmenities, buildingAge, floorNumber, totalFloors, ownerContactName, ownerContactPhone, setPropertyBusy, loadMatches,
  };
  const updatePropertyStatus = async (nextStatus: PropertyStatus) => updatePropertyStatusService(nextStatus, propertyActionDependencies);
  const openPropertyEditor = (p: Property) => openPropertyEditorService(p, propertyActionDependencies);
  const archiveProperty = async () => archivePropertyService(propertyActionDependencies);
  const choosePropertyPhotos = async () => choosePropertyPhotosService(propertyActionDependencies);
  const uploadPendingPropertyPhotos = async (propertyId: string) => uploadPendingPropertyPhotosService(propertyId, propertyActionDependencies);
  const saveProperty = async () => savePropertyService(propertyActionDependencies);

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
