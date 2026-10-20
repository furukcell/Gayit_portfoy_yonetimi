import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';
import { Stat } from '../components/DashboardPrimitives';
import type { Customer, Property, PropertyStatus, Role } from '../types/property';

type TeamMember = { name: string; role: string; id: string };
type Props = {
  visible: boolean;
  role: Role;
  roleProperties: Property[];
  customers: Customer[];
  teamMembers: TeamMember[];
  money: (amount: number) => string;
  onSharePortfolioReport: () => void;
};

export default function StatsScreen({ visible, role, roleProperties, customers, teamMembers, money, onSharePortfolioReport }: Props) {
  if (!visible) return null;
  const now = Date.now();
  const today = new Date().toDateString();
  const followUpDue = customers.filter(c => c.active && c.nextFollowUpAt && new Date(c.nextFollowUpAt).getTime() <= now).length;
  const upcomingFollowUps = customers.filter(c => c.active && c.nextFollowUpAt && new Date(c.nextFollowUpAt).getTime() >= now && new Date(c.nextFollowUpAt).getTime() <= now + 7 * 24 * 60 * 60 * 1000).length;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>PERFORMANS ANALİZİ</Text>
      <Text style={styles.pageTitle}>{role === 'owner' ? 'Ofis istatistikleri' : 'Performansım'}</Text>
      <Text style={styles.pageSub}>Portföy ve görüntülenme metrikleri.</Text>
      <Pressable onPress={onSharePortfolioReport} style={[styles.saveButton, { marginTop: 14, marginBottom: 16 }]}><Ionicons name="share-outline" size={19} color="#fff"/><Text style={styles.saveButtonText}>Portföy raporunu paylaş</Text></Pressable>
      <View style={styles.bigMetric}><Text style={styles.metricLabel}>Toplam portföy değeri</Text><Text style={styles.metricValue}>{money(roleProperties.reduce((sum, p) => sum + p.price, 0))}</Text><Text style={styles.metricFoot}>Satılık ve kiralık ilanların fiyat toplamı; piyasa değeri değildir.</Text></View>
      <View style={styles.statGrid}>
        <Stat icon="home-outline" label="Satılık" value={String(roleProperties.filter(p => p.kind === 'Satılık').length)} note="İlan adedi"/>
        <Stat icon="key-outline" label="Kiralık" value={String(roleProperties.filter(p => p.kind === 'Kiralık').length)} note="İlan adedi"/>
        <Stat icon="people-outline" label="Müşteriler" value={String(customers.filter(c => c.active).length)} note="Aktif kayıt"/>
        <Stat icon="checkmark-done-outline" label="Tamamlanan" value={String(roleProperties.filter(p => p.status === 'Satıldı' || p.status === 'Kiralandı').length)} note="Satış/kiralama"/>
        <Stat icon="calendar-outline" label="Bugünkü takip" value={String(customers.filter(c => c.active && c.nextFollowUpAt && new Date(c.nextFollowUpAt).toDateString() === today).length)} note="Müşteri takibi"/>
        <Stat icon="alert-circle-outline" label="Geciken takip" value={String(customers.filter(c => c.active && c.nextFollowUpAt && new Date(c.nextFollowUpAt).getTime() < now && new Date(c.nextFollowUpAt).toDateString() !== today).length)} note="Takip bekliyor"/>
      </View>
      <Text style={styles.sectionTitle}>Satış fırsatı kontrolü</Text>
      <View style={styles.moreCard}><Ionicons name="time-outline" size={22} color={palette.navy}/><View style={{ flex: 1 }}><Text style={styles.teamName}>Takip bekleyen müşteri</Text><Text style={styles.teamRole}>{followUpDue} müşteri için takip tarihi geçmiş veya bugün. Ana sayfadaki takip listesinden müşteriyi açıp sonraki adımı kaydet.</Text></View></View>
      <View style={styles.moreCard}><Ionicons name="calendar-outline" size={22} color={palette.navy}/><View style={{ flex: 1 }}><Text style={styles.teamName}>Önümüzdeki 7 günün takipleri</Text><Text style={styles.teamRole}>{upcomingFollowUps} takip önümüzdeki 7 gün içinde. Müşteri detayından takip tarihini yönet.</Text></View></View>
      <Text style={styles.sectionTitle}>İlan durumları</Text>
      {(['Aktif', 'Opsiyonlu', 'Satıldı', 'Kiralandı', 'Arşivde'] as PropertyStatus[]).map(status => {
        const count = roleProperties.filter(p => p.status === status).length;
        return <View key={status} style={styles.progressRow}><Text style={styles.progressLabel}>{status}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${roleProperties.length ? count / roleProperties.length * 100 : 0}%`, backgroundColor: status === 'Aktif' ? palette.green : status === 'Opsiyonlu' ? palette.gold : status === 'Arşivde' ? palette.muted : palette.navy2 }]}/></View><Text style={styles.progressCount}>{count}</Text></View>;
      })}
      {role === 'owner' && <><Text style={styles.sectionTitle}>Danışman bazlı portföy</Text><Text style={styles.pageSub}>Yalnızca veritabanından yüklenen portföy kayıtları sayılır. Görüntülenme verisi ölçülmediği için dahil edilmez.</Text>
        {teamMembers.filter(person => person.role === 'agent').map(person => {
          const agentProperties = roleProperties.filter(p => p.ownerAgentId === person.id);
          const activeCount = agentProperties.filter(p => p.status === 'Aktif' || p.status === 'Opsiyonlu').length;
          const totalValue = agentProperties.reduce((sum, p) => sum + p.price, 0);
          return <View key={person.id} style={styles.teamCard}><View style={{ flex: 1 }}><Text style={styles.teamName}>{person.name}</Text><Text style={styles.teamRole}>{agentProperties.length} portföy · {activeCount} aktif/opsiyonlu</Text><Text style={styles.teamMeta}>Fiyat toplamı: {money(totalValue)}</Text></View></View>;
        })}
        {!teamMembers.some(person => person.role === 'agent') && <View style={styles.empty}><Text style={styles.pageSub}>Danışman verisi bulunamadı.</Text></View>}
      </>}
    </ScrollView>
  );
}
