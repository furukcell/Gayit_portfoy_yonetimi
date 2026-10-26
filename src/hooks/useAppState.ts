import { useState } from 'react';
import type { Role, Tab, Customer, PropertyStatus, PropertyPhoto, Property } from '../types/property';
import type { LegalDocumentKey } from '../legalDocuments';
import { initialProperties } from '../data/initialProperties';

export default function useAppState() {
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
  const [requirementNeighborhood, setRequirementNeighborhood] = useState('');
  const [requirementMinPrice, setRequirementMinPrice] = useState('');
  const [requirementMaxPrice, setRequirementMaxPrice] = useState('');
  const [requirementMinArea, setRequirementMinArea] = useState('');
  const [requirementMaxArea, setRequirementMaxArea] = useState('');
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
  const [officeBrandingOpen, setOfficeBrandingOpen] = useState(false);
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
  const [minAreaFilter, setMinAreaFilter] = useState('');
  const [maxAreaFilter, setMaxAreaFilter] = useState('');
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('Muğla');
  const [propertyDistrict, setPropertyDistrict] = useState('');
  const [propertyNeighborhood, setPropertyNeighborhood] = useState('');
  const [propertyLatitude, setPropertyLatitude] = useState('');
  const [propertyLongitude, setPropertyLongitude] = useState('');
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
  return {
    role, setRole, authenticated, setAuthenticated, legalAccepted, setLegalAccepted, legalReady, setLegalReady, legalReadPrivacy, setLegalReadPrivacy,
    legalAcceptTerms, setLegalAcceptTerms, legalDocument, setLegalDocument, legalGateBusy, setLegalGateBusy, authBusy, setAuthBusy, loginUsername, setLoginUsername,
    loginPassword, setLoginPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, mustChangePassword, setMustChangePassword, authError, setAuthError,
    officeId, setOfficeId, superadminOfficeMode, setSuperadminOfficeMode, superOfficeName, setSuperOfficeName, superOwnerName, setSuperOwnerName, superOwnerUsername, setSuperOwnerUsername,
    superOwnerPassword, setSuperOwnerPassword, superCreateBusy, setSuperCreateBusy, superResult, setSuperResult, agentModalOpen, setAgentModalOpen, agentName, setAgentName,
    agentUsername, setAgentUsername, agentPassword, setAgentPassword, agentAvatarUri, setAgentAvatarUri, agentBusy, setAgentBusy, teamMembers, setTeamMembers,
    teamStatusBusyId, setTeamStatusBusyId, customers, setCustomers, customersLoading, setCustomersLoading, customerSearch, setCustomerSearch, customerModalOpen, setCustomerModalOpen,
    selectedCustomer, setSelectedCustomer, customerDetailOpen, setCustomerDetailOpen, customerEditBusy, setCustomerEditBusy, editCustomerName, setEditCustomerName, editCustomerPhone, setEditCustomerPhone,
    editCustomerNotes, setEditCustomerNotes, editFollowUpAt, setEditFollowUpAt, customerRequirements, setCustomerRequirements, customerRequirementsLoading, setCustomerRequirementsLoading, customerActivities, setCustomerActivities,
    activitySummary, setActivitySummary, activityType, setActivityType, activityBusy, setActivityBusy, customerAppointments, setCustomerAppointments, customerOffers, setCustomerOffers,
    offerPropertyId, setOfferPropertyId, offerAmount, setOfferAmount, offerStatus, setOfferStatus, offerNotes, setOfferNotes, offerBusy, setOfferBusy,
    appointmentTitle, setAppointmentTitle, appointmentStartsAt, setAppointmentStartsAt, appointmentNotes, setAppointmentNotes, appointmentBusy, setAppointmentBusy, customerName, setCustomerName,
    customerPhone, setCustomerPhone, customerRoles, setCustomerRoles, customerNotes, setCustomerNotes, requirementIntent, setRequirementIntent, requirementType, setRequirementType,
    requirementCity, setRequirementCity, requirementDistrict, setRequirementDistrict, requirementNeighborhood, setRequirementNeighborhood, requirementMinPrice, setRequirementMinPrice, requirementMaxPrice, setRequirementMaxPrice, requirementMinArea, setRequirementMinArea, requirementMaxArea, setRequirementMaxArea, requirementRooms, setRequirementRooms, customerBusy, setCustomerBusy,
    matches, setMatches, matchesLoading, setMatchesLoading, notifications, setNotifications, notificationsLoading, setNotificationsLoading, notificationsOpen, setNotificationsOpen,
    propertiesLoading, setPropertiesLoading, propertyBusy, setPropertyBusy, propertyStatusBusy, setPropertyStatusBusy, archiveBusy, setArchiveBusy, offerStatusBusyId, setOfferStatusBusyId,
    tab, setTab, properties, setProperties, selected, setSelected, addOpen, setAddOpen, editingPropertyId, setEditingPropertyId,
    search, setSearch, filter, setFilter, quickTypeFilter, setQuickTypeFilter, quickCityFilter, setQuickCityFilter, quickDistrictFilter, setQuickDistrictFilter,
    quickDropdown, setQuickDropdown, sortBy, setSortBy, showArchived, setShowArchived, statusFilter, setStatusFilter, favoriteIds, setFavoriteIds,
    favoritesOnly, setFavoritesOnly, recentOnly, setRecentOnly, recentPropertyIds, setRecentPropertyIds, portfolioPresentationMode, setPortfolioPresentationMode, selectedPresentationIds, setSelectedPresentationIds,
    transactionModalOpen, setTransactionModalOpen, transactionPropertyId, setTransactionPropertyId, transactionFinalPrice, setTransactionFinalPrice, transactionOfficeCommission, setTransactionOfficeCommission, transactionAgentCommission, setTransactionAgentCommission,
    transactionDate, setTransactionDate, transactionNotes, setTransactionNotes, transactionBusy, setTransactionBusy, csvImportOpen, setCsvImportOpen, csvImportText, setCsvImportText,
    csvImportBusy, setCsvImportBusy, profileModalOpen, setProfileModalOpen, officeBrandingOpen, setOfficeBrandingOpen, profilePhone, setProfilePhone, profileEmail, setProfileEmail, profileAvatarPath, setProfileAvatarPath,
    profileAvatarUrl, setProfileAvatarUrl, profileAvatarUri, setProfileAvatarUri, profileBusy, setProfileBusy, currentPassword, setCurrentPassword, profileNewPassword, setProfileNewPassword,
    profileConfirmPassword, setProfileConfirmPassword, passwordBusy, setPasswordBusy, excelFileName, setExcelFileName, excelPreviewCount, setExcelPreviewCount, minPriceFilter, setMinPriceFilter,
    maxPriceFilter, setMaxPriceFilter, minAreaFilter, setMinAreaFilter, maxAreaFilter, setMaxAreaFilter, propertyPhotos, setPropertyPhotos, photosBusy, setPhotosBusy, title, setTitle, address, setAddress, propertyCity, setPropertyCity, propertyDistrict, setPropertyDistrict, propertyNeighborhood, setPropertyNeighborhood, propertyLatitude, setPropertyLatitude, propertyLongitude, setPropertyLongitude,
    price, setPrice, rooms, setRooms, area, setArea, kind, setKind, propertyType, setPropertyType,
    description, setDescription, bathrooms, setBathrooms, balcony, setBalcony, parking, setParking, heating, setHeating,
    cooling, setCooling, occupancyPermit, setOccupancyPermit, elevator, setElevator, nearbyAmenities, setNearbyAmenities, buildingAge, setBuildingAge,
    floorNumber, setFloorNumber, totalFloors, setTotalFloors, ownerContactName, setOwnerContactName, ownerContactPhone, setOwnerContactPhone, selectedOwnerContact, setSelectedOwnerContact,
    pendingPhotoUris, setPendingPhotoUris
  };
}
