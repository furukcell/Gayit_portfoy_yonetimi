import React from 'react';
import { Modal, SafeAreaView, View, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';

type Props = { agentModalOpen: any; setAgentModalOpen: any; chooseAgentAvatar: any; agentAvatarUri: any; agentName: any; setAgentName: any; agentUsername: any; setAgentUsername: any; agentPassword: any; setAgentPassword: any; agentBusy: any; createAgent: any };

export default function AgentModal(props: Props) {
  const { agentModalOpen, setAgentModalOpen, chooseAgentAvatar, agentAvatarUri, agentName, setAgentName, agentUsername, setAgentUsername, agentPassword, setAgentPassword, agentBusy, createAgent } = props;
  return (
          <Modal visible={agentModalOpen} animationType="slide" onRequestClose={()=>setAgentModalOpen(false)}>
            <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
              <View style={styles.modalHeader}><Pressable onPress={()=>setAgentModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Danışman ekle</Text><View style={{width:40}}/></View>
              <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled">
                <Text style={styles.pageTitle}>Yeni danışman hesabı</Text>
                <Text style={styles.pageSub}>Danışman e-posta kullanmadan kullanıcı adı ve ilk şifresiyle giriş yapacak.</Text>
                <Pressable onPress={chooseAgentAvatar} style={styles.avatarPicker}>
                  {agentAvatarUri ? <Text style={styles.avatarPickerText}>Fotoğraf seçildi ✓</Text> : <><Ionicons name="camera-outline" size={26} color={palette.navy}/><Text style={styles.avatarPickerText}>Profil fotoğrafı seç</Text></>}
                </Pressable>
                <Text style={styles.fieldLabel}>Ad soyad *</Text><TextInput value={agentName} onChangeText={setAgentName} style={styles.input} placeholder="Örn. Ayşe Yılmaz" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>Kullanıcı adı * (3-32 karakter)</Text><TextInput value={agentUsername} onChangeText={setAgentUsername} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="ornek.ayse" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>İlk şifre * (en az 10 karakter)</Text><TextInput value={agentPassword} onChangeText={setAgentPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="İlk giriş şifresi" placeholderTextColor={palette.muted}/>
                <Pressable disabled={agentBusy} onPress={createAgent} style={[styles.saveButton,agentBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{agentBusy?'Hesap oluşturuluyor...':'Danışman hesabını oluştur'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable>
                <Text style={styles.noticeText}>Fotoğraf yüklemek için Firebase Storage etkin olmalı ve Storage kuralları yayınlanmalıdır. Danışman hesabı oluşturmak için Firebase Functions dağıtılmış olmalıdır.</Text>
              </ScrollView>
            </SafeAreaView>
          </Modal>
  );
}
