import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import BrandMark from '../components/BrandMark';

export function CustomersScreen(props: any) {
  const { visible, customers = [], customersLoading, customerSearch = '', setCustomerSearch, openCustomerDetail, openAddCustomer } = props;
  if (!visible) return null;

  const filtered = customers.filter((customer: any) => {
    const query = customerSearch.trim().toLocaleLowerCase('tr-TR');
    return !query || String(customer.fullName || '').toLocaleLowerCase('tr-TR').includes(query) || String(customer.phone || '').toLocaleLowerCase('tr-TR').includes(query);
  });

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.brand}><BrandMark size={34} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>GAYIT · MÜŞTERİLER</Text>
          <Text style={styles.title}>Müşteri takibi</Text>
          <Text style={styles.subtitle}>{customers.length} kayıtlı müşteri</Text>
        </View>
        <Pressable onPress={openAddCustomer} style={styles.addButton} accessibilityRole="button" accessibilityLabel="Yeni müşteri ekle">
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addText}>Yeni</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput value={customerSearch} onChangeText={setCustomerSearch} placeholder="Ad veya telefonla ara" placeholderTextColor={colors.muted} style={styles.searchInput} returnKeyType="search" />
        {!!customerSearch && <Pressable onPress={() => setCustomerSearch('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable>}
      </View>

      {customersLoading ? (
        <View style={styles.state}><ActivityIndicator size="large" color={colors.navy} /><Text style={styles.stateText}>Müşteriler yükleniyor...</Text></View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="people-outline" size={30} color={colors.navy} /></View>
          <Text style={styles.emptyTitle}>{customerSearch ? 'Müşteri bulunamadı' : 'Henüz müşteri kaydı yok'}</Text>
          <Text style={styles.emptyText}>{customerSearch ? 'Farklı bir ad veya telefon deneyebilirsin.' : 'Alıcı, satıcı, kiracı ve yatırımcılarını buraya kaydedip görüşme, randevu ve teklif süreçlerini takip edebilirsin.'}</Text>
          {!customerSearch && <Pressable onPress={openAddCustomer} style={styles.primaryButton}><Ionicons name="person-add-outline" size={19} color="#fff" /><Text style={styles.primaryText}>İlk müşteriyi ekle</Text></Pressable>}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: any) => (
            <Pressable onPress={() => openCustomerDetail(item)} style={styles.customerCard}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{String(item.fullName || '?').trim().split(/\s+/).slice(0,2).map((part: string) => part[0] || '').join('').toLocaleUpperCase('tr-TR')}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{item.fullName || 'İsimsiz müşteri'}</Text>
                <Text style={styles.phone}>{item.phone || 'Telefon eklenmemiş'}</Text>
                {!!item.notes && <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>}
                {!!item.nextFollowUpAt && <Text style={styles.followUp}><Ionicons name="time-outline" size={13} color={colors.gold} /> Takip: {new Date(item.nextFollowUpAt).toLocaleString('tr-TR')}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  brand: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 3 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.navy, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 13 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  searchBox: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 13, marginBottom: 14 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },
  list: { paddingBottom: 24, gap: 10 },
  customerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  customerName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  phone: { color: colors.muted, fontSize: 12, marginTop: 4 },
  notes: { color: colors.muted, fontSize: 12, marginTop: 4 },
  followUp: { color: colors.text, fontSize: 11, marginTop: 6 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { color: colors.muted, fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 50 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 320 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.navy, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13, marginTop: 20 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});