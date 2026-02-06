import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for Tour Builder
export interface TourTariff {
  id: string;
  tour_id: string;
  name: string;
  slug: string;
  sort_order: number;
  price_modifier: number;
  hand_luggage_only: boolean;
  suitcase_included: boolean;
  suitcase_weight_kg: number | null;
  seat_reservation: boolean;
  is_refundable: boolean;
  cancellation_days: number | null;
  cancellation_fee_percent: number | null;
  included_features: string[];
  is_recommended: boolean;
  is_active: boolean;
}

export interface TourDate {
  id: string;
  tour_id: string;
  departure_date: string;
  return_date: string;
  duration_days: number;
  price_basic: number;
  price_smart: number | null;
  price_flex: number | null;
  price_business: number | null;
  total_seats: number;
  booked_seats: number;
  status: 'available' | 'limited' | 'soldout' | 'on_request' | 'cancelled';
  early_bird_discount_percent: number;
  early_bird_deadline: string | null;
  promo_code: string | null;
  promo_discount_percent: number;
  notes: string | null;
  is_active: boolean;
}

export interface TourRoute {
  id: string;
  tour_id: string;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  pickup_stops?: TourPickupStop[];
}

export interface TourPickupStop {
  id: string;
  route_id: string;
  city: string;
  location_name: string;
  address: string | null;
  meeting_point: string | null;
  departure_time: string;
  arrival_offset_minutes: number;
  surcharge: number;
  max_passengers: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface TourLuggageAddon {
  id: string;
  tour_id: string;
  name: string;
  description: string | null;
  price: number;
  max_per_booking: number;
  weight_limit_kg: number | null;
  is_active: boolean;
}

export interface TourInclusion {
  id: string;
  tour_id: string;
  icon: string;
  title: string;
  description: string | null;
  category: 'included' | 'excluded' | 'hint';
  sort_order: number;
}

export interface TourLegal {
  id: string;
  tour_id: string;
  section_key: string;
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
}

export interface ExtendedPackageTour {
  id: string;
  destination: string;
  location: string;
  country: string;
  duration_days: number;
  price_from: number;
  image_url: string | null;
  hero_image_url?: string | null;
  gallery_images?: string[];
  highlights: string[] | null;
  description: string | null;
  short_description?: string | null;
  itinerary: unknown[] | null;
  included_services: string[] | null;
  departure_date: string;
  return_date: string;
  max_participants: number | null;
  current_participants: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  discount_percent: number | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  category?: string | null;
  tags?: string[];
  insurance_info?: string | null;
  documents_required?: string | null;
  min_participants?: number | null;
  published_at?: string | null;
  publish_status?: string | null;
  created_at: string;
  updated_at: string;
}

// Default tariff templates
export const DEFAULT_TARIFFS: Omit<TourTariff, 'id' | 'tour_id'>[] = [
  {
    name: 'Basic',
    slug: 'basic',
    sort_order: 0,
    price_modifier: 0,
    hand_luggage_only: true,
    suitcase_included: false,
    suitcase_weight_kg: null,
    seat_reservation: false,
    is_refundable: false,
    cancellation_days: null,
    cancellation_fee_percent: 100,
    included_features: ['Handgepäck bis 8kg', 'Standard-Sitzplatz'],
    is_recommended: false,
    is_active: true,
  },
  {
    name: 'Smart',
    slug: 'smart',
    sort_order: 1,
    price_modifier: 0,
    hand_luggage_only: false,
    suitcase_included: true,
    suitcase_weight_kg: 20,
    seat_reservation: false,
    is_refundable: false,
    cancellation_days: null,
    cancellation_fee_percent: 80,
    included_features: ['Handgepäck bis 8kg', '1 Koffer bis 20kg', 'Standard-Sitzplatz'],
    is_recommended: true,
    is_active: true,
  },
  {
    name: 'Flex',
    slug: 'flex',
    sort_order: 2,
    price_modifier: 0,
    hand_luggage_only: false,
    suitcase_included: true,
    suitcase_weight_kg: 23,
    seat_reservation: false,
    is_refundable: true,
    cancellation_days: 7,
    cancellation_fee_percent: 50,
    included_features: ['Handgepäck bis 8kg', '1 Koffer bis 23kg', 'Umbuchung möglich', 'Teilerstattung bis 7 Tage vorher'],
    is_recommended: false,
    is_active: true,
  },
  {
    name: 'Business',
    slug: 'business',
    sort_order: 3,
    price_modifier: 0,
    hand_luggage_only: false,
    suitcase_included: true,
    suitcase_weight_kg: 23,
    seat_reservation: true,
    is_refundable: true,
    cancellation_days: 1,
    cancellation_fee_percent: 0,
    included_features: ['Handgepäck bis 8kg', '1 Koffer bis 23kg', 'Sitzplatzreservierung', 'Kostenlose Stornierung bis 1 Tag vorher', 'Priority Check-in'],
    is_recommended: false,
    is_active: true,
  },
];

// Hook for managing a single tour with all related data
export function useTourBuilder(tourId?: string) {
  const { toast } = useToast();
  const [tour, setTour] = useState<ExtendedPackageTour | null>(null);
  const [tariffs, setTariffs] = useState<TourTariff[]>([]);
  const [dates, setDates] = useState<TourDate[]>([]);
  const [routes, setRoutes] = useState<TourRoute[]>([]);
  const [luggageAddons, setLuggageAddons] = useState<TourLuggageAddon[]>([]);
  const [inclusions, setInclusions] = useState<TourInclusion[]>([]);
  const [legal, setLegal] = useState<TourLegal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all tour data
  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    setIsLoading(true);

    try {
      // Fetch main tour data
      const { data: tourData, error: tourError } = await supabase
        .from('package_tours')
        .select('*')
        .eq('id', tourId)
        .single();

      if (tourError) throw tourError;
      setTour(tourData as unknown as ExtendedPackageTour);

      // Fetch related data using explicit any cast since tables may not be in types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      
      const [t, d, r, l, i, lg] = await Promise.all([
        client.from('tour_tariffs').select('*').eq('tour_id', tourId).order('sort_order'),
        client.from('tour_dates').select('*').eq('tour_id', tourId).order('departure_date'),
        client.from('tour_routes').select('*').eq('tour_id', tourId).order('sort_order'),
        client.from('tour_luggage_addons').select('*').eq('tour_id', tourId),
        client.from('tour_inclusions').select('*').eq('tour_id', tourId).order('sort_order'),
        client.from('tour_legal').select('*').eq('tour_id', tourId).order('sort_order'),
      ]);

      setTariffs((t.data || []) as TourTariff[]);
      setDates((d.data || []) as TourDate[]);
      setRoutes((r.data || []) as TourRoute[]);
      setLuggageAddons((l.data || []) as TourLuggageAddon[]);
      setInclusions((i.data || []) as TourInclusion[]);
      setLegal((lg.data || []) as TourLegal[]);

      // Fetch pickup stops for each route
      if (r.data && r.data.length > 0) {
        const routeIds = (r.data as TourRoute[]).map(route => route.id);
        const { data: stopsData } = await client
          .from('tour_pickup_stops')
          .select('*')
          .in('route_id', routeIds)
          .order('sort_order');

        if (stopsData) {
          const routesWithStops = (r.data as TourRoute[]).map(route => ({
            ...route,
            pickup_stops: (stopsData as TourPickupStop[]).filter(stop => stop.route_id === route.id),
          }));
          setRoutes(routesWithStops);
        }
      }
    } catch (error) {
      console.error('Error fetching tour:', error);
      toast({ title: 'Fehler beim Laden der Reise', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    if (tourId) {
      fetchTour();
    }
  }, [tourId, fetchTour]);

  // Save tour basic info
  const saveTour = async (updates: Partial<ExtendedPackageTour>) => {
    if (!tourId) return { error: new Error('No tour ID') };
    setIsSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('package_tours')
        .update(updates)
        .eq('id', tourId);

      if (error) throw error;
      
      setTour(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      console.error('Error saving tour:', error);
      return { error };
    } finally {
      setIsSaving(false);
    }
  };

  // Create new tour with default tariffs
  const createTour = async (tourData: Partial<ExtendedPackageTour>) => {
    setIsSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;

    try {
      // Create the tour
      const { data: newTour, error: tourError } = await client
        .from('package_tours')
        .insert({
          destination: tourData.destination || 'Neue Reise',
          location: tourData.location || '',
          country: tourData.country || 'Europa',
          duration_days: tourData.duration_days || 7,
          price_from: tourData.price_from || 299,
          departure_date: tourData.departure_date || new Date().toISOString().split('T')[0],
          return_date: tourData.return_date || new Date().toISOString().split('T')[0],
          max_participants: tourData.max_participants || 45,
          is_active: false,
          publish_status: 'draft',
        })
        .select()
        .single();

      if (tourError) throw tourError;

      // Create default tariffs
      const tariffsToInsert = DEFAULT_TARIFFS.map(tariff => ({
        ...tariff,
        tour_id: newTour.id,
      }));

      await client.from('tour_tariffs').insert(tariffsToInsert);

      // Create default luggage addon
      await client.from('tour_luggage_addons').insert({
        tour_id: newTour.id,
        name: 'Zusatzkoffer',
        description: 'Zusätzlicher Koffer bis 23kg',
        price: 25,
        max_per_booking: 2,
        weight_limit_kg: 23,
      });

      return { data: newTour, error: null };
    } catch (error) {
      console.error('Error creating tour:', error);
      return { data: null, error };
    } finally {
      setIsSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  // Tariff operations
  const saveTariff = async (tariff: Partial<TourTariff> & { id?: string }) => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      if (tariff.id) {
        const { error } = await client.from('tour_tariffs').update(tariff).eq('id', tariff.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_tariffs').insert({ ...tariff, tour_id: tourId });
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Date operations
  const saveDate = async (dateData: Partial<TourDate> & { id?: string }) => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      if (dateData.id) {
        const { error } = await client.from('tour_dates').update(dateData).eq('id', dateData.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_dates').insert({ ...dateData, tour_id: tourId });
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteDate = async (dateId: string) => {
    try {
      const { error } = await client.from('tour_dates').delete().eq('id', dateId);
      if (error) throw error;
      setDates(prev => prev.filter(d => d.id !== dateId));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Route operations
  const saveRoute = async (route: Partial<TourRoute> & { id?: string }) => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      if (route.id) {
        const { error } = await client.from('tour_routes').update(route).eq('id', route.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_routes').insert({ ...route, tour_id: tourId });
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      const { error } = await client.from('tour_routes').delete().eq('id', routeId);
      if (error) throw error;
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Pickup stop operations
  const savePickupStop = async (stop: Partial<TourPickupStop> & { id?: string; route_id: string }) => {
    try {
      if (stop.id) {
        const { error } = await client.from('tour_pickup_stops').update(stop).eq('id', stop.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_pickup_stops').insert(stop);
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deletePickupStop = async (stopId: string) => {
    try {
      const { error } = await client.from('tour_pickup_stops').delete().eq('id', stopId);
      if (error) throw error;
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Luggage addon operations
  const saveLuggageAddon = async (addon: Partial<TourLuggageAddon> & { id?: string }) => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      if (addon.id) {
        const { error } = await client.from('tour_luggage_addons').update(addon).eq('id', addon.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_luggage_addons').insert({ ...addon, tour_id: tourId });
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Inclusion operations
  const saveInclusion = async (inclusion: Partial<TourInclusion> & { id?: string }) => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      if (inclusion.id) {
        const { error } = await client.from('tour_inclusions').update(inclusion).eq('id', inclusion.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_inclusions').insert({ ...inclusion, tour_id: tourId });
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteInclusion = async (inclusionId: string) => {
    try {
      const { error } = await client.from('tour_inclusions').delete().eq('id', inclusionId);
      if (error) throw error;
      setInclusions(prev => prev.filter(i => i.id !== inclusionId));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Legal section operations
  const saveLegal = async (legalSection: Partial<TourLegal> & { id?: string }) => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      if (legalSection.id) {
        const { error } = await client.from('tour_legal').update(legalSection).eq('id', legalSection.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('tour_legal').insert({ ...legalSection, tour_id: tourId });
        if (error) throw error;
      }
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteLegal = async (legalId: string) => {
    try {
      const { error } = await client.from('tour_legal').delete().eq('id', legalId);
      if (error) throw error;
      setLegal(prev => prev.filter(l => l.id !== legalId));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Publish tour
  const publishTour = async () => {
    if (!tourId || !tour) return { error: new Error('No tour') };

    // Validation
    const errors: string[] = [];
    if (!tour.destination) errors.push('Reiseziel fehlt');
    if (!tour.hero_image_url && !tour.image_url) errors.push('Hero-Bild fehlt');
    if (dates.length === 0) errors.push('Mindestens ein Termin erforderlich');
    if (tariffs.length === 0) errors.push('Tarife fehlen');
    if (routes.length === 0) errors.push('Mindestens eine Route erforderlich');
    if (legal.length === 0) errors.push('Rechtliche Hinweise fehlen');

    if (errors.length > 0) {
      return { error: new Error(errors.join(', ')) };
    }

    // Generate slug if missing
    const slug = tour.slug || tour.destination.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Calculate lowest price
    const lowestPrice = dates.length > 0 
      ? Math.min(...dates.map(d => d.price_basic))
      : tour.price_from;

    try {
      const { error } = await client
        .from('package_tours')
        .update({
          slug,
          publish_status: 'published',
          published_at: new Date().toISOString(),
          is_active: true,
          price_from: lowestPrice,
        })
        .eq('id', tourId);

      if (error) throw error;
      
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Unpublish tour
  const unpublishTour = async () => {
    if (!tourId) return { error: new Error('No tour ID') };

    try {
      const { error } = await client
        .from('package_tours')
        .update({
          publish_status: 'draft',
          is_active: false,
        })
        .eq('id', tourId);

      if (error) throw error;
      
      await fetchTour();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    tour,
    tariffs,
    dates,
    routes,
    luggageAddons,
    inclusions,
    legal,
    isLoading,
    isSaving,
    fetchTour,
    saveTour,
    createTour,
    saveTariff,
    saveDate,
    deleteDate,
    saveRoute,
    deleteRoute,
    savePickupStop,
    deletePickupStop,
    saveLuggageAddon,
    saveInclusion,
    deleteInclusion,
    saveLegal,
    deleteLegal,
    publishTour,
    unpublishTour,
  };
}

// Hook for fetching published tours for the frontend
export function usePublishedTours() {
  const [tours, setTours] = useState<ExtendedPackageTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      const { data, error } = await supabase
        .from('package_tours')
        .select('*')
        .eq('is_active', true)
        .order('departure_date');

      if (!error && data) {
        setTours(data as unknown as ExtendedPackageTour[]);
      }
      setIsLoading(false);
    };

    fetchTours();
  }, []);

  return { tours, isLoading };
}

// Hook for fetching a single tour with all details by slug
export function useTourBySlug(slug: string) {
  const [tour, setTour] = useState<ExtendedPackageTour | null>(null);
  const [tariffs, setTariffs] = useState<TourTariff[]>([]);
  const [dates, setDates] = useState<TourDate[]>([]);
  const [routes, setRoutes] = useState<TourRoute[]>([]);
  const [luggageAddons, setLuggageAddons] = useState<TourLuggageAddon[]>([]);
  const [inclusions, setInclusions] = useState<TourInclusion[]>([]);
  const [legal, setLegal] = useState<TourLegal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTourData = async () => {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;

      try {
        // Try to find by destination (lowercased) for backwards compatibility
        const { data: tourData, error: tourError } = await supabase
          .from('package_tours')
          .select('*')
          .ilike('destination', slug.replace(/-/g, '%'))
          .single();

        if (tourError || !tourData) {
          setError('Reise nicht gefunden');
          setIsLoading(false);
          return;
        }

        setTour(tourData as unknown as ExtendedPackageTour);

        // Fetch related data
        const tourId = tourData.id;
        const [t, d, r, l, i, lg] = await Promise.all([
          client.from('tour_tariffs').select('*').eq('tour_id', tourId).eq('is_active', true).order('sort_order'),
          client.from('tour_dates').select('*').eq('tour_id', tourId).eq('is_active', true).gte('departure_date', new Date().toISOString().split('T')[0]).order('departure_date'),
          client.from('tour_routes').select('*').eq('tour_id', tourId).eq('is_active', true).order('sort_order'),
          client.from('tour_luggage_addons').select('*').eq('tour_id', tourId).eq('is_active', true),
          client.from('tour_inclusions').select('*').eq('tour_id', tourId).order('sort_order'),
          client.from('tour_legal').select('*').eq('tour_id', tourId).eq('is_active', true).order('sort_order'),
        ]);

        setTariffs((t.data || []) as TourTariff[]);
        setDates((d.data || []) as TourDate[]);
        setLuggageAddons((l.data || []) as TourLuggageAddon[]);
        setInclusions((i.data || []) as TourInclusion[]);
        setLegal((lg.data || []) as TourLegal[]);

        // Fetch pickup stops for routes
        if (r.data && r.data.length > 0) {
          const routeIds = (r.data as TourRoute[]).map(route => route.id);
          const { data: stopsData } = await client
            .from('tour_pickup_stops')
            .select('*')
            .in('route_id', routeIds)
            .eq('is_active', true)
            .order('sort_order');

          const routesWithStops = (r.data as TourRoute[]).map(route => ({
            ...route,
            pickup_stops: ((stopsData || []) as TourPickupStop[]).filter(stop => stop.route_id === route.id),
          }));
          setRoutes(routesWithStops);
        } else {
          setRoutes([]);
        }
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Fehler beim Laden der Reise');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTourData();
  }, [slug]);

  return {
    tour,
    tariffs,
    dates,
    routes,
    luggageAddons,
    inclusions,
    legal,
    isLoading,
    error,
  };
}
