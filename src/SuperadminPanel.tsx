import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb } from './src/lib/firebase';
import { signOut } from 'firebase/auth';

const C = { navy:'#10243A', navy2:'#1A3652', gold:'#C99A4A', goldSoft:'#F6EBDD', bg:'#F4F6F9', white:'#FFFFFF', ink:'#17283B', muted:'#778597', line:'#E3E8EF', green:'#16805D', greenSoft:'#E5F5ED', red:'#B54747', redSoft:'#FCEBEC', amber:'#9A6714', amberSoft:'#FFF3D9' };
type Office = { id:string; name:string; status?:string; created_at?:string; subscription_status?:string; billing_cycle?:string; plan_name?:string; fee_amount?:number; subscription_start?:string; next_due_date?:string; owner_name?:string; [key:string]:any };
type Payment = { id:string; office_id:string; office_name?:string; amount:number; paid_at?:string; period?:string; note?:string; method?:string };
const fmt = (n:number) => '₺'+new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(n||0);
const dateLabel = (v?:string) => v ? new Date(v).toLocaleDateString('tr-TR') : 'Belirlenmedi';

export default function SuperadminPanel({ onEnterOffice, onLogout }: { onEnterOffice:(office:Office)=>void; onLogout:()=>void }) {
  const [section,setSection] = useState<'overview'|'offices'|'payments'|'create'>('overview');
  const [offices,setOffices] = useState<Office[]>([]);
  const [payments,setPayments] = useState<Payment[]>([]);
  const [memberCount,setMemberCount] = useState(0);
  const [agentCount,setAgentCount] = useState(0);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [search,setSearch] = useState('');
  const [selected,setSelected] = useState<Office|null>(null);
  const [officeName,setOfficeName] = useState('');
  const [ownerName,setOwnerName] = useState('');
  const [ownerUsername,setOwnerUsername] = useState('');
  const [ownerPassword,setOwnerPassword] = useState('');
  const [fee,setFee] = useState('1000');
  const [cycle,setCycle] = useState<'monthly'|'yearly'>('monthly');
  const [plan,setPlan] = useState('Standart');
  const [dueDate,setDueDate] = useState('');
  const [paymentAmount,setPaymentAmount] = useState('');
  const [paymentNote,setPaymentNote] = useState('');
  const [message,setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const db=getFirebaseDb();
      const [officeSnap,paymentSnap,membersSnap] = await Promise.all([
        getDocs(query(collection(db,'offices'),orderBy('created_at','desc'))),
        getDocs(query(collection(db,'superadmin_payments'),orderBy('paid_at','desc'))),
        getDocs(collection(db,'office_members'))
      ]);
      setOffices(officeSnap.docs.map(d=>({id:d.id,...d.data()} as Office)));
      setPayments(paymentSnap.docs.map(d=>({id:d.id,...d.data()} as Payment)));
      setMemberCount(membersSnap.size);
      setAgentCount(membersSnap.docs.filter(d=>d.data().role==='agent').length);
    } catch(e:any) {
      setMessage('Veriler yüklenemedi: '+(e?.message||'Firestore kurallarını kontrol et.'));
    } finally { setLoading(false); }
  },[]);
  useEffect(()=>{ void refresh(); },[refresh]);

  const filtered = useMemo(()=>offices.filter(o=>String(o.name||'').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))),[offices,search]);
  const active = offices.filter(o=>(o.status||'active')==='active').length;
  const overdue = offices.filter(o=>o.next_due_date && new Date(o.next_due_date).getTime()<Date.now() && (o.subscription_status||'active')!=='cancelled').length;
  const dueSoon = offices.filter(o=>o.next_due_date && new Date(o.next_due_date).getTime()>=Date.now() && new Date(o.next_due_date).getTime()<Date.now()+14*86400000).length;
  const monthlyExpected = offices.filter(o=>(o.status||'active')==='active' && (o.subscription_status||'active')==='active').reduce((s,o)=>s+(Number(o.fee_amount||0)/(o.billing_cycle==='yearly'?12:1)),0);
  const receivedThisMonth = payments.filter(p=>p.paid_at && new Date(p.paid_at).getMonth()===new Date().getMonth() && new Date(p.paid_at).getFullYear()===new Date().getFullYear()).reduce((s,p)=>s+Number(p.amount||0),0);

  const createOffice = async () => {
    if(!officeName.trim()||!ownerName.trim()||!ownerUsername.trim()||ownerPassword.length<10){setMessage('Ofis ve yönetici bilgilerini doldur. Şifre en az 10 karakter olmalı.');return;}
    setSaving(true);setMessage('');
    try {
      const fn=httpsCallable(getFunctions(getFirebaseApp(),'europe-west1'),'createOffice');
      const res:any=await fn({officeName:officeName.trim(),ownerFullName:ownerName.trim(),ownerUsername:ownerUsername.trim().toLowerCase(),ownerPassword});
      if(!res.data?.success) throw new Error('Ofis oluşturulamadı.');
      const officeId=res.data.office.id;
      await updateDoc(doc(getFirebaseDb(),'offices',officeId),{
        plan_name:plan,fee_amount:Number(fee)||0,billing_cycle:cycle,
        subscription_status:'active',subscription_start:new Date().toISOString(),
        next_due_date:dueDate.trim()||new Date(Date.now()+(cycle==='yearly'?365:30)*86400000).toISOString().slice(0,10)
      });
      setOfficeName('');setOwnerName('');setOwnerUsername('');setOwnerPassword('');
      setMessage('Ofis oluşturuldu. Yönetici kullanıcı adı: '+res.data.owner.username);
      setSection('offices');await refresh();
    } catch(e:any){setMessage(e?.message||'Ofis oluşturulamadı. Cloud Function dağıtımını kontrol et.');}
    finally{setSaving(false);}
  };

  const saveOffice = async () => {
    if(!selected)return;
    setSaving(true);setMessage('');
    try{
      await updateDoc(doc(getFirebaseDb(),'offices',selected.id),{
        plan_name:selected.plan_name||'Standart',
        fee_amount:Number(selected.fee_amount||0),
        billing_cycle:selected.billing_cycle||'monthly',
        subscription_status:selected.subscription_status||'active',
        next_due_date:selected.next_due_date||'',
        status:selected.status||'active',
        updated_at:new Date().toISOString()
      });
      setMessage('Ofis ve abonelik bilgileri kaydedildi.');
      await refresh();
    }catch(e:any){setMessage('Kaydedilemedi: '+(e?.message||'İzinleri kontrol et.'));}
    finally{setSaving(false);}
  };

  const recordPayment = async () => {
    if(!selected||!(Number(paymentAmount)>0)){setMessage('Ödeme tutarını gir.');return;}
    setSaving(true);setMessage('');
    try{
      const db=getFirebaseDb();const ref=doc(collection(db,'superadmin_payments'));
      const paidAt=new Date().toISOString();
      await setDoc(ref,{office_id:selected.id,office_name:selected.name,amount:Number(paymentAmount),paid_at:paidAt,period:selected.billing_cycle==='yearly'?'yearly':'monthly',note:paymentNote.trim(),recorded_by:getFirebaseAuth().currentUser?.uid||null});
      const next=new Date();next.setDate(next.getDate()+(selected.billing_cycle==='yearly'?365:30));
      await updateDoc(doc(db,'offices',selected.id),{next_due_date:next.toISOString().slice(0,10),subscription_status:'active'});
      setPaymentAmount('');setPaymentNote('');setMessage('Tahsilat kaydedildi ve sonraki vade güncellendi.');
      await refresh();
      const fresh={...selected,next_due_date:next.toISOString().slice(0,10),subscription_status:'active'};setSelected(fresh);
    }catch(e:any){setMessage('Tahsilat kaydedilemedi: '+(e?.message||'İzinleri kontrol et.'));}
    finally{setSaving(false);}
  };

  const toggleOfficeStatus = (office:Office) => {
    const next=(office.status||'active')==='active'?'disabled':'active';
    Alert.alert(next==='disabled'?'Ofisi pasifleştir':'Ofisi yeniden aktifleştir',office.name+' için bu değişiklik uygulansın mı?',[{text:'Vazgeç',style:'cancel'},{text:'Onayla',onPress:async()=>{try{await updateDoc(doc(getFirebaseDb(),'offices',office.id),{status:next,updated_at:new Date().toISOString()});await refresh();if(selected?.id===office.id)setSelected({...office,status:next});}catch(e:any){setMessage(e?.message||'Ofis durumu değiştirilemedi.');}}}]);
  };

  const Header=()=> <View style={s.header}><View style={s.brandIcon}><Ionicons name="shield-checkmark" size={25} color={C.gold}/></View><View style={{flex:1}}><Text style={s.brand}>GAYIT<Text style={{color:C.gold}}>.</Text></Text><Text style={s.sub}>SÜPERADMİN KONTROL MERKEZİ</Text></View><Pressable onPress={onLogout} style={s.logout}><Ionicons name="log-out-outline" size={17} color={C.navy}/><Text style={s.logoutText}>Çıkış</Text></Pressable></View>;
  const Nav=()=> <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.nav}>{([{key:'overview',label:'Genel Bakış',icon:'grid-outline'},{key:'offices',label:'Ofisler',icon:'business-outline'},{key:'payments',label:'Tahsilatlar',icon:'card-outline'},{key:'create',label:'Ofis Oluştur',icon:'add-circle-outline'}] as const).map(item=><Pressable key={item.key} onPress={()=>{setSection(item.key);setSelected(null);setMessage('');}} style={[s.navItem,section===item.key&&s.navOn]}><Ionicons name={item.icon as any} size={17} color={section===item.key?'#fff':C.muted}/><Text style={[s.navText,section===item.key&&{color:'#fff'}]}>{item.label}</Text></Pressable>)}</ScrollView>;
  const Metric=({label,value,icon,note}:{label:string;value:string;icon:any;note?:string})=><View style={s.metric}><View style={s.metricIcon}><Ionicons name={icon} size={18} color={C.navy2}/></View><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text>{!!note&&<Text style={s.metricNote}>{note}</Text>}</View>;

  return <SafeAreaView style={s.safe} edges={['top','left','right','bottom']}><StatusBar barStyle="light-content"/><Header/><Nav/>
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      {loading&&<View style={s.loading}><ActivityIndicator color={C.navy}/><Text style={s.muted}>Veriler yükleniyor…</Text></View>}
      {section==='overview'&&<>
        <Text style={s.eyebrow}>SİSTEM DURUMU</Text><Text style={s.title}>Kontrol sende.</Text><Text style={s.desc}>Bütün ofisler, abonelikler ve tahsilatlar tek merkezde.</Text>
        <View style={s.grid}><Metric label="Toplam ofis" value={String(offices.length)} icon="business-outline"/><Metric label="Aktif ofis" value={String(active)} icon="checkmark-circle-outline"/><Metric label="Vadesi geçen" value={String(overdue)} icon="alert-circle-outline" note="Ödeme takibi"/><Metric label="14 günde yenilenecek" value={String(dueSoon)} icon="calendar-outline"/><Metric label="Toplam kullanıcı" value={String(memberCount)} icon="people-outline"/><Metric label="Danışman sayısı" value={String(agentCount)} icon="person-outline"/></View>
        <View style={s.revenue}><Text style={s.revenueLabel}>Tahmini aylık abonelik geliri</Text><Text style={s.revenueValue}>{fmt(monthlyExpected)}</Text><View style={s.revenueDivider}/><Text style={s.revenueLabel}>Bu ay kaydedilen tahsilat</Text><Text style={s.revenueValue}>{fmt(receivedThisMonth)}</Text></View>
        <Text style={s.sectionTitle}>Yaklaşan işlemler</Text>
        {offices.filter(o=>o.next_due_date).sort((a,b)=>String(a.next_due_date).localeCompare(String(b.next_due_date))).slice(0,5).map(o=><Pressable key={o.id} onPress={()=>{setSelected(o);setSection('offices');}} style={s.rowCard}><View style={s.officeIcon}><Ionicons name="business-outline" size={20} color={C.navy}/></View><View style={{flex:1}}><Text style={s.officeName}>{o.name}</Text><Text style={s.muted}>Vade: {dateLabel(o.next_due_date)} · {fmt(Number(o.fee_amount||0))}/{o.billing_cycle==='yearly'?'yıl':'ay'}</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted}/></Pressable>)}
      </>}
      {section==='offices'&&<>
        <Text style={s.eyebrow}>OFİS PORTFÖYÜ</Text><Text style={s.title}>{selected?'Ofis detayları':'Bütün ofisler'}</Text><Text style={s.desc}>{selected?'Aboneliği düzenle, tahsilat gir veya ofisin çalışma alanına geç.':'Ofis seçerek hesap, abonelik ve ödeme bilgilerini yönet.'}</Text>
        {selected?<><Pressable onPress={()=>setSelected(null)} style={s.back}><Ionicons name="arrow-back" size={17} color={C.navy}/><Text style={s.backText}>Tüm ofislere dön</Text></Pressable>
          <View style={s.detailCard}><Text style={s.officeNameLarge}>{selected.name}</Text><Text style={s.muted}>ID: {selected.id}</Text>
            <Text style={s.label}>Ofis durumu</Text><View style={s.choiceRow}>{(['active','disabled'] as const).map(v=><Pressable key={v} onPress={()=>setSelected({...selected,status:v})} style={[s.choice,selected.status===v&&s.choiceOn]}><Text style={[s.choiceText,selected.status===v&&s.choiceTextOn]}>{v==='active'?'Aktif':'Pasif'}</Text></Pressable>)}</View>
            <Text style={s.label}>Paket adı</Text><TextInput value={String(selected.plan_name||'Standart')} onChangeText={v=>setSelected({...selected,plan_name:v})} style={s.input}/>
            <Text style={s.label}>Abonelik ücreti (TL)</Text><TextInput value={String(selected.fee_amount??0)} onChangeText={v=>setSelected({...selected,fee_amount:v.replace(/[^0-9.]/g,'')})} keyboardType="numeric" style={s.input}/>
            <Text style={s.label}>Faturalama dönemi</Text><View style={s.choiceRow}>{(['monthly','yearly'] as const).map(v=><Pressable key={v} onPress={()=>setSelected({...selected,billing_cycle:v})} style={[s.choice,selected.billing_cycle===v&&s.choiceOn]}><Text style={[s.choiceText,selected.billing_cycle===v&&s.choiceTextOn]}>{v==='monthly'?'Aylık':'Yıllık'}</Text></Pressable>)}</View>
            <Text style={s.label}>Abonelik durumu</Text><View style={s.choiceRow}>{(['active','past_due','cancelled','trial'] as const).map(v=><Pressable key={v} onPress={()=>setSelected({...selected,subscription_status:v})} style={[s.choice,selected.subscription_status===v&&s.choiceOn]}><Text style={[s.choiceText,selected.subscription_status===v&&s.choiceTextOn]}>{({active:'Aktif',past_due:'Gecikmiş',cancelled:'İptal',trial:'Deneme'} as any)[v]}</Text></Pressable>)}</View>
            <Text style={s.label}>Sonraki vade (YYYY-AA-GG)</Text><TextInput value={String(selected.next_due_date||'')} onChangeText={v=>setSelected({...selected,next_due_date:v})} placeholder="2026-11-19" style={s.input}/>
            <Pressable disabled={saving} onPress={saveOffice} style={s.primary}><Text style={s.primaryText}>{saving?'Kaydediliyor…':'Ofis ve aboneliği kaydet'}</Text></Pressable>
            <Text style={s.sectionTitle}>Tahsilat kaydı</Text><TextInput value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" placeholder="Tahsil edilen tutar (TL)" style={s.input}/><TextInput value={paymentNote} onChangeText={setPaymentNote} placeholder="Not / dönem (isteğe bağlı)" style={[s.input,{marginTop:9}]}/><Pressable disabled={saving} onPress={recordPayment} style={[s.primary,{backgroundColor:C.green}]}><Text style={s.primaryText}>Tahsilatı kaydet</Text></Pressable>
            <Pressable onPress={()=>onEnterOffice(selected)} style={[s.primary,{backgroundColor:C.gold,marginTop:12}]}><Text style={[s.primaryText,{color:C.navy}]}>Bu ofisin çalışma alanını aç</Text></Pressable>
            <Pressable onPress={()=>toggleOfficeStatus(selected)} style={[s.secondary,{marginTop:10}]}><Text style={s.secondaryText}>{selected.status==='disabled'?'Ofisi aktifleştir':'Ofisi pasifleştir'}</Text></Pressable>
          </View>
          <Text style={s.sectionTitle}>Bu ofisin tahsilat geçmişi</Text>
          {payments.filter(p=>p.office_id===selected.id).map(p=><View key={p.id} style={s.rowCard}><View style={{flex:1}}><Text style={s.officeName}>{fmt(p.amount)}</Text><Text style={s.muted}>{dateLabel(p.paid_at)} · {p.note||'Not yok'}</Text></View></View>)}
        </>:<>
          <View style={s.searchBox}><Ionicons name="search-outline" size={18} color={C.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Ofis adı ara" style={s.searchInput}/></View>
          {filtered.map(o=><Pressable key={o.id} onPress={()=>{setSelected(o);setPaymentAmount('');setPaymentNote('');setMessage('');}} style={s.rowCard}><View style={s.officeIcon}><Ionicons name="business-outline" size={20} color={C.navy}/></View><View style={{flex:1}}><Text style={s.officeName}>{o.name}</Text><Text style={s.muted}>{(o.status||'active')==='active'?'Aktif':'Pasif'} · {o.plan_name||'Paket tanımlanmamış'} · {fmt(Number(o.fee_amount||0))}/{o.billing_cycle==='yearly'?'yıl':'ay'}</Text><Text style={s.muted}>Vade: {dateLabel(o.next_due_date)} · Abonelik: {o.subscription_status||'tanımsız'}</Text></View><Ionicons name="chevron-forward" size={18} color={C.muted}/></Pressable>)}
          {!loading&&!filtered.length&&<Text style={s.empty}>Henüz ofis yok veya arama sonucu bulunamadı.</Text>}
        </>}
      </>}
      {section==='payments'&&<>
        <Text style={s.eyebrow}>FİNANS</Text><Text style={s.title}>Tahsilatlar</Text><Text style={s.desc}>Süperadmin üzerinden kaydedilmiş ödeme hareketleri.</Text>
        <View style={s.revenue}><Text style={s.revenueLabel}>Toplam kaydedilmiş tahsilat</Text><Text style={s.revenueValue}>{fmt(payments.reduce((a,p)=>a+Number(p.amount||0),0))}</Text></View>
        {payments.map(p=><Pressable key={p.id} onPress={()=>{const o=offices.find(x=>x.id===p.office_id);if(o){setSelected(o);setSection('offices');}}} style={s.rowCard}><View style={{flex:1}}><Text style={s.officeName}>{p.office_name||offices.find(o=>o.id===p.office_id)?.name||'Ofis'}</Text><Text style={s.muted}>{dateLabel(p.paid_at)} · {p.note||'Tahsilat kaydı'}</Text></View><Text style={s.paymentAmount}>{fmt(p.amount)}</Text></Pressable>)}
        {!payments.length&&<Text style={s.empty}>Henüz tahsilat kaydı yok.</Text>}
      </>}
      {section==='create'&&<>
        <Text style={s.eyebrow}>YENİ MÜŞTERİ</Text><Text style={s.title}>Ofis oluştur</Text><Text style={s.desc}>Ofis hesabını ve ilk yöneticisini oluştur; abonelik ayarını başlangıçta tanımla.</Text>
        <Text style={s.label}>Ofis adı</Text><TextInput value={officeName} onChangeText={setOfficeName} style={s.input} placeholder="Örn. Milas Gayrimenkul"/>
        <Text style={s.label}>Ofis sahibi adı soyadı</Text><TextInput value={ownerName} onChangeText={setOwnerName} style={s.input} placeholder="Ad soyad"/>
        <Text style={s.label}>Kullanıcı adı</Text><TextInput value={ownerUsername} onChangeText={setOwnerUsername} autoCapitalize="none" style={s.input} placeholder="milasemlak"/>
        <Text style={s.label}>Geçici şifre (en az 10 karakter)</Text><TextInput value={ownerPassword} onChangeText={setOwnerPassword} secureTextEntry style={s.input} placeholder="İlk giriş şifresi"/>
        <Text style={s.label}>Paket</Text><TextInput value={plan} onChangeText={setPlan} style={s.input}/>
        <Text style={s.label}>Ücret (TL)</Text><TextInput value={fee} onChangeText={setFee} keyboardType="numeric" style={s.input}/>
        <Text style={s.label}>Dönem</Text><View style={s.choiceRow}>{(['monthly','yearly'] as const).map(v=><Pressable key={v} onPress={()=>setCycle(v)} style={[s.choice,cycle===v&&s.choiceOn]}><Text style={[s.choiceText,cycle===v&&s.choiceTextOn]}>{v==='monthly'?'Aylık':'Yıllık'}</Text></Pressable>)}</View>
        <Text style={s.label}>Sonraki vade (isteğe bağlı, YYYY-AA-GG)</Text><TextInput value={dueDate} onChangeText={setDueDate} style={s.input} placeholder="2026-11-19"/>
        <Pressable disabled={saving} onPress={createOffice} style={[s.primary,saving&&{opacity:.6}]}><Text style={s.primaryText}>{saving?'Oluşturuluyor…':'Ofisi ve aboneliği oluştur'}</Text></Pressable>
      </>}
      {!!message&&<View style={s.message}><Text style={s.messageText}>{message}</Text></View>}
      <Pressable onPress={refresh} style={s.refresh}><Ionicons name="refresh-outline" size={17} color={C.navy}/><Text style={s.backText}>Verileri yenile</Text></Pressable>
      <Text style={s.foot}>Ödemeler burada manuel olarak kaydedilir; banka/kart tahsilatı entegrasyonu değildir.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:18,paddingTop:8,paddingBottom:14,backgroundColor:C.navy},brandIcon:{width:44,height:44,borderRadius:14,backgroundColor:'#FFFFFF12',alignItems:'center',justifyContent:'center'},brand:{fontSize:24,fontWeight:'900',letterSpacing:1,color:'#fff'},sub:{fontSize:8,fontWeight:'900',letterSpacing:1.1,color:'#C4D0DC',marginTop:2},logout:{flexDirection:'row',alignItems:'center',gap:5,padding:9,borderRadius:10,backgroundColor:'#fff'},logoutText:{fontSize:10,fontWeight:'800',color:C.navy},nav:{paddingHorizontal:12,paddingVertical:10,gap:8,backgroundColor:C.navy},navItem:{flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:13,paddingVertical:10,borderRadius:10,backgroundColor:'#FFFFFF10'},navOn:{backgroundColor:C.navy2,borderWidth:1,borderColor:C.gold},navText:{fontSize:11,fontWeight:'800',color:'#C4D0DC'},page:{padding:18,paddingBottom:40},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:C.gold,marginTop:6},title:{fontSize:27,fontWeight:'900',color:C.ink,marginTop:7},desc:{fontSize:12,lineHeight:18,color:C.muted,marginTop:5,marginBottom:17},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'48%',flexGrow:1,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:16,padding:13,minHeight:115},metricIcon:{width:32,height:32,borderRadius:10,backgroundColor:C.goldSoft,alignItems:'center',justifyContent:'center'},metricValue:{fontSize:24,fontWeight:'900',color:C.ink,marginTop:9},metricLabel:{fontSize:11,fontWeight:'800',color:C.muted,marginTop:2},metricNote:{fontSize:9,color:C.muted,marginTop:4},revenue:{backgroundColor:C.navy,borderRadius:18,padding:18,marginTop:15,marginBottom:18},revenueLabel:{fontSize:11,color:'#C4D0DC'},revenueValue:{fontSize:25,fontWeight:'900',color:'#fff',marginTop:5,marginBottom:10},revenueDivider:{height:1,backgroundColor:'#FFFFFF25',marginVertical:8},sectionTitle:{fontSize:16,fontWeight:'900',color:C.ink,marginTop:18,marginBottom:10},rowCard:{flexDirection:'row',alignItems:'center',gap:11,padding:13,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:15,marginBottom:9},officeIcon:{width:42,height:42,borderRadius:13,backgroundColor:C.goldSoft,alignItems:'center',justifyContent:'center'},officeName:{fontSize:13,fontWeight:'900',color:C.ink},muted:{fontSize:10,color:C.muted,marginTop:4},searchBox:{height:45,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:12,marginBottom:12},searchInput:{flex:1,fontSize:12,color:C.ink},empty:{padding:22,textAlign:'center',fontSize:12,color:C.muted},back:{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:8,marginBottom:10},backText:{fontSize:12,fontWeight:'800',color:C.navy},detailCard:{padding:15,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:16},officeNameLarge:{fontSize:21,fontWeight:'900',color:C.ink},label:{fontSize:11,fontWeight:'800',color:C.ink,marginTop:15,marginBottom:7},input:{backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:11,paddingHorizontal:12,paddingVertical:12,fontSize:12,color:C.ink},choiceRow:{flexDirection:'row',flexWrap:'wrap',gap:7},choice:{paddingHorizontal:12,paddingVertical:10,borderRadius:10,borderWidth:1,borderColor:C.line,backgroundColor:C.bg},choiceOn:{backgroundColor:C.navy,borderColor:C.navy},choiceText:{fontSize:10,fontWeight:'800',color:C.muted},choiceTextOn:{color:'#fff'},primary:{alignItems:'center',justifyContent:'center',padding:14,borderRadius:12,backgroundColor:C.navy,marginTop:16},primaryText:{fontSize:12,fontWeight:'900',color:'#fff'},secondary:{alignItems:'center',padding:12,borderRadius:12,borderWidth:1,borderColor:C.red,backgroundColor:C.redSoft},secondaryText:{fontSize:11,fontWeight:'800',color:C.red},paymentAmount:{fontSize:15,fontWeight:'900',color:C.green},message:{padding:12,borderRadius:12,backgroundColor:C.goldSoft,marginTop:13},messageText:{fontSize:11,lineHeight:16,color:C.navy},loading:{flexDirection:'row',alignItems:'center',gap:8,padding:10},refresh:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,padding:15,marginTop:8},foot:{fontSize:10,lineHeight:15,color:C.muted,textAlign:'center',marginTop:5}
});