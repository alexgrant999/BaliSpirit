
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

/**
 * Enhanced diagnostic to detect schema issues vs connection issues
 */
export const getSupabaseStatus = async (timeoutMs = 30000) => {
  const check = async () => {
    try {
      const { error, status } = await supabase.from('categories').select('id').limit(1);
      
      if (error) {
        if (error.message.includes('relation "categories" does not exist')) {
          return { ok: false, message: 'Database connected, but schema is missing. Please run schema.sql in the Supabase SQL Editor.' };
        }
        return { ok: false, message: `DB Error: ${error.message} (Code: ${error.code})` };
      }
      
      return { ok: true, message: 'Connected to Bali Spirit Database', status };
    } catch (e: any) {
      return { ok: false, message: `Network error: ${e.message}. The database might be waking up from sleep.` };
    }
  };

  return Promise.race([
    check(),
    new Promise<{ ok: boolean; message: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, message: 'Connection timed out. Database is likely waking up.' }), timeoutMs)
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
      // Fallback for partial schema matches
      const { data: simple } = await supabase.from('events').select('*').order('start_time', { ascending: true });
      return (simple || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: e.start_time,
        endTime: e.end_time,
        venueId: e.venue_id,
        categoryId: e.category_id,
        presenterIds: [],
        tags: e.tags || []
      }));
    }

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.start_time,
      endTime: event.end_time,
      venueId: event.venue_id,
      categoryId: event.category_id,
      presenterIds: event.event_presenters?.map((p: any) => p.presenter_id) || [],
      tags: event.tags || []
    }));
  } catch (err) {
    console.error("Critical fetch error:", err);
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

export const uploadPresenterImage = async (file: File): Promise<string> => {
  const path = `presenters/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('presenters').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('presenters').getPublicUrl(path).data.publicUrl;
};
