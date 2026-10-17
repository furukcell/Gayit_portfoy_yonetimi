import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Property, formatPrice } from '../data/properties';
import { colors } from '../theme';

type Props = { property: Property };

export function PropertyCard({ property }: Props) {
  const statusStyle = property.status === 'Aktif' ? styles.active : styles.optioned;
  return (
    <View style={styles.card}>
      <View style={[styles.thumb, { backgroundColor: property.accent }]}>
        <View style={styles.house}>
          <View style={styles.roof} />
          <View style={styles.houseBody}>
            <View style={styles.window} />
            <View style={styles.window} />
            <View style={styles.door} />
          </View>
        </View>
        <Text style={styles.code}>{property.id}</Text>
      </View>
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <View style={[styles.badge, statusStyle]}><Text style={styles.badgeText}>{property.status}</Text></View>
        </View>
        <Text style={styles.location} numberOfLines={1}>⌖  {property.location}</Text>
        <Text style={styles.price}>{formatPrice(property.price, property.type)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{property.rooms}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{property.area} m²</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{property.type}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  thumb: { height: 116, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  house: { width: 84, alignItems: 'center' },
  roof: { width: 0, height: 0, borderLeftWidth: 44, borderRightWidth: 44, borderBottomWidth: 38, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.navyLight },
  houseBody: { width: 68, height: 42, backgroundColor: colors.navyLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  window: { width: 11, height: 13, backgroundColor: '#E7C98F', borderRadius: 2 },
  door: { width: 12, height: 23, backgroundColor: '#E7C98F', alignSelf: 'flex-end', marginBottom: 0, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  code: { position: 'absolute', right: 10, top: 10, fontSize: 10, color: colors.navy, backgroundColor: '#FFFFFFCC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontWeight: '700' },
  details: { padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  active: { backgroundColor: colors.successSoft },
  optioned: { backgroundColor: colors.warningSoft },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.success },
  location: { fontSize: 12, color: colors.muted, marginTop: 7 },
  price: { fontSize: 19, fontWeight: '900', color: colors.navy, marginTop: 10, letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  meta: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.gold },
});