import React from 'react';
import { Modal, View, Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';

type Props = { authenticated: any; legalReady: any; legalAccepted: any; setLegalDocument: any; legalReadPrivacy: any; setLegalReadPrivacy: any; legalAcceptTerms: any; setLegalAcceptTerms: any; legalGateBusy: any; confirmLegalAcceptance: any };

export default function LegalAcceptanceModal(props: Props) {
  const { authenticated, legalReady, legalAccepted, setLegalDocument, legalReadPrivacy, setLegalReadPrivacy, legalAcceptTerms, setLegalAcceptTerms, legalGateBusy, confirmLegalAcceptance } = props;
  return (
          <Modal visible={authenticated && legalReady && !legalAccepted} animationType="slide" onRequestClose={()=>{}}>
            <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
              <View style={styles.modalHeader}><View style={{width:40}}/><Text style={styles.modalHeaderTitle}>GAYIT · İlk kullanım</Text><View style={{width:40}}/></View>
              <ScrollView contentContainerStyle={styles.formPage}>
                <Text style={styles.eyebrow}>DEVAM ETMEDEN ÖNCE</Text>
                <Text style={styles.pageTitle}>Bilgilendirme ve kullanım koşulları</Text>
                <Text style={styles.pageSub}>İlk kullanımda aşağıdaki metinleri incele. KVKK aydınlatması ile sözleşme kabulü ayrı işlemlerdir.</Text>
                <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('privacy')}><Ionicons name="shield-checkmark-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>KVKK Aydınlatma Metni</Text><Text style={styles.teamRole}>Kişisel verilerin işlenmesine ilişkin bilgilendirme.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
                <Pressable style={styles.moreCard} onPress={()=>setLegalDocument('terms')}><Ionicons name="document-text-outline" size={23} color={palette.navy}/><View style={{flex:1}}><Text style={styles.teamName}>Kullanım Sözleşmesi</Text><Text style={styles.teamRole}>GAYIT kullanım koşulları.</Text></View><Ionicons name="chevron-forward" size={18} color={palette.muted}/></Pressable>
                <Pressable onPress={()=>setLegalReadPrivacy((v: boolean)=>!v)} style={{flexDirection:'row',alignItems:'flex-start',gap:10,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:legalReadPrivacy?palette.green:palette.line,borderRadius:13,marginTop:18}}>
                  <Ionicons name={legalReadPrivacy?'checkbox':'square-outline'} size={22} color={legalReadPrivacy?palette.green:palette.muted}/>
                  <Text style={{flex:1,fontSize:12,lineHeight:18,color:palette.ink}}>KVKK Aydınlatma Metni'ni okudum ve kişisel verilerimin işlenmesine ilişkin bilgilendirildim.</Text>
                </Pressable>
                <Pressable onPress={()=>setLegalAcceptTerms((v: boolean)=>!v)} style={{flexDirection:'row',alignItems:'flex-start',gap:10,padding:14,backgroundColor:palette.white,borderWidth:1,borderColor:legalAcceptTerms?palette.green:palette.line,borderRadius:13,marginTop:10}}>
                  <Ionicons name={legalAcceptTerms?'checkbox':'square-outline'} size={22} color={legalAcceptTerms?palette.green:palette.muted}/>
                  <Text style={{flex:1,fontSize:12,lineHeight:18,color:palette.ink}}>Kullanım Sözleşmesi'ni okudum ve koşullarını kabul ediyorum.</Text>
                </Pressable>
                <Pressable disabled={!legalReadPrivacy||!legalAcceptTerms||legalGateBusy} onPress={confirmLegalAcceptance} style={[styles.saveButton,{opacity:!legalReadPrivacy||!legalAcceptTerms||legalGateBusy?0.45:1}]}><Ionicons name="checkmark-circle-outline" size={20} color="#fff"/><Text style={styles.saveButtonText}>{legalGateBusy?'Kaydediliyor…':'Onayla ve GAYIT’a devam et'}</Text></Pressable>
                <Text style={{fontSize:10,lineHeight:15,color:palette.muted,textAlign:'center',marginTop:6}}>Kabul kaydı bu cihazda kullanıcı hesabına özel saklanır. Metin sürümü değişirse yeniden inceleme istenebilir.</Text>
              </ScrollView>
            </SafeAreaView>
          </Modal>
  );
}
