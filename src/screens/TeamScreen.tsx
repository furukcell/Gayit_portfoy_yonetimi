import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';
import BrandMark from '../components/BrandMark';

type TeamMember = { name: string; username: string; role: string; status: string; avatarPath: string | null; avatarUrl: string | null; id: string };

type Props = {
  visible: boolean;
  teamMembers: TeamMember[];
  teamStatusBusyId: string | null;
  onAddAgent: () => void;
  onToggleAgentStatus: (person: { id: string; name: string; role: string; status: string }) => void;
};

export default function TeamScreen({ visible, teamMembers, teamStatusBusyId, onAddAgent, onToggleAgentStatus }: Props) {
  if (!visible) return null;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={{flexDirection:'row',alignItems:'center',gap:7}}><BrandMark size={20}/><Text style={styles.eyebrow}>EKİP YÖNETİMİ</Text></View>
      <View style={styles.titleRow}>
        <View><Text style={styles.pageTitle}>Danışmanlar</Text><Text style={styles.pageSub}>Ofis ekibinin portföy ve performans özeti.</Text></View>
        <Pressable onPress={onAddAgent} style={styles.addButton}><Ionicons name="person-add-outline" size={22} color="#fff"/></Pressable>
      </View>
      {teamMembers.map(person => (
        <View key={person.id || person.username} style={[styles.teamCard, person.status === 'disabled' && { opacity: 0.72 }]}>
          <View style={styles.avatar}>
            {person.avatarUrl ? <Image source={{ uri: person.avatarUrl }} style={styles.avatarImage}/> : <Text style={styles.avatarText}>{person.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR')}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.teamName}>{person.name}</Text>
            <Text style={styles.teamRole}>{person.role === 'owner' ? 'Ofis sahibi' : 'Gayrimenkul danışmanı'}{person.role === 'agent' ? (person.status === 'disabled' ? ' · Devre dışı' : ' · Aktif') : ''}</Text>
            <Text style={styles.teamMeta}>@{person.username || 'kullanıcı adı yok'}</Text>
          </View>
          {person.role === 'agent' && <Pressable disabled={teamStatusBusyId === person.id} onPress={() => onToggleAgentStatus(person)} style={[styles.memberStatusButton, person.status === 'disabled' && styles.memberStatusButtonOn, teamStatusBusyId === person.id && { opacity: 0.5 }]}><Text style={[styles.memberStatusButtonText, person.status === 'disabled' && styles.memberStatusButtonTextOn]}>{teamStatusBusyId === person.id ? '…' : person.status === 'active' ? 'Devre dışı bırak' : 'Etkinleştir'}</Text></Pressable>}
        </View>
      ))}
      {!teamMembers.length && <View style={styles.empty}><Ionicons name="people-outline" size={30} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz ekip üyesi yok</Text><Text style={styles.pageSub}>Sağ üstteki butondan ilk danışmanını ekleyebilirsin.</Text></View>}
      <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={18} color={palette.muted}/><Text style={styles.noticeText}>Ekip üyeleri oturum açmış ofisin veritabanından yüklenir. Firebase Functions dağıtılmış ve Firebase yapılandırması tamamlanmış olmalıdır.</Text></View>
    </ScrollView>
  );
}
