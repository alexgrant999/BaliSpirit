
import { useState, useCallback, useEffect } from 'react';
import { FestivalEvent, Category, Venue, Presenter } from '../types';
import { supabase, fetchFullEvents, isSupabaseConfigured } from '../services/supabase';

export const useFestivalData = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<FestivalEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [isDbMode, setIsDbMode] = useState(false);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setIsDbMode(false);
      setLoading(false);
      return;
    }

    try {
      const [eventsData, catsRes, vnsRes, presRes] = await Promise.allSettled([
        fetchFullEvents(),
        supabase.from('categories').select('*'),
        supabase.from('venues').select('*'),
        supabase.from('presenters').select('*')
      ]);

      let hasAnyData = false;

      if (eventsData.status === 'fulfilled') {
        setEvents(eventsData.value);
        if (eventsData.value.length > 0) hasAnyData = true;
      }

      if (catsRes.status === 'fulfilled' && !catsRes.value.error) {
        setCategories(catsRes.value.data || []);
        if (catsRes.value.data && catsRes.value.data.length > 0) hasAnyData = true;
      }

      if (vnsRes.status === 'fulfilled' && !vnsRes.value.error) {
        setVenues(vnsRes.value.data || []);
        if (vnsRes.value.data && vnsRes.value.data.length > 0) hasAnyData = true;
      }

      if (presRes.status === 'fulfilled' && !presRes.value.error) {
        setPresenters(presRes.value.data || []);
        if (presRes.value.data && presRes.value.data.length > 0) hasAnyData = true;
      }

      setIsDbMode(hasAnyData);
    } catch (err) {
      console.error("❌ Critical sync error:", err);
      setIsDbMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const onAddEvent = async (event: Partial<FestivalEvent>) => {
    if (isSupabaseConfigured && supabase) {
      const { data: newEvent, error } = await supabase.from('events').insert([{
        title: event.title,
        description: event.description,
        start_time: event.startTime,
        end_time: event.endTime,
        venue_id: event.venueId,
        category_id: event.categoryId,
        tags: event.tags
      }]).select().single();
      
      if (error) throw error;
      if (event.presenterIds?.length) {
        const relationships = event.presenterIds.map(pid => ({ event_id: newEvent.id, presenter_id: pid }));
        await supabase.from('event_presenters').insert(relationships);
      }
      await refreshData();
    }
  };

  const onUpdateEvent = async (event: FestivalEvent) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('events').update({
        title: event.title,
        description: event.description,
        start_time: event.startTime,
        end_time: event.endTime,
        venue_id: event.venueId,
        category_id: event.categoryId,
        tags: event.tags
      }).eq('id', event.id);
      
      if (error) throw error;
      await supabase.from('event_presenters').delete().eq('event_id', event.id);
      if (event.presenterIds?.length) {
        const relationships = event.presenterIds.map(pid => ({ event_id: event.id, presenter_id: pid }));
        await supabase.from('event_presenters').insert(relationships);
      }
      await refreshData();
    }
  };

  const onDeleteEvent = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    }
  };

  const onSavePresenter = async (presenter: Partial<Presenter>) => {
    if (!isSupabaseConfigured || !supabase) return;
    const isUpdate = !!presenter.id;
    const payload = { ...presenter };
    delete payload.id;
    
    const result = isUpdate 
      ? await supabase.from('presenters').update(payload).eq('id', presenter.id)
      : await supabase.from('presenters').insert([payload]);

    if (result.error) throw result.error;
    await refreshData();
  };

  const onDeletePresenter = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('presenters').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    }
  };

  const onSaveVenue = async (venue: Partial<Venue>) => {
    if (!isSupabaseConfigured || !supabase) return;
    const isUpdate = !!venue.id;
    const payload = { name: venue.name, description: venue.description };
    
    const result = isUpdate 
      ? await supabase.from('venues').update(payload).eq('id', venue.id)
      : await supabase.from('venues').insert([payload]);

    if (result.error) throw result.error;
    await refreshData();
  };

  const onDeleteVenue = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('venues').delete().eq('id', id);
      if (error) throw error;
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
