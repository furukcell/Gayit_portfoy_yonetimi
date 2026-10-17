import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}><Ionicons name="person-outline" size={34} color={colors.gold} /></View>
      <Text style={styles.eyebrow}>GAYIT · HESAP</Text>
      <Text style={styles.title}>Hesabım</Text>
      <Text style={styles.body}>Ofis bilgileri, kullanıcı profili, bildirim tercihleri ve abonelik ayarları bu alanda yer alacak.</Text>
      <View style={styles.card}><Text style={styles.cardTitle}>Henüz giriş yapılmadı</Text><Text style={styles.cardBody}>Kimlik doğrulama ve ofis kurulumu, ilk geliştirme adımlarında eklenecek.</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  avatar: { width: 76, height: 76, borderRadius: 25, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 9 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 310 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 18, marginTop: 25, width: '100%' },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  cardBody: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 6 },
});