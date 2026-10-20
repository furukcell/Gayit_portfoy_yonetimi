import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';

const INTERNAL_LOGIN_DOMAIN = 'accounts.gayit.invalid';
export type GayitProfile = { id:string; username:string; full_name:string; avatar_path:string|null; account_status:'active'|'disabled'; must_change_password:boolean };
export type UsernameLoginResult = { user:User; profile:GayitProfile | null; mustChangePassword:boolean; role:'owner'|'agent'|'superadmin'; officeId:string };

export async function signInWithUsername(usernameInput:string,password:string):Promise<UsernameLoginResult> {
  const username=usernameInput.trim().toLowerCase();
  if(!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('Kullanıcı adı 3-32 karakter olmalı.');
  if(!password) throw new Error('Şifre zorunludur.');
  const auth=getFirebaseAuth(), db=getFirebaseDb();
  let user:User;
  try { user=(await signInWithEmailAndPassword(auth,`${username}@${INTERNAL_LOGIN_DOMAIN}`,password)).user; }
  catch { throw new Error('Kullanıcı adı veya şifre hatalı. Firebase Authentication hesabının kullanıcı adı biçiminde oluşturulduğunu kontrol et.'); }
  try {
    const superadminSnap = await getDoc(doc(db,'superadmins',user.uid));
    if (superadminSnap.exists() && superadminSnap.data().enabled === true) {
      return { user, profile: null, mustChangePassword: false, role: 'superadmin', officeId: '' };
    }
    const [profileSnap, membershipSnap]=await Promise.all([
      getDoc(doc(db,'profiles',user.uid)), getDoc(doc(db,'office_members',user.uid))
    ]);
    if(!profileSnap.exists()) throw new Error('Hesap profili bulunamadı. Süperadmin/ofis yöneticisi hesabı doğru hazırlamamış.');
    const profile=profileSnap.data() as GayitProfile;
    const membership=membershipSnap.exists()?membershipSnap.data():null;
    if(profile.account_status!=='active') throw new Error('Hesabınız devre dışı bırakılmış. Ofis yöneticinizle görüşün.');
    if(!membership || membership.status!=='active' || !['owner','agent'].includes(membership.role)) throw new Error('Aktif ofis üyeliği bulunamadı. Yöneticinizle görüşün.');
    return {user,profile:{...profile,id:user.uid},mustChangePassword:!!profile.must_change_password,role:membership.role,officeId:membership.office_id};
  } catch(e) { await signOut(auth); throw e; }
}
export async function restoreUsernameSession(): Promise<UsernameLoginResult | null> {
  const auth = getFirebaseAuth();
  // Firebase restores persisted credentials asynchronously on cold app start.
  // Wait for Auth initialization before reading currentUser.
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  const db = getFirebaseDb();
  try {
    const superadminSnap = await getDoc(doc(db, 'superadmins', user.uid));
    if (superadminSnap.exists() && superadminSnap.data().enabled === true) {
      return { user, profile: null, mustChangePassword: false, role: 'superadmin', officeId: '' };
    }
    const [profileSnap, membershipSnap] = await Promise.all([
      getDoc(doc(db, 'profiles', user.uid)),
      getDoc(doc(db, 'office_members', user.uid)),
    ]);
    if (!profileSnap.exists() || !membershipSnap.exists()) {
      await signOut(auth);
      return null;
    }
    const profile = profileSnap.data() as GayitProfile;
    const membership = membershipSnap.data();
    if (profile.account_status !== 'active' || membership.status !== 'active' || !['owner', 'agent'].includes(membership.role)) {
      await signOut(auth);
      return null;
    }
    return {
      user,
      profile: { ...profile, id: user.uid },
      mustChangePassword: !!profile.must_change_password,
      role: membership.role,
      officeId: membership.office_id,
    };
  } catch (error) {
    // Keep the Firebase session if this is a temporary network/Firestore error.
    throw error;
  }
}

export async function changeInitialPassword(newPassword:string):Promise<void> {
  if(newPassword.length<10) throw new Error('Yeni şifre en az 10 karakter olmalıdır.');
  const user=getFirebaseAuth().currentUser;
  if(!user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
  try { await updatePassword(user,newPassword); await updateDoc(doc(getFirebaseDb(),'profiles',user.uid),{must_change_password:false,updated_at:new Date().toISOString()}); }
  catch { throw new Error('Şifre değiştirildi veya güncelleme tamamlanamadı. Yeniden giriş yapıp tekrar dene.'); }
}

export async function changePasswordWithCurrent(currentPassword:string,newPassword:string):Promise<void> {
  if(newPassword.length<10) throw new Error('Yeni şifre en az 10 karakter olmalıdır.');
  const user=getFirebaseAuth().currentUser;
  if(!user || !user.email) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
  try {
    const credential=EmailAuthProvider.credential(user.email,currentPassword);
    await reauthenticateWithCredential(user,credential);
    await updatePassword(user,newPassword);
    await updateDoc(doc(getFirebaseDb(),'profiles',user.uid),{must_change_password:false,updated_at:new Date().toISOString()});
  } catch(error) {
    const code=(error as {code?:string})?.code;
    if(code==='auth/wrong-password'||code==='auth/invalid-credential') throw new Error('Mevcut şifre doğru değil.');
    if(code==='auth/weak-password') throw new Error('Yeni şifre daha güçlü olmalı.');
    if(code==='auth/requires-recent-login') throw new Error('Güvenlik için çıkış yapıp tekrar giriş yaptıktan sonra yeniden dene.');
    throw new Error('Şifre güncellenemedi. Bağlantını kontrol edip tekrar dene.');
  }
}
