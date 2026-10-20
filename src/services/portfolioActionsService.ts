import { Alert } from 'react-native';
import { getFirebaseClient } from '../lib/firebaseClient';
import type { Property } from '../types/property';

export const saveTransaction = async (deps: any) => {
    const { transactionBusy, transactionFinalPrice, transactionOfficeCommission, transactionAgentCommission, transactionPropertyId, transactionDate, setTransactionBusy, properties, officeId, transactionNotes, loadProperties, setTransactionModalOpen, setTransactionPropertyId, setTransactionFinalPrice, setTransactionOfficeCommission, setTransactionAgentCommission, setTransactionNotes } = deps;
    if (transactionBusy) return;
    const finalPrice = Number(transactionFinalPrice.replace(/[^0-9]/g,''));
    const officeCommission = Number(transactionOfficeCommission.replace(/[^0-9]/g,'') || 0);
    const agentCommission = Number(transactionAgentCommission.replace(/[^0-9]/g,'') || 0);
    if (!transactionPropertyId || !Number.isSafeInteger(finalPrice) || finalPrice <= 0) { Alert.alert('Eksik bilgi','Portföy seç ve gerçekleşen satış/kiralama bedelini gir.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) || officeCommission < 0 || agentCommission < 0 || officeCommission + agentCommission > finalPrice) { Alert.alert('Bilgileri kontrol et','Tarih YYYY-AA-GG olmalı; komisyonlar negatif olamaz ve toplamı işlem bedelini aşamaz.'); return; }
    setTransactionBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data:userResult,error:userError } = await firebaseClient.auth.getUser();
      if(userError||!userResult.user) throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
      const property = properties.find((p: Property)=>p.id===transactionPropertyId);
      if(!property) throw new Error('Seçilen portföy bulunamadı.');
      const { error } = await firebaseClient.from('property_transactions').insert({
        office_id:officeId, property_id:property.id, agent_id:userResult.user.id,
        transaction_type:property.kind==='Kiralık'?'rent':'sale', final_price:finalPrice,
        office_commission:officeCommission, agent_commission:agentCommission,
        closed_on:transactionDate, notes:transactionNotes.trim(), created_by:userResult.user.id,
      });
      if(error) throw error;
      await getFirebaseClient().from('properties').update({status:property.kind==='Kiralık'?'rented':'sold'}).eq('id',property.id).eq('office_id',officeId);
      await loadProperties(officeId);
      setTransactionModalOpen(false); setTransactionPropertyId(''); setTransactionFinalPrice(''); setTransactionOfficeCommission(''); setTransactionAgentCommission(''); setTransactionNotes('');
      Alert.alert('İşlem kaydedildi','Satış/kiralama ve komisyon kaydı oluşturuldu.');
    } catch { Alert.alert('İşlem kaydedilemedi','İşlem şu anda tamamlanamadı. Lütfen tekrar dene.'); }
    finally { setTransactionBusy(false); }
  };

export const loadRecentViews = async (deps: any) => {
    const { officeId, setRecentPropertyIds } = deps;
    if (!officeId) return;
    try {
      const { data, error } = await getFirebaseClient().from('property_recent_views').select('property_id,viewed_at').eq('office_id',officeId).order('viewed_at',{ascending:false}).limit(50);
      if (error) throw error;
      setRecentPropertyIds([...new Set<string>((data||[]).map((row:any)=>String(row.property_id)))]);
    } catch {
      // The rest of the portfolio remains usable before migration 011 is applied.
    }
  };
export const openProperty = (property: Property, deps: any) => {
    const { setSelected, setPropertyPhotos, loadPropertyPhotos, officeId, setRecentPropertyIds } = deps;
    setSelected(property); setPropertyPhotos([]);
    void loadPropertyPhotos(property.id);
    if (!officeId) return;
    void (async()=>{
      try {
        const firebaseClient=getFirebaseClient();
        const {data:userResult}=await firebaseClient.auth.getUser();
        if(!userResult.user) return;
        const {error}=await firebaseClient.from('property_recent_views').upsert(
          {office_id:officeId,property_id:property.id,user_id:userResult.user.id,viewed_at:new Date().toISOString()},
          {onConflict:'office_id,property_id,user_id'}
        );
        if(error) return;
        setRecentPropertyIds((ids: string[])=>[property.id,...ids.filter(id=>id!==property.id)].slice(0,50));
      } catch { /* Recent-view tracking must not block opening a property. */ }
    })();
  };

export const loadFavorites = async (deps: any) => {
    const { officeId, setFavoriteIds } = deps;
    if (!officeId) return;
    try {
      const { data, error } = await getFirebaseClient().from('property_favorites').select('property_id').eq('office_id', officeId);
      if (error) throw error;
      setFavoriteIds((data || []).map((row: any) => row.property_id));
    } catch {
      Alert.alert('Favoriler yüklenemedi','Favoriler şu anda yüklenemiyor. Lütfen tekrar dene.');
    }
  };
export const toggleFavorite = async (property: Property, deps: any) => {
    const { officeId, favoriteIds, setFavoriteIds } = deps;
    if (!officeId) return;
    const firebaseClient = getFirebaseClient();
    const { data: userResult, error: userError } = await firebaseClient.auth.getUser();
    if (userError || !userResult.user) { Alert.alert('Oturum gerekli','Favori kaydetmek için tekrar giriş yap.'); return; }
    const isFavorite = favoriteIds.includes(property.id);
    try {
      if (isFavorite) {
        const { error } = await firebaseClient.from('property_favorites').delete().eq('office_id',officeId).eq('property_id',property.id).eq('user_id',userResult.user.id);
        if (error) throw error;
        setFavoriteIds((ids: string[])=>ids.filter(id=>id!==property.id));
      } else {
        const { error } = await firebaseClient.from('property_favorites').insert({office_id:officeId,property_id:property.id,user_id:userResult.user.id});
        if (error) throw error;
        setFavoriteIds((ids: string[])=>[...ids,property.id]);
      }
    } catch { Alert.alert('Favori kaydedilemedi','Favori işlemi tamamlanamadı. Lütfen tekrar dene.'); }
  };
