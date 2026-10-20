import React from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';

export default function PortfolioOperationModals(props: any) {
 const { transactionModalOpen, setTransactionModalOpen, transactionBusy, setTransactionPropertyId, transactionPropertyId, properties, setTransactionFinalPrice, transactionFinalPrice, money, transactionOfficeCommission, setTransactionOfficeCommission, transactionAgentCommission, setTransactionAgentCommission, transactionDate, setTransactionDate, transactionNotes, setTransactionNotes, saveTransaction, csvImportOpen, setCsvImportOpen, csvImportBusy, pickPortfolioSpreadsheet, excelFileName, excelPreviewCount, csvImportText, setCsvImportText, importPortfolioCsv } = props;
 return (
      <>
        <Modal visible={transactionModalOpen} animationType="slide" onRequestClose={()=>{if(!transactionBusy)setTransactionModalOpen(false);}}>
          <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
            <View style={styles.modalHeader}><Pressable disabled={transactionBusy} onPress={()=>setTransactionModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={21} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Satış / kiralama kaydı</Text><View style={{width:40}}/></View>
            <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
              <Text style={styles.pageSub}>Gerçekleşmiş bir işlemi kaydet. Kayıt sonrası portföy durumu satıldı/kiralandı olarak güncellenir.</Text>
              <Text style={styles.fieldLabel}>Portföy</Text>
              {properties.filter((p: any)=>p.status!=='Arşivde').map((p: any)=><Pressable key={p.id} onPress={()=>{setTransactionPropertyId(p.id);setTransactionFinalPrice(String(p.price));}} style={[styles.moreCard,{marginTop:7,borderColor:transactionPropertyId===p.id?palette.gold:palette.line,borderWidth:transactionPropertyId===p.id?2:1}]}><Ionicons name={transactionPropertyId===p.id?'radio-button-on':'radio-button-off'} size={19} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>{p.title}</Text><Text style={styles.teamRole}>{p.kind} · {money(p.price)}</Text></View></Pressable>)}
              <Text style={styles.fieldLabel}>Gerçekleşen bedel (TL)</Text><TextInput value={transactionFinalPrice} onChangeText={setTransactionFinalPrice} keyboardType="numeric" style={styles.input} placeholder="Örn. 4250000" placeholderTextColor={palette.muted}/>
              <Text style={styles.fieldLabel}>Ofis komisyonu (TL)</Text><TextInput value={transactionOfficeCommission} onChangeText={setTransactionOfficeCommission} keyboardType="numeric" style={styles.input} placeholder="0" placeholderTextColor={palette.muted}/>
              <Text style={styles.fieldLabel}>Danışman komisyonu (TL)</Text><TextInput value={transactionAgentCommission} onChangeText={setTransactionAgentCommission} keyboardType="numeric" style={styles.input} placeholder="0" placeholderTextColor={palette.muted}/>
              <Text style={styles.fieldLabel}>İşlem tarihi (YYYY-AA-GG)</Text><TextInput value={transactionDate} onChangeText={setTransactionDate} autoCapitalize="none" style={styles.input} placeholder="2026-10-17" placeholderTextColor={palette.muted}/>
              <Text style={styles.fieldLabel}>Notlar</Text><TextInput value={transactionNotes} onChangeText={setTransactionNotes} multiline style={[styles.input,{minHeight:85,textAlignVertical:'top'}]} placeholder="İşleme ait notlar" placeholderTextColor={palette.muted}/>
              <Pressable disabled={transactionBusy} onPress={saveTransaction} style={[styles.saveButton,{marginTop:20,opacity:transactionBusy?0.6:1}]}><Text style={styles.saveButtonText}>{transactionBusy?'Kaydediliyor…':'İşlemi kaydet'}</Text></Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
  
        <Modal visible={csvImportOpen} animationType="slide" onRequestClose={()=>{if(!csvImportBusy)setCsvImportOpen(false);}}>
          <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
            <View style={styles.modalHeader}><Pressable disabled={csvImportBusy} onPress={()=>setCsvImportOpen(false)} style={styles.roundButton}><Ionicons name="close" size={21} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>CSV portföy aktarımı</Text><View style={{width:40}}/></View>
            <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
              <Text style={styles.pageSub}>GAYIT'ın dışa aktardığı CSV içeriğini başlık satırıyla birlikte yapıştır. Ayraç noktalı virgül (;) olmalı. Aktarım mevcut ilanları silmez.</Text>
              <Pressable onPress={pickPortfolioSpreadsheet} style={[styles.moreCard,{marginTop:16,marginBottom:8,borderColor:palette.green,borderWidth:1}]}><Ionicons name="document-attach-outline" size={24} color={palette.green}/><View style={{flex:1}}><Text style={styles.teamName}>Excel / CSV dosyası seç</Text><Text style={styles.teamRole}>.xlsx, .xls veya .csv dosyasını telefondan seç; sütunlar otomatik eşleştirilir.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>{!!excelFileName && <View style={styles.notice}><Ionicons name="checkmark-circle" size={18} color={palette.green}/><Text style={styles.noticeText}>{excelFileName} · {excelPreviewCount} ilan satırı okundu.</Text></View>}<TextInput value={csvImportText} onChangeText={setCsvImportText} multiline textAlignVertical="top" autoCapitalize="none" placeholder={'Portföy başlığı;Tür;İlan tipi;Fiyat;Oda;Alan;İlçe;Adres;Durum;Danışman;Açıklama'} placeholderTextColor={palette.muted} style={[styles.input,{minHeight:230,marginTop:18}]}/>
              <Text style={styles.noticeText}>Her satır yeni portföy oluşturur. Dosya seçimi Excel/CSV verisini forma aktarır; mevcut kayıtları güncellemez.</Text>
              <Pressable disabled={csvImportBusy} onPress={importPortfolioCsv} style={[styles.saveButton,{marginTop:20,opacity:csvImportBusy?0.6:1}]}><Text style={styles.saveButtonText}>{csvImportBusy?'Aktarılıyor…':'Portföyleri içe aktar'}</Text></Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </>
 );
}
