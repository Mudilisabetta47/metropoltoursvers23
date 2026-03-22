import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WeekendTripData {
  id?: string;
  destination: string;
  slug: string;
  country: string;
  image_url: string | null;
  hero_image_url: string | null;
  gallery_images: string[];
  short_description: string | null;
  full_description: string | null;
  highlights: string[];
  inclusions: string[];
  not_included: string[];
  duration: string | null;
  distance: string | null;
  base_price: number;
  route_id: string | null;
  departure_city: string;
  departure_point: string | null;
  via_stops: ViaStop[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
}

export interface ViaStop {
  city: string;
  name: string;
  surcharge: number;
}

const defaultTrip: WeekendTripData = {
  destination: '',
  slug: '',
  country: 'Europa',
  image_url: null,
  hero_image_url: null,
  gallery_images: [],
  short_description: null,
  full_description: null,
  highlights: [],
  inclusions: ['Hin- und Rückfahrt im Komfortbus', 'Kostenloses WLAN an Bord', 'Steckdosen am Sitzplatz', 'Erfahrener Busfahrer', 'Stadtplan & Infomaterial'],
  not_included: ['Übernachtung', 'Verpflegung', 'Eintritte & Führungen'],
  duration: null,
  distance: null,
  base_price: 0,
  route_id: null,
  departure_city: 'Hamburg',
  departure_point: 'ZOB Hamburg',
  via_stops: [
    { city: 'Bremen', name: 'Bremen Hbf', surcharge: 0 },
    { city: 'Hannover', name: 'Hannover Hbf', surcharge: 0 },
  ],
  is_active: true,
  is_featured: false,
  sort_order: 0,
  meta_title: null,
  meta_description: null,
  tags: [],
};

export const useWeekendTripBuilder = (tripId?: string) => {
  const { toast } = useToast();
  const [trip, setTrip] = useState<WeekendTripData>({ ...defaultTrip });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('weekend_trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (error) throw error;
      if (data) {
        setTrip({
          ...data,
          highlights: data.highlights || [],
          inclusions: data.inclusions || [],
          not_included: data.not_included || [],
          gallery_images: data.gallery_images || [],
          tags: data.tags || [],
          via_stops: data.via_stops || [],
        });
      }
    } catch (err: any) {
      toast({ title: 'Fehler beim Laden', description: err.message, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [tripId, toast]);

  const updateField = useCallback(<K extends keyof WeekendTripData>(field: K, value: WeekendTripData[K]) => {
    setTrip(prev => ({ ...prev, [field]: value }));
    
    // Auto-save for existing trips
    if (tripId && field !== 'id') {
      (supabase as any)
        .from('weekend_trips')
        .update({ [field]: value })
        .eq('id', tripId)
        .then(({ error }: any) => {
          if (error) console.error('Auto-save error:', error);
        });
    }
  }, [tripId]);

  const saveTrip = useCallback(async () => {
    if (!trip.destination || !trip.slug) {
      toast({ title: 'Bitte Ziel und Slug ausfüllen', variant: 'destructive' });
      return { error: new Error('Missing fields') };
    }
    setIsSaving(true);
    try {
      const { id, ...payload } = trip as any;
      if (tripId) {
        const { error } = await (supabase as any)
          .from('weekend_trips')
          .update(payload)
          .eq('id', tripId);
        if (error) throw error;
        toast({ title: 'Wochenendtrip gespeichert' });
        return { error: null };
      } else {
        const { data, error } = await (supabase as any)
          .from('weekend_trips')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        toast({ title: 'Wochenendtrip erstellt' });
        return { data, error: null };
      }
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
      return { error: err };
    } finally {
      setIsSaving(false);
    }
  }, [trip, tripId, toast]);

  const uploadImage = useCallback(async (file: File, type: 'hero' | 'preview' | 'gallery') => {
    const sanitized = trip.destination.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const ext = file.name.split('.').pop();
    const path = `weekend-trips/${sanitized}/${type}-${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage.from('tour-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload fehlgeschlagen', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data: urlData } = supabase.storage.from('tour-images').getPublicUrl(path);
    return urlData.publicUrl;
  }, [trip.destination, toast]);

  return {
    trip, isLoading, isSaving,
    fetchTrip, saveTrip, updateField, uploadImage,
    setTrip,
  };
};
