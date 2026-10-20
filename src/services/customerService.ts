import { Alert } from 'react-native';
import { getFirebaseClient } from '../lib/firebaseClient';
import { getFirebaseAuth } from '../lib/firebase';
import type { Customer } from '../types/property';

export const loadCustomerOffers = async (targetOfficeId: string, customerId: string, deps: any) => {
    const { setCustomerOffers } = deps;
    try {
      const { data, error } = await getFirebaseClient().from('property_offers').select('*').eq('office_id', targetOfficeId).eq('customer_id', customerId).order('created_at', { ascending: false });
      if (error) throw error;
      setCustomerOffers(data || []);
    } catch (error) {
      setCustomerOffers([]);
      Alert.alert('Teklifler yüklenemedi', error instanceof Error ? error.message : 'Teklif kayıtları alınamadı; property_offers tablosunu kontrol edin.');
    }
  };

export const addCustomerActivityForOffer = async (summary: string, deps: any) => {
    const { selectedCustomer, officeId } = deps;
    if (!selectedCustomer) return;
    const { error } = await getFirebaseClient().from('customer_activities').insert({
      office_id: officeId, customer_id: selectedCustomer.id, created_by: getFirebaseAuth().currentUser?.uid || null,
      activity_type: 'note', summary, occurred_at: new Date().toISOString()
    });
    if (error) throw error;
  };

export const addCustomerOffer = async (deps: any) => {
    const { selectedCustomer, offerAmount, offerPropertyId, offerStatus, offerNotes, setOfferBusy, setCustomerOffers, properties, money, setOfferAmount, setOfferNotes, setOfferStatus, officeId } = deps;
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
      setCustomerOffers((current: any[]) => [data, ...current]);
      await addCustomerActivityForOffer('Teklif kaydedildi: ' + (properties.find((p: any) => p.id === offerPropertyId)?.title || 'Portföy') + ' · ' + money(amount) + ' · ' + offerStatus, deps);
      setOfferAmount(''); setOfferNotes(''); setOfferStatus('pending');
      Alert.alert('Teklif kaydedildi', 'Teklif müşteri geçmişine eklendi.');
    } catch (error) {
      Alert.alert('Teklif kaydedilemedi', error instanceof Error ? error.message : 'Teklif kaydı oluşturulamadı. Veri tabanı şemasını kontrol edin.');
    } finally { setOfferBusy(false); }
  };

export const updateOfferStatus = async (offer: any, status: 'pending'|'countered'|'accepted'|'rejected', deps: any) => {
    const { offerStatusBusyId, setOfferStatusBusyId, officeId, setCustomerOffers } = deps;
    if (offerStatusBusyId) return;
    setOfferStatusBusyId(offer.id);
    try {
      const { error } = await getFirebaseClient().from('property_offers').update({ status, updated_at: new Date().toISOString() }).eq('id', offer.id).eq('office_id', officeId);
      if (error) throw error;
      setCustomerOffers((current: any[]) => current.map((item: any) => item.id === offer.id ? { ...item, status, updated_at: new Date().toISOString() } : item));
    } catch (error) {
      Alert.alert('Teklif güncellenemedi', error instanceof Error ? error.message : 'Teklif durumu güncellenemedi.');
    } finally { setOfferStatusBusyId(null); }
  };

export const openCustomerDetail = async (customer: Customer, deps: any) => {
    const { setSelectedCustomer, setCustomerOffers, setOfferPropertyId, setOfferAmount, setOfferNotes, officeId, setEditCustomerName, setEditCustomerPhone, setEditCustomerNotes, setEditFollowUpAt, setCustomerDetailOpen, setCustomerRequirementsLoading, setCustomerRequirements, setCustomerActivities, setCustomerAppointments } = deps;
    setSelectedCustomer(customer);
    setCustomerOffers([]); setOfferPropertyId(''); setOfferAmount(''); setOfferNotes('');
    await loadCustomerOffers(officeId, customer.id, deps);
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

export const addCustomerAppointment = async (deps: any) => {
    const { selectedCustomer, appointmentStartsAt, setAppointmentBusy, officeId, appointmentTitle, appointmentNotes, setCustomerAppointments, setAppointmentStartsAt, setAppointmentNotes } = deps;
    if (!selectedCustomer || !appointmentStartsAt.trim()) {
      Alert.alert('Tarih eksik', 'Takvimden randevu tarihi ve saatini seç.');
      return false;
    }
    const parsedDate = new Date(appointmentStartsAt.trim().replace(' ', 'T') + (appointmentStartsAt.trim().length === 16 ? ':00' : ''));
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Tarih hatalı', 'Takvimden geçerli bir randevu tarihi ve saati seç.');
      return false;
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
      setCustomerAppointments((current: any[]) => [...current, data].sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));
      setAppointmentStartsAt(''); setAppointmentNotes('');
      Alert.alert('Randevu oluşturuldu', 'Randevu müşteri detayına kaydedildi.');
      return true;
    } catch (error) {
      Alert.alert('Randevu oluşturulamadı', error instanceof Error ? error.message : 'Randevu kaydedilemedi.');
      return false;
    } finally { setAppointmentBusy(false); }
  };

export const addCustomerActivity = async (deps: any) => {
    const { selectedCustomer, activitySummary, setActivityBusy, officeId, activityType, setCustomerActivities, setActivitySummary } = deps;
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
      setCustomerActivities((current: any[]) => [data, ...current]);
      setActivitySummary('');
      Alert.alert('Kayıt eklendi', 'Müşteri görüşme geçmişine eklendi.');
    } catch (error) {
      Alert.alert('Kayıt eklenemedi', error instanceof Error ? error.message : 'Aktivite kaydedilemedi.');
    } finally { setActivityBusy(false); }
  };

const rebuildCustomerMatches = async (officeId: string, customerId: string) => {
  const db = getFirebaseClient();
  const [{ data: requirements, error: reqError }, { data: properties, error: propError }] = await Promise.all([
    db.from('customer_requirements').select('id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,is_active').eq('office_id', officeId).eq('customer_id', customerId).eq('is_active', true),
    db.from('properties').select('id,title,price,listing_type,status,property_type,district,address,rooms,office_id').eq('office_id', officeId).in('status', ['active','optioned'])
  ]);
  if (reqError) throw reqError;
  if (propError) throw propError;

  const { error: clearError } = await db.from('matches').delete().eq('office_id', officeId).eq('customer_id', customerId);
  if (clearError) throw clearError;

  const rows: any[] = [];
  const norm = (value: any) => String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const req of requirements || []) {
    for (const property of properties || []) {
      const reasons: string[] = [];
      let score = 0;

      const intent = norm(req.intent);
      const listing = norm(property.listing_type);
      const isSale = ['sale', 'sell', 'satilik'].includes(intent);
      const isRent = ['rent', 'kiralik', 'lease'].includes(intent);
      if (isSale && ['rent', 'kiralik', 'lease'].includes(listing)) continue;
      if (isRent && !['rent', 'kiralik', 'lease'].includes(listing)) continue;
      score += 25;
      reasons.push('İlan türü uygun');

      const reqType = norm(req.property_type);
      const propType = norm(property.property_type);
      const sameType = !reqType || !propType || reqType === propType ||
        (reqType.includes('apartment') && propType.includes('daire')) ||
        (reqType.includes('daire') && propType.includes('apartment'));
      if (!sameType) continue;
      if (reqType && propType) {
        score += 20;
        reasons.push('Gayrimenkul türü uygun');
      }

      // Property records currently expose district/address, not a reliable separate city field.
      // Do not let a city-only requirement block every listing; use district/neighborhood when available.
      const propertyLocation = norm([property.district, property.address].filter(Boolean).join(' '));
      const wantedArea = norm([req.district, req.neighborhood].filter(Boolean).join(' '));
      if (wantedArea) {
        const tokens = wantedArea.split(/[ ,]+/).filter((token: string) => token.length > 2);
        const matchedTokens = tokens.filter((token: string) => propertyLocation.includes(token));
        if (tokens.length && matchedTokens.length === 0) continue;
        if (tokens.length) {
          score += Math.round(30 * matchedTokens.length / tokens.length);
          reasons.push(matchedTokens.length === tokens.length ? 'Konum uygun' : 'Konum kısmen uygun');
        }
      } else if (req.city) {
        score += 15;
        reasons.push('Şehir kriteri dikkate alındı');
      }

      const price = Number(property.price || 0);
      const minPrice = req.min_price == null || req.min_price === '' ? null : Number(req.min_price);
      const maxPrice = req.max_price == null || req.max_price === '' ? null : Number(req.max_price);
      const hasMin = minPrice != null && Number.isFinite(minPrice) && minPrice > 0;
      const hasMax = maxPrice != null && Number.isFinite(maxPrice) && maxPrice > 0;
      const inExactBudget = (!hasMin || price >= (minPrice as number)) && (!hasMax || price <= (maxPrice as number));

      let inFlexibleBudget = inExactBudget;
      if (!inExactBudget && price > 0 && (hasMin || hasMax)) {
        const flexibleMin = hasMin ? (minPrice as number) * 0.9 : 0;
        const flexibleMax = hasMax ? (maxPrice as number) * 1.1 : Number.POSITIVE_INFINITY;
        inFlexibleBudget = price >= flexibleMin && price <= flexibleMax;
      }
      if ((hasMin || hasMax) && !inFlexibleBudget) continue;

      if (hasMin || hasMax) {
        if (inExactBudget) {
          score += 15;
          reasons.push('Bütçe aralığında · tam eşleşme');
        } else {
          score += 8;
          let boundary = 'Bütçe esnekliği içinde';
          if (hasMax && price > (maxPrice as number)) {
            boundary = 'Tavan bütçenin %' + Math.round((price / (maxPrice as number) - 1) * 100) + ' üzerinde';
          } else if (hasMin && price < (minPrice as number)) {
            boundary = 'Taban bütçenin %' + Math.round((1 - price / (minPrice as number)) * 100) + ' altında';
          }
          reasons.push('%10 esnek bütçe · ' + boundary);
        }
      }

      const wantedRooms = Array.isArray(req.rooms) ? req.rooms.map(norm).filter(Boolean) : [];
      if (wantedRooms.length && !wantedRooms.some((room: string) => norm(property.rooms).includes(room))) continue;
      if (wantedRooms.length) {
        score += 10;
        reasons.push('Oda sayısı uygun');
      }

      rows.push({
        office_id: officeId,
        customer_id: customerId,
        property_id: property.id,
        status: 'new',
        match_kind: inExactBudget ? 'exact' : 'alternative',
        match_score: Math.min(100, score),
        match_reasons: reasons
      });
    }
  }

  if (rows.length) {
    const { error } = await db.from('matches').insert(rows);
    if (error) throw error;
  }
};
export const rebuildAllOfficeMatches = async (officeId: string) => {
  const db = getFirebaseClient();
  const { data, error } = await db.from('customer_requirements')
    .select('customer_id').eq('office_id', officeId).eq('is_active', true);
  if (error) throw error;
  const customerIds = [...new Set((data || []).map((row: any) => row.customer_id).filter(Boolean))];
  for (const customerId of customerIds) {
    await rebuildCustomerMatches(officeId, customerId);
  }
};

export const addRequirementForSelectedCustomer = async (deps: any) => {
    const { selectedCustomer, requirementMaxPrice, requirementDistrict, requirementCity, requirementRooms, setCustomerEditBusy, officeId, requirementIntent, requirementType, setCustomerRequirements, loadMatches, loadCustomers, setRequirementIntent, setRequirementType, setRequirementCity, setRequirementDistrict, setRequirementMaxPrice, setRequirementRooms } = deps;
    if (!selectedCustomer) return;
    const safeMaxPrice = String(requirementMaxPrice ?? '');
    const safeDistrict = String(requirementDistrict ?? '');
    const safeCity = String(requirementCity ?? '');
    const safeRooms = String(requirementRooms ?? '');
    const maxPrice = Number(safeMaxPrice.replace(/[^0-9]/g, ''));
    if (!safeDistrict.trim() && !safeCity.trim() && !safeMaxPrice.trim() && !safeRooms.trim()) {
      Alert.alert('Arama kriteri eksik', 'En azından konum, bütçe veya oda kriterlerinden birini gir.');
      return;
    }
    setCustomerEditBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('customer_requirements').insert({
        office_id: officeId, customer_id: selectedCustomer.id, intent: requirementIntent,
        property_type: requirementType, city: safeCity.trim(), district: safeDistrict.trim(),
        max_price: maxPrice > 0 ? maxPrice : null,
        rooms: safeRooms.trim() ? [safeRooms.trim()] : [], is_active: true,
      }).select('id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,must_have,notes,is_active,created_at').single();
      if (error) throw error;
      setCustomerRequirements((current: any[]) => [data, ...current]);
      await rebuildCustomerMatches(officeId, selectedCustomer.id);
      await loadMatches(officeId);
      await loadCustomers(officeId);
      setRequirementIntent('sale'); setRequirementType('apartment'); setRequirementCity('Muğla');
      setRequirementDistrict(''); setRequirementMaxPrice(''); setRequirementRooms('');
      Alert.alert('Talep eklendi', 'Müşteriye yeni arama talebi kaydedildi.');
    } catch (error) {
      Alert.alert('Talep eklenemedi', error instanceof Error ? error.message : 'Arama talebi kaydedilemedi.');
    } finally { setCustomerEditBusy(false); }
  };

export const updateCustomer = async (deps: any) => {
    const { selectedCustomer, editCustomerName, editCustomerPhone, editCustomerNotes, editFollowUpAt, setCustomerEditBusy, officeId, loadCustomers, setSelectedCustomer } = deps;
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


export const deleteCustomer = async (deps: any) => {
  const { selectedCustomer, officeId, setCustomerEditBusy, setCustomerDetailOpen, setSelectedCustomer, loadCustomers, loadMatches } = deps;
  if (!selectedCustomer) return;
  Alert.alert('Müşteriyi sil', '"' + (selectedCustomer.fullName || 'Bu müşteri') + '" ve bağlı talep, teklif, randevu ve görüşme kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Müşteriyi sil', style: 'destructive', onPress: async () => {
      setCustomerEditBusy(true);
      try {
        const db = getFirebaseClient();
        const customerId = selectedCustomer.id;
        for (const table of ['matches', 'property_offers', 'customer_activities', 'appointments', 'customer_requirements']) {
          const { error } = await db.from(table).delete().eq('office_id', officeId).eq('customer_id', customerId);
          if (error) throw new Error(table + ': ' + error.message);
        }
        const { error } = await db.from('customers').delete().eq('id', customerId).eq('office_id', officeId);
        if (error) throw error;
        setCustomerDetailOpen(false);
        setSelectedCustomer(null);
        await loadCustomers(officeId);
        await loadMatches(officeId);
        Alert.alert('Müşteri silindi', 'Müşteri ve bağlı kayıtları silindi.');
      } catch (error) {
        Alert.alert('Müşteri silinemedi', error instanceof Error ? error.message : 'Kayıtlar silinemedi. Veritabanı izinlerini kontrol et.');
      } finally { setCustomerEditBusy(false); }
    }}
  ]);
};

export const saveCustomer = async (deps: any) => {
    const { customerName, customerRoles, setCustomerBusy, officeId, customerPhone, customerNotes, requirementMaxPrice, requirementIntent, requirementDistrict, requirementRooms, requirementType, requirementCity, loadCustomers, loadMatches, setCustomerModalOpen, setCustomerName, setCustomerPhone, setCustomerRoles, setCustomerNotes, setRequirementIntent, setRequirementType, setRequirementCity, setRequirementDistrict, setRequirementMaxPrice, setRequirementRooms } = deps;
    if (!customerName?.trim()) { Alert.alert('Eksik bilgi', 'Müşterinin adını gir.'); return; }
    if (!Array.isArray(customerRoles) || customerRoles.length === 0) { Alert.alert('Müşteri türü', 'En az bir müşteri rolü seç.'); return; }
    setCustomerBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data: userResult, error: userError } = await firebaseClient.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const { data: customer, error } = await firebaseClient.from('customers').insert({ office_id: officeId, assigned_agent_id: userResult.user.id, created_by: userResult.user.id, full_name: customerName.trim(), phone: String(customerPhone ?? '').trim(), roles: customerRoles, notes: String(customerNotes ?? '').trim() }).select('id').single();
      if (error || !customer) throw new Error(error?.message || 'Müşteri kaydedilemedi. Migration 003 ve RLS ayarlarını kontrol et.');
      const safeMaxPrice = String(requirementMaxPrice ?? '');
      const safeDistrict = String(requirementDistrict ?? '');
      const safeRooms = String(requirementRooms ?? '');
      const safeCity = String(requirementCity ?? '');
      const maxPrice = Number(safeMaxPrice.replace(/[^0-9]/g, ''));
      const hasRequirement = !!(requirementIntent !== 'sale' || safeDistrict.trim() || safeMaxPrice.trim() || safeRooms.trim() || requirementType !== 'apartment' || safeCity.trim() !== 'Muğla');
      if (hasRequirement) {
        const hasActualSearchCriteria = !!(safeDistrict.trim() || safeMaxPrice.trim() || safeRooms.trim() || safeCity.trim());
        if (!hasActualSearchCriteria) {
          await loadCustomers(officeId);
          setCustomerModalOpen(false); setCustomerName(''); setCustomerPhone(''); setCustomerRoles(['buyer']); setCustomerNotes(''); setRequirementIntent('sale'); setRequirementType('apartment'); setRequirementCity('Muğla'); setRequirementDistrict(''); setRequirementMaxPrice(''); setRequirementRooms('');
          Alert.alert('Müşteri kaydedildi', 'Müşteri kaydedildi. Arama talebi için konum, bütçe veya oda kriterlerinden en az birini girmen yeterli.');
          return;
        }
        const { error: requirementError } = await firebaseClient.from('customer_requirements').insert({ office_id: officeId, customer_id: customer.id, intent: requirementIntent, property_type: requirementType, city: safeCity.trim(), district: safeDistrict.trim(), max_price: maxPrice > 0 ? maxPrice : null, rooms: safeRooms.trim() ? [safeRooms.trim()] : [], is_active: true });
        if (requirementError) {
          await firebaseClient.from('customers').delete().eq('id', customer.id).eq('office_id', officeId);
          throw new Error('Arama kriterleri kaydedilemediği için müşteri kaydı tamamlanmadı: ' + requirementError.message);
        }
      }
      await loadCustomers(officeId);
      let matchWarning = '';
      if (hasRequirement) {
        try {
          await rebuildCustomerMatches(officeId, customer.id);
          await loadMatches(officeId);
        } catch (matchingError) {
          matchWarning = ' Eşleştirme yenilenemedi: ' + (matchingError instanceof Error ? matchingError.message : 'bilinmeyen hata');
        }
      }
      setCustomerModalOpen(false); setCustomerName(''); setCustomerPhone(''); setCustomerRoles(['buyer']); setCustomerNotes(''); setRequirementIntent('sale'); setRequirementType('apartment'); setRequirementCity('Muğla'); setRequirementDistrict(''); setRequirementMaxPrice(''); setRequirementRooms('');
      Alert.alert('Müşteri kaydedildi', hasRequirement ? 'Müşteri ve arama talebi kaydedildi.' + matchWarning : 'Müşteri kaydedildi. İstersen daha sonra arama talebi ekleyebilirsin.');
    } catch (error) { Alert.alert('Müşteri kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.'); }
    finally { setCustomerBusy(false); }
  };
