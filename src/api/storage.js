import { supabase } from '@/api/supabaseClient';

const BUCKET = 'photos';

/**
 * Uploads a file to Supabase Storage and returns a public URL, mirroring
 * the old `base44.integrations.Core.UploadFile({ file })` return shape
 * ( { file_url } ) so call sites don't need to change.
 */
export async function UploadFile({ file }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl };
}
