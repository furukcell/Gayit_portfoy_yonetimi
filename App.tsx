import React, { useMemo, useState } from 'react';
import { changeInitialPassword, signInWithUsername } from './src/lib/usernameAuth';
import {
  Alert, Linking, Modal, Pressable, ScrollView, Share, StatusBar,
  StyleSheet, Text, TextInput, View, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseClient } from './src/lib/supabase';

type Role = 'owner' | 'agent';
type Tab = 'home' | 'portfolio' | 'customers' | 'matches' | 'more' | 'team' | 'stats';
type Customer = { id: string; fullName: string; phone: string; roles: string[]; assignedAgent: string; notes: string; active: boolean; requirementCount: number; nextFollowUpAt: string | null; assignedAgentId: string };
type PropertyStatus = 'Aktif' | 'Opsiyonlu' | 'Satıldı' | 'Kiralandı' | 'Arşivde';
type PropertyPhoto = { id: string; storagePath: string; url: string; sortOrder: number };
type Property = {
  id: string; title: string; address: string; district: string; price: number;
  rooms: string; area: string; propertyType?: string; kind: 'Satılık' | 'Kiralık'; status: PropertyStatus;
  agent: string; ownerAgentId: string; views: number; createdAt: string; description: string;
};

const palette = {
  navy: '#10243A', navy2: '#1A3652', gold: '#C99A4A', goldSoft: '#F6EBDD',
  bg: '#F4F6F9', white: '#FFFFFF', ink: '#17283B', muted: '#778597',
  line: '#E3E8EF', green: '#16805D', greenSoft: '#E5F5ED', amber: '#9A6714',
  amberSoft: '#FFF3D9', red: '#B54747', redSoft: '#FCEBEC',
};
const initialProperties: Property[] = [
  { id: 'GY-1024', title: 'Modern Aile Dairesi', address: 'İsmetpaşa Mahallesi, Milas, Muğla', district: 'Milas', price: 4250000, rooms: '3+1', area: '145 m²', kind: 'Satılık', status: 'Aktif', agent: 'Mert Yılmaz', ownerAgentId: 'demo-agent-1', views: 0, createdAt: '12 Ekim 2026', description: 'Aydınlık salonu, kullanışlı planı ve merkezi konumuyla öne çıkan aile dairesi.' },
  { id: 'GY-1023', title: 'Bahçeli Müstakil Villa', address: 'Konacık Mahallesi, Bodrum, Muğla', district: 'Bodrum', price: 125000, rooms: '4+1', area: '220 m²', kind: 'Kiralık', status: 'Opsiyonlu', agent: 'Elif Demir', ownerAgentId: 'demo-agent-2', views: 0, createdAt: '10 Ekim 2026', description: 'Özel bahçeli, ferah yaşam alanlarına sahip müstakil villa.' },
  { id: 'GY-1022', title: 'Merkezi Konumda 2+1', address: 'Güllük Mahallesi, Milas, Muğla', district: 'Milas', price: 3150000, rooms: '2+1', area: '105 m²', kind: 'Satılık', status: 'Aktif', agent: 'Sen', ownerAgentId: 'demo-owner', views: 0, createdAt: '8 Ekim 2026', description: 'Ulaşım noktalarına yakın, bakımlı daire.' },
];
const money = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
const propertyTypeLabel = (type?: string) => ({ apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'İş yeri', house: 'Müstakil ev', other: 'Diğer' } as Record<string, string>)[type || 'apartment'] || 'Daire';
const shareText = (p: Property) => `GAYIT | ${p.title}\n${p.address}\n${p.rooms} · ${p.area}\n${p.kind}: ${money(p.price)}${p.kind === 'Kiralık' ? '/ay' : ''}\n\nDetaylı bilgi için bizimle iletişime geçin.`;
const htmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function App() {
  const [role, setRole] = useState<Role>('owner');
  const [authenticated, setAuthenticated] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [officeId, setOfficeId] = useState('');
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
  const [tab, setTab] = useState<Tab>('home');
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selected, setSelected] = useState<Property | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Tümü' | 'Satılık' | 'Kiralık'>('Tümü');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const [showArchived, setShowArchived] = useState(false);
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

  const roleProperties = useMemo(() => properties, [properties]);
  const visibleProperties = useMemo(() => properties.filter(p => {
    const searchMatch = `${p.title} ${p.address} ${p.id}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'));
    return searchMatch && (showArchived ? p.status === 'Arşivde' : p.status !== 'Arşivde') && (filter === 'Tümü' || p.kind === filter);
  }).sort((a,b) => sortBy === 'priceAsc' ? a.price-b.price : sortBy === 'priceDesc' ? b.price-a.price : 0), [properties, role, search, filter, sortBy, showArchived]);

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
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('property_photos').select('id,storage_path,sort_order').eq('property_id', propertyId).order('sort_order', { ascending: true });
      if (error) throw error;
      const photos: PropertyPhoto[] = await Promise.all((data || []).map(async (row: any) => {
        const { data: signed, error: signError } = await supabase.storage.from('property-photos').createSignedUrl(row.storage_path, 60 * 60);
        if (signError) throw signError;
        return { id: row.id, storagePath: row.storage_path, url: signed.signedUrl, sortOrder: row.sort_order || 0 };
      }));
      setPropertyPhotos(photos);
    } catch (error) {
      setPropertyPhotos([]);
      Alert.alert('Fotoğraflar yüklenemedi', 'Supabase 004 migration ve Storage izinlerini kontrol edin.');
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
      const supabase = getSupabaseClient();
      const { error: uploadError } = await supabase.storage.from('property-photos').upload(storagePath, blob, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;
      const { error: rowError } = await supabase.from('property_photos').insert({ property_id: selected.id, office_id: officeId, storage_path: storagePath, sort_order: propertyPhotos.length });
      if (rowError) { await supabase.storage.from('property-photos').remove([storagePath]); throw rowError; }
      await loadPropertyPhotos(selected.id);
    } catch (error) { Alert.alert('Fotoğraf yüklenemedi', error instanceof Error ? error.message : 'Supabase migration ve Storage izinlerini kontrol edin.'); }
    finally { setPhotosBusy(false); }
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
          const supabase = getSupabaseClient();
          // Remove the metadata first so the gallery no longer advertises a file
          // that failed to delete. Storage cleanup errors are reported separately.
          const { error: rowError } = await supabase.from('property_photos')
            .delete().eq('id', photo.id).eq('property_id', propertyId);
          if (rowError) throw rowError;
          setPropertyPhotos(current => current.filter(item => item.id !== photo.id));
          const { error: storageError } = await supabase.storage.from('property-photos').remove([photo.storagePath]);
          if (storageError) {
            Alert.alert('Fotoğraf kaydı kaldırıldı', 'Fotoğraf galeriden kaldırıldı ancak depolamadaki dosya silinemedi. Supabase Storage izinlerini kontrol et; dosyanın temizliği ayrıca yapılmalı.');
            return;
          }
          await loadPropertyPhotos(propertyId);
        } catch (error) {
          Alert.alert('Fotoğraf silinemedi', error instanceof Error ? error.message : 'Fotoğraf kaydı silinemedi. Tekrar deneyin.');
        } finally {
          setPhotosBusy(false);
        }
      }}
    ]);
  };
  const createPdf = async (p: Property) => {
    try {
      const photosForPdf = selected?.id === p.id ? propertyPhotos : [];
      const photoHtml = photosForPdf.map(photo => '<img class="property-photo" src="' + photo.url + '" />').join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;color:#17283b;padding:32px} .brand{background:#10243a;color:white;padding:24px;border-radius:16px}
      .brand small{color:#e4c58d;letter-spacing:2px} h1{font-size:28px;margin:12px 0} .price{font-size:25px;color:#10243a;font-weight:bold;margin:24px 0}
      .pill{display:inline-block;background:#f6ebdd;padding:8px 12px;border-radius:8px;margin-right:6px}
      .section{margin-top:24px;border-top:1px solid #e3e8ef;padding-top:16px}.muted{color:#778597}.gallery{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.property-photo{width:48%;height:190px;object-fit:cover;border-radius:10px}
      </style></head><body><div class="brand"><small>GAYIT · PORTFÖY YÖNETİMİ</small><h1>${htmlEscape(p.title)}</h1><div>${htmlEscape(p.address)}</div></div>
      <div class="gallery">${photoHtml}</div><div class="price">${money(p.price)}${p.kind === 'Kiralık' ? ' / ay' : ''}</div>
      <span class="pill">${p.kind}</span><span class="pill">${propertyTypeLabel(p.propertyType)}</span><span class="pill">${htmlEscape(p.rooms)}</span><span class="pill">${htmlEscape(p.area)}</span><span class="pill">${p.status}</span>
      <div class="section"><h3>Gayrimenkul hakkında</h3><p>${htmlEscape(p.description || 'Detaylı bilgi için danışmanımızla iletişime geçebilirsiniz.')}</p></div>
      <div class="section"><h3>Konum</h3><p>${htmlEscape(p.address)}</p></div>
      <div class="section"><p class="muted">Portföy kodu: ${p.id} · Danışman: ${htmlEscape(p.agent)}</p><p class="muted">Bu belge GAYIT Portföy Yönetimi üzerinden oluşturulmuştur.</p></div></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Gayrimenkul PDF sunumu' });
      else Alert.alert('PDF hazır', 'PDF dosyası oluşturuldu: ' + file.uri);
    } catch { Alert.alert('PDF oluşturulamadı', 'Lütfen tekrar deneyin.'); }
  };
  const loadProperties = async (targetOfficeId: string) => {
    setPropertiesLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('properties').select('*').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Portföyler yüklenemedi.');
      const rows = data || [];
      const ids = [...new Set(rows.map((row: any) => row.owner_agent_id))];
      const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] as any[] };
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
      }));
      setProperties(mapped);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const loadCustomers = async (targetOfficeId: string) => {
    setCustomersLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('customers').select('id,full_name,phone,roles,assigned_agent_id,notes,is_active,next_follow_up_at,customer_requirements(id)').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Müşteriler yüklenemedi. Migration 003 uygulanmış olmalı.');
      const rows = data || [];
      const ids = [...new Set(rows.map((row: any) => row.assigned_agent_id))];
      const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] as any[] };
      const names = new Map((profiles || []).map((profile: any) => [profile.id, profile.full_name]));
      setCustomers(rows.map((row: any) => ({ id: row.id, fullName: row.full_name, phone: row.phone || '', roles: row.roles || [], assignedAgent: names.get(row.assigned_agent_id) || 'Danışman', assignedAgentId: row.assigned_agent_id, notes: row.notes || '', active: row.is_active, nextFollowUpAt: row.next_follow_up_at || null, requirementCount: Array.isArray(row.customer_requirements) ? row.customer_requirements.length : 0 })));
    } finally { setCustomersLoading(false); }
  };

  const loadMatches = async (targetOfficeId: string) => {
    setMatchesLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('matches').select('id,status,match_kind,match_score,match_reasons,created_at,properties(id,title,price,listing_type,district,rooms),customers(id,full_name,phone)').eq('office_id', targetOfficeId).order('created_at', { ascending: false });
      if (error) throw new Error('Eşleşmeler yüklenemedi. Migration 003 uygulanmış olmalı.');
      setMatches(data || []);
    } finally { setMatchesLoading(false); }
  };

  const loadNotifications = async (targetOfficeId: string) => {
    setNotificationsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('notifications')
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
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
      if (error) throw error;
      setNotifications(current => current.map(n => n.id === notificationId ? {...n, read_at: new Date().toISOString()} : n));
    } catch (error) {
      Alert.alert('Bildirim güncellenemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    }
  };

  const loadTeamMembers = async (targetOfficeId: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('office_members')
      .select('role,status,profiles(id,full_name,username,avatar_path)')
      .eq('office_id', targetOfficeId)
      .in('status', ['active', 'disabled']);
    if (error) throw new Error('Ekip bilgileri yüklenemedi.');
    const mapped = await Promise.all((data || []).map(async (row: any) => {
      const avatarPath = row.profiles?.avatar_path || null;
      let avatarUrl: string | null = null;
      if (avatarPath) {
        const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(avatarPath, 3600);
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
            const supabase = getSupabaseClient();
            const { error } = await supabase
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

  const openCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditCustomerName(customer.fullName);
    setEditCustomerPhone(customer.phone);
    setEditCustomerNotes(customer.notes);
    setEditFollowUpAt(customer.nextFollowUpAt ? new Date(customer.nextFollowUpAt).toISOString().slice(0,16).replace('T',' ') : '');
    setCustomerDetailOpen(true);
    setCustomerRequirementsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('customer_requirements')
        .select('id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,must_have,notes,is_active,created_at')
        .eq('customer_id', customer.id).order('created_at', { ascending: false });
      if (error) throw error;
      setCustomerRequirements(data || []);
      const { data: activities, error: activityError } = await supabase.from('customer_activities')
        .select('id,activity_type,summary,occurred_at,created_by')
        .eq('customer_id', customer.id).order('occurred_at', { ascending: false }).limit(50);
      if (activityError) throw activityError;
      setCustomerActivities(activities || []);
      const { data: appointments, error: appointmentError } = await supabase.from('appointments')
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
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('appointments').insert({
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
      const supabase = getSupabaseClient();
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı.');
      const { data, error } = await supabase.from('customer_activities').insert({
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
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('customer_requirements').insert({
        office_id: officeId, customer_id: selectedCustomer.id, intent: requirementIntent,
        property_type: requirementType, city: requirementCity.trim(), district: requirementDistrict.trim(),
        max_price: maxPrice > 0 ? maxPrice : null,
        rooms: requirementRooms.trim() ? [requirementRooms.trim()] : [], is_active: true,
      }).select('id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,must_have,notes,is_active,created_at').single();
      if (error) throw error;
      setCustomerRequirements(current => [data, ...current]);
      const { error: matchingError } = await supabase.functions.invoke('evaluate-matches', { body: { officeId, customerId: selectedCustomer.id } });
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
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('customers').update({
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
      const supabase = getSupabaseClient();
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const { data: customer, error } = await supabase.from('customers').insert({ office_id: officeId, assigned_agent_id: userResult.user.id, created_by: userResult.user.id, full_name: customerName.trim(), phone: customerPhone.trim(), roles: customerRoles, notes: customerNotes.trim() }).select('id').single();
      if (error || !customer) throw new Error(error?.message || 'Müşteri kaydedilemedi. Migration 003 ve RLS ayarlarını kontrol et.');
      const maxPrice = Number(requirementMaxPrice.replace(/[^0-9]/g, ''));
      const hasRequirement = !!(requirementIntent !== 'sale' || requirementDistrict.trim() || requirementMaxPrice.trim() || requirementRooms.trim() || requirementType !== 'apartment' || requirementCity.trim() !== 'Muğla');
      if (hasRequirement) {
        const { error: requirementError } = await supabase.from('customer_requirements').insert({ office_id: officeId, customer_id: customer.id, intent: requirementIntent, property_type: requirementType, city: requirementCity.trim(), district: requirementDistrict.trim(), max_price: maxPrice > 0 ? maxPrice : null, rooms: requirementRooms.trim() ? [requirementRooms.trim()] : [], is_active: true });
        if (requirementError) throw new Error('Müşteri kaydedildi ancak arama talebi kaydedilemedi: ' + requirementError.message);
      }
      await loadCustomers(officeId);
      let matchWarning = '';
      if (hasRequirement) {
        const { error: matchingError } = await supabase.functions.invoke('evaluate-matches', { body: { officeId, customerId: customer.id } });
        if (matchingError) matchWarning = ' Eşleştirme şu an çalışmadı; Edge Function ve migration kurulumu kontrol edilmeli.';
        else await loadMatches(officeId);
      }
      setCustomerModalOpen(false); setCustomerName(''); setCustomerPhone(''); setCustomerRoles(['buyer']); setCustomerNotes(''); setRequirementIntent('sale'); setRequirementType('apartment'); setRequirementCity('Muğla'); setRequirementDistrict(''); setRequirementMaxPrice(''); setRequirementRooms('');
      Alert.alert('Müşteri kaydedildi', hasRequirement ? 'Müşteri ve arama talebi kaydedildi.' + matchWarning : 'Müşteri kaydedildi. İstersen daha sonra arama talebi ekleyebilirsin.');
    } catch (error) { Alert.alert('Müşteri kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.'); }
    finally { setCustomerBusy(false); }
  };

  const handleLogin = async () => {
    setAuthBusy(true); setAuthError('');
    try {
      const result = await signInWithUsername(loginUsername, loginPassword);
      setRole(result.role);
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
      const supabase = getSupabaseClient();
      let avatarPath: string | null = null;
      if (agentAvatarUri) {
        const response = await fetch(agentAvatarUri);
        const blob = await response.blob();
        const ext = agentAvatarUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
        avatarPath = officeId + '/agent-' + Date.now() + '.' + ext;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(avatarPath, blob, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false });
        if (uploadError) throw new Error('Fotoğraf yüklenemedi. Supabase avatar migration ve izinlerini kontrol edin.');
      }
      const { data, error } = await supabase.functions.invoke('create-agent', { body: { officeId, username: agentUsername, password: agentPassword, fullName: agentName, avatarPath } });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Danışman oluşturulamadı.');
      await loadTeamMembers(officeId);
      Alert.alert('Danışman eklendi', agentName.trim() + ' için hesap oluşturuldu. İlk girişte şifresini değiştirmesi gerekecek.');
      setAgentModalOpen(false); setAgentName(''); setAgentUsername(''); setAgentPassword(''); setAgentAvatarUri(null);
    } catch (error) {
      Alert.alert('Hesap oluşturulamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally { setAgentBusy(false); }
  };

  const handleSignOut = async () => {
    const { getSupabaseClient } = await import('./src/lib/supabase');
    await getSupabaseClient().auth.signOut();
    setAuthenticated(false); setMustChangePassword(false); setLoginPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const updatePropertyStatus = async (nextStatus: PropertyStatus) => {
    if (!selected) return;
    const statusMap: Record<PropertyStatus, string> = { 'Aktif': 'active', 'Opsiyonlu': 'optioned', 'Satıldı': 'sold', 'Kiralandı': 'rented', 'Arşivde': 'archived' };
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('properties').update({ status: statusMap[nextStatus] }).eq('id', selected.id).eq('office_id', officeId);
      if (error) throw error;
      setProperties(current => current.map(p => p.id === selected.id ? {...p, status: nextStatus} : p));
      setSelected((current: Property | null) => current && current.id === selected.id ? {...current, status: nextStatus} : current);
      Alert.alert('Durum güncellendi', 'İlan durumu: ' + nextStatus);
      await loadProperties(officeId);
    } catch (error) {
      Alert.alert('Güncellenemedi', error instanceof Error ? error.message : 'İlan durumu değiştirilemedi.');
    }
  };

  const openPropertyEditor = (p: Property) => {
    setEditingPropertyId(p.id);
    setTitle(p.title); setAddress(p.address); setPrice(String(p.price)); setArea(p.area.replace(/[^0-9.]/g, ''));
    setKind(p.kind); setRooms(p.rooms || '3+1'); setDescription(p.description || '');
    setPropertyType(p.propertyType || 'apartment'); setSelected(null); setAddOpen(true);
  };

  const archiveProperty = async () => {
    if (!selected) return;
    Alert.alert('Portföyü arşivle', 'Bu ilan aktif portföy listesinden çıkarılacak. Devam edilsin mi?', [
      {text:'Vazgeç',style:'cancel'},
      {text:'Arşivle',style:'destructive',onPress:async()=>{
        try {
          const supabase=getSupabaseClient();
          const {error}=await supabase.from('properties').update({status:'archived'}).eq('id',selected.id).eq('office_id',officeId);
          if(error) throw error;
          setSelected(null); await loadProperties(officeId);
          Alert.alert('Arşivlendi','Portföy arşivlendi.');
        } catch(error) { Alert.alert('Arşivlenemedi',error instanceof Error?error.message:'Tekrar deneyin.'); }
      }}
    ]);
  };

  const saveProperty = async () => {
    if (propertyBusy) return;
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
      const supabase = getSupabaseClient();
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const parts = address.split(',').map((part) => part.trim());
      const payload = {
        title: cleanTitle, address: cleanAddress,
        district: parts.length > 1 ? parts[parts.length - 2] : '',
        city: parts.length > 0 ? parts[parts.length - 1] : '',
        price: numericPrice, rooms, property_type: propertyType, area_m2: numericArea,
        listing_type: kind === 'Kiralık' ? 'rent' : 'sale', description: description.trim(),
      };
      let savedId = editingPropertyId;
      if (editingPropertyId) {
        const {error}=await supabase.from('properties').update(payload).eq('id',editingPropertyId).eq('office_id',officeId);
        if(error) throw error;
      } else {
        const {data:inserted,error}=await supabase.from('properties').insert({
          ...payload, office_id:officeId, owner_agent_id:userResult.user.id, created_by:userResult.user.id, status:'active',
        }).select('id').single();
        if(error || !inserted) throw new Error('Portföy kaydedilemedi. Ofis yetkilerini ve veritabanı kurulumunu kontrol et.');
        savedId=inserted.id;
      }
      await loadProperties(officeId);
      if(savedId && !editingPropertyId) {
        const {error:matchingError}=await supabase.functions.invoke('evaluate-matches',{body:{officeId,propertyId:savedId}});
        if(!matchingError) await loadMatches(officeId);
        else Alert.alert('Eşleştirme beklemede','Portföy kaydedildi ancak eşleştirme çalışmadı. Edge Function ve migration kurulumu kontrol edilmeli.');
      }
      setAddOpen(false); setEditingPropertyId(null);
      setTitle(''); setAddress(''); setPrice(''); setArea(''); setDescription(''); setPropertyType('apartment');
      Alert.alert(editingPropertyId?'Portföy güncellendi':'Portföy eklendi',editingPropertyId?'Değişiklikler kaydedildi.':'Yeni portföy kaydedildi.');
    } catch (error) {
      Alert.alert('Portföy kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally {
      setPropertyBusy(false);
    }
  };

  if (!authenticated || mustChangePassword) {
    return <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled">
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
          <View style={styles.statGrid}>
            <Stat icon="business-outline" label={role === 'owner' ? 'Toplam portföy' : 'Portföyüm'} value={String(role === 'owner' ? properties.length : properties.filter(p => p.agent === 'Sen').length)} note="Aktif kayıtlar" />
            <Stat icon="eye-outline" label="Görüntülenme" value="—" note="Ölçüm kurulmadı" />
            <Stat icon="checkmark-circle-outline" label="Aktif ilan" value={String(roleProperties.filter(p=>p.status==='Aktif').length)} note="Yayındaki portföy" />
            <Stat icon="people-outline" label={role === 'owner' ? 'Danışmanlar' : 'Müşteriler'} value={String(role === 'owner' ? teamMembers.filter(m=>m.role==='agent').length : customers.length)} note="Gerçek kayıtlar" />
          </View>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{role === 'owner' ? 'Son portföy hareketleri' : 'Portföyümden'}</Text><Pressable onPress={()=>setTab('portfolio')}><Text style={styles.link}>Tümünü gör</Text></Pressable></View>
          {roleProperties.slice(0,3).map(p=><PropertyRow key={p.id} property={p} onPress={()=>{setSelected(p);setPropertyPhotos([]);void loadPropertyPhotos(p.id);}} />)}
          <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Portföy ve ekip kayıtları bağlı Supabase veritabanından yüklenir. Görüntülenme analitiği ve otomatik eşleştirme henüz etkin değil.</Text></View>
        </ScrollView>}

        {tab === 'portfolio' && <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>GAYIT · PORTFÖY</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Portföyler</Text><Text style={styles.pageSub}>{role === 'owner' ? 'Ofisteki tüm gayrimenkuller' : 'Sana ait gayrimenkuller'}</Text></View><Pressable onPress={()=>setAddOpen(true)} style={styles.addButton}><Ionicons name="add" size={25} color="#fff"/></Pressable></View>
          <View style={styles.search}><Ionicons name="search-outline" size={19} color={palette.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="İlan, adres veya kod ara" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
          <View style={styles.filters}>{(['Tümü','Satılık','Kiralık'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={[styles.filter,filter===f&&styles.filterOn]}><Text style={[styles.filterText,filter===f&&styles.filterTextOn]}>{f}</Text></Pressable>)}</View>
          <View style={[styles.filters,{marginTop:10}]}>{([{key:'newest',label:'En yeni'},{key:'priceAsc',label:'Fiyat ↑'},{key:'priceDesc',label:'Fiyat ↓'}] as const).map(opt=><Pressable key={opt.key} onPress={()=>setSortBy(opt.key)} style={[styles.filter,sortBy===opt.key&&styles.filterOn]}><Text style={[styles.filterText,sortBy===opt.key&&styles.filterTextOn]}>{opt.label}</Text></Pressable>)}</View>
          <Pressable onPress={()=>setShowArchived(v=>!v)} style={[styles.filter,{alignSelf:'flex-start',marginTop:10},showArchived&&styles.filterOn]}><Text style={[styles.filterText,showArchived&&styles.filterTextOn]}>{showArchived ? 'Arşivden çıkış · Aktif portföyleri göster' : 'Arşivlenmiş portföyleri göster'}</Text></Pressable>
          <Text style={styles.resultCount}>{propertiesLoading ? 'Portföyler yükleniyor…' : `${visibleProperties.length} portföy`}</Text>
          {visibleProperties.map(p=><PropertyRow key={p.id} property={p} onPress={()=>setSelected(p)} />)}
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
          {role === 'owner' && <Pressable style={styles.moreCard} onPress={()=>setTab('team')}><Ionicons name="people-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Ekip yönetimi</Text><Text style={styles.teamRole}>Danışmanları ve ofis üyelerini yönet.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>}
          <Pressable style={styles.moreCard} onPress={async()=>{setNotificationsOpen(true);await loadNotifications(officeId);}}><Ionicons name="notifications-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Bildirim merkezi {notifications.filter(n=>!n.read_at).length ? '('+notifications.filter(n=>!n.read_at).length+')' : ''}</Text><Text style={styles.teamRole}>Yeni eşleşmeler ve sistem bildirimleri.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={()=>setTab('stats')}><Ionicons name="bar-chart-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>{role==='owner'?'Ofis istatistikleri':'Performansım'}</Text><Text style={styles.teamRole}>Portföy ve operasyon özetleri.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
          <Pressable style={styles.moreCard} onPress={handleSignOut}><Ionicons name="log-out-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Oturumu kapat</Text><Text style={styles.teamRole}>GAYIT hesabından çıkış yap.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
        </ScrollView>}

        {tab === 'team' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>EKİP YÖNETİMİ</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Danışmanlar</Text><Text style={styles.pageSub}>Ofis ekibinin portföy ve performans özeti.</Text></View><Pressable onPress={()=>setAgentModalOpen(true)} style={styles.addButton}><Ionicons name="person-add-outline" size={22} color="#fff"/></Pressable></View>
          {teamMembers.map((person)=><View key={person.id || person.username} style={[styles.teamCard,person.status==='disabled'&&{opacity:0.72}]}><View style={styles.avatar}>{person.avatarUrl ? <Image source={{uri:person.avatarUrl}} style={styles.avatarImage}/> : <Text style={styles.avatarText}>{person.name.split(/\s+/).map((part:string)=>part[0]).slice(0,2).join('').toLocaleUpperCase('tr-TR')}</Text>}</View><View style={{flex:1}}><Text style={styles.teamName}>{person.name}</Text><Text style={styles.teamRole}>{person.role === 'owner' ? 'Ofis sahibi' : 'Gayrimenkul danışmanı'}{person.role==='agent' ? (person.status==='disabled'?' · Devre dışı':' · Aktif') : ''}</Text><Text style={styles.teamMeta}>@{person.username || 'kullanıcı adı yok'}</Text></View>{person.role==='agent'&&<Pressable disabled={teamStatusBusyId===person.id} onPress={()=>toggleAgentStatus(person)} style={[styles.memberStatusButton,person.status==='disabled'&&styles.memberStatusButtonOn,teamStatusBusyId===person.id&&{opacity:0.5}]}><Text style={[styles.memberStatusButtonText,person.status==='disabled'&&styles.memberStatusButtonTextOn]}>{teamStatusBusyId===person.id?'…':person.status==='active'?'Devre dışı bırak':'Etkinleştir'}</Text></Pressable>}</View>)}
          {!teamMembers.length && <View style={styles.empty}><Ionicons name="people-outline" size={30} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz ekip üyesi yok</Text><Text style={styles.pageSub}>Sağ üstteki butondan ilk danışmanını ekleyebilirsin.</Text></View>}
          <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Ekip üyeleri oturum açmış ofisin veritabanından yüklenir. Hesap oluşturma fonksiyonunun deploy edilmiş ve Supabase bağlantısının ayarlanmış olması gerekir.</Text></View>        </ScrollView>}

        {tab === 'stats' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>PERFORMANS ANALİZİ</Text><Text style={styles.pageTitle}>{role === 'owner' ? 'Ofis istatistikleri' : 'Performansım'}</Text><Text style={styles.pageSub}>Portföy ve görüntülenme metrikleri.</Text>
          <View style={styles.bigMetric}><Text style={styles.metricLabel}>Toplam portföy değeri</Text><Text style={styles.metricValue}>{money(roleProperties.reduce((sum,p)=>sum+p.price,0))}</Text><Text style={styles.metricFoot}>Satılık ve kiralık ilanların fiyat toplamı; piyasa değeri değildir.</Text></View>
          <View style={styles.statGrid}><Stat icon="home-outline" label="Satılık" value={String(roleProperties.filter(p=>p.kind==='Satılık').length)} note="İlan adedi"/><Stat icon="key-outline" label="Kiralık" value={String(roleProperties.filter(p=>p.kind==='Kiralık').length)} note="İlan adedi"/><Stat icon="eye-outline" label="Görüntülenme" value="—" note="Ölçüm kurulmadı"/><Stat icon="checkmark-done-outline" label="Tamamlanan" value={String(roleProperties.filter(p=>p.status==='Satıldı'||p.status==='Kiralandı').length)} note="Satış/kiralama"/></View>
          <Text style={styles.sectionTitle}>İlan durumları</Text>
          {(['Aktif','Opsiyonlu','Satıldı','Kiralandı','Arşivde'] as PropertyStatus[]).map(status=>{const count=roleProperties.filter(p=>p.status===status).length;return <View key={status} style={styles.progressRow}><Text style={styles.progressLabel}>{status}</Text><View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${roleProperties.length ? count/roleProperties.length*100 : 0}%`,backgroundColor:status==='Aktif'?palette.green:status==='Opsiyonlu'?palette.gold:status==='Arşivde'?palette.muted:palette.navy2}]}/></View><Text style={styles.progressCount}>{count}</Text></View>})}
          {role==='owner'&&<><Text style={styles.sectionTitle}>Danışman bazlı portföy</Text><Text style={styles.pageSub}>Yalnızca veritabanından yüklenen portföy kayıtları sayılır. Görüntülenme verisi ölçülmediği için dahil edilmez.</Text>
          {teamMembers.filter(person=>person.role==='agent').map(person=>{const agentProperties=roleProperties.filter(p=>p.ownerAgentId===person.id);const activeCount=agentProperties.filter(p=>p.status==='Aktif'||p.status==='Opsiyonlu').length;const totalValue=agentProperties.reduce((sum,p)=>sum+p.price,0);return <View key={person.id} style={styles.teamCard}><View style={{flex:1}}><Text style={styles.teamName}>{person.name}</Text><Text style={styles.teamRole}>{agentProperties.length} portföy · {activeCount} aktif/opsiyonlu</Text><Text style={styles.teamMeta}>Fiyat toplamı: {money(totalValue)}</Text></View></View>})}
          {!teamMembers.some(person=>person.role==='agent')&&<View style={styles.empty}><Text style={styles.pageSub}>Danışman verisi bulunamadı.</Text></View>}</>}
        </ScrollView>}
      </View>

      <View style={styles.bottomNav}>{([{key:'home',label:'Ana Sayfa',icon:'grid-outline'},{key:'portfolio',label:'Portföy',icon:'business-outline'},{key:'customers',label:'Müşteriler',icon:'people-outline'},{key:'matches',label:'Eşleşme',icon:'git-compare-outline'},{key:'more',label:'Daha Fazla',icon:'menu-outline'}] as {key:Tab;label:string;icon:keyof typeof Ionicons.glyphMap}[]).map(item=><Pressable key={item.key} onPress={()=>setTab(item.key)} style={styles.navItem}><View style={[styles.navIcon,tab===item.key&&styles.navIconOn]}><Ionicons name={item.icon} size={20} color={tab===item.key?palette.gold:palette.muted}/></View><Text style={[styles.navLabel,tab===item.key&&styles.navLabelOn]}>{item.label}</Text></Pressable>)}</View>

      <Modal visible={!!selected} animationType="slide" onRequestClose={()=>{setSelected(null);setPropertyPhotos([]);}}>
        {selected && <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}><View style={styles.modalHeader}><Pressable onPress={()=>{setSelected(null);setPropertyPhotos([]);}} style={styles.roundButton}><Ionicons name="chevron-down" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>İlan detayı</Text><Text style={styles.code}>{selected.id}</Text></View>
          <ScrollView contentContainerStyle={styles.modalPage}><View style={styles.propertyHero}><View style={styles.houseIcon}><Ionicons name="home" size={52} color={palette.navy2}/></View><View style={styles.statusPill}><Text style={styles.statusText}>{selected.status}</Text></View></View>
          <View style={{marginBottom:18}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><Text style={styles.sectionTitle}>İlan fotoğrafları ({propertyPhotos.length})</Text><Pressable onPress={addPropertyPhoto} disabled={photosBusy} style={[styles.pdfButton,{flex:0,paddingHorizontal:14,paddingVertical:9}]}><Ionicons name="add-circle-outline" size={18} color={palette.navy}/><Text style={styles.pdfButtonText}>{photosBusy ? 'İşleniyor…' : 'Fotoğraf ekle'}</Text></Pressable></View>
  {photosBusy && propertyPhotos.length===0 ? <Text style={styles.noticeText}>Fotoğraflar yükleniyor…</Text> : propertyPhotos.length===0 ? <Text style={styles.noticeText}>Henüz fotoğraf eklenmedi. Galeriden fotoğraf seçerek ilana ekleyebilirsin.</Text> : <View style={{flexDirection:'row',flexWrap:'wrap',gap:9}}>{propertyPhotos.map(photo=><View key={photo.id} style={{width:'48%',height:145,borderRadius:12,overflow:'hidden',backgroundColor:palette.line}}><Image source={{uri:photo.url}} style={{width:'100%',height:'100%'}} resizeMode="cover"/><Pressable disabled={photosBusy} onPress={()=>removePropertyPhoto(photo)} style={{position:'absolute',right:7,top:7,backgroundColor:'#FFFFFFE8',borderRadius:18,padding:6,opacity:photosBusy?0.5:1}}><Ionicons name={photosBusy?"time-outline":"trash-outline"} size={17} color={palette.red}/></Pressable></View>)}</View>}
</View>
<Text style={styles.eyebrow}>{propertyTypeLabel(selected.propertyType).toLocaleUpperCase('tr-TR')} · {selected.kind.toLocaleUpperCase('tr-TR')}</Text><Text style={styles.detailTitle}>{selected.title}</Text><View style={styles.addressLine}><Ionicons name="location-outline" size={18} color={palette.muted}/><Text style={styles.addressText}>{selected.address}</Text></View><Text style={styles.detailPrice}>{money(selected.price)}{selected.kind==='Kiralık'?<Text style={styles.perMonth}> / ay</Text>:null}</Text>
          <View style={styles.featureRow}><Feature icon="bed-outline" label="Oda" value={selected.rooms}/><Feature icon="resize-outline" label="Alan" value={selected.area}/><Feature icon="eye-outline" label="Görüntülenme" value={String(selected.views)}/></View>
          <View style={styles.shareRow}><Pressable style={styles.pdfButton} onPress={()=>openPropertyEditor(selected)}><Ionicons name="create-outline" size={20} color={palette.navy}/><Text style={styles.pdfButtonText}>Düzenle</Text></Pressable><Pressable style={[styles.pdfButton,{borderColor:'#DCA6A6'}]} onPress={archiveProperty}><Ionicons name="archive-outline" size={20} color="#A13D3D"/><Text style={[styles.pdfButtonText,{color:'#A13D3D'}]}>Arşivle</Text></Pressable></View>
          <Text style={styles.sectionTitle}>İlan durumunu yönet</Text><View style={styles.kindRow}>{(['Aktif','Opsiyonlu','Satıldı','Kiralandı'] as PropertyStatus[]).map(status=><Pressable key={status} onPress={()=>updatePropertyStatus(status)} style={[styles.kindButton,selected.status===status&&styles.kindButtonOn]}><Text style={[styles.kindText,selected.status===status&&styles.kindTextOn]}>{status}</Text></Pressable>)}</View>
          <Text style={styles.sectionTitle}>Açıklama</Text><Text style={styles.description}>{selected.description || 'Açıklama eklenmemiş.'}</Text>
          <Text style={styles.sectionTitle}>Konum ve paylaşım</Text><Pressable style={styles.mapButton} onPress={()=>openMap(selected)}><Ionicons name="navigate-circle-outline" size={23} color="#fff"/><View style={{flex:1}}><Text style={styles.mapButtonTitle}>Google Maps'te yol tarifi</Text><Text style={styles.mapButtonSub}>Adresi haritada aç ve navigasyonu başlat</Text></View><Ionicons name="open-outline" size={18} color="#fff"/></Pressable>
          <View style={styles.shareRow}><Pressable style={styles.whatsappButton} onPress={()=>shareWhatsApp(selected)}><Ionicons name="logo-whatsapp" size={21} color="#fff"/><Text style={styles.actionButtonText}>WhatsApp</Text></Pressable><Pressable style={styles.pdfButton} onPress={()=>createPdf(selected)}><Ionicons name="document-text-outline" size={21} color={palette.navy}/><Text style={styles.pdfButtonText}>PDF sunumu</Text></Pressable></View>
          <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>PDF sunumu, eklediğin ilan fotoğraflarını ve temel portföy bilgilerini içerir. Ofis logosu ve danışman iletişim bilgileri sonraki tasarım adımında eklenecek.</Text></View>
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
            <Text style={styles.noticeText}>Fotoğraf yükleme için Supabase'de 002_private_avatars.sql migration uygulanmış olmalı. Hesap oluşturma Edge Function deploy edilmeden işlem tamamlanmaz.</Text>
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
            <Text style={styles.fieldLabel}>Açıklama</Text><TextInput value={description} onChangeText={setDescription} placeholder="Gayrimenkul hakkında kısa bilgi" style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholderTextColor={palette.muted}/>
            <Pressable disabled={propertyBusy} onPress={saveProperty} style={[styles.saveButton,propertyBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{propertyBusy?'Kaydediliyor...':editingPropertyId ? 'Değişiklikleri kaydet' : 'Portföye kaydet'}</Text><Ionicons name={propertyBusy?"time-outline":"checkmark-circle-outline"} size={21} color="#fff"/></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({icon,label,value,note}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string;note:string}) {
  return <View style={styles.statCard}><View style={styles.statTop}><View style={styles.statIcon}><Ionicons name={icon} size={18} color={palette.navy2}/></View><Text style={styles.statNote}>{note}</Text></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function PropertyRow({property,onPress}:{property:Property;onPress:()=>void}) {
  const active = property.status === 'Aktif';
  return <Pressable onPress={onPress} style={styles.propertyCard}><View style={styles.propertyThumb}><Ionicons name="home-outline" size={36} color={palette.navy2}/><Text style={styles.thumbCode}>{property.id}</Text></View><View style={styles.propertyInfo}><View style={styles.propertyTitleLine}><Text numberOfLines={1} style={styles.propertyTitle}>{property.title}</Text><View style={[styles.miniStatus,active?styles.activeStatus:styles.optionStatus]}><Text style={[styles.miniStatusText,{color:active?palette.green:palette.amber}]}>{property.status}</Text></View></View><Text numberOfLines={1} style={styles.propertyAddress}><Ionicons name="location-outline" size={12}/> {property.address}</Text><Text style={styles.propertyPrice}>{money(property.price)}{property.kind==='Kiralık'?<Text style={styles.rentSuffix}> / ay</Text>:null}</Text><Text style={styles.propertyMeta}>{property.rooms}  ·  {property.area}  ·  {property.kind}</Text></View><Ionicons name="chevron-forward" size={17} color={palette.muted}/></Pressable>;
}
function Feature({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}) {
  return <View style={styles.feature}><Ionicons name={icon} size={20} color={palette.gold}/><Text style={styles.featureValue}>{value}</Text><Text style={styles.featureLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:palette.bg}, authPage:{flexGrow:1,justifyContent:'center',paddingHorizontal:26,paddingVertical:36},authBrandMark:{width:64,height:64,borderRadius:20,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center',alignSelf:'center',marginBottom:14},authBrand:{fontSize:32,fontWeight:'900',letterSpacing:1.5,color:palette.navy,textAlign:'center'},authTitle:{fontSize:25,fontWeight:'900',color:palette.ink,marginTop:38},authSubtitle:{fontSize:13,lineHeight:20,color:palette.muted,marginTop:8,marginBottom:12},authSubmit:{backgroundColor:palette.navy,borderRadius:13,padding:16,alignItems:'center',marginTop:24},authSubmitText:{fontSize:14,fontWeight:'900',color:'#fff'},authHint:{fontSize:11,color:palette.muted,textAlign:'center',marginTop:15,lineHeight:17},authError:{flexDirection:'row',alignItems:'flex-start',gap:8,padding:12,borderRadius:12,backgroundColor:palette.redSoft,marginTop:16},authErrorText:{flex:1,fontSize:12,lineHeight:17,color:palette.red},signOutButton:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:11,paddingVertical:9,backgroundColor:'#E8ECF1',borderRadius:10},signOutText:{fontSize:11,fontWeight:'800',color:palette.navy}, topbar:{paddingHorizontal:20,paddingTop:8,paddingBottom:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  brand:{fontSize:25,fontWeight:'900',letterSpacing:1.1,color:palette.navy},brandDot:{color:palette.gold},brandSub:{fontSize:8,fontWeight:'900',letterSpacing:1.6,color:palette.muted,marginTop:1},
  roleSwitch:{flexDirection:'row',backgroundColor:'#E8ECF1',padding:3,borderRadius:12},roleButton:{paddingHorizontal:10,paddingVertical:8,borderRadius:9},roleActive:{backgroundColor:palette.navy},roleText:{fontSize:10,fontWeight:'700',color:palette.muted},roleTextActive:{color:'#fff'},
  body:{flex:1},page:{paddingHorizontal:20,paddingTop:14,paddingBottom:28},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:palette.gold},pageTitle:{fontSize:27,fontWeight:'900',letterSpacing:-.6,color:palette.ink,marginTop:7},pageSub:{fontSize:12,color:palette.muted,marginTop:5,lineHeight:18},
  hero:{backgroundColor:palette.navy,borderRadius:22,padding:20,marginTop:20,marginBottom:17,minHeight:155,flexDirection:'row',alignItems:'center',overflow:'hidden'},heroKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.4,color:'#E5C58B'},heroTitle:{fontSize:23,fontWeight:'900',color:'#fff',marginTop:10,maxWidth:230},heroBody:{fontSize:11,lineHeight:17,color:'#C4D0DC',marginTop:7,maxWidth:230},heroIcon:{width:58,height:58,borderRadius:20,backgroundColor:'#FFFFFF12',alignItems:'center',justifyContent:'center',marginLeft:8},
  statGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:24},statCard:{width:'48%',flexGrow:1,minHeight:105,padding:13,backgroundColor:palette.white,borderRadius:17,borderWidth:1,borderColor:palette.line},statTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},statIcon:{width:32,height:32,borderRadius:11,backgroundColor:palette.goldSoft,alignItems:'center',justifyContent:'center'},statNote:{fontSize:9,color:palette.muted,flexShrink:1,textAlign:'right'},statValue:{fontSize:24,fontWeight:'900',color:palette.ink,marginTop:8},statLabel:{fontSize:11,fontWeight:'700',color:palette.muted,marginTop:2},
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},sectionTitle:{fontSize:17,fontWeight:'900',color:palette.ink,marginTop:12,marginBottom:12},link:{fontSize:12,fontWeight:'800',color:palette.navy2},
  propertyCard:{flexDirection:'row',alignItems:'center',gap:11,padding:11,backgroundColor:palette.white,borderRadius:17,borderWidth:1,borderColor:palette.line,marginBottom:11},propertyThumb:{width:76,height:83,borderRadius:13,backgroundColor:'#E5EAEF',alignItems:'center',justifyContent:'center',position:'relative'},thumbCode:{position:'absolute',bottom:5,fontSize:8,fontWeight:'800',color:palette.navy},propertyInfo:{flex:1,minWidth:0},propertyTitleLine:{flexDirection:'row',alignItems:'center',gap:5},propertyTitle:{fontSize:12,fontWeight:'900',color:palette.ink,flex:1},miniStatus:{paddingHorizontal:6,paddingVertical:4,borderRadius:6},activeStatus:{backgroundColor:palette.greenSoft},optionStatus:{backgroundColor:palette.amberSoft},miniStatusText:{fontSize:8,fontWeight:'800'},propertyAddress:{fontSize:10,color:palette.muted,marginTop:7},propertyPrice:{fontSize:17,fontWeight:'900',color:palette.navy,marginTop:7},rentSuffix:{fontSize:10,fontWeight:'600',color:palette.muted},propertyMeta:{fontSize:10,color:palette.muted,marginTop:4},
  notice:{flexDirection:'row',gap:8,alignItems:'flex-start',padding:12,backgroundColor:'#EDF1F5',borderRadius:13,marginTop:10},noticeText:{flex:1,fontSize:10,lineHeight:15,color:palette.muted},
  titleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:7,marginBottom:17},addButton:{width:45,height:45,borderRadius:15,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center'},search:{height:48,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:13,backgroundColor:palette.white,borderRadius:14,borderWidth:1,borderColor:palette.line},searchInput:{flex:1,fontSize:12,color:palette.ink},filters:{flexDirection:'row',gap:8,marginTop:13,marginBottom:15},filter:{paddingVertical:8,paddingHorizontal:15,borderRadius:10,borderWidth:1,borderColor:palette.line,backgroundColor:palette.white},filterOn:{backgroundColor:palette.navy,borderColor:palette.navy},filterText:{fontSize:11,fontWeight:'700',color:palette.muted},filterTextOn:{color:'#fff'},resultCount:{fontSize:11,fontWeight:'700',color:palette.muted,marginBottom:11},empty:{alignItems:'center',padding:28,backgroundColor:palette.white,borderRadius:17},
  avatarPicker:{minHeight:100,alignItems:'center',justifyContent:'center',gap:8,backgroundColor:palette.goldSoft,borderWidth:1,borderColor:palette.line,borderRadius:16,marginTop:18},avatarPickerText:{fontSize:12,fontWeight:'800',color:palette.navy},teamCard:{flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:16,marginTop:10},memberStatusButton:{paddingHorizontal:9,paddingVertical:8,borderRadius:9,backgroundColor:palette.redSoft},memberStatusButtonOn:{backgroundColor:palette.greenSoft},memberStatusButtonText:{fontSize:9,fontWeight:'800',color:palette.red},memberStatusButtonTextOn:{color:palette.green},avatar:{width:45,height:45,borderRadius:15,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:45,height:45,borderRadius:15},avatarText:{color:palette.gold,fontSize:13,fontWeight:'900'},teamName:{fontSize:13,fontWeight:'900',color:palette.ink},teamRole:{fontSize:10,color:palette.muted,marginTop:3},teamMeta:{fontSize:10,color:palette.navy2,fontWeight:'700',marginTop:5},
  customerCard:{flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:16,marginBottom:10},customerAvatar:{width:44,height:44,borderRadius:14,backgroundColor:palette.goldSoft,alignItems:'center',justifyContent:'center'},customerRoles:{fontSize:10,fontWeight:'800',color:palette.navy2,marginTop:5},matchSection:{marginTop:14,marginBottom:8},matchCard:{flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:16,marginBottom:10},matchScore:{width:44,height:44,borderRadius:14,backgroundColor:palette.greenSoft,alignItems:'center',justifyContent:'center'},matchScoreText:{fontSize:12,fontWeight:'900',color:palette.green},moreCard:{flexDirection:'row',alignItems:'center',gap:12,padding:16,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:16,marginTop:12},
  bigMetric:{padding:19,backgroundColor:palette.navy,borderRadius:18,marginTop:20,marginBottom:16},metricLabel:{fontSize:11,color:'#C4D0DC'},metricValue:{fontSize:25,fontWeight:'900',color:'#fff',marginTop:8},metricFoot:{fontSize:9,color:'#C4D0DC',marginTop:8,lineHeight:14},progressRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:16},progressLabel:{width:78,fontSize:11,fontWeight:'700',color:palette.ink},progressTrack:{flex:1,height:8,backgroundColor:'#E5EAF0',borderRadius:6,overflow:'hidden'},progressFill:{height:8,borderRadius:6},progressCount:{width:20,textAlign:'right',fontSize:11,fontWeight:'800',color:palette.ink},
  bottomNav:{flexDirection:'row',justifyContent:'space-around',backgroundColor:palette.white,borderTopWidth:1,borderTopColor:palette.line,paddingTop:8,paddingBottom:7},navItem:{flex:1,alignItems:'center',gap:4},navIcon:{width:42,height:29,borderRadius:11,alignItems:'center',justifyContent:'center'},navIconOn:{backgroundColor:palette.navy},navLabel:{fontSize:9,color:palette.muted,fontWeight:'700'},navLabelOn:{color:palette.navy,fontWeight:'900'},
  modalSafe:{flex:1,backgroundColor:palette.bg},modalHeader:{paddingHorizontal:18,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:palette.white,borderBottomWidth:1,borderBottomColor:palette.line},roundButton:{width:40,height:40,borderRadius:13,backgroundColor:palette.bg,alignItems:'center',justifyContent:'center'},modalHeaderTitle:{fontSize:15,fontWeight:'900',color:palette.ink},code:{fontSize:10,fontWeight:'800',color:palette.muted},modalPage:{padding:20,paddingBottom:36},propertyHero:{height:165,backgroundColor:'#E4E9EE',borderRadius:20,alignItems:'center',justifyContent:'center',marginBottom:20,position:'relative'},houseIcon:{width:90,height:90,borderRadius:28,backgroundColor:'#FFFFFF80',alignItems:'center',justifyContent:'center'},statusPill:{position:'absolute',top:12,right:12,paddingHorizontal:10,paddingVertical:6,backgroundColor:palette.white,borderRadius:8},statusText:{fontSize:10,fontWeight:'800',color:palette.green},detailTitle:{fontSize:25,fontWeight:'900',color:palette.ink,marginTop:7},addressLine:{flexDirection:'row',alignItems:'center',gap:5,marginTop:9},addressText:{fontSize:12,color:palette.muted,flex:1},detailPrice:{fontSize:27,fontWeight:'900',color:palette.navy,marginTop:18},perMonth:{fontSize:13,fontWeight:'600',color:palette.muted},featureRow:{flexDirection:'row',gap:9,marginVertical:18},feature:{flex:1,alignItems:'center',paddingVertical:13,backgroundColor:palette.white,borderRadius:14,borderWidth:1,borderColor:palette.line,gap:5},featureValue:{fontSize:13,fontWeight:'900',color:palette.ink},featureLabel:{fontSize:9,color:palette.muted},description:{fontSize:12,lineHeight:20,color:palette.muted},mapButton:{flexDirection:'row',alignItems:'center',gap:10,padding:14,backgroundColor:palette.navy,borderRadius:15,marginTop:3},mapButtonTitle:{fontSize:12,fontWeight:'900',color:'#fff'},mapButtonSub:{fontSize:9,color:'#C4D0DC',marginTop:3},shareRow:{flexDirection:'row',gap:10,marginTop:12},whatsappButton:{flex:1,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',backgroundColor:'#168A55',paddingVertical:14,borderRadius:13},actionButtonText:{fontSize:12,fontWeight:'900',color:'#fff'},pdfButton:{flex:1,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',backgroundColor:palette.goldSoft,paddingVertical:14,borderRadius:13},pdfButtonText:{fontSize:12,fontWeight:'900',color:palette.navy},
  formPage:{padding:20,paddingBottom:36},fieldLabel:{fontSize:12,fontWeight:'800',color:palette.ink,marginTop:17,marginBottom:7},input:{backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:12,paddingHorizontal:13,paddingVertical:13,fontSize:13,color:palette.ink},multiline:{minHeight:90},kindRow:{flexDirection:'row',gap:8},kindButton:{flex:1,alignItems:'center',padding:12,borderRadius:11,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line},kindButtonOn:{backgroundColor:palette.navy,borderColor:palette.navy},kindText:{fontSize:12,fontWeight:'800',color:palette.muted},kindTextOn:{color:'#fff'},roomButton:{flex:1,alignItems:'center',paddingVertical:11,borderRadius:10,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line},saveButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:palette.navy,padding:16,borderRadius:14,marginTop:24,marginBottom:14},saveButtonText:{fontSize:13,fontWeight:'900',color:'#fff'},
});
