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
    throw new Error('Cloudinary ayarları eksik. EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ve EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET tanımlanmalı.');
  }

  const fileResponse = await fetch(uri);
  if (!fileResponse.ok) throw new Error('Fotoğraf dosyası okunamadı.');
  const blob = await fileResponse.blob();
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('Fotoğraf en fazla 5 MB olabilir.');
  }
  if (blob.type && !['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) {
    throw new Error('Yalnızca JPG, PNG veya WebP fotoğrafları yüklenebilir.');
  }

  const form = new FormData();
  form.append('file', blob as any, options?.fileName || 'photo.jpg');
  form.append('upload_preset', UPLOAD_PRESET);
  if (options?.folder) form.append('folder', options.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const result = await response.json();
  if (!response.ok || !result?.secure_url || !result?.public_id) {
    throw new Error(result?.error?.message || 'Cloudinary fotoğraf yükleme işlemi başarısız.');
  }

  return { url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' };
}
