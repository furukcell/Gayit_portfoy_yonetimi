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
      setCustomerOffers(current => [data, ...current]);
      await addCustomerActivityForOffer('Teklif kaydedildi: ' + (properties.find(p => p.id === offerPropertyId)?.title || 'Portföy') + ' · ' + money(amount) + ' · ' + offerStatus, deps);
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
      setCustomerAppointments((current: any[]) => [...current, data].sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));
      setAppointmentStartsAt(''); setAppointmentNotes('');
      Alert.alert('Randevu oluşturuldu', 'Randevu müşteri detayına kaydedildi.');
    } catch (error) {
      Alert.alert('Randevu oluşturulamadı', error instanceof Error ? error.message : 'Randevu kaydedilemedi.');
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

export const addRequirementForSelectedCustomer = async (deps: any) => {
    const { selectedCustomer, requirementMaxPrice, requirementDistrict, requirementCity, requirementRooms, setCustomerEditBusy, officeId, requirementIntent, requirementType, setCustomerRequirements, loadMatches, loadCustomers, setRequirementIntent, setRequirementType, setRequirementCity, setRequirementDistrict, setRequirementMaxPrice, setRequirementRooms } = deps;
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
      setCustomerRequirements((current: any[]) => [data, ...current]);
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

export const saveCustomer = async (deps: any) => {
    const { customerName, customerRoles, setCustomerBusy, officeId, customerPhone, customerNotes, requirementMaxPrice, requirementIntent, requirementDistrict, requirementRooms, requirementType, requirementCity, loadCustomers, loadMatches, setCustomerModalOpen, setCustomerName, setCustomerPhone, setCustomerRoles, setCustomerNotes, setRequirementIntent, setRequirementType, setRequirementCity, setRequirementDistrict, setRequirementMaxPrice, setRequirementRooms } = deps;
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
