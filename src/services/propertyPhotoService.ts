import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirebaseClient } from '../lib/firebaseClient';
import { uploadMediaFromUri } from '../lib/mediaStorage';
import type { Property, PropertyPhoto } from '../types/property';

type PhotoDependencies = {
  selected: Property | null;
  officeId: string;
  propertyPhotos: PropertyPhoto[];
  photosBusy: boolean;
  setPhotosBusy: (value: boolean) => void;
  setPropertyPhotos: (value: PropertyPhoto[] | ((current: PropertyPhoto[]) => PropertyPhoto[])) => void;
};

export const loadPropertyPhotos = async (propertyId: string, deps: PhotoDependencies) => {
    const { setPhotosBusy, setPropertyPhotos } = deps;
    setPhotosBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      const { data, error } = await firebaseClient.from('property_photos').select('id,storage_path,sort_order').eq('property_id', propertyId).order('sort_order', { ascending: true });
      if (error) throw error;
      const photos: PropertyPhoto[] = await Promise.all((data || []).map(async (row: any) => {
        const storedPath = String(row.storage_path || '');
        // Cloudinary assets are stored as HTTPS URLs; only legacy Firebase paths need signed URLs.
        if (/^https?:\/\//i.test(storedPath)) {
          return { id: row.id, storagePath: storedPath, url: storedPath, sortOrder: row.sort_order || 0 };
        }
        const { data: signed, error: signError } = await firebaseClient.storage.from('property-photos').createSignedUrl(storedPath, 60 * 60);
        if (signError) throw signError;
        return { id: row.id, storagePath: storedPath, url: signed.signedUrl, sortOrder: row.sort_order || 0 };
      }));
      setPropertyPhotos(photos);
    } catch (error: any) {
      setPropertyPhotos([]);
      const detail = error instanceof Error ? error.message : error?.message || 'Bilinmeyen hata';
      Alert.alert('Fotoğraflar yüklenemedi', `Fotoğraf kayıtları okunamadı: ${detail}`);
    } finally { setPhotosBusy(false); }
  };

export const addPropertyPhoto = async (deps: PhotoDependencies) => {
    const { selected, officeId, propertyPhotos, setPhotosBusy, setPropertyPhotos } = deps;
    if (!selected) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Galeri izni gerekli', 'İlan fotoğrafı seçmek için galeri izni vermelisin.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    setPhotosBusy(true);
    try {
      const asset = result.assets[0];
      const uploaded = await uploadMediaFromUri(asset.uri, { folder: `gayit/${officeId}/properties/${selected.id}`, fileName: `photo-${Date.now()}.jpg`, mimeType: asset.mimeType || undefined });
      const firebaseClient = getFirebaseClient();
      // Store the Cloudinary secure URL; all photo features use the same provider.
      const persistedPath = uploaded.url;
      const { error: rowError } = await firebaseClient.from('property_photos').insert({ property_id: selected.id, office_id: officeId, storage_path: persistedPath, sort_order: propertyPhotos.length });
      if (rowError) {
        if (!/^https?:\/\//i.test(persistedPath)) await firebaseClient.storage.from('property-photos').remove([persistedPath]);
        throw new Error(rowError.message || 'Fotoğrafın ilan kaydı oluşturulamadı.');
      }
      await loadPropertyPhotos(selected.id, deps);
    } catch (error: any) { Alert.alert('Fotoğraf yüklenemedi', error instanceof Error ? error.message : error?.message || 'Bilinmeyen yükleme hatası. Cloudinary ayarlarını ve Firestore erişim izinlerini kontrol edin.'); }
    finally { setPhotosBusy(false); }
  };

export const movePropertyPhoto = async (photo: PropertyPhoto, direction: -1 | 1, deps: PhotoDependencies) => {
    const { selected, propertyPhotos, photosBusy, setPhotosBusy, setPropertyPhotos } = deps;
    if (!selected || photosBusy) return;
    const current = [...propertyPhotos].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = current.findIndex(item => item.id === photo.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setPhotosBusy(true);
    try {
      const firebaseClient = getFirebaseClient();
      // Persist sequential sort_order values; index 0 is the cover photo.
      for (let i = 0; i < reordered.length; i++) {
        const { error } = await firebaseClient.from('property_photos')
          .update({ sort_order: i }).eq('id', reordered[i].id).eq('property_id', selected.id);
        if (error) throw error;
      }
      setPropertyPhotos(reordered.map((item, i) => ({ ...item, sortOrder: i })));
    } catch (error) {
      await loadPropertyPhotos(selected.id, deps);
      Alert.alert('Sıralama kaydedilemedi', error instanceof Error ? error.message : 'Fotoğraf sırası güncellenemedi.');
    } finally {
      setPhotosBusy(false);
    }
  };

export const removePropertyPhoto = async (photo: PropertyPhoto, deps: PhotoDependencies) => {
    const { selected, photosBusy, setPhotosBusy, setPropertyPhotos } = deps;
    if (!selected || photosBusy) return;
    const propertyId = selected.id;
    Alert.alert('Fotoğrafı sil', 'Bu fotoğraf ilandan kaldırılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        if (photosBusy) return;
        setPhotosBusy(true);
        try {
          const firebaseClient = getFirebaseClient();
          // Cloudinary URLs cannot be deleted securely from a mobile client without a server-side signature.
          // Remove only the database row for Cloudinary assets; legacy Firebase objects are removed from Storage.
          if (!/^https?:\/\//i.test(photo.storagePath)) {
            const { error: storageError } = await firebaseClient.storage.from('property-photos').remove([photo.storagePath]);
            if (storageError) {
              await loadPropertyPhotos(propertyId, deps);
              Alert.alert('Fotoğraf silinemedi', 'Dosya depolamadan silinemedi; kayıt galeride bırakıldı. Firebase Storage izinlerini kontrol et.');
              return;
            }
          }
          const { error: rowError } = await firebaseClient.from('property_photos')
            .delete().eq('id', photo.id).eq('property_id', propertyId);
          if (rowError) {
            await loadPropertyPhotos(propertyId, deps);
            Alert.alert('Fotoğraf dosyası silindi', 'Depolama dosyası silindi ancak fotoğraf kaydı kaldı. Galeriyi yenileyip tekrar deneyebilirsin.');
            return;
          }
          setPropertyPhotos(current => current.filter(item => item.id !== photo.id));
          await loadPropertyPhotos(propertyId, deps);
        } catch (error) {
          Alert.alert('Fotoğraf silinemedi', error instanceof Error ? error.message : 'Silme işlemi tamamlanamadı. Tekrar deneyin.');
        } finally {
          setPhotosBusy(false);
        }
      }}
    ]);
  };
