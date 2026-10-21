import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stat } from '../components/DashboardPrimitives';
import PropertyRow from '../components/PropertyRow';
import BrandMark from '../components/BrandMark';

export default function HomeDashboardScreen(props: any) {
  const { styles, palette, role, setTab, customers, openCustomerDetail, properties, roleProperties, teamMembers, money, openProperty } = props;
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
              <Text style={styles.eyebrow}>{role === 'owner' ? 'OFİS YÖNETİMİ' : 'ÇALIŞMA ALANIM'}</Text>
              <Text style={styles.pageTitle}>{role === 'owner' ? 'Ofis özeti' : 'Portföyüm'}</Text>
              <Text style={styles.pageSub}>{role === 'owner' ? 'Ekibin ve portföyün tek bakışta.' : 'İlanlarını, performansını ve fırsatlarını yönet.'}</Text>
              <View style={styles.hero}><View style={{ flex: 1 }}><Text style={styles.heroKicker}>GAYIT İŞ ASİSTANI</Text><Text style={styles.heroTitle}>{role === 'owner' ? 'Ofisin kontrol altında.' : 'İyi portföy, doğru sunum.'}</Text><Text style={styles.heroBody}>{role === 'owner' ? 'Ekibin performansını izle, kararlarını veriye dayandır.' : 'Portföyünü hızlıca paylaş, müşterine profesyonel sun.'}</Text></View><View style={styles.heroIcon}><BrandMark size={46}/></View></View>
              <Pressable onPress={()=>setTab('agenda')} style={{marginTop:16,marginBottom:4,padding:15,borderRadius:16,backgroundColor:palette.navy,flexDirection:'row',alignItems:'center',gap:13,overflow:'hidden'}}><View style={{width:48,height:48,borderRadius:15,backgroundColor:'#FFFFFF18',alignItems:'center',justifyContent:'center'}}><Ionicons name="calendar" size={26} color={palette.gold}/></View><View style={{flex:1}}><Text style={{fontSize:15,fontWeight:'900',color:'#fff'}}>Ajandam</Text><Text style={{fontSize:11,color:'#D6E0E8',marginTop:3}}>Günlük işler, yaklaşan görüşmeler ve saatli randevular</Text></View><Ionicons name="chevron-forward" size={19} color={palette.gold}/></Pressable>
              <Pressable onPress={()=>setTab('customers')} style={{marginTop:8,marginBottom:4,padding:15,borderRadius:16,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><Text style={styles.sectionTitle}>Bugünün müşteri takipleri</Text><Ionicons name="chevron-forward" size={17} color={palette.muted}/></View>
                {customers.filter((c: any)=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()<=new Date(new Date().toDateString()).getTime()+24*60*60*1000).sort((a: any,b: any)=>new Date(a.nextFollowUpAt||0).getTime()-new Date(b.nextFollowUpAt||0).getTime()).slice(0,3).map((c: any)=><Pressable key={c.id} onPress={()=>openCustomerDetail(c)} style={{paddingVertical:9,borderTopWidth:1,borderTopColor:palette.line,flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:34,height:34,borderRadius:11,backgroundColor:palette.goldSoft,alignItems:'center',justifyContent:'center'}}><Ionicons name="calendar-outline" size={17} color={palette.navy}/></View><View style={{flex:1}}><Text style={styles.teamName}>{c.fullName}</Text><Text style={styles.teamMeta}>{new Date(c.nextFollowUpAt||'').toLocaleString('tr-TR',{dateStyle:'medium',timeStyle:'short'})}</Text></View><Ionicons name="chevron-forward" size={15} color={palette.muted}/></Pressable>)}
                {!customers.some((c: any)=>c.active&&c.nextFollowUpAt&&new Date(c.nextFollowUpAt).getTime()<=new Date(new Date().toDateString()).getTime()+24*60*60*1000)&&<Text style={styles.pageSub}>Bugün veya gecikmiş takip yok. Müşteri detayından takip tarihi ekleyebilirsin.</Text>}
              </Pressable>
              <View style={styles.statGrid}>
                <Stat icon="business-outline" label={role === 'owner' ? 'Toplam portföy' : 'Portföyüm'} value={String(role === 'owner' ? properties.length : properties.filter((p: any) => p.agent === 'Sen').length)} note="Aktif kayıtlar" />
                <Stat icon="eye-outline" label="Görüntülenme" value="—" note="Ölçüm kurulmadı" />
                <Stat icon="checkmark-circle-outline" label="Aktif ilan" value={String(roleProperties.filter((p: any)=>p.status==='Aktif').length)} note="Yayındaki portföy" />
                <Stat icon="people-outline" label={role === 'owner' ? 'Danışmanlar' : 'Müşteriler'} value={String(role === 'owner' ? teamMembers.filter((m: any)=>m.role==='agent').length : customers.length)} note="Gerçek kayıtlar" />
              </View>
              <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{role === 'owner' ? 'Son portföy hareketleri' : 'Portföyümden'}</Text><Pressable onPress={()=>setTab('portfolio')}><Text style={styles.link}>Tümünü gör</Text></Pressable></View>
              {roleProperties.slice(0,3).map((p: any)=><PropertyRow key={p.id} property={p} money={money} onPress={()=>openProperty(p)} />)}
            </ScrollView>
  );
}
