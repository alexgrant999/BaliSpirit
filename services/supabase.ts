
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

export const getSupabaseStatus = async () => {
  try {
    const { data, error } = await supabase.from('categories').select('id').limit(1);
    if (error) {
      console.error("Connection Check Failed:", error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Connected' };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
};

/**
 * Fetches all core festival data in a single sync operation
 */
export const fetchFestivalData = async () => {
  console.group("🚀 Supabase Sync Diagnostics");
  try {
    const [eventsRes, catsRes, vnsRes, presRes, epRes] = await Promise.all([
      supabase.from('events').select('*').order('start_time'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('venues').select('*').order('name'),
      supabase.from('presenters').select('*').order('name'),
      supabase.from('event_presenters').select('*')
    ]);

    // Log individual table health
    console.log("Categories found:", catsRes.data?.length || 0);
    console.log("Venues found:", vnsRes.data?.length || 0);
    console.log("Presenters found:", presRes.data?.length || 0);
    console.log("Events found:", eventsRes.data?.length || 0);
    
    if (presRes.data && presRes.data.length > 0) {
      console.log("Sample Presenter from DB:", presRes.data[0]);
    }

    const events = (eventsRes.data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      startTime: e.start_time,
      endTime: e.end_time,
      venueId: e.venue_id,
      categoryId: e.category_id,
      tags: e.tags || [],
      presenterIds: (epRes.data || [])
        .filter((ep: any) => ep.event_id === e.id)
        .map((ep: any) => ep.presenter_id)
    }));

    console.groupEnd();

    return {
      events,
      categories: catsRes.data || [],
      venues: vnsRes.data || [],
      presenters: presRes.data || []
    };
  } catch (err) {
    console.error("Critical Sync Error:", err);
    console.groupEnd();
    throw err;
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

export const updateProfile = async (userId: string, updates: any) => {
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
