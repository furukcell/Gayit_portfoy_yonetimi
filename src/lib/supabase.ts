import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, setDoc, where, orderBy, limit as take, documentId } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase';

type Row = Record<string, any>;
const err = (message: string) => ({ message });

class CollectionQuery {
  filters: any[] = []; orders: any[] = []; max?: number; op = 'select'; payload: any; one = false; optional = false; conflict: string[] = []; selectedFields = '*'; hasOfficeFilter = false;
  constructor(private table: string) {}
  select(_fields = '*') { this.selectedFields = _fields; return this; }
  eq(k: string, v: any) { if (k === 'office_id') this.hasOfficeFilter = true; this.filters.push((k === 'id' || (this.table === 'office_members' && k === 'user_id')) ? where(documentId(), '==', String(v)) : where(k, '==', v)); return this; }
  neq(k: string, v: any) { this.filters.push((k === 'id' || (this.table === 'office_members' && k === 'user_id')) ? where(documentId(), '!=', String(v)) : where(k, '!=', v)); return this; }
  in(k: string, v: any[]) { this.filters.push(v.length ? where(k === 'id' ? documentId() : k, 'in', v.slice(0, 30)) : where(documentId(), '==', '__empty__')); return this; }
  order(k: string, o?: {ascending?: boolean}) { this.orders.push(orderBy(k, o?.ascending === false ? 'desc' : 'asc')); return this; }
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
      if (this.table === 'profiles' && !this.hasOfficeFilter) {
        const currentUser = getFirebaseAuth().currentUser;
        if (currentUser && !this.selectedFields.includes('superadmin')) {
          const membership = await getDoc(doc(db, 'office_members', currentUser.uid));
          if (membership.exists() && membership.data().office_id) {
            this.filters.push(where('office_id', '==', membership.data().office_id));
          }
        }
      }
      const snap = await getDocs(query(col, ...this.filters, ...this.orders, ...(this.max ? [take(this.max)] : [])));
      let rows = snap.docs.map(d => ({id:d.id, ...d.data()} as Row));
      if (this.table === 'office_members') {
        rows = await Promise.all(rows.map(async row => {
          const profileSnap = await getDoc(doc(db, 'profiles', row.id));
          return { ...row, user_id: row.id, profiles: profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null };
        }));
      } else if (this.table === 'customers' && this.selectedFields.includes('customer_requirements')) {
        rows = await Promise.all(rows.map(async row => {
          const reqSnap = await getDocs(query(collection(db, 'customer_requirements'), where('customer_id', '==', row.id)));
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
      if (this.op === 'update' || this.op === 'delete') {
        for (const row of rows) this.op === 'delete' ? await deleteDoc(doc(db,this.table,row.id)) : await updateDoc(doc(db,this.table,row.id),this.payload);
        return {data:null,error:null};
      }
      const data = this.one ? (rows[0] ?? null) : rows;
      if (this.one && !data && !this.optional) return {data:null,error:err('Kayıt bulunamadı.')};
      return {data,error:null};
    } catch(e:any) { return {data:null,error:err(e?.message || 'Firebase veri işlemi başarısız.')}; }
  }
}
let client: any;
export function getSupabaseClient(): any {
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
    storage: {from:(bucket:string)=>({
      upload:async(path:string,body:Blob,options?:any)=>{try{await uploadBytes(ref(storage,path),body,options);return {data:{path},error:null};}catch(e:any){return {data:null,error:err(e.message)};}},
      createSignedUrl:async(path:string)=>{try{return {data:{signedUrl:await getDownloadURL(ref(storage,path))},error:null};}catch(e:any){return {data:null,error:err(e.message)};}},
      remove:async(paths:string[])=>{try{await Promise.all(paths.map(p=>deleteObject(ref(storage,p))));return {data:paths.map(name=>({name})),error:null};}catch(e:any){return {data:null,error:err(e.message)};}}
    })},
    functions:{invoke:async(name:string, options?:{body?:any})=>{try{const fn=getFunctions(getFirebaseApp(),'europe-west1');const callableName=({ 'create-agent':'createAgent', 'create-office':'createOffice', 'evaluate-matches':'evaluateMatches' } as Record<string,string>)[name];if(!callableName)return {data:null,error:err(`Firebase sunucu işlemi '${name}' tanımlı değil.`)};const result=await httpsCallable(fn,callableName)(options?.body||{});return {data:result.data,error:null};}catch(e:any){return {data:null,error:err(e?.message||'Firebase sunucu işlemi başarısız.')}}}}
  };
  return client;
}
