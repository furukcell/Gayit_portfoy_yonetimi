const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();
const REGION = 'europe-west1';
const LOGIN_DOMAIN = 'accounts.gayit.invalid';
const usernamePattern = /^[a-z0-9._-]{3,32}$/;

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Önce giriş yapmalısın.');
  return request.auth.uid;
}
async function requireSuperadmin(uid) {
  const snap = await db.doc('superadmins/' + uid).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Süperadmin yetkisi gerekli.');
}
async function requireOwner(uid) {
  const snap = await db.doc('office_members/' + uid).get();
  if (!snap.exists || snap.data().status !== 'active' || snap.data().role !== 'owner') {
    throw new HttpsError('permission-denied', 'Aktif ofis sahibi yetkisi gerekli.');
  }
  return snap.data();
}
function validateUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!usernamePattern.test(username)) throw new HttpsError('invalid-argument', 'Kullanıcı adı 3-32 karakter olmalı.');
  return username;
}
async function createAccount(username, password, displayName) {
  if (typeof password !== 'string' || password.length < 10) throw new HttpsError('invalid-argument', 'Şifre en az 10 karakter olmalı.');
  try {
    return await getAuth().createUser({ email: username + '@' + LOGIN_DOMAIN, password, displayName, disabled: false });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Bu kullanıcı adı zaten kayıtlı.');
    throw new HttpsError('internal', 'Hesap oluşturulamadı: ' + error.message);
  }
}
exports.createOffice = onCall({ region: REGION, enforceAppCheck: false }, async request => {
  const uid = requireAuth(request);
  await requireSuperadmin(uid);
  const { officeName, ownerFullName, ownerUsername: rawUsername, ownerPassword } = request.data || {};
  if (typeof officeName !== 'string' || officeName.trim().length < 2 || typeof ownerFullName !== 'string' || ownerFullName.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Ofis adı ve ofis sahibi adı gerekli.');
  }
  const username = validateUsername(rawUsername);
  const owner = await createAccount(username, ownerPassword, ownerFullName.trim());
  const officeRef = db.collection('offices').doc();
  const batch = db.batch();
  batch.set(officeRef, { name: officeName.trim(), status: 'active', created_at: new Date().toISOString(), created_by: uid });
  batch.set(db.doc('profiles/' + owner.uid), { username, full_name: ownerFullName.trim(), office_id: officeRef.id, avatar_path: null, account_status: 'active', must_change_password: true, created_at: new Date().toISOString() });
  batch.set(db.doc('office_members/' + owner.uid), { office_id: officeRef.id, role: 'owner', status: 'active', created_at: new Date().toISOString() });
  await batch.commit();
  return { success: true, office: { id: officeRef.id, name: officeName.trim() }, owner: { id: owner.uid, username } };
});
exports.createAgent = onCall({ region: REGION, enforceAppCheck: false }, async request => {
  const uid = requireAuth(request);
  const membership = await requireOwner(uid);
  const { fullName, agentName, username: rawUsername, agentUsername, password, agentPassword, avatarPath } = request.data || {};
  const name = String(fullName || agentName || '').trim();
  if (name.length < 2) throw new HttpsError('invalid-argument', 'Danışman adı gerekli.');
  const username = validateUsername(rawUsername || agentUsername);
  const user = await createAccount(username, password || agentPassword, name);
  const batch = db.batch();
  batch.set(db.doc('profiles/' + user.uid), { username, full_name: name, office_id: membership.office_id, avatar_path: avatarPath || null, account_status: 'active', must_change_password: true, created_at: new Date().toISOString() });
  batch.set(db.doc('office_members/' + user.uid), { office_id: membership.office_id, role: 'agent', status: 'active', created_at: new Date().toISOString(), created_by: uid });
  await batch.commit();
  return { success: true, agent: { id: user.uid, username, full_name: name } };
});
exports.evaluateMatches = onCall({ region: REGION, enforceAppCheck: false }, async request => {
  const uid = requireAuth(request);
  const membershipSnap = await db.doc('office_members/' + uid).get();
  if (!membershipSnap.exists || membershipSnap.data().status !== 'active') throw new HttpsError('permission-denied', 'Aktif ofis üyeliği gerekli.');
  const officeId = membershipSnap.data().office_id;
  const [propertiesSnap, requirementsSnap] = await Promise.all([
    db.collection('properties').where('office_id', '==', officeId).get(),
    db.collection('customer_requirements').where('office_id', '==', officeId).get()
  ]);
  const properties = propertiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const requirements = requirementsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const normalize = v => String(v || '').toLocaleLowerCase('tr-TR').trim();
  const matches = [];
  for (const req of requirements) {
    for (const p of properties) {
      const intent = normalize(req.intent || req.listing_type || req.transaction_type);
      const listing = normalize(p.listing_type || p.kind);
      if (intent && listing && !((intent.includes('rent') || intent.includes('kir')) && (listing.includes('rent') || listing.includes('kir')) || (intent.includes('sale') || intent.includes('sat')) && (listing.includes('sale') || listing.includes('sat')))) continue;
      const max = Number(req.max_price || req.maxPrice || req.budget_max || 0);
      if (max > 0 && Number(p.price || 0) > max) continue;
      const min = Number(req.min_price || req.minPrice || 0);
      if (min > 0 && Number(p.price || 0) < min) continue;
      const reqDistrict = normalize(req.district);
      if (reqDistrict && normalize(p.district) && reqDistrict !== normalize(p.district)) continue;
      const reqType = normalize(req.property_type || req.propertyType);
      if (reqType && normalize(p.property_type) && reqType !== normalize(p.property_type)) continue;
      const key = req.id + '__' + p.id;
      matches.push({ key, office_id: officeId, requirement_id: req.id, customer_id: req.customer_id || null, property_id: p.id, score: 100, match_score: 100, match_kind: 'requirement_property', match_reasons: ['Kriterlerle eşleşti'], status: 'new', created_at: new Date().toISOString() });
    }
  }
  const batch = db.batch();
  const col = db.collection('matches');
  const existing = await col.where('office_id', '==', officeId).get();
  existing.docs.forEach(d => batch.delete(d.ref));
  matches.forEach(m => { const ref = col.doc(m.key); batch.set(ref, m); });
  await batch.commit();
  return { success: true, count: matches.length, matches };
});
