import { Alert } from 'react-native';
import { getFirebaseClient } from '../lib/firebaseClient';
import type { Property } from '../types/property';

export const loadProperties = async (targetOfficeId: string, deps: any) => {
    const { setPropertiesLoading, setProperties } = deps;
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
      // Load the first sorted photo for each property so cards can show their cover image.
      if (mapped.length) {
        const propertyIds = mapped.map((property: Property) => property.id);
        const photoRows: any[] = [];
        let photoQueryFailed = false;
        // Firestore-compatible adapter caps "in" filters at 30 IDs, so fetch in batches.
        for (let offset = 0; offset < propertyIds.length; offset += 30) {
          const { data: batch, error: photoError } = await firebaseClient.from('property_photos')
            .select('id,property_id,storage_path,sort_order')
            .in('property_id', propertyIds.slice(offset, offset + 30));
          if (photoError) { photoQueryFailed = true; break; }
          photoRows.push(...(batch || []));
        }
        if (!photoQueryFailed && photoRows.length) {
          const firstPhotoByProperty = new Map<string, any>();
          for (const photo of [...photoRows].sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0))) {
            if (!firstPhotoByProperty.has(String(photo.property_id))) firstPhotoByProperty.set(String(photo.property_id), photo);
          }
          await Promise.all(mapped.map(async (property: Property) => {
            const photo = firstPhotoByProperty.get(property.id);
            if (!photo?.storage_path) return;
            const storedPath = String(photo.storage_path);
            if (/^https?:\\/\\//i.test(storedPath)) property.coverPhotoUrl = storedPath;
            else {
              const { data: signed } = await firebaseClient.storage.from('property-photos').createSignedUrl(storedPath, 60 * 60);
              property.coverPhotoUrl = signed?.signedUrl || undefined;
            }
          }));
        }
      }
      setProperties(mapped);
    } finally {
      setPropertiesLoading(false);
    }
  };

export const loadCustomers = async (targetOfficeId: string, deps: any) => {
    const { setCustomersLoading, setCustomers } = deps;
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

export const loadMatches = async (targetOfficeId: string, deps: any) => {
    const { setMatchesLoading, setMatches } = deps;
    setMatchesLoading(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('matches').select('id,status,match_kind,match_score,match_reasons,created_at,properties(id,title,price,listing_type,city,district,neighborhood,rooms),customers(id,full_name,phone)').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Eşleşmeler yüklenemedi. Migration 003 uygulanmış olmalı.');
      setMatches(data || []);
    } finally { setMatchesLoading(false); }
  };

export const loadNotifications = async (targetOfficeId: string, deps: any) => {
    const { setNotificationsLoading, setNotifications } = deps;
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

export const markNotificationRead = async (notificationId: string, deps: any) => {
    const { setNotifications } = deps;
    try {
      const firebaseClient = getFirebaseClient();
      const { error } = await firebaseClient.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
      if (error) throw error;
      setNotifications((current: any[]) => current.map((n: any) => n.id === notificationId ? {...n, read_at: new Date().toISOString()} : n));
    } catch (error) {
      Alert.alert('Bildirim güncellenemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    }
  };

export const loadTeamMembers = async (targetOfficeId: string, deps: any) => {
    const { setTeamMembers } = deps;
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
