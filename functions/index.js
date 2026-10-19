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
  if (!snap.exists || snap.data().enabled !== true) throw new HttpsError('permission-denied', 'Etkin süperadmin yetkisi gerekli.');
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
  const { officeName, ownerFullName, ownerUsername: rawUsername, ownerPassword, planName, feeAmount, billingCycle, nextDueDate } = request.data || {};
  if (typeof officeName !== 'string' || officeName.trim().length < 2 || typeof ownerFullName !== 'string' || ownerFullName.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Ofis adı ve ofis sahibi adı gerekli.');
  }
  const username = validateUsername(rawUsername);
  const amount = Number(feeAmount || 0);
  const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
  if (!Number.isFinite(amount) || amount < 0) throw new HttpsError('invalid-argument', 'Abonelik ücreti geçersiz.');
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + (cycle === 'yearly' ? 365 : 30));
  const due = typeof nextDueDate === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(nextDueDate) ? nextDueDate : defaultDue.toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const owner = await createAccount(username, ownerPassword, ownerFullName.trim());
  const officeRef = db.collection('offices').doc();
  const batch = db.batch();
  batch.set(officeRef, {
    name: officeName.trim(), status: 'active', created_at: now, created_by: uid,
    plan_name: String(planName || 'Standart').trim().slice(0, 80),
    fee_amount: amount, billing_cycle: cycle, subscription_status: 'active',
    subscription_start: now, next_due_date: due
  });
  batch.set(db.doc('profiles/' + owner.uid), { username, full_name: ownerFullName.trim(), office_id: officeRef.id, avatar_path: null, account_status: 'active', must_change_password: true, created_at: new Date().toISOString() });
  batch.set(db.doc('office_members/' + owner.uid), { office_id: officeRef.id, role: 'owner', status: 'active', created_at: new Date().toISOString() });
  await batch.commit();
  return { success: true, office: { id: officeRef.id, name: officeName.trim() }, owner: { id: owner.uid, username } };
});
exports.createAgent = onCall({ region: REGION, enforceAppCheck: false }, async request => {
  const uid = requireAuth(request);
  const { fullName, agentName, username: rawUsername, agentUsername, password, agentPassword, avatarPath, officeId: requestedOfficeId } = request.data || {};
  const superadminSnap = await db.doc('superadmins/' + uid).get();
  let officeId;
  if (superadminSnap.exists && superadminSnap.data().enabled === true) {
    if (typeof requestedOfficeId !== 'string' || !requestedOfficeId.trim()) throw new HttpsError('invalid-argument', 'Süperadmin işlemi için ofis seçilmelidir.');
    const officeSnap = await db.doc('offices/' + requestedOfficeId).get();
    if (!officeSnap.exists) throw new HttpsError('not-found', 'Seçilen ofis bulunamadı.');
    officeId = requestedOfficeId;
  } else {
    const membership = await requireOwner(uid);
    officeId = membership.office_id;
  }
  const name = String(fullName || agentName || '').trim();
  if (name.length < 2) throw new HttpsError('invalid-argument', 'Danışman adı gerekli.');
  const username = validateUsername(rawUsername || agentUsername);
  const user = await createAccount(username, password || agentPassword, name);
  const batch = db.batch();
  batch.set(db.doc('profiles/' + user.uid), { username, full_name: name, office_id: officeId, avatar_path: avatarPath || null, account_status: 'active', must_change_password: true, created_at: new Date().toISOString() });
  batch.set(db.doc('office_members/' + user.uid), { office_id: officeId, role: 'agent', status: 'active', created_at: new Date().toISOString(), created_by: uid });
  await batch.commit();
  return { success: true, agent: { id: user.uid, username, full_name: name, office_id: officeId } };
});
exports.setAgentStatus = onCall({ region: REGION, enforceAppCheck: false }, async request => {
  const uid = requireAuth(request);
  const { userId, status, officeId: requestedOfficeId } = request.data || {};
  if (typeof userId !== 'string' || !['active', 'disabled'].includes(status)) {
    throw new HttpsError('invalid-argument', 'Danışman ve geçerli durum gerekli.');
  }
  const superadminSnap = await db.doc('superadmins/' + uid).get();
  let officeId;
  if (superadminSnap.exists && superadminSnap.data().enabled === true) {
    if (typeof requestedOfficeId !== 'string' || !requestedOfficeId.trim()) throw new HttpsError('invalid-argument', 'Süperadmin işlemi için ofis seçilmelidir.');
    officeId = requestedOfficeId;
  } else {
    const membership = await requireOwner(uid);
    officeId = membership.office_id;
  }
  const target = await db.doc('office_members/' + userId).get();
  if (!target.exists || target.data().office_id !== officeId || target.data().role !== 'agent') {
    throw new HttpsError('permission-denied', 'Bu danışman seçilen ofise ait değil.');
  }
  await target.ref.update({ status, updated_at: new Date().toISOString() });
  return { success: true, userId, status, office_id: officeId };
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
      const reqRooms = Array.isArray(req.rooms) ? req.rooms.map(normalize).filter(Boolean) : [];
      if (reqRooms.length && !reqRooms.includes(normalize(p.rooms))) continue;
      const minArea = Number(req.min_area_m2 || req.minArea || 0);
      const maxArea = Number(req.max_area_m2 || req.maxArea || 0);
      const area = Number(p.area_m2 || 0);
      if (minArea > 0 && area > 0 && area < minArea) continue;
      if (maxArea > 0 && area > maxArea) continue;
      const reqType = normalize(req.property_type || req.propertyType);
      if (reqType && normalize(p.property_type) && reqType !== normalize(p.property_type)) continue;
      const key = req.id + '__' + p.id;
      matches.push({ key, office_id: officeId, requirement_id: req.id, customer_id: req.customer_id || null, property_id: p.id, score: 100, match_score: 100, match_kind: 'requirement_property', match_reasons: ['Kriterlerle eşleşti'], status: 'new', created_at: new Date().toISOString() });
    }
  }
  const col = db.collection('matches');
  const existing = await col.where('office_id', '==', officeId).get();
  const existingById = new Map(existing.docs.map(d => [d.id, d.data()]));
  const nextKeys = new Set(matches.map(m => m.key));
  const writes = [];
  existing.docs.forEach(d => { if (!nextKeys.has(d.id)) writes.push({ type: 'delete', ref: d.ref }); });
  for (const match of matches) {
    const old = existingById.get(match.key);
    const ref = col.doc(match.key);
    writes.push({ type: 'set', ref, data: { ...match, status: old?.status || 'new', created_at: old?.created_at || match.created_at }, merge: true });
    if (!old) {
      const notificationRef = db.collection('notifications').doc('match_' + match.key);
      writes.push({ type: 'set', ref: notificationRef, data: {
        office_id: officeId, notification_type: 'match', title: 'Yeni portföy eşleşmesi',
        body: 'Bir müşteri talebi portföyünüzle eşleşti.', match_id: match.key,
        customer_id: match.customer_id, property_id: match.property_id, read_at: null,
        created_at: new Date().toISOString()
      }, merge: true });
    }
  }
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + 400)) {
      if (write.type === 'delete') batch.delete(write.ref);
      else batch.set(write.ref, write.data, { merge: write.merge });
    }
    await batch.commit();
  }
  return { success: true, count: matches.length, matches };
});
