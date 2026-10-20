import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthForm(props: any) {
  const { styles, palette, mustChangePassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, authBusy, handleInitialPasswordChange, loginUsername, setLoginUsername, loginPassword, setLoginPassword, handleLogin, authError } = props;
  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
    <ScrollView contentContainerStyle={styles.authPage} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.authBrandMark}><Ionicons name="business" size={32} color={palette.gold}/></View>
      <Text style={styles.authBrand}>GAYIT<Text style={styles.brandDot}>.</Text></Text>
      <Text style={styles.brandSub}>PORTFÖY YÖNETİMİ</Text>
      <Text style={styles.authTitle}>{mustChangePassword ? 'Yeni şifreni belirle' : 'Tekrar hoş geldin'}</Text>
      <Text style={styles.authSubtitle}>{mustChangePassword ? 'Güvenliğin için ilk giriş şifreni değiştirmen gerekiyor.' : 'Ofis yöneticinin verdiği kullanıcı adı ve şifreyle giriş yap.'}</Text>
      {mustChangePassword ? <>
        <Text style={styles.fieldLabel}>Yeni şifre (en az 10 karakter)</Text>
        <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="Yeni şifren" placeholderTextColor={palette.muted}/>
        <Text style={styles.fieldLabel}>Yeni şifre tekrar</Text>
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="Yeni şifreni tekrar gir" placeholderTextColor={palette.muted}/>
        <Pressable disabled={authBusy} onPress={handleInitialPasswordChange} style={[styles.authSubmit,authBusy&&{opacity:0.6}]}><Text style={styles.authSubmitText}>{authBusy?'İşleniyor...':'Şifreyi değiştir'}</Text></Pressable>
      </> : <>
        <Text style={styles.fieldLabel}>Kullanıcı adı</Text>
        <TextInput value={loginUsername} onChangeText={setLoginUsername} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="Kullanıcı adın" placeholderTextColor={palette.muted}/>
        <Text style={styles.fieldLabel}>Şifre</Text>
        <TextInput value={loginPassword} onChangeText={setLoginPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="Şifren" placeholderTextColor={palette.muted} onSubmitEditing={handleLogin}/>
        <Pressable disabled={authBusy} onPress={handleLogin} style={[styles.authSubmit,authBusy&&{opacity:0.6}]}><Text style={styles.authSubmitText}>{authBusy?'Giriş yapılıyor...':'Giriş yap'}</Text></Pressable>
        <Text style={styles.authHint}>Hesap oluşturmak için ofis yöneticinle iletişime geç.</Text>
      </>}
      {!!authError && <View style={styles.authError}><Ionicons name="alert-circle-outline" size={18} color={palette.red}/><Text style={styles.authErrorText}>{authError}</Text></View>}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
