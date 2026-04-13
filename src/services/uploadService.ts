/**
 * uploadService.ts
 * Handles photo and audio uploads to Supabase Storage.
 * Returns permanent public URLs safe to store in Neon.
 */

import { supabase } from '@services/supabaseClient';

const PHOTO_BUCKET = 'memory-photos';
const AUDIO_BUCKET = 'memory-audio';

export async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(filename, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function uploadAudio(file: File | Blob, filename?: string): Promise<string> {
  const ext = file instanceof File
    ? file.name.split('.').pop()
    : 'webm';

  const name = filename ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(name, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file instanceof File ? file.type : 'audio/webm',
    });

  if (error) throw new Error(`Audio upload failed: ${error.message}`);

  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(name);
  return data.publicUrl;
}
