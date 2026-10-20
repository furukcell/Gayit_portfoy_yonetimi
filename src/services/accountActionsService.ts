import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { changeInitialPassword, changePasswordWithCurrent, signInWithUsername } from '../lib/usernameAuth';
import { getFirebaseClient } from '../lib/firebaseClient';
import { uploadMediaFromUri } from '../lib/mediaStorage';
import { getFirebaseApp, getFirebaseAuth } from '../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export const handleLogin = async (deps: any) => {
    const { setAuthBusy, setAuthError, loginUsername, loginPassword, setRole, setAuthenticated, setLoginPassword, setOfficeId, loadProperties, loadCustomers, loadMatches, loadNotifications, loadTeamMembers, setMustChangePassword } = deps;
    setAuthBusy(true); setAuthError('');
    try {
      const result = await signInWithUsername(loginUsername, loginPassword);
      setRole(result.role);
      if (result.role === 'superadmin') {
        setAuthenticated(true);
        setLoginPassword('');
        return;
      }
      setOfficeId(result.officeId);
      await loadProperties(result.officeId);
      await loadCustomers(result.officeId);
      await loadMatches(result.officeId);
      await loadNotifications(result.officeId);
      if (result.role === 'owner') await loadTeamMembers(result.officeId);
      setMustChangePassword(result.mustChangePassword);
      setAuthenticated(true);
      setLoginPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Giriş yapılamadı.');
    } finally { setAuthBusy(false); }
  };

export const handleInitialPasswordChange = async (deps: any) => {
    const { setAuthError, newPassword, confirmPassword, setAuthBusy, setMustChangePassword, setNewPassword, setConfirmPassword } = deps;
    setAuthError('');
    if (newPassword !== confirmPassword) { setAuthError('Şifreler eşleşmiyor.'); return; }
    setAuthBusy(true);
    try {
      await changeInitialPassword(newPassword);
      setMustChangePassword(false); setNewPassword(''); setConfirmPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Şifre değiştirilemedi.');
    } finally { setAuthBusy(false); }
  };

export const openProfile = async (deps: any) => {
    const { setProfileBusy, setProfilePhone, setProfileEmail, setProfileAvatarPath, setProfileAvatarUri, setProfileAvatarUrl, setProfileModalOpen } = deps;
    const uid = getFirebaseAuth().currentUser?.uid; if (!uid) { Alert.alert('Oturum bulunamadı', 'Lütfen yeniden giriş yap.'); return; }
    setProfileBusy(true);
    try { const client = getFirebaseClient(); const { data, error } = await client.from('profiles').select('phone,email,avatar_path').eq('id', uid).maybeSingle(); if (error) throw new Error('Profil bilgileri alınamadı.');
      setProfilePhone(data?.phone || ''); setProfileEmail(data?.email || ''); setProfileAvatarPath(data?.avatar_path || null); setProfileAvatarUri(null);
      if (data?.avatar_path) { const { data: signed } = await client.storage.from('avatars').createSignedUrl(data.avatar_path, 3600); setProfileAvatarUrl(signed?.signedUrl || null); } else setProfileAvatarUrl(null); setProfileModalOpen(true);
    } catch (error) { Alert.alert('Profil açılamadı', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); } finally { setProfileBusy(false); }
  };
export const chooseProfileAvatar = async (deps: any) => {
    const { setProfileAvatarUri } = deps; const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { Alert.alert('Fotoğraf izni gerekli', 'Profil fotoğrafı seçmek için galeri izni vermelisin.'); return; } const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.82 }); if (!result.canceled && result.assets[0]) setProfileAvatarUri(result.assets[0].uri); };
export const handleProfilePasswordChange = async (deps: any) => {
    const { currentPassword, profileNewPassword, profileConfirmPassword, setCurrentPassword, setProfileNewPassword, setProfileConfirmPassword, setPasswordBusy } = deps;
    if (!currentPassword || !profileNewPassword || !profileConfirmPassword) { Alert.alert('Eksik bilgi', 'Tüm şifre alanlarını doldur.'); return; }
    if (profileNewPassword.length < 10) { Alert.alert('Şifre kısa', 'Yeni şifre en az 10 karakter olmalı.'); return; }
    if (profileNewPassword !== profileConfirmPassword) { Alert.alert('Şifreler eşleşmiyor', 'Yeni şifre ve tekrar alanları aynı olmalı.'); return; }
    if (currentPassword === profileNewPassword) { Alert.alert('Yeni şifre gerekli', 'Yeni şifren mevcut şifrenle aynı olamaz.'); return; }
    setPasswordBusy(true);
    try {
      await changePasswordWithCurrent(currentPassword, profileNewPassword);
      setCurrentPassword(''); setProfileNewPassword(''); setProfileConfirmPassword('');
      Alert.alert('Şifre değiştirildi', 'Hesap şifren başarıyla güncellendi.');
    } catch (error) { Alert.alert('Şifre değiştirilemedi', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); }
    finally { setPasswordBusy(false); }
  };

export const saveProfile = async (deps: any) => {
    const { profileEmail, profileAvatarPath, profileAvatarUri, officeId, profilePhone, setProfileBusy, setProfileAvatarPath, setProfileAvatarUri, setProfileAvatarUrl, setProfileModalOpen } = deps;
    const uid = getFirebaseAuth().currentUser?.uid; if (!uid) { Alert.alert('Oturum bulunamadı', 'Lütfen yeniden giriş yap.'); return; }
    if (profileEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())) { Alert.alert('E-posta hatalı', 'Geçerli bir e-posta adresi gir.'); return; }
    setProfileBusy(true); try { const client = getFirebaseClient(); let avatarPath = profileAvatarPath;
      if (profileAvatarUri) { const uploaded = await uploadMediaFromUri(profileAvatarUri, { folder: `gayit/${officeId || uid}/avatars`, fileName: `${uid}-profile-${Date.now()}.jpg` }); avatarPath = uploaded.url; }
      const { error } = await client.from('profiles').update({ phone: profilePhone.trim(), email: profileEmail.trim(), avatar_path: avatarPath || null, updated_at: new Date().toISOString() }).eq('id', uid); if (error) throw new Error('Profil kaydedilemedi. Firestore profil güncelleme kurallarını kontrol et.');
      setProfileAvatarPath(avatarPath || null); setProfileAvatarUri(null); if (avatarPath) { const { data: signed } = await client.storage.from('avatars').createSignedUrl(avatarPath, 3600); setProfileAvatarUrl(signed?.signedUrl || null); }
      Alert.alert('Profil kaydedildi', 'Profil bilgilerin güncellendi ve PDF sunumlarında kullanılacak.'); setProfileModalOpen(false);
    } catch (error) { Alert.alert('Profil kaydedilemedi', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); } finally { setProfileBusy(false); }
  };

export const chooseAgentAvatar = async (deps: any) => {
    const { setAgentAvatarUri } = deps;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Fotoğraf izni gerekli', 'Danışman fotoğrafı seçmek için galeri izni vermelisin.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.82 });
    if (!result.canceled && result.assets[0]) setAgentAvatarUri(result.assets[0].uri);
  };

export const createAgent = async (deps: any) => {
    const { agentName, agentUsername, agentPassword, agentAvatarUri, officeId, setAgentBusy, loadTeamMembers, setAgentModalOpen, setAgentName, setAgentUsername, setAgentPassword, setAgentAvatarUri } = deps;
    if (!agentName.trim() || !agentUsername.trim() || !agentPassword) { Alert.alert('Eksik bilgi', 'Danışman adı, kullanıcı adı ve ilk şifre zorunlu.'); return; }
    if (agentPassword.length < 10) { Alert.alert('Şifre çok kısa', 'İlk şifre en az 10 karakter olmalı.'); return; }
    setAgentBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      let avatarPath: string | null = null;
      if (agentAvatarUri) {
        const uploaded = await uploadMediaFromUri(agentAvatarUri, { folder: `gayit/${officeId}/avatars`, fileName: `agent-${Date.now()}.jpg` });
        avatarPath = uploaded.url;
      }
      // Create the agent with a secondary Firebase app so the current owner/superadmin
      // session is not replaced. This path works without paid Cloud Functions.
      const mainApp = getFirebaseApp();
      const secondaryApp = initializeApp(mainApp.options, 'agent-creation-' + Date.now());
      let agentUid = '';
      try {
        const secondaryAuth = (await import('firebase/auth')).getAuth(secondaryApp);
        const credential = await createUserWithEmailAndPassword(
          secondaryAuth,
          agentUsername.trim().toLowerCase() + '@accounts.gayit.invalid',
          agentPassword
        );
        agentUid = credential.user.uid;
        const db = getFirestore(mainApp);
        const now = new Date().toISOString();
        await setDoc(doc(db, 'profiles', agentUid), {
          username: agentUsername.trim().toLowerCase(),
          full_name: agentName.trim(),
          office_id: officeId,
          avatar_path: avatarPath,
          account_status: 'active',
          must_change_password: true,
          created_at: now
        });
        await setDoc(doc(db, 'office_members', agentUid), {
          office_id: officeId,
          role: 'agent',
          status: 'active',
          created_at: now,
          created_by: getFirebaseAuth().currentUser?.uid || ''
        });
      } finally {
        await deleteApp(secondaryApp).catch(() => {});
      }
      await loadTeamMembers(officeId);
      Alert.alert('Danışman eklendi', agentName.trim() + ' için hesap oluşturuldu. İlk girişte şifresini değiştirmesi gerekecek.');
      setAgentModalOpen(false); setAgentName(''); setAgentUsername(''); setAgentPassword(''); setAgentAvatarUri(null);
    } catch (error) {
      Alert.alert('Hesap oluşturulamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
    } finally { setAgentBusy(false); }
  };

export const handleSignOut = async (deps: any) => {
    const { setAuthenticated, setMustChangePassword, setLoginPassword, setNewPassword, setConfirmPassword, setSuperadminOfficeMode } = deps;
    await getFirebaseClient().auth.signOut();
    setAuthenticated(false); setMustChangePassword(false); setLoginPassword(''); setNewPassword(''); setConfirmPassword(''); setSuperadminOfficeMode(false);
  };
