import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirebaseClient } from '../lib/firebaseClient';
import { Stat } from '../components/DashboardPrimitives';
import PropertyRow from '../components/PropertyRow';

const pad = (value: number) => String(value).padStart(2, '0');
const moneyText = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value || 0);

export default function HomeDashboardScreen(props: any) {
  const { styles, palette, role, setTab, customers = [], openCustomerDetail, properties = [], roleProperties = [], teamMembers = [], money, openProperty, officeId } = props;
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!officeId) return;
    setAppointmentsLoading(true);
    try {
      const { data, error } = await getFirebaseClient()
        .from('appointments')
        .select('id,title,starts_at,notes,customer_id,status')
        .eq('office_id', officeId)
        .neq('status', 'cancelled')
        .order('starts_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      // Keep the dashboard usable if appointments are not configured for this office yet.
      console.warn('Dashboard appointments could not be loaded:', error?.message || error);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [officeId]);

  useEffect(() => { void loadAppointments(); }, [loadAppointments]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 12
    ? 'Günaydın, hazır mısın?'
    : hour >= 12 && hour < 18
      ? 'İyi günler, hazır mısın?'
      : hour >= 18 && hour < 23
        ? 'İyi akşamlar, hazır mısın?'
        : 'İyi geceler, hazır mısın?';
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const todaysAppointments = useMemo(() => appointments
    .filter((item: any) => {
      const timestamp = new Date(item.starts_at).getTime();
      return timestamp >= todayStart && timestamp < tomorrowStart;
    })
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()), [appointments, todayStart, tomorrowStart]);
  const upcomingAppointments = useMemo(() => appointments
    .filter((item: any) => new Date(item.starts_at).getTime() >= now.getTime())
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()), [appointments]);
  const todayFollowUps = useMemo(() => customers
    .filter((customer: any) => customer.active && customer.nextFollowUpAt && new Date(customer.nextFollowUpAt).getTime() < tomorrowStart)
    .sort((a: any, b: any) => new Date(a.nextFollowUpAt).getTime() - new Date(b.nextFollowUpAt).getTime())
    .slice(0, 3), [customers, tomorrowStart]);

  const miniStat = (icon: keyof typeof Ionicons.glyphMap, label: string, value: string, hint: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ flex: 1, minWidth: '46%', padding: 14, borderRadius: 18, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: palette.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={19} color={palette.navy} />
        </View>
        <Ionicons name="arrow-up-outline" size={16} color={palette.muted} />
      </View>
      <Text style={{ fontSize: 27, fontWeight: '900', color: palette.navy }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: '800', color: palette.navy, marginTop: 3 }}>{label}</Text>
      <Text style={{ fontSize: 10, color: palette.muted, marginTop: 4 }}>{hint}</Text>
    </Pressable>
  );

  const appointmentRow = (item: any) => {
    const date = new Date(item.starts_at);
    const customer = customers.find((entry: any) => entry.id === item.customer_id);
    return (
      <Pressable key={item.id} onPress={() => customer ? openCustomerDetail(customer) : setTab('agenda')} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.line }}>
        <View style={{ width: 48, alignItems: 'center', paddingVertical: 7, borderRadius: 12, backgroundColor: palette.goldSoft }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: palette.navy }}>{pad(date.getHours())}:{pad(date.getMinutes())}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '800', color: palette.navy }}>{item.title || 'Randevu'}</Text>
          <Text numberOfLines={1} style={{ fontSize: 11, color: palette.muted, marginTop: 3 }}>{customer?.fullName || item.notes || 'Ajanda kaydı'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.muted} />
      </Pressable>
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: 8, paddingBottom: 28 }]} showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.eyebrow, { letterSpacing: 2, marginBottom: 7 }]}>{role === 'owner' ? 'OFİS YÖNETİMİ' : 'ÇALIŞMA ALANIM'}</Text>
        <Text style={[styles.pageTitle, { fontSize: 31, marginBottom: 5 }]}>{role === 'owner' ? greeting : 'Günlük çalışma alanın'}</Text>
        <Text style={[styles.pageSub, { fontSize: 13 }]}>{now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · Ofisinin bugünkü özeti</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 5 }}>
        {miniStat('business-outline', 'Toplam portföy', String(roleProperties.length), 'Aktif ve yönetilen ilanlar', () => setTab('portfolio'))}
        {miniStat('people-outline', 'Müşteriler', String(customers.filter((c: any) => c.active).length), 'Aktif müşteri kayıtları', () => setTab('customers'))}
        {miniStat('calendar-outline', 'Bugünkü randevu', String(todaysAppointments.length), 'Saatli görüşmeler', () => setTab('agenda'))}
        {miniStat('checkmark-done-outline', 'Müşteri takibi', String(todayFollowUps.length), 'Bugün ve gecikenler', () => setTab('customers'))}
      </View>

      <Pressable onPress={() => setTab('agenda')} style={{ padding: 17, borderRadius: 20, backgroundColor: palette.navy, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <View style={{ width: 49, height: 49, borderRadius: 15, backgroundColor: '#FFFFFF18', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="calendar" size={26} color={palette.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>Bugünün ajandası</Text>
          <Text style={{ fontSize: 11, color: '#D6E0E8', marginTop: 4 }}>{todaysAppointments.length ? `${todaysAppointments.length} planlı görüşme · sıradaki ${pad(new Date((upcomingAppointments[0] || todaysAppointments[0]).starts_at).getHours())}:${pad(new Date((upcomingAppointments[0] || todaysAppointments[0]).starts_at).getMinutes())}` : 'Görüşmelerini ve günlük işlerini planla'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={palette.gold} />
      </Pressable>

      <View style={{ backgroundColor: palette.white, borderRadius: 20, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5, marginBottom: 17 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: palette.navy }}>Günün programı</Text>
            <Text style={{ fontSize: 11, color: palette.muted, marginTop: 3 }}>Saat sırasına göre yaklaşan görüşmeler</Text>
          </View>
          <Pressable onPress={() => setTab('agenda')} style={{ padding: 7 }}><Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>Tümü</Text></Pressable>
        </View>
        {todaysAppointments.slice(0, 3).map(appointmentRow)}
        {!todaysAppointments.length && <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Ionicons name="calendar-clear-outline" size={25} color={palette.muted} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: palette.navy, marginTop: 7 }}>{appointmentsLoading ? 'Ajanda yükleniyor…' : 'Bugün planlanmış görüşme yok'}</Text>
          <Text style={{ fontSize: 11, color: palette.muted, marginTop: 4, textAlign: 'center' }}>Yeni bir iş veya müşteri randevusu ekleyebilirsin.</Text>
          <Pressable onPress={() => setTab('agenda')} style={{ marginTop: 11, backgroundColor: palette.goldSoft, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11 }}><Text style={{ fontSize: 12, fontWeight: '900', color: palette.navy }}>Ajandaya git</Text></Pressable>
        </View>}
        {!!todayFollowUps.length && <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: palette.line }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: palette.navy, marginBottom: 2 }}>Müşteri takipleri</Text>
          {todayFollowUps.slice(0, 2).map((customer: any) => <Pressable key={customer.id} onPress={() => openCustomerDetail(customer)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 9 }}>
            <Ionicons name="call-outline" size={16} color={palette.gold} />
            <View style={{ flex: 1 }}><Text style={{ fontSize: 12, fontWeight: '800', color: palette.navy }}>{customer.fullName}</Text><Text style={{ fontSize: 10, color: palette.muted }}>{new Date(customer.nextFollowUpAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · Geri dönüş</Text></View>
            <Ionicons name="chevron-forward" size={14} color={palette.muted} />
          </Pressable>)}
        </View>}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: palette.navy }}>Portföy özeti</Text>
        <Pressable onPress={() => setTab('portfolio')}><Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>Portföyü aç →</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 9, marginBottom: 17 }}>
        {[{ label: 'Aktif', value: roleProperties.filter((p: any) => p.status === 'Aktif').length, icon: 'checkmark-circle-outline' as const }, { label: 'Satılık', value: roleProperties.filter((p: any) => p.kind === 'Satılık' && p.status !== 'Arşivde').length, icon: 'pricetag-outline' as const }, { label: 'Kiralık', value: roleProperties.filter((p: any) => p.kind === 'Kiralık' && p.status !== 'Arşivde').length, icon: 'key-outline' as const }].map((item) => <Pressable key={item.label} onPress={() => setTab('portfolio')} style={{ flex: 1, borderRadius: 15, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, padding: 12 }}>
          <Ionicons name={item.icon} size={18} color={palette.gold} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: palette.navy, marginTop: 7 }}>{item.value}</Text>
          <Text style={{ fontSize: 11, color: palette.muted, marginTop: 2 }}>{item.label}</Text>
        </Pressable>)}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: palette.navy }}>Son eklenen ilanlar</Text>
        <Pressable onPress={() => setTab('portfolio')}><Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>Tümünü gör →</Text></Pressable>
      </View>
      {roleProperties.slice(0, 3).map((property: any) => <PropertyRow key={property.id} property={property} money={money} onPress={() => openProperty(property)} />)}
      {!roleProperties.length && <View style={{ padding: 18, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white, alignItems: 'center' }}>
        <Ionicons name="business-outline" size={26} color={palette.muted} />
        <Text style={{ fontSize: 13, fontWeight: '800', color: palette.navy, marginTop: 8 }}>Henüz portföy kaydı yok</Text>
        <Text style={{ fontSize: 11, color: palette.muted, marginTop: 4 }}>İlk ilanını ekleyerek başlayabilirsin.</Text>
      </View>}
    </ScrollView>
  );
}
