import React, { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandMark from '../components/BrandMark';

export default function MatchesScreen(props: any) {
  const { styles, palette, matches, matchesLoading, money } = props;
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
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
    const lines = [
      '🏡 GAYIT · MÜŞTERİYE UYGUN İLANLAR',
      group.customer?.full_name || 'Müşteri',
      '',
      ...group.properties.map((m: any, i: number) => {
        const p = m.properties || {};
        const location = [p.district, p.neighborhood, p.city].filter(Boolean).join(' / ');
        return [
          `${i + 1}. ${p.title || 'İlan'}`,
          location,
          `${p.listing_type === 'rent' ? 'Kiralık' : 'Satılık'} · ${money(Number(p.price || 0))}`,
          [p.rooms, p.area_m2 ? `${p.area_m2} m²` : null].filter(Boolean).join(' · '),
          (m.match_reasons || []).join(' · '),
        ].filter(Boolean).join('\n');
      }),
      '',
      'GAYIT Portföy Yönetimi',
    ];
    try {
      await Share.share({ title: 'Müşteri eşleşmeleri', message: lines.join('\n\n') });
    } catch {
      // Share sheet cancellation should not interrupt the screen.
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
                <Ionicons name="share-social-outline" size={17} color="#fff"/><Text style={{ color: '#fff', fontWeight: '800' }}>Paylaş</Text>
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
