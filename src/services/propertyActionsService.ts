import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirebaseClient } from '../lib/firebaseClient';
import { getFirebaseAuth } from '../lib/firebase';
import type { Property, PropertyStatus } from '../types/property';
import { rebuildAllOfficeMatches } from './customerService';

export const updatePropertyStatus = async (nextStatus: PropertyStatus, deps: any) => {
    const { selected, propertyStatusBusy, role, officeId, setPropertyStatusBusy, setProperties, setSelected, loadProperties } = deps;
    if (!selected || propertyStatusBusy) return;
    if (role === 'agent' && selected.ownerAgentId !== getFirebaseAuth().currentUser?.uid) { Alert.alert('İşlem yetkisi yok', 'Yalnızca kendi ilanlarının durumunu değiştirebilirsin.'); return; }
    const statusMap: Record<PropertyStatus, string> = { 'Aktif': 'active', 'Opsiyonlu': 'optioned', 'Satıldı': 'sold', 'Kiralandı': 'rented', 'Arşivde': 'archived' };
    setPropertyStatusBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { error } = await firebaseClient.from('properties').update({ status: statusMap[nextStatus] }).eq('id', selected.id).eq('office_id', officeId);
      if (error) throw error;
      setProperties((current: Property[]) => current.map((p: Property) => p.id === selected.id ? {...p, status: nextStatus} : p));
      setSelected((current: Property | null) => current && current.id === selected.id ? {...current, status: nextStatus} : current);
      Alert.alert('Durum güncellendi', 'İlan durumu: ' + nextStatus);
      await loadProperties(officeId);
    } catch (error) {
      Alert.alert('Güncellenemedi', error instanceof Error ? error.message : 'İlan durumu değiştirilemedi.');
    } finally { setPropertyStatusBusy(false); }
  };

export const openPropertyEditor = (p: Property, deps: any) => {
    const { role, setPendingPhotoUris, setEditingPropertyId, setTitle, setAddress, setPropertyCity, setPropertyDistrict, setPropertyNeighborhood, setPropertyLatitude, setPropertyLongitude, setPrice, setArea, setKind, setRooms, setDescription, setBathrooms, setBalcony, setParking, setHeating, setCooling, setOccupancyPermit, setElevator, setNearbyAmenities, setBuildingAge, setFloorNumber, setTotalFloors, setOwnerContactName, setOwnerContactPhone, setPropertyType, setSelected, setAddOpen } = deps;
    const currentUid = getFirebaseAuth().currentUser?.uid;
    if (role === 'agent' && p.ownerAgentId !== currentUid) { Alert.alert('Düzenleme yetkisi yok', 'Ofis ilanlarını görebilirsin ancak yalnızca kendi eklediğin ilanları düzenleyebilirsin.'); return; }
    setPendingPhotoUris([]);
    setEditingPropertyId(p.id);
    setTitle(p.title); setAddress(p.address); setPropertyCity((p as any).city || 'Muğla'); setPropertyDistrict((p as any).district || ''); setPropertyNeighborhood((p as any).neighborhood || ''); setPropertyLatitude((p as any).latitude == null ? '' : String((p as any).latitude)); setPropertyLongitude((p as any).longitude == null ? '' : String((p as any).longitude)); setPrice(String(p.price)); setArea(p.area.replace(/[^0-9.]/g, ''));
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

export const archiveProperty = async (deps: any) => {
    const { selected, archiveBusy, role, officeId, setArchiveBusy, setSelected, loadProperties } = deps;
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


export const deleteProperty = async (deps: any) => {
  const { selected, role, officeId, setArchiveBusy, archiveBusy, setSelected, setPropertyPhotos, loadProperties, loadMatches } = deps;
  if (!selected || archiveBusy) return;
  if (role === 'agent' && selected.ownerAgentId !== getFirebaseAuth().currentUser?.uid) {
    Alert.alert('İşlem yetkisi yok', 'Yalnızca kendi ilanlarını silebilirsin.');
    return;
  }
  Alert.alert('İlanı kalıcı olarak sil', '"' + selected.title + '" ilanı, fotoğraf kayıtları ve eşleştirmeleriyle birlikte silinecek. Bu işlem geri alınamaz.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'İlanı sil', style: 'destructive', onPress: async () => {
      setArchiveBusy(true);
      try {
        const db = getFirebaseClient();
        const propertyId = selected.id;
        const { error: matchError } = await db.from('matches').delete().eq('office_id', officeId).eq('property_id', propertyId);
        if (matchError) throw new Error('İlan eşleştirmeleri silinemedi: ' + matchError.message);
        const { error: offerError } = await db.from('property_offers').delete().eq('office_id', officeId).eq('property_id', propertyId);
        if (offerError) throw new Error('İlan teklifleri silinemedi: ' + offerError.message);
        const { error: photoError } = await db.from('property_photos').delete().eq('office_id', officeId).eq('property_id', propertyId);
        if (photoError) throw new Error('Fotoğraf kayıtları silinemedi: ' + photoError.message);
        const { error } = await db.from('properties').delete().eq('id', propertyId).eq('office_id', officeId);
        if (error) throw error;
        setSelected(null);
        setPropertyPhotos([]);
        await loadProperties(officeId);
        await loadMatches(officeId);
        Alert.alert('İlan silindi', 'İlan ve bağlı kayıtları silindi.');
      } catch (error) {
        Alert.alert('İlan silinemedi', error instanceof Error ? error.message : 'İlan silinemedi. Veritabanı izinlerini kontrol et.');
      } finally { setArchiveBusy(false); }
    }}
  ]);
};

export const choosePropertyPhotos = async (deps: any) => {
    const { pendingPhotoUris, setPendingPhotoUris } = deps;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Galeri izni gerekli', 'İlan fotoğrafı seçmek için galeri izni vermelisin.'); return; }
    const remaining = Math.max(0, 12 - pendingPhotoUris.length);
    if (remaining === 0) { Alert.alert('Fotoğraf sınırı', 'Bir ilana en fazla 12 fotoğraf ekleyebilirsin.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.82 });
    if (result.canceled) return;
    setPendingPhotoUris((current: any[]) => [...current, ...result.assets.map(asset => ({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName }))].slice(0, 12));
  };

export const uploadPendingPropertyPhotos = async (propertyId: string, deps: any) => {
    const { pendingPhotoUris, officeId, setPendingPhotoUris } = deps;
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
      const { data: uploaded, error: uploadError } = await firebaseClient.storage.from('property-photos').upload(storagePath, blob, { contentType: isPng ? 'image/png' : 'image/jpeg', upsert: false });
      if (uploadError) throw new Error('Fotoğraf depolamaya yüklenemedi: ' + (uploadError.message || 'sağlayıcı hatası'));
      // Cloudinary returns a permanent HTTPS URL; save it so gallery/PDF can resolve it later.
      const persistedPath = uploaded?.url || uploaded?.path || storagePath;
      const { error: rowError } = await firebaseClient.from('property_photos').insert({ property_id: propertyId, office_id: officeId, storage_path: persistedPath, sort_order: sortOrder });
      if (rowError) {
        if (!/^https?:\/\//i.test(persistedPath)) await firebaseClient.storage.from('property-photos').remove([persistedPath]);
        throw new Error('Fotoğraf kaydı oluşturulamadı: ' + (rowError.message || 'veritabanı hatası'));
      }
      sortOrder += 1;
    }
    setPendingPhotoUris([]);
  };

export const saveProperty = async (deps: any) => {
    const { propertyBusy, editingPropertyId, properties, role, title, address, propertyCity, propertyDistrict, propertyNeighborhood, propertyLatitude, propertyLongitude, price, area, rooms, propertyType, kind, description, bathrooms, balcony, parking, heating, cooling, occupancyPermit, elevator, nearbyAmenities, buildingAge, floorNumber, totalFloors, ownerContactName, ownerContactPhone, setPropertyBusy, officeId, pendingPhotoUris, loadProperties, loadMatches, setAddOpen, setEditingPropertyId, setTitle, setAddress, setPropertyCity, setPropertyDistrict, setPropertyNeighborhood, setPropertyLatitude, setPropertyLongitude, setPrice, setArea, setDescription, setPropertyType, setPendingPhotoUris, setOwnerContactName, setOwnerContactPhone } = deps;
    if (propertyBusy) return;
    if (editingPropertyId) { const existing = properties.find((p: Property) => p.id === editingPropertyId); if (role === 'agent' && existing?.ownerAgentId !== getFirebaseAuth().currentUser?.uid) { Alert.alert('Düzenleme yetkisi yok', 'Yalnızca kendi ilanlarını düzenleyebilirsin.'); return; } }
    const cleanTitle = title.trim();
    const cleanAddress = String(address ?? '').trim();
    const cleanCity = String(propertyCity ?? '').trim();
    const cleanDistrict = String(propertyDistrict ?? '').trim();
    const cleanNeighborhood = String(propertyNeighborhood ?? '').trim();
    const latitude = propertyLatitude === '' || propertyLatitude == null ? null : Number(String(propertyLatitude).replace(',', '.'));
    const longitude = propertyLongitude === '' || propertyLongitude == null ? null : Number(String(propertyLongitude).replace(',', '.'));
    const priceDigits = price.replace(/[^0-9]/g, '');
    const numericPrice = Number(priceDigits);
    const normalizedArea = area.trim().replace(',', '.');
    const numericArea = Number(normalizedArea);
    if (!cleanTitle || !cleanAddress || !cleanCity || !cleanDistrict || !cleanNeighborhood || !price.trim() || !area.trim()) {
      Alert.alert('Eksik bilgi', 'İlan başlığı, il, ilçe, mahalle, açık adres, fiyat ve metrekare zorunludur.');
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
      if ((latitude !== null && !Number.isFinite(latitude)) || (longitude !== null && !Number.isFinite(longitude)) || ((latitude === null) !== (longitude === null))) { Alert.alert('Konumu kontrol et', 'Enlem ve boylam birlikte girilmeli ve sayısal olmalı.'); setPropertyBusy(false); return; }
      const payload = {
        title: cleanTitle, address: cleanAddress,
        district: cleanDistrict,
        city: cleanCity,
         neighborhood: cleanNeighborhood,
         latitude,
         longitude,
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
        try { await uploadPendingPropertyPhotos(savedId, deps); }
        catch (photoError) { Alert.alert('İlan kaydedildi, fotoğraf yüklemesi tamamlanmadı', photoError instanceof Error ? photoError.message : 'Fotoğrafları ilan detayından tekrar ekleyebilirsin.'); }
      }
      await loadProperties(officeId);
      if (savedId) {
        try {
          await rebuildAllOfficeMatches(officeId);
          await loadMatches(officeId);
        } catch (matchingError) {
          Alert.alert('Eşleştirme güncellenemedi', matchingError instanceof Error ? matchingError.message : 'Portföy kaydedildi ancak eşleştirmeler yenilenemedi.');
        }
      }
      setAddOpen(false); setEditingPropertyId(null);
      setTitle(''); setAddress(''); setPropertyCity('Muğla'); setPropertyDistrict(''); setPropertyNeighborhood(''); setPropertyLatitude(''); setPropertyLongitude(''); setPrice(''); setArea(''); setDescription(''); setPropertyType('apartment'); setPendingPhotoUris([]); setOwnerContactName(''); setOwnerContactPhone('');
      Alert.alert(editingPropertyId?'Portföy güncellendi':'Portföy eklendi',editingPropertyId?'Değişiklikler kaydedildi.':'Yeni portföy kaydedildi.');
    } catch (error) {
      Alert.alert('Portföy kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally {
      setPropertyBusy(false);
    }
  };
