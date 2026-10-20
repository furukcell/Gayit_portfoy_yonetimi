import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandMark from '../components/BrandMark';

export default function MatchesScreen(props: any) {
  const { styles, palette, matches, matchesLoading, money } = props;
  return (
    <ScrollView contentContainerStyle={styles.page}>
              <View style={{flexDirection:'row',alignItems:'center',gap:7}}><BrandMark size={20}/><Text style={styles.eyebrow}>GAYIT · AKILLI EŞLEŞME</Text></View><Text style={styles.pageTitle}>Eşleşmeler</Text><Text style={styles.pageSub}>Tam eşleşmeleri ve esnek alternatifleri ayrı takip et.</Text>
              <View style={styles.matchSection}><Text style={styles.sectionTitle}>Tam eşleşmeler</Text><Text style={styles.pageSub}>Kayıtlı zorunlu kriterleri karşılayan ilanlar.</Text></View>
              {matches.filter((m:any)=>m.match_kind==='exact').map((m:any)=><View key={m.id} style={styles.matchCard}><View style={{flex:1,minWidth:0}}><Text style={styles.teamName}>{m.customers?.full_name || 'Müşteri'}</Text><Text style={styles.teamRole}>{m.properties?.title || 'İlan'} · {m.properties?.district || 'Konum belirtilmemiş'}</Text><Text style={styles.teamMeta}>{m.properties?.listing_type==='rent'?'Kiralık':'Satılık'} · {money(Number(m.properties?.price || 0))}</Text><Text style={styles.customerRoles}>{(m.match_reasons || []).join(' · ') || 'Eşleşme gerekçesi eklenmemiş'}</Text></View><View style={[styles.matchScore,{flexShrink:0,alignSelf:'flex-start'}]}><Text style={styles.matchScoreText}>{m.match_score == null ? '—' : `${m.match_score}%`}</Text></View></View>)}
              <View style={styles.matchSection}><Text style={styles.sectionTitle}>Alternatifler</Text><Text style={styles.pageSub}>Kriterleri tam karşılamayan fakat makul alternatif olabilecek ilanlar; farklar gerekçelerde açıklanır.</Text></View>
              {matches.filter((m:any)=>m.match_kind==='alternative').map((m:any)=><View key={m.id} style={styles.matchCard}><View style={{flex:1,minWidth:0}}><Text style={styles.teamName}>{m.customers?.full_name || 'Müşteri'}</Text><Text style={styles.teamRole}>{m.properties?.title || 'Alternatif ilan'}</Text><Text style={styles.customerRoles}>{(m.match_reasons || []).join(' · ')}</Text></View></View>)}
              {!matchesLoading && !matches.length && <View style={styles.empty}><Ionicons name="git-compare-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz eşleşme yok</Text><Text style={styles.pageSub}>Müşteri talepleri ve aktif portföyler için uygun ilanlar bulunduğunda eşleşmeler burada görüntülenir.</Text></View>}
              {matchesLoading && <Text style={styles.pageSub}>Eşleşmeler yükleniyor…</Text>}
            </ScrollView>
  );
}
