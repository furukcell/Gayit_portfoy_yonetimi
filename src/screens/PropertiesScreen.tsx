import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyCard } from '../components/PropertyCard';
import { sampleProperties } from '../data/properties';
import { colors } from '../theme';

type Filter = 'Tümü' | 'Satılık' | 'Kiralık';

export function PropertiesScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Tümü');
  const filtered = useMemo(() => sampleProperties.filter((item) => {
    const matchesQuery = `${item.title} ${item.location} ${item.id}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'));
    return matchesQuery && (filter === 'Tümü' || item.type === filter);
  }), [query, filter]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>GAYIT · PORTFÖY</Text>
      <View style={styles.titleRow}>
        <View><Text style={styles.title}>Portföylerim</Text><Text style={styles.subtitle}>Gayrimenkullerini tek yerden yönet.</Text></View>
        <Pressable style={styles.addButton} accessibilityRole="button"><Ionicons name="add" size={24} color="#FFFFFF" /></Pressable>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Portföy, konum veya kod ara" placeholderTextColor={colors.muted} style={styles.searchInput} />
        {query.length > 0 ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></Pressable> : null}
      </View>
      <View style={styles.filters}>
        {(['Tümü', 'Satılık', 'Kiralık'] as Filter[]).map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.result}>{filtered.length} portföy listeleniyor</Text>
      {filtered.map((item) => <PropertyCard key={item.id} property={item} />)}
      {filtered.length === 0 ? <View style={styles.empty}><Ionicons name="search-outline" size={32} color={colors.muted} /><Text style={styles.emptyTitle}>Sonuç bulunamadı</Text><Text style={styles.subtitle}>Arama kelimeni veya filtreyi değiştir.</Text></View> : null}
      <Text style={styles.disclaimer}>Demo amaçlı örnek portföy verileri.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 30 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 6 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 18 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5 },
  addButton: { width: 46, height: 46, backgroundColor: colors.navy, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 13, height: 50 },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 17 },
  filter: { borderRadius: 11, paddingVertical: 9, paddingHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#FFFFFF' },
  result: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 12 },
  empty: { backgroundColor: colors.surface, borderRadius: 18, padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  disclaimer: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 8 },
});