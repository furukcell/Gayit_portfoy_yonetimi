import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type TabKey = 'home' | 'properties' | 'customers' | 'profile';
type Props = { activeTab: TabKey; onChange: (tab: TabKey) => void };

const items: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Özet', icon: 'grid-outline' },
  { key: 'properties', label: 'Portföy', icon: 'business-outline' },
  { key: 'customers', label: 'Müşteriler', icon: 'people-outline' },
  { key: 'profile', label: 'Hesabım', icon: 'person-circle-outline' },
];

export function BottomNavigation({ activeTab, onChange }: Props) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = activeTab === item.key;
        return (
          <Pressable key={item.key} accessibilityRole="button" onPress={() => onChange(item.key)} style={styles.item}>
            <View style={[styles.iconWrap, active && styles.iconActive]}>
              <Ionicons name={item.icon} size={21} color={active ? colors.gold : colors.muted} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.surface, paddingTop: 9, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 44, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  iconActive: { backgroundColor: colors.navy },
  label: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  labelActive: { color: colors.navy, fontWeight: '800' },
});