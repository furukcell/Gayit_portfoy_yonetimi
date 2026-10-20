import React, { useEffect, useMemo } from 'react';
import { palette, styles } from './src/theme/appStyles';
import useAppState from './src/hooks/useAppState';
import AnimatedSplash from './src/components/AnimatedSplash';
import { Stat, Feature } from './src/components/DashboardPrimitives';
import type { Role, Tab, Customer, PropertyStatus, PropertyPhoto, Property } from './src/types/property';
import { escapeCsvCell as escapeCsv, findImportColumn as find, parseSemicolonCsvLine as parseLine } from './src/utils/importHelpers';
import PropertyRow from './src/components/PropertyRow';
import CustomersScreen from './src/screens/CustomersScreen';
import TeamScreen from './src/screens/TeamScreen';
import StatsScreen from './src/screens/StatsScreen';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import MoreScreen from './src/screens/MoreScreen';
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
import { saveTransaction as saveTransactionService, loadRecentViews as loadRecentViewsService, openProperty as openPropertyService, loadFavorites as loadFavoritesService, toggleFavorite as toggleFavoriteService } from './src/services/portfolioActionsService';
import { toggleAgentStatus as toggleAgentStatusService, handleCreateOfficeAsSuperadmin as createOfficeService, handleSuperadminLogout as superadminLogoutService } from './src/services/officeAdminService';
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
import { getFirebaseAuth } from './src/lib/firebase';
import SuperadminPanel from './src/SuperadminPanel';


export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Immersive sticky: hide Android system navigation controls and let a swipe reveal them temporarily.
    // Use only APIs supported by the installed expo-navigation-bar version.
    void NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);
  const {
    role, setRole, authenticated, setAuthenticated, legalAccepted, setLegalAccepted, legalReady, setLegalReady, legalReadPrivacy, setLegalReadPrivacy, legalAcceptTerms, setLegalAcceptTerms,
    legalDocument, setLegalDocument, legalGateBusy, setLegalGateBusy, authBusy, setAuthBusy, loginUsername, setLoginUsername, loginPassword, setLoginPassword, newPassword, setNewPassword,
    confirmPassword, setConfirmPassword, mustChangePassword, setMustChangePassword, authError, setAuthError, officeId, setOfficeId, superadminOfficeMode, setSuperadminOfficeMode, superOfficeName, setSuperOfficeName,
    superOwnerName, setSuperOwnerName, superOwnerUsername, setSuperOwnerUsername, superOwnerPassword, setSuperOwnerPassword, superCreateBusy, setSuperCreateBusy, superResult, setSuperResult, agentModalOpen, setAgentModalOpen,
    agentName, setAgentName, agentUsername, setAgentUsername, agentPassword, setAgentPassword, agentAvatarUri, setAgentAvatarUri, agentBusy, setAgentBusy, teamMembers, setTeamMembers,
    teamStatusBusyId, setTeamStatusBusyId, customers, setCustomers, customersLoading, setCustomersLoading, customerSearch, setCustomerSearch, customerModalOpen, setCustomerModalOpen, selectedCustomer, setSelectedCustomer,
    customerDetailOpen, setCustomerDetailOpen, customerEditBusy, setCustomerEditBusy, editCustomerName, setEditCustomerName, editCustomerPhone, setEditCustomerPhone, editCustomerNotes, setEditCustomerNotes, editFollowUpAt, setEditFollowUpAt,
    customerRequirements, setCustomerRequirements, customerRequirementsLoading, setCustomerRequirementsLoading, customerActivities, setCustomerActivities, activitySummary, setActivitySummary, activityType, setActivityType, activityBusy, setActivityBusy,
    customerAppointments, setCustomerAppointments, customerOffers, setCustomerOffers, offerPropertyId, setOfferPropertyId, offerAmount, setOfferAmount, offerStatus, setOfferStatus, offerNotes, setOfferNotes,
    offerBusy, setOfferBusy, appointmentTitle, setAppointmentTitle, appointmentStartsAt, setAppointmentStartsAt, appointmentNotes, setAppointmentNotes, appointmentBusy, setAppointmentBusy, customerName, setCustomerName,
    customerPhone, setCustomerPhone, customerRoles, setCustomerRoles, customerNotes, setCustomerNotes, requirementIntent, setRequirementIntent, requirementType, setRequirementType, requirementCity, setRequirementCity,
    requirementDistrict, setRequirementDistrict, requirementMaxPrice, setRequirementMaxPrice, requirementRooms, setRequirementRooms, customerBusy, setCustomerBusy, matches, setMatches, matchesLoading, setMatchesLoading,
    notifications, setNotifications, notificationsLoading, setNotificationsLoading, notificationsOpen, setNotificationsOpen, propertiesLoading, setPropertiesLoading, propertyBusy, setPropertyBusy, propertyStatusBusy, setPropertyStatusBusy,
    archiveBusy, setArchiveBusy, offerStatusBusyId, setOfferStatusBusyId, tab, setTab, properties, setProperties, selected, setSelected, addOpen, setAddOpen,
    editingPropertyId, setEditingPropertyId, search, setSearch, filter, setFilter, quickTypeFilter, setQuickTypeFilter, quickCityFilter, setQuickCityFilter, quickDistrictFilter, setQuickDistrictFilter,
    quickDropdown, setQuickDropdown, sortBy, setSortBy, showArchived, setShowArchived, statusFilter, setStatusFilter, favoriteIds, setFavoriteIds, favoritesOnly, setFavoritesOnly,
    recentOnly, setRecentOnly, recentPropertyIds, setRecentPropertyIds, portfolioPresentationMode, setPortfolioPresentationMode, selectedPresentationIds, setSelectedPresentationIds, transactionModalOpen, setTransactionModalOpen, transactionPropertyId, setTransactionPropertyId,
    transactionFinalPrice, setTransactionFinalPrice, transactionOfficeCommission, setTransactionOfficeCommission, transactionAgentCommission, setTransactionAgentCommission, transactionDate, setTransactionDate, transactionNotes, setTransactionNotes, transactionBusy, setTransactionBusy,
    csvImportOpen, setCsvImportOpen, csvImportText, setCsvImportText, csvImportBusy, setCsvImportBusy, profileModalOpen, setProfileModalOpen, profilePhone, setProfilePhone, profileEmail, setProfileEmail,
    profileAvatarPath, setProfileAvatarPath, profileAvatarUrl, setProfileAvatarUrl, profileAvatarUri, setProfileAvatarUri, profileBusy, setProfileBusy, currentPassword, setCurrentPassword, profileNewPassword, setProfileNewPassword,
    profileConfirmPassword, setProfileConfirmPassword, passwordBusy, setPasswordBusy, excelFileName, setExcelFileName, excelPreviewCount, setExcelPreviewCount, minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter,
    propertyPhotos, setPropertyPhotos, photosBusy, setPhotosBusy, title, setTitle, address, setAddress, price, setPrice, rooms, setRooms,
    area, setArea, kind, setKind, propertyType, setPropertyType, description, setDescription, bathrooms, setBathrooms, balcony, setBalcony,
    parking, setParking, heating, setHeating, cooling, setCooling, occupancyPermit, setOccupancyPermit, elevator, setElevator, nearbyAmenities, setNearbyAmenities,
    buildingAge, setBuildingAge, floorNumber, setFloorNumber, totalFloors, setTotalFloors, ownerContactName, setOwnerContactName, ownerContactPhone, setOwnerContactPhone, selectedOwnerContact, setSelectedOwnerContact,
    pendingPhotoUris, setPendingPhotoUris
  } = useAppState();

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

  const portfolioActionDependencies = {
    transactionBusy, transactionFinalPrice, transactionOfficeCommission, transactionAgentCommission, transactionPropertyId,
    transactionDate, setTransactionBusy, properties, officeId, transactionNotes, loadProperties, setTransactionModalOpen,
    setTransactionPropertyId, setTransactionFinalPrice, setTransactionOfficeCommission, setTransactionAgentCommission, setTransactionNotes,
    setRecentPropertyIds, setSelected, setPropertyPhotos, loadPropertyPhotos, favoriteIds, setFavoriteIds,
  };
  const saveTransaction = async () => saveTransactionService(portfolioActionDependencies);
  const loadRecentViews = async () => loadRecentViewsService(portfolioActionDependencies);
  const openProperty = (property: Property) => openPropertyService(property, portfolioActionDependencies);
  const loadFavorites = async () => loadFavoritesService(portfolioActionDependencies);
  const toggleFavorite = async (property: Property) => toggleFavoriteService(property, portfolioActionDependencies);

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

  const toggleAgentStatus = (person: {id:string; name:string; role:string; status:string}) => toggleAgentStatusService(person, { officeId, setTeamStatusBusyId, loadTeamMembers });

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

  const superadminActionDependencies = { superOfficeName, superOwnerName, superOwnerUsername, superOwnerPassword, setSuperResult, setSuperCreateBusy, setSuperOfficeName, setSuperOwnerName, setSuperOwnerUsername, setSuperOwnerPassword, setAuthenticated, setRole, setLoginUsername, setLoginPassword };
  const handleCreateOfficeAsSuperadmin = async () => createOfficeService(superadminActionDependencies);
  const handleSuperadminLogout = async () => superadminLogoutService(superadminActionDependencies);

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
        {tab === 'home' && <HomeDashboardScreen styles={styles} palette={palette} role={role} setTab={setTab} customers={customers} openCustomerDetail={openCustomerDetail} properties={properties} roleProperties={roleProperties} teamMembers={teamMembers} money={money} openProperty={openProperty} />}

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

        {tab === 'matches' && <MatchesScreen styles={styles} palette={palette} matches={matches} matchesLoading={matchesLoading} money={money} />}

        {tab === 'more' && <MoreScreen styles={styles} palette={palette} setLegalDocument={setLegalDocument} superadminOfficeMode={superadminOfficeMode} setSuperadminOfficeMode={setSuperadminOfficeMode} setRole={setRole} setTab={setTab} setOfficeId={setOfficeId} role={role} setNotificationsOpen={setNotificationsOpen} notifications={notifications} loadNotifications={loadNotifications} officeId={officeId} setRecentOnly={setRecentOnly} setFavoritesOnly={setFavoritesOnly} loadRecentViews={loadRecentViews} setCsvImportOpen={setCsvImportOpen} openProfile={openProfile} exportPortfolioCsv={exportPortfolioCsv} setTransactionPropertyId={setTransactionPropertyId} properties={properties} setTransactionModalOpen={setTransactionModalOpen} handleSignOut={handleSignOut} />}

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
