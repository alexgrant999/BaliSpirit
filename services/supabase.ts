
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://isvjtaxpxgmgdcbdqktz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzdmp0YXhweGdtZ2RjYmRxa3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzYzOTMsImV4cCI6MjA4NTI1MjM5M30.eqHJZ8l-Gj58wPtLzI1A_7C-VMje3CPn7TfxFuLY9xU';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

/**
 * Authentication Helpers
 */
export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  
  // Use a cleaner redirect URL that matches typical Supabase settings
  const redirectUrl = window.location.origin;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  if (error) throw error;
};

export const signOut = async () => {
  if (supabase) await supabase.auth.signOut();
};

/**
 * Favorites Management
 */
export const fetchUserFavorites = async (userId: string): Promise<string[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_favorites')
    .select('event_id')
    .eq('user_id', userId);
  
  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
  return data.map(f => f.event_id);
};

export const toggleFavoriteInDb = async (userId: string, eventId: string, isCurrentlyFavorite: boolean) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  
  if (isCurrentlyFavorite) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, event_id: eventId });
    if (error) throw error;
  }
};

/**
 * Storage & Seeding
 */
export const uploadPresenterImage = async (file: File): Promise<string> => {
  if (!supabase) throw new Error("Supabase not configured");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `presenters/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('presenters')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('presenters')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const fetchFullEvents = async () => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        category:categories(*),
        event_presenters(presenter_id)
      `)
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }
    if (!data) return [];

    return data.map((event: any) => ({
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
    console.error("Fetch implementation error:", err);
    return [];
  }
};
