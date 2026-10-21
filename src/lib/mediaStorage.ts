/**
 * Media storage adapter (Cloudinary for the current rollout).
 *
 * Firebase Storage remains available in firebase.ts/firebaseClient.ts for a
 * future provider switch. Do not put Cloudinary API secrets in the mobile app.
 */
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type UploadedMedia = {
  url: string;
  publicId: string;
  provider: 'cloudinary';
};

export async function uploadMediaFromUri(
  uri: string,
  options?: { folder?: string; fileName?: string; mimeType?: string },
): Promise<UploadedMedia> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary ayarları eksik. Uygulama EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ve EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET değerlerini alamıyor.');
  }

  // Use Expo's standards-based File/FormData implementation. React Native's
  // global FormData rejects { uri, name, type } parts on this runtime.
  const inferredType = options?.mimeType || 'image/jpeg';
  const fileName = options?.fileName || `photo.${inferredType.includes('png') ? 'png' : inferredType.includes('webp') ? 'webp' : 'jpg'}`;
  let response: Response;
  try {
    const file = new File(uri);
    const form = new FormData();
    form.append('file', file, fileName);
    form.append('upload_preset', UPLOAD_PRESET);
    if (options?.folder) form.append('folder', options.folder);
    response = await expoFetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch (error: any) {
    throw new Error(`Cloudinary bağlantı/yükleme hatası: ${error?.message || 'Dosya hazırlanamadı veya ağa bağlanılamadı.'}`);
  }

  let result: any;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Cloudinary geçerli yanıt döndürmedi (HTTP ${response.status}).`);
  }
  if (!response.ok || !result?.secure_url || !result?.public_id) {
    const detail = result?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Cloudinary yükleme hatası: ${detail}. Cloud adı: ${CLOUD_NAME}`);
  }

  return { url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' };
}
