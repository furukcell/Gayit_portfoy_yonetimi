import React from 'react';
import { Modal, SafeAreaView, View, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';

type Props = { customerModalOpen: any; setCustomerModalOpen: any; customerName: any; setCustomerName: any; customerPhone: any; setCustomerPhone: any; customerRoles: any; setCustomerRoles: any; requirementIntent: any; setRequirementIntent: any; requirementType: any; setRequirementType: any; requirementCity: any; setRequirementCity: any; requirementDistrict: any; setRequirementDistrict: any; requirementMaxPrice: any; setRequirementMaxPrice: any; requirementRooms: any; setRequirementRooms: any; customerNotes: any; setCustomerNotes: any; customerBusy: any; saveCustomer: any };

export default function CustomerCreateModal(props: Props) {
  const { customerModalOpen, setCustomerModalOpen, customerName, setCustomerName, customerPhone, setCustomerPhone, customerRoles, setCustomerRoles, requirementIntent, setRequirementIntent, requirementType, setRequirementType, requirementCity, setRequirementCity, requirementDistrict, setRequirementDistrict, requirementMaxPrice, setRequirementMaxPrice, requirementRooms, setRequirementRooms, customerNotes, setCustomerNotes, customerBusy, saveCustomer } = props;
  return (
          <Modal visible={customerModalOpen} animationType="slide" onRequestClose={()=>setCustomerModalOpen(false)}>
            <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
              <View style={styles.modalHeader}><Pressable onPress={()=>setCustomerModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Yeni müşteri</Text><View style={{width:40}}/></View>
              <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled">
                <Text style={styles.pageTitle}>Müşteri bilgileri</Text><Text style={styles.pageSub}>Birden fazla müşteri rolü seçebilir, arama kriterlerini hemen ekleyebilirsin.</Text>
                <Text style={styles.fieldLabel}>Ad soyad *</Text><TextInput value={customerName} onChangeText={setCustomerName} style={styles.input} placeholder="Örn. Ayşe Yılmaz" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>Telefon</Text><TextInput value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" style={styles.input} placeholder="05xx xxx xx xx" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>Müşteri rolleri (birden fazla seçilebilir)</Text><View style={styles.kindRow}>{([{key:'buyer',label:'Alıcı'},{key:'seller',label:'Satıcı'},{key:'tenant',label:'Kiracı'}]).map(r=><Pressable key={r.key} onPress={()=>setCustomerRoles(old=>old.includes(r.key)?old.filter(x=>x!==r.key):[...old,r.key])} style={[styles.kindButton,customerRoles.includes(r.key)&&styles.kindButtonOn]}><Text style={[styles.kindText,customerRoles.includes(r.key)&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
                <View style={[styles.kindRow,{marginTop:8}]}>{([{key:'landlord',label:'Ev sahibi'},{key:'investor',label:'Yatırımcı'}]).map(r=><Pressable key={r.key} onPress={()=>setCustomerRoles(old=>old.includes(r.key)?old.filter(x=>x!==r.key):[...old,r.key])} style={[styles.kindButton,customerRoles.includes(r.key)&&styles.kindButtonOn]}><Text style={[styles.kindText,customerRoles.includes(r.key)&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
                <Text style={styles.sectionTitle}>Arama kriterleri (isteğe bağlı)</Text><Text style={styles.fieldLabel}>İşlem türü</Text><View style={styles.kindRow}>{([{key:'sale',label:'Satılık'},{key:'rent',label:'Kiralık'}] as const).map(r=><Pressable key={r.key} onPress={()=>setRequirementIntent(r.key)} style={[styles.kindButton,requirementIntent===r.key&&styles.kindButtonOn]}><Text style={[styles.kindText,requirementIntent===r.key&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
                <Text style={styles.fieldLabel}>Gayrimenkul tipi</Text><View style={styles.kindRow}>{([{key:'apartment',label:'Daire'},{key:'villa',label:'Villa'},{key:'land',label:'Arsa'},{key:'commercial',label:'İş yeri'}]).map(r=><Pressable key={r.key} onPress={()=>setRequirementType(r.key)} style={[styles.kindButton,requirementType===r.key&&styles.kindButtonOn]}><Text style={[styles.kindText,requirementType===r.key&&styles.kindTextOn]}>{r.label}</Text></Pressable>)}</View>
                <Text style={styles.fieldLabel}>İl</Text><TextInput value={requirementCity} onChangeText={setRequirementCity} style={styles.input} placeholder="Muğla" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>İlçe</Text><TextInput value={requirementDistrict} onChangeText={setRequirementDistrict} style={styles.input} placeholder="Bodrum" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>Azami bütçe (TL)</Text><TextInput value={requirementMaxPrice} onChangeText={setRequirementMaxPrice} keyboardType="numeric" style={styles.input} placeholder="5000000" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>Oda sayısı (ör. 3+1)</Text><TextInput value={requirementRooms} onChangeText={setRequirementRooms} style={styles.input} placeholder="Fark etmezse boş bırak" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>Notlar</Text><TextInput value={customerNotes} onChangeText={setCustomerNotes} style={[styles.input,styles.multiline]} multiline textAlignVertical="top" placeholder="İletişim ve müşteri hakkında notlar" placeholderTextColor={palette.muted}/>
                <Pressable disabled={customerBusy} onPress={saveCustomer} style={[styles.saveButton,customerBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{customerBusy?'Kaydediliyor...':'Müşteriyi kaydet'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable>
              </ScrollView>
            </SafeAreaView>
          </Modal>
  );
}
