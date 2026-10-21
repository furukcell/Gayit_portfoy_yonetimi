/**
 * Media storage adapter (Cloudinary for the current rollout).
 *
 * Firebase Storage remains available in firebase.ts/firebaseClient.ts for a
 * future provider switch. Do not put Cloudinary API secrets in the mobile app.
 */
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

  // React Native's FormData supports a native file descriptor. Fetching a local
  // content:// URI and converting it to Blob is inconsistent across Android
  // vendors, so upload the picker URI directly instead.
  const inferredType = options?.mimeType || 'image/jpeg';
  const fileName = options?.fileName || `photo.${inferredType.includes('png') ? 'png' : inferredType.includes('webp') ? 'webp' : 'jpg'}`;
  const form = new FormData();
  form.append('file', {
    uri,
    name: fileName,
    type: inferredType,
  } as any);
  form.append('upload_preset', UPLOAD_PRESET);
  if (options?.folder) form.append('folder', options.folder);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch (error: any) {
    throw new Error(`Cloudinary bağlantı hatası: ${error?.message || 'Ağa bağlanılamadı.'}`);
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
