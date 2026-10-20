import React, { useEffect, useMemo, useRef } from 'react';
import * as Updates from 'expo-updates';
import { palette, styles } from './src/theme/appStyles';
import useAppState from './src/hooks/useAppState';
import AnimatedSplash from './src/components/AnimatedSplash';
import { Stat, Feature } from './src/components/DashboardPrimitives';
import type { Role, Tab, Customer, PropertyStatus, PropertyPhoto, Property } from './src/types/property';
import { escapeCsvCell as escapeCsv, findImportColumn as find, parseSemicolonCsvLine as parseLine } from './src/utils/importHelpers';
import PropertyRow from './src/components/PropertyRow';
import { CustomersScreen } from './src/screens/CustomersScreen';
import TeamScreen from './src/screens/TeamScreen';
import StatsScreen from './src/screens/StatsScreen';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import MoreScreen from './src/screens/MoreScreen';
import AuthForm from './src/components/AuthForm';
import BrandMark from './src/components/BrandMark';
import { OfficeBrandProvider, OfficeBrandTitle, OfficeBrandingModal } from './src/components/OfficeBranding';
import WorkspaceScreens from './src/screens/WorkspaceScreens';
import WorkspaceBottomNavigation from './src/components/WorkspaceBottomNavigation';
import useLegalAcceptance from './src/hooks/useLegalAcceptance';
import useRestoreSession from './src/hooks/useRestoreSession';
import useSelectedOwnerContact from './src/hooks/useSelectedOwnerContact';
import useVisibleProperties from './src/hooks/useVisibleProperties';
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
import { loadCustomerOffers as loadCustomerOffersService, addCustomerOffer as addCustomerOfferService, updateOfferStatus as updateOfferStatusService, openCustomerDetail as openCustomerDetailService, addCustomerAppointment as addCustomerAppointmentService, addCustomerActivity as addCustomerActivityService, addRequirementForSelectedCustomer as addRequirementForSelectedCustomerService, updateCustomer as updateCustomerService, saveCustomer as saveCustomerService, deleteCustomer as deleteCustomerService } from './src/services/customerService';
import { handleLogin as handleLoginService, handleInitialPasswordChange as handleInitialPasswordChangeService, openProfile as openProfileService, chooseProfileAvatar as chooseProfileAvatarService, handleProfilePasswordChange as handleProfilePasswordChangeService, saveProfile as saveProfileService, chooseAgentAvatar as chooseAgentAvatarService, createAgent as createAgentService, handleSignOut as handleSignOutService } from './src/services/accountActionsService';
import { updatePropertyStatus as updatePropertyStatusService, openPropertyEditor as openPropertyEditorService, archiveProperty as archivePropertyService, deleteProperty as deletePropertyService, choosePropertyPhotos as choosePropertyPhotosService, uploadPendingPropertyPhotos as uploadPendingPropertyPhotosService, saveProperty as savePropertyService } from './src/services/propertyActionsService';
import { saveTransaction as saveTransactionService, loadRecentViews as loadRecentViewsService, openProperty as openPropertyService, loadFavorites as loadFavoritesService, toggleFavorite as toggleFavoriteService } from './src/services/portfolioActionsService';
import { toggleAgentStatus as toggleAgentStatusService, handleCreateOfficeAsSuperadmin as createOfficeService, handleSuperadminLogout as superadminLogoutService } from './src/services/officeAdminService';
import {
  Alert, Linking, Modal, Pressable, ScrollView, Share, StatusBar, KeyboardAvoidingView, Platform,
  Text, TextInput, View, Image, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import SuperadminPanel from './src/SuperadminPanel';


const money = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const propertyTypeLabel = (type?: string) => ({ apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'İş yeri', house: 'Müstakil ev', other: 'Diğer' }[type || ''] || type || 'Gayrimenkul');
const htmlEscape = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const shareText = (p: Property) => `🏡 ${p.title}\n${p.address}\n${money(p.price)}\n${p.kind} · ${propertyTypeLabel(p.propertyType)}\n\nGAYIT Portföy Yönetimi`;

export default function App() {
  const otaPromptShownRef = useRef(false);

  useEffect(() => {
    // In installed builds, check the preview/production update channel at startup.
    // Silently skip in development or when the update service is unavailable.
    if (__DEV__ || !Updates.isEnabled || otaPromptShownRef.current) return;
    otaPromptShownRef.current = true;
    let cancelled = false;

    const checkForOtaUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        Alert.alert(
          'Yeni güncelleme hazır',
          'GAYIT için yeni bir güncelleme var. Şimdi uygulamak ister misin?',
          [
            { text: 'Daha sonra', style: 'cancel' },
            {
              text: 'Şimdi güncelle',
              onPress: async () => {
                try {
                  const fetched = await Updates.fetchUpdateAsync();
                  if (fetched.isNew) await Updates.reloadAsync();
                  else Alert.alert('Güncelleme bulunamadı', 'Uygulama zaten güncel görünüyor.');
                } catch {
                  Alert.alert('Güncelleme yapılamadı', 'İnternet bağlantını kontrol edip uygulamayı yeniden aç.');
                }
              },
            },
          ],
          { cancelable: true },
        );
      } catch {
        // No update or temporary network issue: keep the app usable without a popup.
      }
    };

    void checkForOtaUpdate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Immersive sticky: hide Android system navigation controls and let a swipe reveal them temporarily.
    // Use only APIs supported by the installed expo-navigation-bar version.
    void NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);
  const tabHistoryRef = useRef<Tab[]>([]);
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
    csvImportOpen, setCsvImportOpen, csvImportText, setCsvImportText, csvImportBusy, setCsvImportBusy, profileModalOpen, setProfileModalOpen, officeBrandingOpen, setOfficeBrandingOpen, profilePhone, setProfilePhone, profileEmail, setProfileEmail,
    profileAvatarPath, setProfileAvatarPath, profileAvatarUrl, setProfileAvatarUrl, profileAvatarUri, setProfileAvatarUri, profileBusy, setProfileBusy, currentPassword, setCurrentPassword, profileNewPassword, setProfileNewPassword,
    profileConfirmPassword, setProfileConfirmPassword, passwordBusy, setPasswordBusy, excelFileName, setExcelFileName, excelPreviewCount, setExcelPreviewCount, minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter,
    propertyPhotos, setPropertyPhotos, photosBusy, setPhotosBusy, title, setTitle, address, setAddress, price, setPrice, rooms, setRooms,
    area, setArea, kind, setKind, propertyType, setPropertyType, description, setDescription, bathrooms, setBathrooms, balcony, setBalcony,
    parking, setParking, heating, setHeating, cooling, setCooling, occupancyPermit, setOccupancyPermit, elevator, setElevator, nearbyAmenities, setNearbyAmenities,
    buildingAge, setBuildingAge, floorNumber, setFloorNumber, totalFloors, setTotalFloors, ownerContactName, setOwnerContactName, ownerContactPhone, setOwnerContactPhone, selectedOwnerContact, setSelectedOwnerContact,
    pendingPhotoUris, setPendingPhotoUris
  } = useAppState();


  const navigateTab = (nextTab: Tab) => {
    if (nextTab !== tab) {
      tabHistoryRef.current.push(tab);
      setTab(nextTab);
    }
  };

  const handleBack = () => {
    if (legalDocument) { setLegalDocument(null); return; }
    if (profileModalOpen) { setProfileModalOpen(false); return; }
    if (notificationsOpen) { setNotificationsOpen(false); return; }
    if (csvImportOpen) { setCsvImportOpen(false); return; }
    if (transactionModalOpen) { setTransactionModalOpen(false); return; }
    if (agentModalOpen) { setAgentModalOpen(false); return; }
    if (customerDetailOpen) { setCustomerDetailOpen(false); return; }
    if (customerModalOpen) { setCustomerModalOpen(false); return; }
    if (addOpen) { setAddOpen(false); return; }
    if (selected) { setSelected(null); return; }
    if (tabHistoryRef.current.length) {
      setTab(tabHistoryRef.current.pop() as Tab);
      return;
    }
    if (tab !== 'home') { setTab('home'); return; }
  };

  const showBackButton = tab !== 'home' || Boolean(legalDocument || profileModalOpen || notificationsOpen || csvImportOpen || transactionModalOpen || agentModalOpen || customerDetailOpen || customerModalOpen || addOpen || selected);

  useSelectedOwnerContact(selected?.id, setSelectedOwnerContact);

  const { confirmLegalAcceptance } = useLegalAcceptance({
    authenticated, legalReadPrivacy, legalAcceptTerms, legalGateBusy,
    setLegalReady, setLegalAccepted, setLegalGateBusy, setLegalDocument,
  });

  let loadProperties: (targetOfficeId: string) => Promise<any> = async () => {};
  let loadPropertyPhotos: (propertyId: string) => Promise<any> = async () => {};

  const roleProperties = properties;
  const visibleProperties = useVisibleProperties({
    properties, search, minPriceFilter, maxPriceFilter, statusFilter, quickTypeFilter,
    quickCityFilter, quickDistrictFilter, showArchived, filter, favoritesOnly, favoriteIds,
    recentOnly, recentPropertyIds, sortBy, propertyTypeLabel,
  });

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
  loadPropertyPhotos = async (propertyId: string) => loadPropertyPhotosService(propertyId, propertyPhotoDependencies);
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
  loadProperties = async (targetOfficeId: string) => loadPropertiesService(targetOfficeId, officeDataDependencies);
  const loadCustomers = async (targetOfficeId: string) => loadCustomersService(targetOfficeId, officeDataDependencies);
  const loadMatches = async (targetOfficeId: string) => loadMatchesService(targetOfficeId, officeDataDependencies);
  const loadNotifications = async (targetOfficeId: string) => loadNotificationsService(targetOfficeId, officeDataDependencies);
  const markNotificationRead = async (notificationId: string) => markNotificationReadService(notificationId, officeDataDependencies);
  const loadTeamMembers = async (targetOfficeId: string) => loadTeamMembersService(targetOfficeId, officeDataDependencies);

  useRestoreSession({
    setAuthBusy, setAuthError, setRole, setOfficeId, loadProperties, loadCustomers,
    loadMatches, loadNotifications, loadTeamMembers, setMustChangePassword, setAuthenticated,
  });

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
  const deleteCustomer = async () => deleteCustomerService(customerActionDependencies);

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
  const deleteProperty = async () => deletePropertyService(propertyActionDependencies);
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
      />

      <AuthForm styles={styles} palette={palette} mustChangePassword={mustChangePassword} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} authBusy={authBusy} handleInitialPasswordChange={handleInitialPasswordChange} loginUsername={loginUsername} setLoginUsername={setLoginUsername} loginPassword={loginPassword} setLoginPassword={setLoginPassword} handleLogin={handleLogin} authError={authError} />
    </SafeAreaView>;
  }

  return (
    <OfficeBrandProvider officeId={officeId}>
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <LegalDocumentModal legalDocument={legalDocument} setLegalDocument={setLegalDocument} styles={styles} palette={palette} />
      <View style={styles.topbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {showBackButton && <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={handleBack} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F4F8' }}><Ionicons name="arrow-back" size={22} color={palette.navy} /></Pressable>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><BrandMark size={38}/><OfficeBrandTitle /></View>
        </View>
        <Pressable onPress={handleSignOut} style={styles.signOutButton}><Ionicons name="log-out-outline" size={17} color={palette.navy}/><Text style={styles.signOutText}>Çıkış</Text></Pressable>
      </View>

      <WorkspaceScreens {...{
        tab, styles, palette, role, setTab: navigateTab, customers, openCustomerDetail, properties, roleProperties, teamMembers, money, openProperty, portfolioPresentationMode, setPortfolioPresentationMode, setSelectedPresentationIds, selectedPresentationIds, setAddOpen, search, setSearch, quickTypeFilter, quickCityFilter, quickDistrictFilter, setQuickDropdown, quickDropdown, setQuickTypeFilter, setQuickCityFilter, setQuickDistrictFilter, filter, setFilter, sortBy, setSortBy, recentOnly, setRecentOnly, favoritesOnly, setFavoritesOnly, minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter, statusFilter, setStatusFilter, showArchived, setShowArchived, createMultiPropertyPdf, propertiesLoading, visibleProperties, toggleFavorite, favoriteIds, customersLoading, customerSearch, setCustomerSearch, setCustomerModalOpen, matches, matchesLoading, setLegalDocument, superadminOfficeMode, setSuperadminOfficeMode, setRole, setOfficeId, setNotificationsOpen, notifications, loadNotifications, officeId, loadRecentViews, setCsvImportOpen, openProfile, setOfficeBrandingOpen, exportPortfolioCsv, setTransactionPropertyId, setTransactionModalOpen, handleSignOut, teamStatusBusyId, setAgentModalOpen, toggleAgentStatus, sharePortfolioReport
      }} />

      <WorkspaceBottomNavigation styles={styles} palette={palette} tab={tab} setTab={navigateTab} loadFavorites={loadFavorites} loadRecentViews={loadRecentViews} />

      <PortfolioOperationModals transactionModalOpen={transactionModalOpen} setTransactionModalOpen={setTransactionModalOpen} transactionBusy={transactionBusy} setTransactionPropertyId={setTransactionPropertyId} transactionPropertyId={transactionPropertyId} properties={properties} setTransactionFinalPrice={setTransactionFinalPrice} transactionFinalPrice={transactionFinalPrice} money={money} transactionOfficeCommission={transactionOfficeCommission} setTransactionOfficeCommission={setTransactionOfficeCommission} transactionAgentCommission={transactionAgentCommission} setTransactionAgentCommission={setTransactionAgentCommission} transactionDate={transactionDate} setTransactionDate={setTransactionDate} transactionNotes={transactionNotes} setTransactionNotes={setTransactionNotes} saveTransaction={saveTransaction} csvImportOpen={csvImportOpen} setCsvImportOpen={setCsvImportOpen} csvImportBusy={csvImportBusy} pickPortfolioSpreadsheet={pickPortfolioSpreadsheet} excelFileName={excelFileName} excelPreviewCount={excelPreviewCount} csvImportText={csvImportText} setCsvImportText={setCsvImportText} importPortfolioCsv={importPortfolioCsv} />

      <PropertyDetailModal deleteProperty={deleteProperty} selected={selected} setSelected={setSelected} setPropertyPhotos={setPropertyPhotos} propertyPhotos={propertyPhotos} photosBusy={photosBusy} addPropertyPhoto={addPropertyPhoto} movePropertyPhoto={movePropertyPhoto} removePropertyPhoto={removePropertyPhoto} propertyTypeLabel={propertyTypeLabel} money={money} openPropertyEditor={openPropertyEditor} archiveProperty={archiveProperty} propertyStatusBusy={propertyStatusBusy} updatePropertyStatus={updatePropertyStatus} openMap={openMap} shareWhatsApp={shareWhatsApp} createPdf={createPdf} selectedOwnerContact={selectedOwnerContact} />

      <CustomerCreateModal customerModalOpen={customerModalOpen} setCustomerModalOpen={setCustomerModalOpen} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} customerRoles={customerRoles} setCustomerRoles={setCustomerRoles} requirementIntent={requirementIntent} setRequirementIntent={setRequirementIntent} requirementType={requirementType} setRequirementType={setRequirementType} requirementCity={requirementCity} setRequirementCity={setRequirementCity} requirementDistrict={requirementDistrict} setRequirementDistrict={setRequirementDistrict} requirementMaxPrice={requirementMaxPrice} setRequirementMaxPrice={setRequirementMaxPrice} requirementRooms={requirementRooms} setRequirementRooms={setRequirementRooms} customerNotes={customerNotes} setCustomerNotes={setCustomerNotes} customerBusy={customerBusy} saveCustomer={saveCustomer} />

      <CustomerDetailModal deleteCustomer={deleteCustomer} customerDetailOpen={customerDetailOpen} setCustomerDetailOpen={setCustomerDetailOpen} selectedCustomer={selectedCustomer} editCustomerName={editCustomerName} setEditCustomerName={setEditCustomerName} editCustomerPhone={editCustomerPhone} setEditCustomerPhone={setEditCustomerPhone} editFollowUpAt={editFollowUpAt} setEditFollowUpAt={setEditFollowUpAt} editCustomerNotes={editCustomerNotes} setEditCustomerNotes={setEditCustomerNotes} customerEditBusy={customerEditBusy} updateCustomer={updateCustomer} appointmentTitle={appointmentTitle} setAppointmentTitle={setAppointmentTitle} appointmentStartsAt={appointmentStartsAt} setAppointmentStartsAt={setAppointmentStartsAt} appointmentNotes={appointmentNotes} setAppointmentNotes={setAppointmentNotes} appointmentBusy={appointmentBusy} addCustomerAppointment={addCustomerAppointment} customerAppointments={customerAppointments} activityType={activityType} setActivityType={setActivityType} activitySummary={activitySummary} setActivitySummary={setActivitySummary} activityBusy={activityBusy} addCustomerActivity={addCustomerActivity} properties={properties} offerPropertyId={offerPropertyId} setOfferPropertyId={setOfferPropertyId} offerAmount={offerAmount} setOfferAmount={setOfferAmount} offerStatus={offerStatus} setOfferStatus={setOfferStatus} offerNotes={offerNotes} setOfferNotes={setOfferNotes} offerBusy={offerBusy} addCustomerOffer={addCustomerOffer} customerOffers={customerOffers} updateOfferStatus={updateOfferStatus} customerRequirementsLoading={customerRequirementsLoading} customerRequirements={customerRequirements} customerActivities={customerActivities} requirementIntent={requirementIntent} setRequirementIntent={setRequirementIntent} requirementType={requirementType} setRequirementType={setRequirementType} requirementCity={requirementCity} setRequirementCity={setRequirementCity} requirementDistrict={requirementDistrict} setRequirementDistrict={setRequirementDistrict} requirementMaxPrice={requirementMaxPrice} setRequirementMaxPrice={setRequirementMaxPrice} requirementRooms={requirementRooms} setRequirementRooms={setRequirementRooms} addRequirementForSelectedCustomer={addRequirementForSelectedCustomer} money={money} />

      <NotificationsModal notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} notificationsLoading={notificationsLoading} notifications={notifications} markNotificationRead={markNotificationRead} />

      <OfficeBrandingModal visible={officeBrandingOpen} officeId={officeId} onClose={()=>setOfficeBrandingOpen(false)} />

      <ProfileModal profileModalOpen={profileModalOpen} setProfileModalOpen={setProfileModalOpen} profileBusy={profileBusy} chooseProfileAvatar={chooseProfileAvatar} profileAvatarUri={profileAvatarUri} profileAvatarUrl={profileAvatarUrl} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileEmail={profileEmail} setProfileEmail={setProfileEmail} saveProfile={saveProfile} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword} profileNewPassword={profileNewPassword} setProfileNewPassword={setProfileNewPassword} profileConfirmPassword={profileConfirmPassword} setProfileConfirmPassword={setProfileConfirmPassword} passwordBusy={passwordBusy} handleProfilePasswordChange={handleProfilePasswordChange} />

      <AgentModal agentModalOpen={agentModalOpen} setAgentModalOpen={setAgentModalOpen} chooseAgentAvatar={chooseAgentAvatar} agentAvatarUri={agentAvatarUri} agentName={agentName} setAgentName={setAgentName} agentUsername={agentUsername} setAgentUsername={setAgentUsername} agentPassword={agentPassword} setAgentPassword={setAgentPassword} agentBusy={agentBusy} createAgent={createAgent} />

      <PropertyFormModal addOpen={addOpen} setAddOpen={setAddOpen} editingPropertyId={editingPropertyId} setEditingPropertyId={setEditingPropertyId} title={title} setTitle={setTitle} address={address} setAddress={setAddress} kind={kind} setKind={setKind} propertyType={propertyType} setPropertyType={setPropertyType} price={price} setPrice={setPrice} rooms={rooms} setRooms={setRooms} area={area} setArea={setArea} bathrooms={bathrooms} setBathrooms={setBathrooms} balcony={balcony} setBalcony={setBalcony} parking={parking} setParking={setParking} heating={heating} setHeating={setHeating} cooling={cooling} setCooling={setCooling} occupancyPermit={occupancyPermit} setOccupancyPermit={setOccupancyPermit} elevator={elevator} setElevator={setElevator} buildingAge={buildingAge} setBuildingAge={setBuildingAge} floorNumber={floorNumber} setFloorNumber={setFloorNumber} totalFloors={totalFloors} setTotalFloors={setTotalFloors} nearbyAmenities={nearbyAmenities} setNearbyAmenities={setNearbyAmenities} description={description} setDescription={setDescription} ownerContactName={ownerContactName} setOwnerContactName={setOwnerContactName} ownerContactPhone={ownerContactPhone} setOwnerContactPhone={setOwnerContactPhone} pendingPhotoUris={pendingPhotoUris} setPendingPhotoUris={setPendingPhotoUris} choosePropertyPhotos={choosePropertyPhotos} propertyBusy={propertyBusy} saveProperty={saveProperty} />
    </SafeAreaView>
    </OfficeBrandProvider>
  );
}
