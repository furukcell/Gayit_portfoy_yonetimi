import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirebaseClient } from '../lib/firebaseClient';
import { getFirebaseAuth } from '../lib/firebase';

const pad=(n:number)=>String(n).padStart(2,'0');
const toLocalInput=(date:Date)=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
const parseLocal=(value:string)=>new Date(value.trim().replace(' ','T')+(value.trim().length===16?':00':''));
const datePart=(value:string)=>value.slice(0,10);
const timePart=(value:string)=>value.slice(11,16);

const reminderStorageKey=(officeId:string,appointmentId:string)=>'agenda-reminders:'+officeId+':'+appointmentId;

const scheduleAppointmentReminders=async(officeId:string,item:any)=>{
  if(!officeId||!item?.id||!item?.starts_at||item.status==='cancelled')return;
  const startAt=new Date(item.starts_at).getTime();
  if(!Number.isFinite(startAt)||startAt<=Date.now())return;
  const storageKey=reminderStorageKey(officeId,String(item.id));
  if(await AsyncStorage.getItem(storageKey))return;

  let permission=await Notifications.getPermissionsAsync();
  if(permission.status!=='granted')permission=await Notifications.requestPermissionsAsync();
  if(permission.status!=='granted')return;

  await Notifications.setNotificationChannelAsync('agenda-reminders',{
    name:'Ajanda hatırlatmaları',
    importance:Notifications.AndroidImportance.HIGH,
    sound:'default'
  });

  const reminders=[60,30,15];
  const notificationIds:string[]=[];
  for(const minutes of reminders){
    const fireAt=startAt-minutes*60*1000;
    if(fireAt<=Date.now())continue;
    const id=await Notifications.scheduleNotificationAsync({
      content:{
        title:'Ajanda hatırlatması',
        body:'“'+(item.title||'Ajanda kaydı')+'” '+minutes+' dakika sonra başlayacak.',
        sound:'default',
        data:{appointmentId:String(item.id),officeId}
      },
      trigger:{
        type:Notifications.SchedulableTriggerInputTypes.DATE,
        date:new Date(fireAt),
        channelId:'agenda-reminders'
      }
    });
    notificationIds.push(id);
  }
  await AsyncStorage.setItem(storageKey,JSON.stringify(notificationIds));
};

export default function AgendaScreen({styles,palette,officeId,customers,openCustomerDetail}:any) {
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [title,setTitle]=useState('');
  const [startsAt,setStartsAt]=useState(toLocalInput(new Date(Date.now()+60*60*1000)));
  const [calendarMonth,setCalendarMonth]=useState(()=>{const d=parseLocal(toLocalInput(new Date(Date.now()+60*60*1000)));return new Date(d.getFullYear(),d.getMonth(),1);});
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
      const activeItems=(data||[]).filter((x:any)=>x.status!=='cancelled').sort((a:any,b:any)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime());
      setItems(activeItems);
      for(const appointment of activeItems){
        try{await scheduleAppointmentReminders(String(officeId),appointment);}
        catch(notificationError){console.warn('Ajanda bildirimi planlanamadı',notificationError);}
      }
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
      try{await scheduleAppointmentReminders(String(officeId),data);}
      catch(notificationError){console.warn('Ajanda bildirimi planlanamadı',notificationError);}
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
      <Text style={{fontSize:12,fontWeight:'800',color:palette.ink}}>Tarih seç</Text>
      <View style={{borderWidth:1,borderColor:palette.line,borderRadius:14,padding:12}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <Pressable accessibilityLabel="Önceki ay" onPress={()=>setCalendarMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} style={{padding:8,borderRadius:9,backgroundColor:palette.goldSoft}}><Ionicons name="chevron-back" size={20} color={palette.navy}/></Pressable>
          <Text style={{fontSize:15,fontWeight:'900',color:palette.ink}}>{calendarMonth.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</Text>
          <Pressable accessibilityLabel="Sonraki ay" onPress={()=>setCalendarMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} style={{padding:8,borderRadius:9,backgroundColor:palette.goldSoft}}><Ionicons name="chevron-forward" size={20} color={palette.navy}/></Pressable>
        </View>
        <View style={{flexDirection:'row',marginBottom:6}}>{['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(day=><Text key={day} style={{width:'14.2857%',textAlign:'center',fontSize:10,fontWeight:'800',color:palette.muted}}>{day}</Text>)}</View>
        <View style={{flexDirection:'row',flexWrap:'wrap'}}>
          {Array.from({length:(calendarMonth.getDay()+6)%7},(_,i)=><View key={'blank-'+i} style={{width:'14.2857%',height:40}} />)}
          {Array.from({length:new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate()},(_,i)=>i+1).map(day=>{
            const chosen=datePart(startsAt)===`${calendarMonth.getFullYear()}-${pad(calendarMonth.getMonth()+1)}-${pad(day)}`;
            const todayDate=new Date();
            const isToday=day===todayDate.getDate()&&calendarMonth.getMonth()===todayDate.getMonth()&&calendarMonth.getFullYear()===todayDate.getFullYear();
            return <Pressable key={day} onPress={()=>setStartsAt(`${calendarMonth.getFullYear()}-${pad(calendarMonth.getMonth()+1)}-${pad(day)} ${timePart(startsAt)||'09:00'}`)} style={{width:'14.2857%',height:40,alignItems:'center',justifyContent:'center'}}><View style={{width:32,height:32,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:chosen?palette.navy:isToday?palette.goldSoft:'transparent',borderWidth:isToday&&!chosen?1:0,borderColor:palette.gold}}><Text style={{fontSize:12,fontWeight:chosen||isToday?'900':'500',color:chosen?'#fff':palette.ink}}>{day}</Text></View></Pressable>;
          })}
        </View>
        <Text style={{fontSize:11,color:palette.muted,marginTop:8}}>Seçilen tarih: {parseLocal(startsAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</Text>
      </View>
      <Text style={{fontSize:12,fontWeight:'800',color:palette.ink,marginTop:2}}>Saat seç</Text>
      <View style={{flexDirection:'row',gap:12}}>
        {([{label:'Saat',value:timePart(startsAt).split(':')[0],values:Array.from({length:24},(_,i)=>pad(i)),key:'hour'},{label:'Dakika',value:timePart(startsAt).split(':')[1],values:['00','15','30','45'],key:'minute'}] as any[]).map(part=><View key={part.key} style={{flex:1,gap:6}}><Text style={{fontSize:11,color:palette.muted}}>{part.label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}>{part.values.map((v:string)=><Pressable key={v} onPress={()=>{const [h,m]=timePart(startsAt).split(':');setStartsAt(`${datePart(startsAt)} ${part.key==='hour'?v:h}:${part.key==='minute'?v:m}`)}} style={{minWidth:42,paddingVertical:10,paddingHorizontal:9,alignItems:'center',borderRadius:9,borderWidth:1,borderColor:part.value===v?palette.gold:palette.line,backgroundColor:part.value===v?palette.goldSoft:palette.white}}><Text style={{fontSize:12,fontWeight:part.value===v?'900':'600',color:palette.ink}}>{v}</Text></Pressable>)}</ScrollView></View>)}
      </View>
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
