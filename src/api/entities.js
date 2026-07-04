import { supabase } from '@/api/supabaseClient';

/**
 * Creates an entity client that mimics the shape of the old
 * base44.entities.<Name> API (list/create/update/delete), backed by a
 * Supabase table. Every row is scoped to the logged-in user via the
 * `user_id` column + Row Level Security policies (see supabase/schema.sql),
 * so no manual filtering is needed here beyond stamping user_id on create.
 */
function createEntityClient(table) {
  return {
    /**
     * @param {string} sort e.g. '-created_date' or 'created_date'
     * @param {number} limit
     */
    async list(sort = '-created_date', limit = 500) {
      const column = sort.replace(/^-/, '');
      const ascending = !sort.startsWith('-');

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(column, { ascending })
        .limit(limit);

      if (error) throw error;
      return data;
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(table)
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update({ ...payload, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

export const Person = createEntityClient('persons');
export const Relationship = createEntityClient('relationships');
