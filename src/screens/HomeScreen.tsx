import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyCard } from '../components/PropertyCard';
import { SectionHeader } from '../components/SectionHeader';
import { sampleProperties } from '../data/properties';
import { colors } from '../theme';

type Props = { onOpenProperties: () => void };

export function HomeScreen({ onOpenProperties }: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>GAYIT · PORTFÖY YÖNETİMİ</Text>
          <Text style={styles.greeting}>Günaydın 👋</Text>
          <Text style={styles.subtitle}>Bugün ofisinde neler oluyor?</Text>
        </View>
        <Pressable style={styles.notification} accessibilityRole="button" accessibilityLabel="Bildirimler">
          <Ionicons name="notifications-outline" size={22} color={colors.navy} />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.welcomeCopy}>
          <Text style={styles.welcomeLabel}>OFİS ÖZETİ</Text>
          <Text style={styles.welcomeTitle}>Portföyün{ '\n' }kontrol altında.</Text>
          <Text style={styles.welcomeBody}>İşlerini tek yerden takip et, fırsatları kaçırma.</Text>
        </View>
        <View style={styles.welcomeIcon}><Ionicons name="business" size={38} color={colors.gold} /></View>
        <View style={styles.welcomeAccent} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="home-outline" label="Toplam portföy" value="24" change="+3 bu hafta" />
        <StatCard icon="people-outline" label="Aktif müşteriler" value="18" change="4 yeni talep" />
        <StatCard icon="calendar-outline" label="Gösterimler" value="7" change="Bu hafta" />
        <StatCard icon="trending-up-outline" label="Fiyat güncelleme" value="3" change="İncelenmeli" />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickTitle}>Hızlı işlemler</Text>
        <View style={styles.actionRow}>
          <QuickAction icon="add-circle-outline" label="Portföy ekle" onPress={onOpenProperties} />
          <QuickAction icon="person-add-outline" label="Müşteri ekle" />
          <QuickAction icon="document-text-outline" label="Sunum hazırla" />
        </View>
      </View>

      <SectionHeader title="Son portföyler" action="Tümünü gör" onAction={onOpenProperties} />
      {sampleProperties.slice(0, 2).map((property) => <PropertyCard key={property.id} property={property} />)}
      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
        <Text style={styles.footerText}>Örnek veriler gösterilmektedir. Gerçek ofis verileri henüz bağlanmadı.</Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, change }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; change: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={styles.statIcon}><Ionicons name={icon} size={18} color={colors.navyLight} /></View>
        <Text style={styles.statChange}>{change}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button">
      <View style={styles.actionIcon}><Ionicons name={icon} size={22} color={colors.navy} /></View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 6 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  greeting: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 5 },
  notification: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 7, height: 7, backgroundColor: colors.gold, borderRadius: 4, position: 'absolute', top: 10, right: 11 },
  welcomeCard: { backgroundColor: colors.navy, borderRadius: 22, padding: 20, minHeight: 168, overflow: 'hidden', flexDirection: 'row', marginBottom: 18 },
  welcomeCopy: { flex: 1, zIndex: 1 },
  welcomeLabel: { color: '#E5C58B', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  welcomeTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 30, fontWeight: '900', marginTop: 10, letterSpacing: -0.5 },
  welcomeBody: { color: '#C3CFDC', fontSize: 11, lineHeight: 16, marginTop: 8, maxWidth: 215 },
  welcomeIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#FFFFFF12', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  welcomeAccent: { position: 'absolute', width: 150, height: 150, borderRadius: 80, borderWidth: 1, borderColor: '#FFFFFF12', right: -48, bottom: -75 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 17, padding: 13, borderWidth: 1, borderColor: colors.border, minHeight: 112 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  statChange: { color: colors.muted, fontSize: 9, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  statValue: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 8 },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 1, fontWeight: '600' },
  quickActions: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15, marginBottom: 23 },
  quickTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 13 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  action: { flex: 1, alignItems: 'center', gap: 7 },
  actionIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  footerText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 14 },
});