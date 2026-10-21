import React, { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View, ActivityIndicator, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import BrandMark from '../components/BrandMark';

export default function MatchesScreen(props: any) {
  const { styles, palette, matches, matchesLoading, money } = props;
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const shareCardRef = React.useRef<any>(null);
  const groupedCustomers = useMemo(() => {
    const groups = new Map<string, any>();
    (matches || []).forEach((match: any) => {
      const customer = match.customers || {};
      const customerId = customer.id || customer.full_name || match.customer_id || match.id;
      if (!groups.has(String(customerId))) {
        groups.set(String(customerId), { id: String(customerId), customer, matches: [] });
      }
      groups.get(String(customerId)).matches.push(match);
    });
    return Array.from(groups.values()).map((group: any) => ({
      ...group,
      properties: group.matches.filter((m: any) => m.properties),
      exactCount: group.matches.filter((m: any) => m.match_kind === 'exact' && m.properties).length,
      alternativeCount: group.matches.filter((m: any) => m.match_kind === 'alternative' && m.properties).length,
    }));
  }, [matches]);

  const shareMatches = async (group: any) => {
    if (sharingImage || !shareCardRef.current) return;
    setSharingImage(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Paylaşım kullanılamıyor', 'Bu cihazda görsel paylaşımı desteklenmiyor.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Uygun ilan görselini paylaş',
        UTI: 'public.png',
      });
    } catch (error: any) {
      Alert.alert('Görsel oluşturulamadı', error?.message || 'İlan görseli hazırlanırken bir hata oluştu.');
    } finally {
      setSharingImage(false);
    }
  };

  const contactCustomer = (kind: 'call' | 'whatsapp', customer: any) => {
    const phone = String(customer?.phone || '');
    if (!phone) return;
    if (kind === 'call') {
      void Linking.openURL('tel:' + phone.replace(/[^+0-9]/g, ''));
      return;
    }
    const digits = phone.replace(/[^0-9]/g, '');
    const normalized = digits.startsWith('0') ? '90' + digits.slice(1) : digits.startsWith('90') ? digits : digits;
    void Linking.openURL('https://wa.me/' + normalized);
  };

  const customerCard = (group: any) => (
    <Pressable key={group.id} onPress={() => setSelectedCustomer(group)} style={[styles.matchCard, { alignItems: 'center', gap: 12 }]}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person" size={21} color="#fff" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.teamName}>{group.customer?.full_name || 'Müşteri'}</Text>
        <Text style={styles.teamRole}>{group.properties.length} uygun ilan</Text>
        <Text style={styles.teamMeta}>
          {group.exactCount ? `${group.exactCount} tam eşleşme` : ''}
          {group.exactCount && group.alternativeCount ? ' · ' : ''}
          {group.alternativeCount ? `${group.alternativeCount} alternatif` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={palette.muted} />
    </Pressable>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><BrandMark size={20} /><Text style={styles.eyebrow}>GAYIT · AKILLI EŞLEŞME</Text></View>
        <Text style={styles.pageTitle}>Eşleşmeler</Text>
        <Text style={styles.pageSub}>Her müşteri bir kez görünür. Müşteriye dokunarak uygun ilanların tamamını incele.</Text>
        <View style={styles.matchSection}><Text style={styles.sectionTitle}>Müşteriler</Text><Text style={styles.pageSub}>Tam eşleşmeler ve alternatifler müşteri bazında birleştirildi.</Text></View>
        {groupedCustomers.map(customerCard)}
        {!matchesLoading && !groupedCustomers.length && <View style={styles.empty}><Ionicons name="git-compare-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz eşleşme yok</Text><Text style={styles.pageSub}>Müşteri talepleri ve aktif portföyler için uygun ilanlar bulunduğunda burada görüntülenir.</Text></View>}
        {matchesLoading && <Text style={styles.pageSub}>Eşleşmeler yükleniyor…</Text>}
      </ScrollView>

      {selectedCustomer && (
        <View
          ref={shareCardRef}
          collapsable={false}
          pointerEvents="none"
          style={{ position: 'absolute', left: -1200, top: 0, width: 380, backgroundColor: '#F3F6FA', padding: 20 }}
        >
          <View style={{ backgroundColor: '#10243A', borderRadius: 20, padding: 20, marginBottom: 14 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 2 }}>GAYIT</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 12 }}>Size uygun ilanlar</Text>
            <Text style={{ color: '#C7D5E5', fontSize: 14, marginTop: 6 }}>{selectedCustomer.customer?.full_name || 'Müşteri'} için {selectedCustomer.properties.length} ilan bulundu</Text>
          </View>
          {selectedCustomer.properties.map((match: any, index: number) => {
            const p = match.properties || {};
            const exact = match.match_kind === 'exact';
            const location = [p.district, p.neighborhood, p.city].filter(Boolean).join(' · ');
            return (
              <View key={match.id || p.id || index} style={{ backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#DDE5EF' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ color: '#10243A', fontSize: 15, fontWeight: '900', flex: 1 }}>{index + 1}. {p.title || 'İlan'}</Text>
                  <View style={{ backgroundColor: exact ? '#DDF7E8' : '#FFF0D5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                    <Text style={{ color: exact ? '#167447' : '#9A5B00', fontSize: 10, fontWeight: '900' }}>{exact ? 'TAM EŞLEŞME' : 'ALTERNATİF'}</Text>
                  </View>
                </View>
                {!!location && <Text style={{ color: '#64748B', fontSize: 12, marginTop: 7 }}>{location}</Text>}
                <Text style={{ color: '#1769AA', fontSize: 17, fontWeight: '900', marginTop: 8 }}>{p.listing_type === 'rent' ? 'Kiralık' : 'Satılık'} · {money(Number(p.price || 0))}</Text>
                {!!([p.rooms, p.area_m2 ? p.area_m2 + ' m²' : null].filter(Boolean).length) && <Text style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>{[p.rooms, p.area_m2 ? p.area_m2 + ' m²' : null].filter(Boolean).join(' · ')}</Text>}
                {!!(match.match_reasons || []).length && <Text style={{ color: '#64748B', fontSize: 11, marginTop: 8 }}>{match.match_reasons.join(' · ')}</Text>}
              </View>
            );
          })}
          <Text style={{ color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 6 }}>GAYIT · Portföy Yönetimi</Text>
        </View>
      )}

      <Modal visible={!!selectedCustomer} transparent animationType="slide" onRequestClose={() => setSelectedCustomer(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' }}>
          <View style={{ backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', paddingTop: 18, paddingHorizontal: 18, paddingBottom: 0, flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalHeaderTitle}>{selectedCustomer?.customer?.full_name || 'Müşteri eşleşmeleri'}</Text>
                <Text style={styles.pageSub}>{selectedCustomer?.properties?.length || 0} uygun ilan bulundu</Text>
              </View>
              <Pressable onPress={() => setSelectedCustomer(null)} style={styles.roundButton}><Ionicons name="close" size={21} color={palette.navy}/></Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Pressable disabled={!selectedCustomer?.customer?.phone} onPress={() => contactCustomer('call', selectedCustomer?.customer)} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#1677D2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, opacity: selectedCustomer?.customer?.phone ? 1 : 0.45 }}>
                <Ionicons name="call" size={17} color="#fff"/><Text style={{ color: '#fff', fontWeight: '800' }}>Ara</Text>
              </Pressable>
              <Pressable disabled={!selectedCustomer?.customer?.phone} onPress={() => contactCustomer('whatsapp', selectedCustomer?.customer)} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, opacity: selectedCustomer?.customer?.phone ? 1 : 0.45 }}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff"/><Text style={{ color: '#fff', fontWeight: '800' }}>WhatsApp</Text>
              </Pressable>
              <Pressable onPress={() => selectedCustomer && shareMatches(selectedCustomer)} style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                {sharingImage ? <ActivityIndicator color="#fff" /> : <Ionicons name="image-outline" size={17} color="#fff"/>}<Text style={{ color: '#fff', fontWeight: '800' }}>{sharingImage ? 'Hazırlanıyor' : 'Görsel paylaş'}</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: 30, gap: 10 }}>
              {(selectedCustomer?.properties || []).map((match: any, index: number) => {
                const p = match.properties || {};
                const isExact = match.match_kind === 'exact';
                const location = [p.district, p.neighborhood, p.city].filter(Boolean).join(' / ');
                return <View key={match.id || `${p.id || index}`} style={{ backgroundColor: palette.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: palette.line }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: isExact ? palette.greenSoft : palette.amberSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={isExact ? 'checkmark-circle' : 'git-compare-outline'} size={19} color={isExact ? palette.green : palette.amber}/>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>{p.title || 'İlan'}</Text>
                      {!!location && <Text style={styles.teamRole}>{location}</Text>}
                      <Text style={{ color: palette.navy, fontWeight: '900', fontSize: 15, marginTop: 4 }}>{p.listing_type === 'rent' ? 'Kiralık' : 'Satılık'} · {money(Number(p.price || 0))}</Text>
                      <Text style={styles.teamMeta}>{[p.rooms, p.area_m2 ? `${p.area_m2} m²` : null].filter(Boolean).join(' · ')}</Text>
                    </View>
                    <View style={{ backgroundColor: isExact ? palette.greenSoft : palette.amberSoft, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }}>
                      <Text style={{ color: isExact ? palette.green : palette.amber, fontSize: 10, fontWeight: '800' }}>{isExact ? 'Tam eşleşme' : 'Alternatif'}</Text>
                    </View>
                  </View>
                  {!!(match.match_reasons || []).length && <Text style={[styles.customerRoles, { marginTop: 10 }]}>{match.match_reasons.join(' · ')}</Text>}
                </View>;
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
