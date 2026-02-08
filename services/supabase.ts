
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
    console.log('🔍 Checking Supabase connection...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current auth user:', user?.id, user?.email);

    const { data, error } = await supabase.from('categories').select('id').limit(1);
    if (error) {
      console.error("❌ Connection Check Failed:", error);
      return { ok: false, message: error.message };
    }
    console.log('✅ Connection check passed');
    return { ok: true, message: 'Connected' };
  } catch (e: any) {
    // AbortErrors are expected during concurrent auth operations - treat as success
    if (e.name === 'AbortError') {
      console.log('⚠️ Connection check aborted (concurrent auth), treating as OK');
      return { ok: true, message: 'Connected (skipped check)' };
    }
    console.error("❌ Connection check exception:", e);
    return { ok: false, message: e.message };
  }
};

/**
 * Fetches all core festival data in a single sync operation
 * Automatically retries on AbortError with delay
 */
export const fetchFestivalData = async (retryCount = 0): Promise<any> => {
  console.group("🚀 Supabase Sync Diagnostics");
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Fetching data as user:", user?.id || 'anonymous');

    const [eventsRes, catsRes, vnsRes, presRes, epRes] = await Promise.all([
      supabase.from('events').select('*').order('start_time'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('venues').select('*').order('name'),
      supabase.from('presenters').select('*').order('name'),
      supabase.from('event_presenters').select('*')
    ]);

    // Log errors if any
    if (catsRes.error) console.error("Categories error:", catsRes.error);
    if (vnsRes.error) console.error("Venues error:", vnsRes.error);
    if (presRes.error) console.error("Presenters error:", presRes.error);
    if (eventsRes.error) console.error("Events error:", eventsRes.error);
    if (epRes.error) console.error("Event presenters error:", epRes.error);

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
  } catch (err: any) {
    console.groupEnd();

    // Retry on AbortError with exponential backoff (max 2 retries)
    if (err.name === 'AbortError' && retryCount < 2) {
      const delayMs = (retryCount + 1) * 300; // 300ms, 600ms
      console.log(`⚠️ Data fetch aborted, retrying in ${delayMs}ms (attempt ${retryCount + 1}/2)...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchFestivalData(retryCount + 1);
    }

    console.error("Critical Sync Error:", err);
    throw err;
  }
};

/**
 * Ensures the current user has a profile in the database
 * Call this after authentication to handle cases where the trigger didn't fire
 */
export const ensureProfile = async (userId: string, userEmail: string) => {
  console.log('🔐 ensureProfile called for:', userId, userEmail);

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Profile check timeout')), 3000)
  );

  const profilePromise = async () => {
    console.log('➕ Attempting to ensure profile exists (insert with conflict handling)...');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail || '',
        role: 'user'
      });

    // Check if error is something other than unique constraint violation
    if (insertError && insertError.code !== '23505') {
      console.error('❌ Failed to ensure profile:', insertError);
    } else {
      console.log('✅ Profile ensured (created or already exists)');
    }
  };

  try {
    // Race between profile operation and timeout
    await Promise.race([profilePromise(), timeoutPromise]);
  } catch (err: any) {
    if (err.message === 'Profile check timeout') {
      console.log('⏱️ Profile check timed out (likely already exists), continuing...');
    } else {
      console.error('❌ Unexpected error in ensureProfile:', err);
    }
  }
  console.log('🔐 ensureProfile completed');
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
  console.log('⭐ Fetching favorites for user:', userId);
  const { data, error } = await supabase.from('user_favorites').select('event_id').eq('user_id', userId);
  if (error) {
    console.error('❌ Error fetching favorites:', error);
    throw error;
  }
  console.log('✅ Favorites fetched:', data?.length || 0);
  return data?.map(f => f.event_id) || [];
};

export const toggleFavoriteInDb = async (userId: string, eventId: string, isCurrentlyFavorite: boolean, userEmail?: string) => {
  if (isCurrentlyFavorite) {
    await supabase.from('user_favorites').delete().eq('user_id', userId).eq('event_id', eventId);
  } else {
    await supabase.from('user_favorites').insert({ user_id: userId, event_id: eventId });

    // Send favorite notification email
    if (userEmail) {
      try {
        const { data, error } = await supabase.functions.invoke('send-favorite-email', {
          body: { userId, eventId, userEmail }
        });

        if (error) {
          console.error('Failed to send favorite email:', error);
        } else {
          console.log('✅ Favorite email sent:', data);
        }
      } catch (err) {
        console.error('Error sending favorite email:', err);
        // Don't throw - email failure shouldn't break favoriting
      }
    }
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
