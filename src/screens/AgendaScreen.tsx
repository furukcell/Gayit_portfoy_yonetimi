import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirebaseClient } from '../lib/firebaseClient';
import { getFirebaseAuth } from '../lib/firebase';

const pad=(n:number)=>String(n).padStart(2,'0');
const toLocalInput=(date:Date)=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
const parseLocal=(value:string)=>new Date(value.trim().replace(' ','T')+(value.trim().length===16?':00':''));

export default function AgendaScreen({styles,palette,officeId,customers,openCustomerDetail}:any) {
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [title,setTitle]=useState('');
  const [startsAt,setStartsAt]=useState(toLocalInput(new Date(Date.now()+60*60*1000)));
  const [notes,setNotes]=useState('');
  const [customerId,setCustomerId]=useState('');
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{
    if(!officeId)return;
    setLoading(true);
    try {
      const {data,error}=await getFirebaseClient().from('appointments').select('*').eq('office_id',officeId).order('starts_at',{ascending:true}).limit(200);
      if(error)throw error;
      setItems((data||[]).filter((x:any)=>x.status!=='cancelled').sort((a:any,b:any)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));
    } catch(e:any) { Alert.alert('Ajanda yüklenemedi',e?.message||'Randevular okunamadı.'); }
    finally {setLoading(false);}
  },[officeId]);
  useEffect(()=>{void load();},[load]);
  const now=new Date();
  const upcoming=useMemo(()=>items.filter(x=>new Date(x.starts_at).getTime()>=now.getTime()),[items]);
  const today=useMemo(()=>items.filter(x=>{const d=new Date(x.starts_at);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();}),[items]);
  const save=async()=>{
    const when=parseLocal(startsAt);
    if(!title.trim()){Alert.alert('İş başlığı gerekli','Örneğin müşteri görüşmesi, portföy gösterimi veya telefonla arama.');return;}
    if(Number.isNaN(when.getTime())){Alert.alert('Tarih/saat hatalı','Tarih ve saati YYYY-AA-GG SS:DD biçiminde gir.');return;}
    setSaving(true);
    try{
      const customer=customers.find((c:any)=>c.id===customerId);
      const {data,error}=await getFirebaseClient().from('appointments').insert({
        office_id:officeId,customer_id:customer?.id||null,assigned_agent_id:customer?.assignedAgentId||getFirebaseAuth().currentUser?.uid||null,
        title:title.trim(),starts_at:when.toISOString(),notes:notes.trim(),status:'scheduled',created_by:getFirebaseAuth().currentUser?.uid||null
      }).select('*').single();
      if(error)throw error;
      setItems((prev:any[])=>[...prev,data].sort((a:any,b:any)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()));
      setTitle('');setNotes('');setCustomerId('');setShowForm(false);
      Alert.alert('Ajandaya eklendi','İş veya görüşme takvime kaydedildi.');
    }catch(e:any){Alert.alert('Kaydedilemedi',e?.message||'Ajanda kaydı oluşturulamadı.');}
    finally{setSaving(false);}
  };
  const renderItem=(item:any)=>{
    const customer=customers.find((c:any)=>c.id===item.customer_id);
    const date=new Date(item.starts_at);
    const overdue=date.getTime()<Date.now();
    return <View key={item.id} style={{flexDirection:'row',gap:12,padding:13,borderRadius:14,borderWidth:1,borderColor:palette.line,backgroundColor:palette.white,marginBottom:9}}>
      <View style={{width:54,alignItems:'center',justifyContent:'center',borderRadius:11,backgroundColor:overdue?'#FFF0ED':palette.goldSoft,paddingVertical:8}}>
        <Text style={{fontSize:11,fontWeight:'800',color:overdue?'#A13D3D':palette.navy}}>{pad(date.getDate())}.{pad(date.getMonth()+1)}</Text>
        <Text style={{fontSize:15,fontWeight:'900',color:overdue?'#A13D3D':palette.navy}}>{pad(date.getHours())}:{pad(date.getMinutes())}</Text>
      </View>
      <View style={{flex:1}}>
        <Text style={{fontSize:14,fontWeight:'800',color:palette.ink}}>{item.title||'Ajanda kaydı'}</Text>
        {!!customer&&<Pressable onPress={()=>openCustomerDetail(customer)}><Text style={{fontSize:12,color:palette.navy,fontWeight:'700',marginTop:3}}><Ionicons name="person-outline" size={12}/> {customer.fullName}</Text></Pressable>}
        {!!item.notes&&<Text style={{fontSize:12,color:palette.muted,marginTop:4,lineHeight:17}}>{item.notes}</Text>}
        <Text style={{fontSize:10,color:overdue?'#A13D3D':palette.muted,marginTop:5}}>{date.toLocaleDateString('tr-TR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}{overdue?' · Geçmiş':' · Planlandı'}</Text>
      </View>
    </View>;
  };
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Ionicons name="calendar" size={22} color={palette.gold}/><Text style={styles.eyebrow}>GAYIT · PLANLAMA</Text></View>
    <Text style={styles.pageTitle}>Ajandam</Text>
    <Text style={styles.pageSub}>Günlük işler, müşteri görüşmeleri ve yaklaşan randevular tek yerde.</Text>
    <View style={{backgroundColor:palette.navy,borderRadius:18,padding:17,marginTop:14,marginBottom:14}}>
      <Text style={{fontSize:11,fontWeight:'800',letterSpacing:1,color:palette.gold}}>BUGÜNÜN AJANDASI</Text>
      <View style={{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginTop:7}}>
        <View><Text style={{fontSize:30,fontWeight:'900',color:'#fff'}}>{today.length}</Text><Text style={{fontSize:12,color:'#D6E0E8'}}>Bugünkü kayıt</Text></View>
        <View><Text style={{fontSize:30,fontWeight:'900',color:'#fff'}}>{upcoming.length}</Text><Text style={{fontSize:12,color:'#D6E0E8'}}>Yaklaşan iş</Text></View>
        <Pressable onPress={()=>setShowForm(v=>!v)} style={{backgroundColor:palette.gold,borderRadius:12,paddingHorizontal:13,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:5}}><Ionicons name="add" size={18} color={palette.navy}/><Text style={{fontSize:12,fontWeight:'900',color:palette.navy}}>Yeni iş</Text></Pressable>
      </View>
    </View>
    {showForm&&<View style={{padding:15,borderRadius:16,borderWidth:1,borderColor:palette.line,backgroundColor:palette.white,marginBottom:16,gap:10}}>
      <Text style={styles.sectionTitle}>Ajandaya kayıt ekle</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="İş / görüşme başlığı" placeholderTextColor={palette.muted} style={{borderWidth:1,borderColor:palette.line,borderRadius:10,padding:12,color:palette.ink}}/>
      <Text style={{fontSize:11,color:palette.muted}}>Tarih ve saat (yerel saat)</Text>
      <TextInput value={startsAt} onChangeText={setStartsAt} placeholder="2026-10-21 14:30" placeholderTextColor={palette.muted} style={{borderWidth:1,borderColor:palette.line,borderRadius:10,padding:12,color:palette.ink}}/>
      <Text style={{fontSize:11,color:palette.muted}}>Müşteriyle ilişkilendir (isteğe bağlı)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>
        <Pressable onPress={()=>setCustomerId('')} style={{padding:9,borderRadius:9,borderWidth:1,borderColor:!customerId?palette.gold:palette.line,backgroundColor:!customerId?palette.goldSoft:palette.white}}><Text style={{fontSize:11,color:palette.ink}}>Genel iş</Text></Pressable>
        {customers.filter((c:any)=>c.active).map((c:any)=><Pressable key={c.id} onPress={()=>setCustomerId(c.id)} style={{padding:9,borderRadius:9,borderWidth:1,borderColor:customerId===c.id?palette.gold:palette.line,backgroundColor:customerId===c.id?palette.goldSoft:palette.white}}><Text style={{fontSize:11,color:palette.ink}}>{c.fullName}</Text></Pressable>)}
      </ScrollView>
      <TextInput value={notes} onChangeText={setNotes} placeholder="Notlar / adres / yapılacaklar" placeholderTextColor={palette.muted} multiline style={{minHeight:76,textAlignVertical:'top',borderWidth:1,borderColor:palette.line,borderRadius:10,padding:12,color:palette.ink}}/>
      <View style={{flexDirection:'row',gap:8}}>
        <Pressable onPress={()=>setShowForm(false)} style={{flex:1,padding:12,alignItems:'center',borderRadius:10,borderWidth:1,borderColor:palette.line}}><Text style={{color:palette.ink,fontWeight:'700'}}>Vazgeç</Text></Pressable>
        <Pressable disabled={saving} onPress={save} style={{flex:1,padding:12,alignItems:'center',borderRadius:10,backgroundColor:palette.navy,opacity:saving?0.6:1}}><Text style={{color:'#fff',fontWeight:'800'}}>{saving?'Kaydediliyor…':'Ajandaya kaydet'}</Text></Pressable>
      </View>
    </View>}
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><Text style={styles.sectionTitle}>Yaklaşanlar ve günlük işler</Text><Pressable onPress={()=>void load()}><Ionicons name="refresh-outline" size={19} color={palette.navy}/></Pressable></View>
    {loading?<Text style={styles.pageSub}>Ajanda yükleniyor…</Text>:items.length?items.map(renderItem):<View style={{padding:22,alignItems:'center',borderRadius:16,backgroundColor:palette.white,borderWidth:1,borderColor:palette.line}}><Ionicons name="calendar-outline" size={32} color={palette.gold}/><Text style={{fontWeight:'800',color:palette.ink,marginTop:8}}>Ajandan boş görünüyor</Text><Text style={{fontSize:12,color:palette.muted,textAlign:'center',marginTop:4}}>Müşteri detayındaki randevuların otomatik burada listelenir. Yeni iş ekleyerek başlayabilirsin.</Text></View>}
  </ScrollView>;
}
