import React, { useMemo, useState } from 'react';
import { changeInitialPassword, signInWithUsername } from './src/lib/usernameAuth';
import {
  Alert, Linking, Modal, Pressable, ScrollView, Share, StatusBar,
  StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseClient } from './src/lib/supabase';

type Role = 'owner' | 'agent';
type Tab = 'home' | 'portfolio' | 'team' | 'stats';
type PropertyStatus = 'Aktif' | 'Opsiyonlu' | 'Satıldı' | 'Kiralandı';
type Property = {
  id: string; title: string; address: string; district: string; price: number;
  rooms: string; area: string; kind: 'Satılık' | 'Kiralık'; status: PropertyStatus;
  agent: string; views: number; createdAt: string; description: string;
};

const palette = {
  navy: '#10243A', navy2: '#1A3652', gold: '#C99A4A', goldSoft: '#F6EBDD',
  bg: '#F4F6F9', white: '#FFFFFF', ink: '#17283B', muted: '#778597',
  line: '#E3E8EF', green: '#16805D', greenSoft: '#E5F5ED', amber: '#9A6714',
  amberSoft: '#FFF3D9', red: '#B54747', redSoft: '#FCEBEC',
};
const initialProperties: Property[] = [
  { id: 'GY-1024', title: 'Modern Aile Dairesi', address: 'İsmetpaşa Mahallesi, Milas, Muğla', district: 'Milas', price: 4250000, rooms: '3+1', area: '145 m²', kind: 'Satılık', status: 'Aktif', agent: 'Mert Yılmaz', views: 126, createdAt: '12 Ekim 2026', description: 'Aydınlık salonu, kullanışlı planı ve merkezi konumuyla öne çıkan aile dairesi.' },
  { id: 'GY-1023', title: 'Bahçeli Müstakil Villa', address: 'Konacık Mahallesi, Bodrum, Muğla', district: 'Bodrum', price: 125000, rooms: '4+1', area: '220 m²', kind: 'Kiralık', status: 'Opsiyonlu', agent: 'Elif Demir', views: 94, createdAt: '10 Ekim 2026', description: 'Özel bahçeli, ferah yaşam alanlarına sahip müstakil villa.' },
  { id: 'GY-1022', title: 'Merkezi Konumda 2+1', address: 'Güllük Mahallesi, Milas, Muğla', district: 'Milas', price: 3150000, rooms: '2+1', area: '105 m²', kind: 'Satılık', status: 'Aktif', agent: 'Sen', views: 78, createdAt: '8 Ekim 2026', description: 'Ulaşım noktalarına yakın, bakımlı daire.' },
];
const money = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
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
  const [tab, setTab] = useState<Tab>('home');
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [selected, setSelected] = useState<Property | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Tümü' | 'Satılık' | 'Kiralık'>('Tümü');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [rooms, setRooms] = useState('3+1');
  const [area, setArea] = useState('');
  const [kind, setKind] = useState<'Satılık' | 'Kiralık'>('Satılık');
  const [description, setDescription] = useState('');

  const roleProperties = useMemo(() => role === 'owner' ? properties : properties.filter(p => p.agent === 'Sen'), [properties, role]);
  const visibleProperties = useMemo(() => properties.filter(p => {
    const roleMatch = role === 'owner' || p.agent === 'Sen';
    const searchMatch = `${p.title} ${p.address} ${p.id}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'));
    return roleMatch && searchMatch && (filter === 'Tümü' || p.kind === filter);
  }), [properties, role, search, filter]);

  const openMap = async (p: Property) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`;
    try { await Linking.openURL(url); } catch { Alert.alert('Harita açılamadı', 'Adresin geçerli olduğundan emin olun.'); }
  };
  const shareWhatsApp = async (p: Property) => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText(p))}`;
    try { await Linking.openURL(url); } catch { await Share.share({ message: shareText(p) }); }
  };
  const createPdf = async (p: Property) => {
    try {
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;color:#17283b;padding:32px} .brand{background:#10243a;color:white;padding:24px;border-radius:16px}
      .brand small{color:#e4c58d;letter-spacing:2px} h1{font-size:28px;margin:12px 0} .price{font-size:25px;color:#10243a;font-weight:bold;margin:24px 0}
      .pill{display:inline-block;background:#f6ebdd;padding:8px 12px;border-radius:8px;margin-right:6px}
      .section{margin-top:24px;border-top:1px solid #e3e8ef;padding-top:16px}.muted{color:#778597}
      </style></head><body><div class="brand"><small>GAYIT · PORTFÖY YÖNETİMİ</small><h1>${htmlEscape(p.title)}</h1><div>${htmlEscape(p.address)}</div></div>
      <div class="price">${money(p.price)}${p.kind === 'Kiralık' ? ' / ay' : ''}</div>
      <span class="pill">${p.kind}</span><span class="pill">${htmlEscape(p.rooms)}</span><span class="pill">${htmlEscape(p.area)}</span><span class="pill">${p.status}</span>
      <div class="section"><h3>Gayrimenkul hakkında</h3><p>${htmlEscape(p.description || 'Detaylı bilgi için danışmanımızla iletişime geçebilirsiniz.')}</p></div>
      <div class="section"><h3>Konum</h3><p>${htmlEscape(p.address)}</p></div>
      <div class="section"><p class="muted">Portföy kodu: ${p.id} · Danışman: ${htmlEscape(p.agent)}</p><p class="muted">Bu belge GAYIT Portföy Yönetimi üzerinden oluşturulmuştur.</p></div></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Gayrimenkul PDF sunumu' });
      else Alert.alert('PDF hazır', 'PDF dosyası oluşturuldu: ' + file.uri);
    } catch { Alert.alert('PDF oluşturulamadı', 'Lütfen tekrar deneyin.'); }
  };
  const handleLogin = async () => {
    setAuthBusy(true); setAuthError('');
    try {
      const result = await signInWithUsername(loginUsername, loginPassword);
      setRole(result.role);
      setOfficeId(result.officeId);
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

  const saveProperty = () => {
    const numericPrice = Number(price.replace(/[^0-9]/g, ''));
    if (!title.trim() || !address.trim() || !numericPrice || !area.trim()) {
      Alert.alert('Eksik bilgi', 'İlan başlığı, adres, fiyat ve metrekare alanlarını doldur.');
      return;
    }
    const p: Property = {
      id: `GY-${Date.now().toString().slice(-5)}`, title: title.trim(), address: address.trim(),
      district: address.split(',')[1]?.trim() || '', price: numericPrice, rooms, area: area.trim().includes('m²') ? area.trim() : area.trim() + ' m²',
      kind, status: 'Aktif', agent: role === 'owner' ? 'Ofis sahibi' : 'Sen', views: 0,
      createdAt: new Date().toLocaleDateString('tr-TR'), description: description.trim(),
    };
    setProperties(prev => [p, ...prev]); setAddOpen(false); setSelected(p); setTab('portfolio');
    setTitle(''); setAddress(''); setPrice(''); setArea(''); setDescription('');
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
            <Stat icon="eye-outline" label="Görüntülenme" value={String(roleProperties.reduce((n,p)=>n+p.views,0))} note="Örnek istatistik" />
            <Stat icon="checkmark-circle-outline" label="Aktif ilan" value={String(roleProperties.filter(p=>p.status==='Aktif').length)} note="Yayındaki portföy" />
            <Stat icon="people-outline" label={role === 'owner' ? 'Danışmanlar' : 'Paylaşım'} value={role === 'owner' ? '4' : '12'} note={role === 'owner' ? 'Örnek ekip' : 'Örnek veri'} />
          </View>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{role === 'owner' ? 'Son portföy hareketleri' : 'Portföyümden'}</Text><Pressable onPress={()=>setTab('portfolio')}><Text style={styles.link}>Tümünü gör</Text></Pressable></View>
          {roleProperties.slice(0,3).map(p=><PropertyRow key={p.id} property={p} onPress={()=>setSelected(p)} />)}
          <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Şu an örnek verilerle çalışıyor. Kullanıcı girişi ve bulut veritabanı sonraki entegrasyon aşamasında bağlanacak.</Text></View>
        </ScrollView>}

        {tab === 'portfolio' && <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>GAYIT · PORTFÖY</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Portföyler</Text><Text style={styles.pageSub}>{role === 'owner' ? 'Ofisteki tüm gayrimenkuller' : 'Sana ait gayrimenkuller'}</Text></View><Pressable onPress={()=>setAddOpen(true)} style={styles.addButton}><Ionicons name="add" size={25} color="#fff"/></Pressable></View>
          <View style={styles.search}><Ionicons name="search-outline" size={19} color={palette.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="İlan, adres veya kod ara" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
          <View style={styles.filters}>{(['Tümü','Satılık','Kiralık'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={[styles.filter,filter===f&&styles.filterOn]}><Text style={[styles.filterText,filter===f&&styles.filterTextOn]}>{f}</Text></Pressable>)}</View>
          <Text style={styles.resultCount}>{visibleProperties.length} portföy</Text>
          {visibleProperties.map(p=><PropertyRow key={p.id} property={p} onPress={()=>setSelected(p)} />)}
          {!visibleProperties.length && <View style={styles.empty}><Ionicons name="file-tray-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Portföy bulunamadı</Text><Text style={styles.pageSub}>Aramanı değiştir veya yeni ilan ekle.</Text></View>}
        </ScrollView>}

        {tab === 'team' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>EKİP YÖNETİMİ</Text><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Danışmanlar</Text><Text style={styles.pageSub}>Ofis ekibinin portföy ve performans özeti.</Text></View><Pressable onPress={()=>setAgentModalOpen(true)} style={styles.addButton}><Ionicons name="person-add-outline" size={22} color="#fff"/></Pressable></View>
          {[
            {name:'Mert Yılmaz', role:'Kıdemli danışman', count:'12 portföy', performance:'8 gösterim', initials:'MY'},
            {name:'Elif Demir', role:'Gayrimenkul danışmanı', count:'9 portföy', performance:'6 gösterim', initials:'ED'},
            {name:'Can Aydın', role:'Gayrimenkul danışmanı', count:'7 portföy', performance:'4 gösterim', initials:'CA'},
            {name:'Sen', role:'Ofis sahibi', count:`${properties.length} portföy`, performance:'Ofis yöneticisi', initials:'GY'},
          ].map((person,i)=><View key={person.name} style={styles.teamCard}><View style={styles.avatar}><Text style={styles.avatarText}>{person.initials}</Text></View><View style={{flex:1}}><Text style={styles.teamName}>{person.name}</Text><Text style={styles.teamRole}>{person.role}</Text><Text style={styles.teamMeta}>{person.count} · {person.performance}</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></View>)}
          <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Ekip listesi demo verisidir. Gerçek çalışan daveti, rol izinleri ve hesap yönetimi kimlik doğrulama entegrasyonuyla eklenecek.</Text></View>
        </ScrollView>}

        {tab === 'stats' && <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>PERFORMANS ANALİZİ</Text><Text style={styles.pageTitle}>{role === 'owner' ? 'Ofis istatistikleri' : 'Performansım'}</Text><Text style={styles.pageSub}>Portföy ve görüntülenme metrikleri.</Text>
          <View style={styles.bigMetric}><Text style={styles.metricLabel}>Toplam portföy değeri</Text><Text style={styles.metricValue}>{money(roleProperties.reduce((sum,p)=>sum+p.price,0))}</Text><Text style={styles.metricFoot}>Satılık ve kiralık ilanların fiyat toplamı; piyasa değeri değildir.</Text></View>
          <View style={styles.statGrid}><Stat icon="home-outline" label="Satılık" value={String(roleProperties.filter(p=>p.kind==='Satılık').length)} note="İlan adedi"/><Stat icon="key-outline" label="Kiralık" value={String(roleProperties.filter(p=>p.kind==='Kiralık').length)} note="İlan adedi"/><Stat icon="eye-outline" label="Görüntülenme" value={String(roleProperties.reduce((n,p)=>n+p.views,0))} note="Demo verisi"/><Stat icon="checkmark-done-outline" label="Tamamlanan" value={String(roleProperties.filter(p=>p.status==='Satıldı'||p.status==='Kiralandı').length)} note="Satış/kiralama"/></View>
          <Text style={styles.sectionTitle}>İlan durumları</Text>
          {(['Aktif','Opsiyonlu','Satıldı','Kiralandı'] as PropertyStatus[]).map(status=>{const count=roleProperties.filter(p=>p.status===status).length;return <View key={status} style={styles.progressRow}><Text style={styles.progressLabel}>{status}</Text><View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${roleProperties.length ? count/roleProperties.length*100 : 0}%`,backgroundColor:status==='Aktif'?palette.green:status==='Opsiyonlu'?palette.gold:palette.navy2}]}/></View><Text style={styles.progressCount}>{count}</Text></View>})}
        </ScrollView>}
      </View>

      <View style={styles.bottomNav}>{([{key:'home',label:'Özet',icon:'grid-outline'},{key:'portfolio',label:'Portföy',icon:'business-outline'},...(role==='owner'?[{key:'team',label:'Ekip',icon:'people-outline'} as const]:[]),{key:'stats',label:'İstatistik',icon:'bar-chart-outline'}] as {key:Tab;label:string;icon:keyof typeof Ionicons.glyphMap}[]).map(item=><Pressable key={item.key} onPress={()=>setTab(item.key)} style={styles.navItem}><View style={[styles.navIcon,tab===item.key&&styles.navIconOn]}><Ionicons name={item.icon} size={20} color={tab===item.key?palette.gold:palette.muted}/></View><Text style={[styles.navLabel,tab===item.key&&styles.navLabelOn]}>{item.label}</Text></Pressable>)}</View>

      <Modal visible={!!selected} animationType="slide" onRequestClose={()=>setSelected(null)}>
        {selected && <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}><View style={styles.modalHeader}><Pressable onPress={()=>setSelected(null)} style={styles.roundButton}><Ionicons name="chevron-down" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>İlan detayı</Text><Text style={styles.code}>{selected.id}</Text></View>
          <ScrollView contentContainerStyle={styles.modalPage}><View style={styles.propertyHero}><View style={styles.houseIcon}><Ionicons name="home" size={52} color={palette.navy2}/></View><View style={styles.statusPill}><Text style={styles.statusText}>{selected.status}</Text></View></View>
          <Text style={styles.eyebrow}>{selected.kind.toLocaleUpperCase('tr-TR')} GAYRİMENKUL</Text><Text style={styles.detailTitle}>{selected.title}</Text><View style={styles.addressLine}><Ionicons name="location-outline" size={18} color={palette.muted}/><Text style={styles.addressText}>{selected.address}</Text></View><Text style={styles.detailPrice}>{money(selected.price)}{selected.kind==='Kiralık'?<Text style={styles.perMonth}> / ay</Text>:null}</Text>
          <View style={styles.featureRow}><Feature icon="bed-outline" label="Oda" value={selected.rooms}/><Feature icon="resize-outline" label="Alan" value={selected.area}/><Feature icon="eye-outline" label="Görüntülenme" value={String(selected.views)}/></View>
          <Text style={styles.sectionTitle}>Açıklama</Text><Text style={styles.description}>{selected.description || 'Açıklama eklenmemiş.'}</Text>
          <Text style={styles.sectionTitle}>Konum ve paylaşım</Text><Pressable style={styles.mapButton} onPress={()=>openMap(selected)}><Ionicons name="navigate-circle-outline" size={23} color="#fff"/><View style={{flex:1}}><Text style={styles.mapButtonTitle}>Google Maps'te yol tarifi</Text><Text style={styles.mapButtonSub}>Adresi haritada aç ve navigasyonu başlat</Text></View><Ionicons name="open-outline" size={18} color="#fff"/></Pressable>
          <View style={styles.shareRow}><Pressable style={styles.whatsappButton} onPress={()=>shareWhatsApp(selected)}><Ionicons name="logo-whatsapp" size={21} color="#fff"/><Text style={styles.actionButtonText}>WhatsApp</Text></Pressable><Pressable style={styles.pdfButton} onPress={()=>createPdf(selected)}><Ionicons name="document-text-outline" size={21} color={palette.navy}/><Text style={styles.pdfButtonText}>PDF sunumu</Text></Pressable></View>
          <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>PDF şu an temel bilgileri içeren profesyonel bir sunum oluşturur. İlan fotoğrafları, ofis logosu ve danışman iletişim bilgileri sonraki tasarım adımında eklenecek.</Text></View>
        </ScrollView></SafeAreaView>}
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

      <Modal visible={addOpen} animationType="slide" onRequestClose={()=>setAddOpen(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}><View style={styles.modalHeader}><Pressable onPress={()=>setAddOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Yeni portföy</Text><View style={{width:40}}/></View>
          <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled"><Text style={styles.pageTitle}>Gayrimenkul ekle</Text><Text style={styles.pageSub}>İlan bilgilerini girerek portföyünü oluştur.</Text>
            <Text style={styles.fieldLabel}>İlan başlığı *</Text><TextInput value={title} onChangeText={setTitle} placeholder="Örn. Deniz manzaralı 3+1 daire" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Açık adres *</Text><TextInput value={address} onChangeText={setAddress} placeholder="Mahalle, ilçe, il" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>İlan türü</Text><View style={styles.kindRow}>{(['Satılık','Kiralık'] as const).map(k=><Pressable key={k} onPress={()=>setKind(k)} style={[styles.kindButton,kind===k&&styles.kindButtonOn]}><Text style={[styles.kindText,kind===k&&styles.kindTextOn]}>{k}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Fiyat (TL) *</Text><TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="4250000" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Oda sayısı</Text><View style={styles.kindRow}>{['1+1','2+1','3+1','4+1','5+1'].map(r=><Pressable key={r} onPress={()=>setRooms(r)} style={[styles.roomButton,rooms===r&&styles.kindButtonOn]}><Text style={[styles.kindText,rooms===r&&styles.kindTextOn]}>{r}</Text></Pressable>)}</View>
            <Text style={styles.fieldLabel}>Metrekare *</Text><TextInput value={area} onChangeText={setArea} keyboardType="numeric" placeholder="145" style={styles.input} placeholderTextColor={palette.muted}/>
            <Text style={styles.fieldLabel}>Açıklama</Text><TextInput value={description} onChangeText={setDescription} placeholder="Gayrimenkul hakkında kısa bilgi" style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholderTextColor={palette.muted}/>
            <Pressable onPress={saveProperty} style={styles.saveButton}><Text style={styles.saveButtonText}>Portföye kaydet</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable>
            <Text style={styles.noticeText}>Bu ilk sürümde kayıtlar uygulama belleğinde tutulur; uygulama kapanınca kalıcı olmaz. Kalıcı kayıt için veritabanı bağlantısı gereklidir.</Text>
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
  avatarPicker:{minHeight:100,alignItems:'center',justifyContent:'center',gap:8,backgroundColor:palette.goldSoft,borderWidth:1,borderColor:palette.line,borderRadius:16,marginTop:18},avatarPickerText:{fontSize:12,fontWeight:'800',color:palette.navy},teamCard:{flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:16,marginTop:10},avatar:{width:45,height:45,borderRadius:15,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center'},avatarText:{color:palette.gold,fontSize:13,fontWeight:'900'},teamName:{fontSize:13,fontWeight:'900',color:palette.ink},teamRole:{fontSize:10,color:palette.muted,marginTop:3},teamMeta:{fontSize:10,color:palette.navy2,fontWeight:'700',marginTop:5},
  bigMetric:{padding:19,backgroundColor:palette.navy,borderRadius:18,marginTop:20,marginBottom:16},metricLabel:{fontSize:11,color:'#C4D0DC'},metricValue:{fontSize:25,fontWeight:'900',color:'#fff',marginTop:8},metricFoot:{fontSize:9,color:'#C4D0DC',marginTop:8,lineHeight:14},progressRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:16},progressLabel:{width:78,fontSize:11,fontWeight:'700',color:palette.ink},progressTrack:{flex:1,height:8,backgroundColor:'#E5EAF0',borderRadius:6,overflow:'hidden'},progressFill:{height:8,borderRadius:6},progressCount:{width:20,textAlign:'right',fontSize:11,fontWeight:'800',color:palette.ink},
  bottomNav:{flexDirection:'row',justifyContent:'space-around',backgroundColor:palette.white,borderTopWidth:1,borderTopColor:palette.line,paddingTop:8,paddingBottom:7},navItem:{flex:1,alignItems:'center',gap:4},navIcon:{width:42,height:29,borderRadius:11,alignItems:'center',justifyContent:'center'},navIconOn:{backgroundColor:palette.navy},navLabel:{fontSize:9,color:palette.muted,fontWeight:'700'},navLabelOn:{color:palette.navy,fontWeight:'900'},
  modalSafe:{flex:1,backgroundColor:palette.bg},modalHeader:{paddingHorizontal:18,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:palette.white,borderBottomWidth:1,borderBottomColor:palette.line},roundButton:{width:40,height:40,borderRadius:13,backgroundColor:palette.bg,alignItems:'center',justifyContent:'center'},modalHeaderTitle:{fontSize:15,fontWeight:'900',color:palette.ink},code:{fontSize:10,fontWeight:'800',color:palette.muted},modalPage:{padding:20,paddingBottom:36},propertyHero:{height:165,backgroundColor:'#E4E9EE',borderRadius:20,alignItems:'center',justifyContent:'center',marginBottom:20,position:'relative'},houseIcon:{width:90,height:90,borderRadius:28,backgroundColor:'#FFFFFF80',alignItems:'center',justifyContent:'center'},statusPill:{position:'absolute',top:12,right:12,paddingHorizontal:10,paddingVertical:6,backgroundColor:palette.white,borderRadius:8},statusText:{fontSize:10,fontWeight:'800',color:palette.green},detailTitle:{fontSize:25,fontWeight:'900',color:palette.ink,marginTop:7},addressLine:{flexDirection:'row',alignItems:'center',gap:5,marginTop:9},addressText:{fontSize:12,color:palette.muted,flex:1},detailPrice:{fontSize:27,fontWeight:'900',color:palette.navy,marginTop:18},perMonth:{fontSize:13,fontWeight:'600',color:palette.muted},featureRow:{flexDirection:'row',gap:9,marginVertical:18},feature:{flex:1,alignItems:'center',paddingVertical:13,backgroundColor:palette.white,borderRadius:14,borderWidth:1,borderColor:palette.line,gap:5},featureValue:{fontSize:13,fontWeight:'900',color:palette.ink},featureLabel:{fontSize:9,color:palette.muted},description:{fontSize:12,lineHeight:20,color:palette.muted},mapButton:{flexDirection:'row',alignItems:'center',gap:10,padding:14,backgroundColor:palette.navy,borderRadius:15,marginTop:3},mapButtonTitle:{fontSize:12,fontWeight:'900',color:'#fff'},mapButtonSub:{fontSize:9,color:'#C4D0DC',marginTop:3},shareRow:{flexDirection:'row',gap:10,marginTop:12},whatsappButton:{flex:1,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',backgroundColor:'#168A55',paddingVertical:14,borderRadius:13},actionButtonText:{fontSize:12,fontWeight:'900',color:'#fff'},pdfButton:{flex:1,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',backgroundColor:palette.goldSoft,paddingVertical:14,borderRadius:13},pdfButtonText:{fontSize:12,fontWeight:'900',color:palette.navy},
  formPage:{padding:20,paddingBottom:36},fieldLabel:{fontSize:12,fontWeight:'800',color:palette.ink,marginTop:17,marginBottom:7},input:{backgroundColor:palette.white,borderWidth:1,borderColor:palette.line,borderRadius:12,paddingHorizontal:13,paddingVertical:13,fontSize:13,color:palette.ink},multiline:{minHeight:90},kindRow:{flexDirection:'row',gap:8},kindButton:{flex:1,alignItems:'center',padding:12,borderRadius:11,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line},kindButtonOn:{backgroundColor:palette.navy,borderColor:palette.navy},kindText:{fontSize:12,fontWeight:'800',color:palette.muted},kindTextOn:{color:'#fff'},roomButton:{flex:1,alignItems:'center',paddingVertical:11,borderRadius:10,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line},saveButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:palette.navy,padding:16,borderRadius:14,marginTop:24,marginBottom:14},saveButtonText:{fontSize:13,fontWeight:'900',color:'#fff'},
});
