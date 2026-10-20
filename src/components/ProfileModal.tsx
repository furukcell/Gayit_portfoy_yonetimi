import React from 'react';
import { Modal, View, Pressable, ScrollView, Text, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';

type Props = { profileModalOpen: any; setProfileModalOpen: any; profileBusy: any; chooseProfileAvatar: any; profileAvatarUri: any; profileAvatarUrl: any; profilePhone: any; setProfilePhone: any; profileEmail: any; setProfileEmail: any; saveProfile: any; currentPassword: any; setCurrentPassword: any; profileNewPassword: any; setProfileNewPassword: any; profileConfirmPassword: any; setProfileConfirmPassword: any; passwordBusy: any; handleProfilePasswordChange: any };

export default function ProfileModal(props: Props) {
  const { profileModalOpen, setProfileModalOpen, profileBusy, chooseProfileAvatar, profileAvatarUri, profileAvatarUrl, profilePhone, setProfilePhone, profileEmail, setProfileEmail, saveProfile, currentPassword, setCurrentPassword, profileNewPassword, setProfileNewPassword, profileConfirmPassword, setProfileConfirmPassword, passwordBusy, handleProfilePasswordChange } = props;
  return (
          <Modal visible={profileModalOpen} animationType="slide" onRequestClose={()=>{if(!profileBusy)setProfileModalOpen(false);}}>
            <SafeAreaView style={styles.modalSafe} edges={['top','left','right','bottom']}>
              <View style={styles.modalHeader}><Pressable disabled={profileBusy} onPress={()=>setProfileModalOpen(false)} style={styles.roundButton}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Profilim</Text><View style={{width:40}}/></View>
              <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled"><Text style={styles.pageTitle}>İletişim bilgilerin</Text><Text style={styles.pageSub}>Bu bilgiler gayrimenkul PDF sunumlarında danışman iletişimi olarak gösterilir.</Text>
                <Pressable onPress={chooseProfileAvatar} style={styles.avatarPicker}>{(profileAvatarUri || profileAvatarUrl) ? <Image source={{uri:profileAvatarUri || profileAvatarUrl || undefined}} style={{width:86,height:86,borderRadius:43}}/> : <Ionicons name="camera-outline" size={30} color={palette.navy}/>}<Text style={styles.avatarPickerText}>{profileAvatarUri ? 'Yeni fotoğraf seçildi · değiştirmek için dokun' : 'Profil fotoğrafı seç / değiştir'}</Text></Pressable>
                <Text style={styles.fieldLabel}>Cep telefonu</Text><TextInput value={profilePhone} onChangeText={setProfilePhone} keyboardType="phone-pad" style={styles.input} placeholder="05xx xxx xx xx" placeholderTextColor={palette.muted}/>
                <Text style={styles.fieldLabel}>E-posta adresi</Text><TextInput value={profileEmail} onChangeText={setProfileEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="ornek@eposta.com" placeholderTextColor={palette.muted}/>
                <Pressable disabled={profileBusy} onPress={saveProfile} style={[styles.saveButton,profileBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{profileBusy?'Kaydediliyor…':'Profili kaydet'}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff"/></Pressable><Text style={styles.noticeText}>PDF oluşturulurken kayıtlı profil fotoğrafın, telefonun ve e-posta adresin otomatik alınır. Boş alanlar PDF'de gösterilmez.</Text>
                <View style={{height:1,backgroundColor:palette.line,marginVertical:24}} />
                <Text style={styles.pageTitle}>Şifre değiştir</Text><Text style={styles.pageSub}>Hesap güvenliğin için mevcut şifreni doğrula. Yeni şifre en az 10 karakter olmalı.</Text>
                <Text style={styles.fieldLabel}>Mevcut şifre</Text><TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Mevcut şifren" placeholderTextColor={palette.muted} />
                <Text style={styles.fieldLabel}>Yeni şifre</Text><TextInput value={profileNewPassword} onChangeText={setProfileNewPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="En az 10 karakter" placeholderTextColor={palette.muted} />
                <Text style={styles.fieldLabel}>Yeni şifre (tekrar)</Text><TextInput value={profileConfirmPassword} onChangeText={setProfileConfirmPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Yeni şifreni tekrar gir" placeholderTextColor={palette.muted} />
                <Pressable disabled={passwordBusy} onPress={handleProfilePasswordChange} style={[styles.saveButton,{marginTop:14},passwordBusy&&{opacity:0.6}]}><Text style={styles.saveButtonText}>{passwordBusy?'Şifre güncelleniyor…':'Şifreyi değiştir'}</Text><Ionicons name="lock-closed-outline" size={20} color="#fff" /></Pressable>
              </ScrollView>
            </SafeAreaView>
          </Modal>
  );
}
