import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PackageTour {
  id: string;
  destination: string;
  location: string;
  country: string;
  duration_days: number;
  price_from: number;
  image_url: string | null;
  highlights: string[];
  description: string | null;
  itinerary: unknown[];
  included_services: string[];
  departure_date: string;
  return_date: string;
  max_participants: number;
  current_participants: number;
  is_featured: boolean;
  is_active: boolean;
  discount_percent: number;
  created_at: string;
  updated_at: string;
  // Extended fields (optional for backward compatibility)
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  hero_image_url?: string | null;
  gallery_images?: string[];
  short_description?: string | null;
  category?: string | null;
  tags?: string[];
  insurance_info?: string | null;
  documents_required?: string | null;
  min_participants?: number;
  published_at?: string | null;
  publish_status?: 'draft' | 'published' | 'archived';
}

export interface ServiceType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  highlight: string | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CMSContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePackageTours = (featuredOnly = false) => {
  const [tours, setTours] = useState<PackageTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from('package_tours')
          .select('*')
          .eq('is_active', true)
          .order('departure_date', { ascending: true });

        if (featuredOnly) {
          query = query.eq('is_featured', true);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setTours((data as PackageTour[]) || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, [featuredOnly]);

  return { tours, isLoading, error };
};

export const usePackageTour = (destination: string) => {
  const [tour, setTour] = useState<PackageTour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('package_tours')
          .select('*')
          .ilike('destination', destination)
          .eq('is_active', true)
          .single();

        if (fetchError) throw fetchError;
        setTour(data as PackageTour);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (destination) {
      fetchTour();
    }
  }, [destination]);

  return { tour, isLoading, error };
};

export const useServiceTypes = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('service_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) throw fetchError;
        setServices((data as ServiceType[]) || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, isLoading, error };
};

export const useCMSContent = (sectionKey?: string) => {
  const [content, setContent] = useState<CMSContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from('cms_content')
          .select('*')
          .eq('is_active', true);

        if (sectionKey) {
          query = query.eq('section_key', sectionKey);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setContent((data as CMSContent[]) || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [sectionKey]);

  const getContent = (key: string) => content.find(c => c.section_key === key);

  return { content, getContent, isLoading, error };
};

// Admin functions for CRUD operations
export const useAdminTours = () => {
  const [tours, setTours] = useState<PackageTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('package_tours')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTours(data as PackageTour[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createTour = async (tour: Omit<PackageTour, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('package_tours')
      .insert(tour as never)
      .select()
      .single();
    
    if (!error) {
      await fetchAll();
    }
    return { data, error };
  };

  const updateTour = async (id: string, updates: Partial<PackageTour>) => {
    const { data, error } = await supabase
      .from('package_tours')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      await fetchAll();
    }
    return { data, error };
  };

  const deleteTour = async (id: string) => {
    const { error } = await supabase
      .from('package_tours')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await fetchAll();
    }
    return { error };
  };

  return { tours, isLoading, fetchAll, createTour, updateTour, deleteTour };
};

export const useAdminServices = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setServices(data as ServiceType[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createService = async (service: Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('service_types')
      .insert(service as never)
      .select()
      .single();
    
    if (!error) {
      await fetchAll();
    }
    return { data, error };
  };

  const updateService = async (id: string, updates: Partial<ServiceType>) => {
    const { data, error } = await supabase
      .from('service_types')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      await fetchAll();
    }
    return { data, error };
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await fetchAll();
    }
    return { error };
  };

  return { services, isLoading, fetchAll, createService, updateService, deleteService };
};

export const useAdminContent = () => {
  const [content, setContent] = useState<CMSContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('cms_content')
      .select('*')
      .order('section_key', { ascending: true });

    if (!error && data) {
      setContent(data as CMSContent[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const upsertContent = async (sectionKey: string, updates: Partial<CMSContent>) => {
    const existing = content.find(c => c.section_key === sectionKey);
    
    if (existing) {
      const { data, error } = await supabase
        .from('cms_content')
        .update(updates as never)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (!error) {
        await fetchAll();
      }
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('cms_content')
        .insert({ section_key: sectionKey, ...updates } as never)
        .select()
        .single();
      
      if (!error) {
        await fetchAll();
      }
      return { data, error };
    }
  };

  return { content, isLoading, fetchAll, upsertContent };
};
