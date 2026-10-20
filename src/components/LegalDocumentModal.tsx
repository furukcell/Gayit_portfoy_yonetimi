import React from 'react';
import { Modal, Pressable, ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '../legalDocuments';

type Props = { legalDocument: LegalDocumentKey | null; setLegalDocument: (key: LegalDocumentKey | null) => void; styles: any; palette: any };

export default function LegalDocumentModal({ legalDocument, setLegalDocument, styles, palette }: Props) {
  return (
    <Modal visible={legalDocument !== null} animationType="slide" onRequestClose={() => setLegalDocument(null)}>
      <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
        <View style={styles.modalHeader}><Pressable onPress={() => setLegalDocument(null)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle} numberOfLines={1}>{legalDocument ? LEGAL_DOCUMENTS[legalDocument].title : ''}</Text><View style={{width:40}}/></View>
        <ScrollView contentContainerStyle={styles.formPage}>
          <Text style={styles.pageTitle}>{legalDocument ? LEGAL_DOCUMENTS[legalDocument].title : ''}</Text>
          <Text style={{fontSize:12,lineHeight:20,color:palette.ink}}>{legalDocument ? LEGAL_DOCUMENTS[legalDocument].body : ''}</Text>
          {legalDocument === 'about' && <Text style={{fontSize:11,fontWeight:'800',color:palette.navy,textAlign:'center',marginTop:22}}>© 2026 FK Digital. Tüm hakları saklıdır.</Text>}
          {legalDocument === 'privacy' && <Text style={{fontSize:10,lineHeight:15,color:palette.muted,marginTop:18}}>Bu metin genel taslaktır; gerçek veri akışları ve teknik hizmet yapılandırması doğrulanarak hukuki incelemeden geçirilmelidir.</Text>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
