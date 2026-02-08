
import { useState, useCallback, useEffect } from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { supabase, isSupabaseConfigured, getSupabaseStatus, fetchFestivalData } from '../services/supabase';

export const useFestivalData = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<FestivalEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [presenters, setPresenterData] = useState<Presenter[]>([]);
  const [isDbMode, setIsDbMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  const refreshData = useCallback(async () => {
    console.log('🔄 refreshData called');

    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setStatusMessage('Connecting...');
      console.log('Getting Supabase status...');

      const status = await getSupabaseStatus().catch(err => {
        // If status check fails with AbortError, try to continue anyway
        if (err.name === 'AbortError') {
          console.log('Status check aborted, will try to fetch data anyway');
          return { ok: true, message: 'Continuing...' };
        }
        throw err;
      });

      console.log('Status:', status);
      setIsDbMode(status.ok);

      if (status.ok) {
        setStatusMessage('Syncing data...');
        console.log('Fetching festival data...');

        // fetchFestivalData now handles AbortError retries internally
        const data = await fetchFestivalData();

        console.log('Data fetched:', {
          events: data.events.length,
          categories: data.categories.length,
          venues: data.venues.length,
          presenters: data.presenters.length
        });

        setEvents(data.events);
        setCategories(data.categories);
        setVenues(data.venues);
        setPresenterData(data.presenters);

        setStatusMessage('Sync complete');
      } else {
        setStatusMessage(`Connection failed: ${status.message}`);
      }
    } catch (err: any) {
      console.error("❌ App Sync Failed:", err);
      setStatusMessage(`Error: ${err.message || 'Unknown error'}`);
      setIsDbMode(false);
    } finally {
      // Small delay to let UI see the "Complete" message
      setTimeout(() => {
        console.log('Setting loading to false');
        setLoading(false);
      }, 500);
    }
  }, []);

  const onAddEvent = async (event: Partial<FestivalEvent>) => {
    const { data: newEvent, error } = await supabase.from('events').insert([{
      title: event.title, description: event.description,
      start_time: event.startTime, end_time: event.endTime,
      venue_id: event.venueId, category_id: event.categoryId, tags: event.tags
    }]).select().single();
    if (error) throw error;
    if (event.presenterIds?.length) {
      await supabase.from('event_presenters').insert(event.presenterIds.map(pid => ({ event_id: newEvent.id, presenter_id: pid })));
    }
    await refreshData();
  };

  const onUpdateEvent = async (event: FestivalEvent) => {
    const { error } = await supabase.from('events').update({
      title: event.title, description: event.description,
      start_time: event.startTime, end_time: event.endTime,
      venue_id: event.venueId, category_id: event.categoryId, tags: event.tags
    }).eq('id', event.id);
    if (error) throw error;
    await supabase.from('event_presenters').delete().eq('event_id', event.id);
    if (event.presenterIds?.length) {
      await supabase.from('event_presenters').insert(event.presenterIds.map(pid => ({ event_id: event.id, presenter_id: pid })));
    }
    await refreshData();
  };

  const onDeleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    await refreshData();
  };

  const onSavePresenter = async (p: Partial<Presenter>) => {
    const { id, ...payload } = p;
    const res = id ? await supabase.from('presenters').update(payload).eq('id', id) : await supabase.from('presenters').insert([payload]);
    if (res.error) throw res.error;
    await refreshData();
  };

  const onDeletePresenter = async (id: string) => {
    await supabase.from('presenters').delete().eq('id', id);
    await refreshData();
  };

  const onSaveVenue = async (v: Partial<Venue>) => {
    const { id, ...payload } = v;
    const res = id ? await supabase.from('venues').update(payload).eq('id', id) : await supabase.from('venues').insert([payload]);
    if (res.error) throw res.error;
    await refreshData();
  };

  const onDeleteVenue = async (id: string) => {
    await supabase.from('venues').delete().eq('id', id);
    await refreshData();
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      await refreshData();
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [refreshData]);

  return {
    loading, events, categories, venues, presenters, isDbMode, statusMessage,
    refreshData, onAddEvent, onUpdateEvent, onDeleteEvent, 
    onSavePresenter, onDeletePresenter, onSaveVenue, onDeleteVenue
  };
};
