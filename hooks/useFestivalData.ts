
import { useState, useCallback, useEffect } from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { supabase, fetchFullEvents, isSupabaseConfigured, getSupabaseStatus } from '../services/supabase';

export const useFestivalData = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<FestivalEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [presenters, setPresenterData] = useState<Presenter[]>([]);
  const [isDbMode, setIsDbMode] = useState(false);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setIsDbMode(false);
      return;
    }

    try {
      // First, check connection status with a timeout race
      const statusPromise = getSupabaseStatus(15000); // 15s timeout
      const status = await statusPromise;
      setIsDbMode(status.ok);

      if (status.ok) {
        // Fetch all data in parallel
        const [eventsData, catsRes, vnsRes, presRes] = await Promise.allSettled([
          fetchFullEvents(),
          supabase.from('categories').select('*'),
          supabase.from('venues').select('*'),
          supabase.from('presenters').select('*')
        ]);

        if (eventsData.status === 'fulfilled') {
          setEvents(eventsData.value || []);
        }
        
        if (catsRes.status === 'fulfilled' && !catsRes.value.error) {
          setCategories(catsRes.value.data || []);
        }
        
        if (vnsRes.status === 'fulfilled' && !vnsRes.value.error) {
          setVenues(vnsRes.value.data || []);
        }
        
        if (presRes.status === 'fulfilled' && !presRes.value.error) {
          setPresenterData(presRes.value.data || []);
        }
      } else {
        // Clear data if disconnected to prevent inconsistent rendering
        setEvents([]);
        setCategories([]);
        setVenues([]);
        setPresenterData([]);
      }
    } catch (err) {
      console.error("Festival Data Refresh Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onAddEvent = async (event: Partial<FestivalEvent>) => {
    if (!supabase) return;
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
    if (!supabase) return;
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
    if (supabase) {
      await supabase.from('events').delete().eq('id', id);
      await refreshData();
    }
  };

  const onSavePresenter = async (p: Partial<Presenter>) => {
    if (!supabase) return;
    const { id, ...payload } = p;
    const res = id ? await supabase.from('presenters').update(payload).eq('id', id) : await supabase.from('presenters').insert([payload]);
    if (res.error) throw res.error;
    await refreshData();
  };

  const onDeletePresenter = async (id: string) => {
    if (supabase) {
      await supabase.from('presenters').delete().eq('id', id);
      await refreshData();
    }
  };

  const onSaveVenue = async (v: Partial<Venue>) => {
    if (!supabase) return;
    const { id, ...payload } = v;
    const res = id ? await supabase.from('venues').update(payload).eq('id', id) : await supabase.from('venues').insert([payload]);
    if (res.error) throw res.error;
    await refreshData();
  };

  const onDeleteVenue = async (id: string) => {
    if (supabase) {
      await supabase.from('venues').delete().eq('id', id);
      await refreshData();
    }
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    loading, events, categories, venues, presenters, isDbMode,
    refreshData, onAddEvent, onUpdateEvent, onDeleteEvent, 
    onSavePresenter, onDeletePresenter, onSaveVenue, onDeleteVenue
  };
};
