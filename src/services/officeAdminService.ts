import { Alert } from 'react-native';
import { getFirebaseClient } from '../lib/firebaseClient';
import { getFirebaseApp, getFirebaseAuth } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signOut } from 'firebase/auth';

export const toggleAgentStatus = (person: {id:string; name:string; role:string; status:string}, deps: any) => {
    const { officeId, setTeamStatusBusyId, loadTeamMembers } = deps;
    if (person.role !== 'agent' || !person.id || !officeId) return;
    const nextStatus = person.status === 'active' ? 'disabled' : 'active';
    const actionLabel = nextStatus === 'disabled' ? 'devre dışı bırakmak' : 'yeniden etkinleştirmek';
    Alert.alert(
      nextStatus === 'disabled' ? 'Danışmanı devre dışı bırak' : 'Danışmanı yeniden etkinleştir',
      `${person.name} hesabını ${actionLabel} istediğine emin misin? ${nextStatus === 'disabled' ? 'Bu üyelikle ofis verilerine erişimi engellenecek.' : 'Danışman tekrar giriş yapabilecek.'}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Onayla', style: 'destructive', onPress: async () => {
          setTeamStatusBusyId(person.id);
          try {
            const firebaseClient = getFirebaseClient();
            const { error } = await firebaseClient
              .from('office_members')
              .update({ status: nextStatus })
              .eq('office_id', officeId)
              .eq('user_id', person.id)
              .eq('role', 'agent');
            if (error) throw error;
            await loadTeamMembers(officeId);
            Alert.alert('Ekip güncellendi', nextStatus === 'disabled' ? 'Danışmanın ofis erişimi kapatıldı.' : 'Danışmanın ofis erişimi yeniden açıldı.');
          } catch (error) {
            Alert.alert('İşlem tamamlanamadı', error instanceof Error ? error.message : 'Üyelik durumu güncellenemedi.');
          } finally {
            setTeamStatusBusyId(null);
          }
        }},
      ],
    );
  };

export const handleCreateOfficeAsSuperadmin = async (deps: any) => {
    const { superOfficeName, superOwnerName, superOwnerUsername, superOwnerPassword, setSuperResult, setSuperCreateBusy, setSuperOfficeName, setSuperOwnerName, setSuperOwnerUsername, setSuperOwnerPassword } = deps;
    if (!superOfficeName.trim() || !superOwnerName.trim() || !superOwnerUsername.trim() || superOwnerPassword.length < 10) {
      setSuperResult('Tüm alanları doldur. Ofis sahibi şifresi en az 10 karakter olmalı.');
      return;
    }
    setSuperCreateBusy(true); setSuperResult('');
    try {
      const functions = getFunctions(getFirebaseApp(), 'europe-west1');
      const createOfficeCall = httpsCallable(functions, 'createOffice');
      const response:any = await createOfficeCall({
        officeName: superOfficeName.trim(),
        ownerFullName: superOwnerName.trim(),
        ownerUsername: superOwnerUsername.trim().toLowerCase(),
        ownerPassword: superOwnerPassword
      });
      if (!response.data?.success) throw new Error('Ofis oluşturulamadı.');
      setSuperResult('Ofis oluşturuldu: ' + response.data.office.name + ' · Ofis sahibi kullanıcı adı: ' + response.data.owner.username);
      setSuperOfficeName(''); setSuperOwnerName(''); setSuperOwnerUsername(''); setSuperOwnerPassword('');
    } catch (error) {
      setSuperResult(error instanceof Error ? error.message : 'Ofis oluşturulamadı. Cloud Function dağıtımını kontrol et.');
    } finally { setSuperCreateBusy(false); }
  };

export const handleSuperadminLogout = async (deps: any) => {
    const { setAuthenticated, setRole, setLoginUsername, setLoginPassword, setSuperResult } = deps;
    try { await signOut(getFirebaseAuth()); } catch {}
    setAuthenticated(false); setRole('owner'); setLoginUsername(''); setLoginPassword(''); setSuperResult('');
  };
