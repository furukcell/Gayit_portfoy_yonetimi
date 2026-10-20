import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function CustomersScreen(_props: any) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Ionicons name="people-outline" size={34} color={colors.gold} /></View>
      <Text style={styles.eyebrow}>GAYIT · MÜŞTERİLER</Text>
      <Text style={styles.title}>Müşteri takibi</Text>
      <Text style={styles.body}>Alıcı ve kiracı taleplerini, bütçelerini ve aradıkları özellikleri burada yöneteceğiz.</Text>
      <View style={styles.note}><Ionicons name="construct-outline" size={18} color={colors.navy} /><Text style={styles.noteText}>Bu ekran geliştirme aşamasında. Henüz müşteri kaydı tutulmuyor.</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  icon: { width: 76, height: 76, borderRadius: 25, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 9 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 310 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 15, marginTop: 25 },
  noteText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
});