
import { createClient } from '@supabase/supabase-js';

const URL = 'https://isvjtaxpxgmgdcbdqktz.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzdmp0YXhweGdtZ2RjYmRxa3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzYzOTMsImV4cCI6MjA4NTI1MjM5M30.eqHJZ8l-Gj58wPtLzI1A_7C-VMje3CPn7TfxFuLY9xU';

export const isSupabaseConfigured = true;

export const supabase = createClient(URL, KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export const getSupabaseStatus = async (timeoutMs = 30000) => {
  const check = async () => {
    try {
      const { error, status } = await supabase.from('categories').select('id').limit(1);
      if (error) {
        if (error.message.includes('relation "categories" does not exist')) {
          return { ok: false, message: 'Schema missing. Run schema.sql.' };
        }
        return { ok: false, message: `DB Error: ${error.message}` };
      }
      return { ok: true, message: 'Connected', status };
    } catch (e: any) {
      return { ok: false, message: `Network error: ${e.message}` };
    }
  };

  return Promise.race([
    check(),
    new Promise<{ ok: boolean; message: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, message: 'Connection timed out.' }), timeoutMs)
    )
  ]);
};

export const fetchFullEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, venue:venues(id, name), category:categories(id, name), event_presenters(presenter_id)')
      .order('start_time', { ascending: true });

    if (error) {
      const { data: simple } = await supabase.from('events').select('*').order('start_time', { ascending: true });
      return (simple || []).map((e: any) => ({
        id: e.id, title: e.title, description: e.description,
        startTime: e.start_time, endTime: e.end_time,
        venueId: e.venue_id, categoryId: e.category_id,
        presenterIds: [], tags: e.tags || []
      }));
    }

    return (data || []).map((event: any) => ({
      id: event.id, title: event.title, description: event.description,
      startTime: event.start_time, endTime: event.end_time,
      venueId: event.venue_id, categoryId: event.category_id,
      presenterIds: event.event_presenters?.map((p: any) => p.presenter_id) || [],
      tags: event.tags || []
    }));
  } catch (err) {
    return [];
  }
};

export const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const fetchUserFavorites = async (userId: string): Promise<string[]> => {
  const { data } = await supabase.from('user_favorites').select('event_id').eq('user_id', userId);
  return data?.map(f => f.event_id) || [];
};

export const toggleFavoriteInDb = async (userId: string, eventId: string, isCurrentlyFavorite: boolean) => {
  if (isCurrentlyFavorite) {
    await supabase.from('user_favorites').delete().eq('user_id', userId).eq('event_id', eventId);
  } else {
    await supabase.from('user_favorites').insert({ user_id: userId, event_id: eventId });
  }
};

export const updateProfile = async (userId: string, updates: { email?: string; phone?: string; avatar_url?: string; interests?: string[] }) => {
  if (updates.email) {
    const { error: authError } = await supabase.auth.updateUser({ email: updates.email });
    if (authError) throw authError;
  }
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
};

export const fetchAllProfiles = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
};

export const uploadFile = async (bucket: string, file: File): Promise<string> => {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const uploadPresenterImage = (file: File) => uploadFile('presenters', file);
export const uploadAvatar = (file: File) => uploadFile('avatars', file);
