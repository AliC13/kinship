import { supabase } from '@/api/supabaseClient';

/**
 * CRUD for the `shares` table. Kept separate from entities.js since shares
 * aren't a tree-owned entity (they're not scoped by "user_id = the owner
 * of this row" alone - recipients need to read rows addressed to them too,
 * which the generic createEntityClient() in entities.js doesn't support).
 */
export const Shares = {
  /** Trees the current user has shared out to other people. */
  async listSharedByMe() {
    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Trees other people have shared with the current user's email. */
  async listSharedWithMe() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return [];

    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .ilike('shared_with_email', user.email)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create({ email, permission = 'view' }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('shares')
      .insert({
        owner_id: user.id,
        owner_email: user.email,
        shared_with_email: email.trim().toLowerCase(),
        permission,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from('shares').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async updatePermission(id, permission) {
    const { data, error } = await supabase
      .from('shares')
      .update({ permission })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};