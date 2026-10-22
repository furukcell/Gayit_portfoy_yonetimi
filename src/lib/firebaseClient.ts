import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, setDoc, where, orderBy, limit as take, documentId } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase';

type Row = Record<string, any>;
const err = (message: string) => ({ message });

class CollectionQuery {
  filters: any[] = []; orders: {field:string; direction:'asc'|'desc'}[] = []; max?: number; op = 'select'; payload: any; one = false; optional = false; conflict: string[] = []; selectedFields = '*'; hasOfficeFilter = false;
  constructor(private table: string) {}
  select(_fields = '*') { this.selectedFields = _fields; return this; }
  eq(k: string, v: any) { if (k === 'office_id') this.hasOfficeFilter = true; this.filters.push((k === 'id' || (this.table === 'office_members' && k === 'user_id')) ? where(documentId(), '==', String(v)) : where(k, '==', v)); return this; }
  neq(k: string, v: any) { this.filters.push((k === 'id' || (this.table === 'office_members' && k === 'user_id')) ? where(documentId(), '!=', String(v)) : where(k, '!=', v)); return this; }
  in(k: string, v: any[]) { this.filters.push(v.length ? where(k === 'id' ? documentId() : k, 'in', v.slice(0, 30)) : where(documentId(), '==', '__empty__')); return this; }
  order(k: string, o?: {ascending?: boolean}) { this.orders.push({field:k, direction:o?.ascending === false ? 'desc' : 'asc'}); return this; }
  limit(n: number) { this.max = n; return this; }
  insert(v: any) { this.op = 'insert'; this.payload = v; return this; }
  upsert(v: any, options?: {onConflict?: string}) { this.op = 'upsert'; this.payload = v; this.conflict = options?.onConflict?.split(',').map(s => s.trim()).filter(Boolean) || []; return this; }
  update(v: any) { this.op = 'update'; this.payload = v; return this; }
  delete() { this.op = 'delete'; return this; }
  single() { this.one = true; return this; }
  maybeSingle() { this.one = true; this.optional = true; return this; }
  then(resolve: any, reject: any) { return this.run().then(resolve, reject); }
  async run() {
    try {
      const db = getFirebaseDb(), col = collection(db, this.table);
      if (this.op === 'insert' || this.op === 'upsert') {
        const values: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload], out: Row[] = [];
        for (const value of values) {
          const id = value.id; const clean = {...value}; delete clean.id;
          if (this.op === 'upsert') {
            const targetId = id ? String(id) : this.conflict.length ? this.conflict.map(k => String(clean[k] ?? '')).join('__') : '';
            if (!targetId || targetId.includes('undefined')) throw new Error('Upsert için belge ID veya onConflict alanları gerekli.');
            await setDoc(doc(db, this.table, targetId), clean, {merge:true}); out.push({id:targetId, ...clean});
          } else { const saved = await addDoc(col, clean); out.push({id:saved.id, ...clean}); }
        }
        return {data:Array.isArray(this.payload)?out:out[0], error:null};
      }
      if (!['superadmins', 'offices'].includes(this.table) && !this.hasOfficeFilter) {
        const currentUser = getFirebaseAuth().currentUser;
        if (currentUser && !this.selectedFields.includes('superadmin')) {
          const membership = await getDoc(doc(db, 'office_members', currentUser.uid));
          if (membership.exists() && membership.data().office_id) {
            this.filters.push(where('office_id', '==', membership.data().office_id));
          }
        }
      }
      const snap = await getDocs(query(col, ...this.filters));
      let rows = snap.docs.map(d => ({id:d.id, ...d.data()} as Row));
      if (this.table === 'office_members') {
        rows = await Promise.all(rows.map(async row => {
          const profileSnap = await getDoc(doc(db, 'profiles', row.id));
          return { ...row, user_id: row.id, profiles: profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null };
        }));
      } else if (this.table === 'customers' && this.selectedFields.includes('customer_requirements')) {
        rows = await Promise.all(rows.map(async row => {
          const reqSnap = await getDocs(query(collection(db, 'customer_requirements'), where('office_id', '==', row.office_id), where('customer_id', '==', row.id)));
          return { ...row, customer_requirements: reqSnap.docs.map(d => ({ id: d.id, ...d.data() })) };
        }));
      } else if (this.table === 'matches' && this.selectedFields.includes('properties(')) {
        rows = await Promise.all(rows.map(async row => {
          const [propertySnap, customerSnap] = await Promise.all([
            row.property_id ? getDoc(doc(db, 'properties', row.property_id)) : Promise.resolve(null),
            row.customer_id ? getDoc(doc(db, 'customers', row.customer_id)) : Promise.resolve(null)
          ]);
          return { ...row, properties: propertySnap?.exists() ? { id: propertySnap.id, ...propertySnap.data() } : null, customers: customerSnap?.exists() ? { id: customerSnap.id, ...customerSnap.data() } : null };
        }));
      }
      for (const order of [...this.orders].reverse()) {
        rows.sort((a, b) => {
          const av = a[order.field], bv = b[order.field];
          const cmp = av == null ? (bv == null ? 0 : -1) : bv == null ? 1 : av < bv ? -1 : av > bv ? 1 : 0;
          return order.direction === 'desc' ? -cmp : cmp;
        });
      }
      if (this.max) rows = rows.slice(0, this.max);
      if (this.op === 'update' || this.op === 'delete') {
        for (const row of rows) {
          if (this.table === 'office_members' && this.op === 'update' && typeof this.payload?.status === 'string') {
            await httpsCallable(getFunctions(getFirebaseApp(), 'europe-west1'), 'setAgentStatus')({ userId: row.id, status: this.payload.status });
          } else if (this.op === 'delete') await deleteDoc(doc(db,this.table,row.id));
          else await updateDoc(doc(db,this.table,row.id),this.payload);
        }
        return {data:null,error:null};
      }
      const data = this.one ? (rows[0] ?? null) : rows;
      if (this.one && !data && !this.optional) return {data:null,error:err('Kayıt bulunamadı.')};
      return {data,error:null};
    } catch(e:any) { return {data:null,error:err(e?.message || 'Firebase veri işlemi başarısız.')}; }
  }
}
let client: any;
export function getFirebaseClient(): any {
  if (client) return client;
  const auth = getFirebaseAuth(), storage = getFirebaseStorage();
  client = {
    auth: {
      getUser: async () => ({data:{user:auth.currentUser ? {id:auth.currentUser.uid,email:auth.currentUser.email}:null},error:null}),
      signOut: async () => { try { await signOut(auth); return {error:null}; } catch(e:any) { return {error:err(e.message)}; } },
      signInWithPassword: async ({email,password}: {email:string;password:string}) => {
        try { const c = await signInWithEmailAndPassword(auth,email,password); return {data:{user:{id:c.user.uid,email:c.user.email}},error:null}; }
        catch { return {data:{user:null},error:err('Kullanıcı adı veya şifre hatalı.')}; }
      }
    },
    from: (table:string) => new CollectionQuery(table),
    // Media provider: Cloudinary for now. Firebase Storage imports above and
    // getFirebaseStorage() remain intact so the provider can be switched back later.
    storage: {from:(bucket:string)=>({
      upload:async(path:string,body:Blob,options?:any)=>{
        try {
          const cloudName = String(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
          const uploadPreset = String(process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '').trim();
          if (!cloudName || !uploadPreset) throw new Error('Cloudinary ayarları eksik. EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ve EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET değişkenlerini kontrol edin.');
          // Reject accidental whitespace / copied URL values before calling Cloudinary.
          if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new Error('Cloudinary cloud name biçimi geçersiz.');
          const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
          const form = new FormData();
          form.append('file', body as any);
          form.append('upload_preset', uploadPreset);
          // Keep Firebase-style path organization as a Cloudinary folder/public ID.
          const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\.[^/.]+$/, '');
          if (cleanPath) {
            const parts = cleanPath.split('/');
            const fileName = parts.pop();
            if (parts.length) form.append('folder', parts.join('/'));
            if (fileName) form.append('public_id', fileName);
          }
          const response = await fetch(endpoint, { method:'POST', body:form });
          const raw = await response.text();
          let result:any;
          try { result = raw ? JSON.parse(raw) : {}; }
          catch { result = {error:{message:raw || 'Cloudinary boş veya geçersiz yanıt döndürdü.'}}; }
          if (!response.ok || !result.secure_url) {
            const message = result?.error?.message || 'Cloudinary medya yüklemesi başarısız.';
            // Include status and endpoint host/path for diagnosis; never expose API secrets.
            throw new Error(`Cloudinary yükleme hatası (${response.status}; cloud=${cloudName}; preset=${uploadPreset}): ${message}`);
          }
          return {data:{path:result.secure_url, fullPath:result.public_id, url:result.secure_url, publicId:result.public_id, resourceType:result.resource_type},error:null};
        } catch(e:any) { return {data:null,error:err(e?.message || 'Cloudinary medya yüklemesi başarısız.')}; }
      },
      createSignedUrl:async(path:string)=>{
        try {
          // New Cloudinary records store secure_url directly; old Firebase paths
          // can still be resolved by Firebase Storage for a future migration.
          if (/^https?:\/\//i.test(path)) return {data:{signedUrl:path},error:null};
          return {data:{signedUrl:await getDownloadURL(ref(getFirebaseStorage(),path))},error:null};
        } catch(e:any) { return {data:null,error:err(e.message)}; }
      },
      remove:async(paths:string[])=>{
        try {
          const firebasePaths = paths.filter(p => !/^https?:\/\//i.test(p));
          await Promise.all(firebasePaths.map(p=>deleteObject(ref(getFirebaseStorage(),p))));
          if (paths.some(p => /^https?:\/\//i.test(p))) throw new Error('Cloudinary dosyaları istemciden güvenli biçimde silinemez; imzalı sunucu işlemi gerekir.');
          return {data:paths.map(name=>({name})),error:null};
        } catch(e:any) { return {data:null,error:err(e.message)}; }
      }
    })},
    functions:{invoke:async(name:string, options?:{body?:any})=>{
      try {
        if (name === 'evaluate-matches') {
          const officeId = String(options?.body?.officeId || '');
          if (!officeId) throw new Error('Ofis bilgisi eksik.');
          const db = getFirebaseDb();
          const [propertySnap, requirementSnap, existingSnap] = await Promise.all([
            getDocs(query(collection(db, 'properties'), where('office_id', '==', officeId))),
            getDocs(query(collection(db, 'customer_requirements'), where('office_id', '==', officeId), where('is_active', '==', true))),
            getDocs(query(collection(db, 'matches'), where('office_id', '==', officeId)))
          ]);
          const norm = (v:any) => String(v ?? '').trim().toLocaleLowerCase('tr-TR');
          const properties = propertySnap.docs.map(d => ({ id:d.id, ...d.data() } as Row));
          const requirements = requirementSnap.docs.map(d => ({ id:d.id, ...d.data() } as Row));
          const existing = new Map(existingSnap.docs.map(d => [d.id, {ref:d.ref, data:d.data()}]));
          const next = new Map<string, Row>();
          for (const req of requirements) {
            for (const p of properties) {
              const intent = norm(req.intent || req.listing_type || req.transaction_type);
              const listing = norm(p.listing_type || p.kind);
              const wantsRent = intent.includes('rent') || intent.includes('kir');
              const isRent = listing.includes('rent') || listing.includes('kir');
              if (intent && listing && wantsRent !== isRent) continue;
              const max = Number(req.max_price || req.maxPrice || req.budget_max || 0);
              const min = Number(req.min_price || req.minPrice || 0);
              const price = Number(p.price || 0);
              if (max > 0 && price > max) continue;
              if (min > 0 && price < min) continue;
              const reqDistrict = norm(req.district), propertyDistrict = norm(p.district);
              if (reqDistrict && propertyDistrict && reqDistrict !== propertyDistrict) continue;
              const reqCity = norm(req.city), propertyCity = norm(p.city);
              if (reqCity && propertyCity && reqCity !== propertyCity) continue;
              const rooms = Array.isArray(req.rooms) ? req.rooms.map(norm).filter(Boolean) : [];
              if (rooms.length && !rooms.includes(norm(p.rooms))) continue;
              const reqType = norm(req.property_type || req.propertyType), propType = norm(p.property_type);
              if (reqType && propType && reqType !== propType) continue;
              const key = req.id + '__' + p.id;
              const oldMatch:any = existing.get(key)?.data;
              next.set(key, {
                office_id:officeId, requirement_id:req.id, customer_id:req.customer_id || null, property_id:p.id,
                match_score:100, score:100, match_kind:'exact', match_reasons:['Kriterlerle eşleşti'],
                status:oldMatch?.status || 'new', created_at:oldMatch?.created_at || new Date().toISOString()
              });
            }
          }
          const batchWrites:Array<Promise<any>> = [];
          for (const [id, item] of existing) if (!next.has(id)) batchWrites.push(deleteDoc(item.ref));
          for (const [id, data] of next) {
            const ref = doc(db, 'matches', id);
            batchWrites.push(setDoc(ref, data, {merge:true}));
            if (!existing.has(id)) {
              batchWrites.push(setDoc(doc(db, 'notifications', 'match_' + id), {
                office_id:officeId, notification_type:'match', title:'Yeni portföy eşleşmesi',
                body:'Bir müşteri talebi portföyünüzle eşleşti.', match_id:id,
                customer_id:data.customer_id, property_id:data.property_id, read_at:null, created_at:new Date().toISOString()
              }, {merge:true}));
            }
          }
          await Promise.all(batchWrites);
          return {data:{success:true,count:next.size},error:null};
        }
        const fn=getFunctions(getFirebaseApp(),'europe-west1');
        const callableName=({ 'create-agent':'createAgent', 'create-office':'createOffice' } as Record<string,string>)[name];
        if(!callableName)return {data:null,error:err(`Firebase sunucu işlemi '${name}' tanımlı değil.`)};
        const result=await httpsCallable(fn,callableName)(options?.body||{});
        return {data:result.data,error:null};
      } catch(e:any) { return {data:null,error:err(e?.message||'Firebase işlemi başarısız.')} }
    }}
  };
  return client;
}
