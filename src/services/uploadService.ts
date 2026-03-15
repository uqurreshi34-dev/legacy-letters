/**
 * uploadService.ts
 * Handles photo uploads to Supabase Storage.
 * Returns a permanent public URL safe to store in Neon.
 */

import { supabase } from '@services/supabaseClient';

const BUCKET = 'memory-photos';

export async function uploadPhoto(file: File): Promise<string> {
  // Create a unique filename using timestamp + original name
  // to avoid collisions between uploads
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  // Get the permanent public URL
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
}
