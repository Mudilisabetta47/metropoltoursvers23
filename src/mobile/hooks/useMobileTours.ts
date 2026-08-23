import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MobileTourDate {
  id: string;
  departure_date: string;
  return_date: string | null;
  price_basic: number | null;
  total_seats: number | null;
  booked_seats: number | null;
  status: string | null;
  is_active: boolean | null;
}

export interface MobileTour {
  id: string;
  slug: string | null;
  destination: string;
  location: string | null;
  country: string | null;
  category: string | null;
  short_description: string | null;
  description: string | null;
  duration_days: number | null;
  price_from: number | null;
  hero_image_url: string | null;
  image_url: string | null;
  gallery_images: string[] | null;
  highlights: string[] | null;
  included_services: string[] | null;
  hotel_name: string | null;
  hotel_address: string | null;
  discount_percent: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  publish_status: string | null;
  documents_required: string | null;
  insurance_info: string | null;
  tour_dates?: MobileTourDate[];
}

const TOUR_FIELDS =
  "id, slug, destination, location, country, category, short_description, description, duration_days, price_from, hero_image_url, image_url, gallery_images, highlights, included_services, hotel_name, hotel_address, discount_percent, is_featured, is_active, publish_status, documents_required, insurance_info";

const DATE_FIELDS =
  "id, departure_date, return_date, price_basic, total_seats, booked_seats, status, is_active";

/** Alle aktiven Reisen inkl. kommender Termine – aus den produktiven Tabellen. */
export function useMobileTours() {
  return useQuery({
    queryKey: ["mobile", "tours"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MobileTour[]> => {
      const { data, error } = await supabase
        .from("package_tours")
        .select(`${TOUR_FIELDS}, tour_dates(${DATE_FIELDS})`)
        .eq("is_active", true)
        .order("is_featured", { ascending: false });
      if (error) throw error;

      const today = new Date().toISOString().slice(0, 10);
      return ((data ?? []) as any[]).map((t) => ({
        ...t,
        tour_dates: (t.tour_dates ?? [])
          .filter((d: MobileTourDate) => d.is_active !== false && d.departure_date >= today)
          .sort((a: MobileTourDate, b: MobileTourDate) =>
            a.departure_date.localeCompare(b.departure_date),
          ),
      })) as MobileTour[];
    },
  });
}

/** Einzelne Reise inkl. Termine, Tarife, Leistungen, Extras und Zustiegsorten. */
export function useMobileTour(tourId?: string) {
  return useQuery({
    queryKey: ["mobile", "tour", tourId],
    enabled: Boolean(tourId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tourId!);

      // Zuerst über den SEO-Slug, sonst über die UUID (bestehende Lookup-Strategie).
      let query = supabase
        .from("package_tours")
        .select(`${TOUR_FIELDS}, tour_dates(${DATE_FIELDS})`)
        .limit(1);
      query = isUuid ? query.eq("id", tourId!) : query.eq("slug", tourId!);

      let { data: tour } = await query.maybeSingle();
      if (!tour && isUuid) {
        const fallback = await supabase
          .from("package_tours")
          .select(`${TOUR_FIELDS}, tour_dates(${DATE_FIELDS})`)
          .eq("slug", tourId!)
          .maybeSingle();
        tour = fallback.data;
      }
      if (!tour) return null;

      const id = (tour as any).id as string;
      const today = new Date().toISOString().slice(0, 10);

      const [inclusions, tariffs, extras, routes] = await Promise.all([
        supabase
          .from("tour_inclusions")
          .select("id, icon, title, description, category, sort_order")
          .eq("tour_id", id)
          .order("sort_order"),
        supabase
          .from("tour_tariffs")
          .select("id, name, price_modifier, included_features, is_recommended, sort_order")
          .eq("tour_id", id)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("tour_extras")
          .select("id, name, description, price, price_type, category, icon, sort_order")
          .eq("tour_id", id)
          .eq("is_active", true)
          .order("sort_order"),
        supabase.from("tour_routes").select("id").eq("tour_id", id),
      ]);

      const routeIds = (routes.data ?? []).map((r: any) => r.id);
      const pickups = routeIds.length
        ? await supabase
            .from("tour_pickup_stops")
            .select("id, city, location_name, address, meeting_point, departure_time, surcharge, sort_order")
            .in("route_id", routeIds)
            .eq("is_active", true)
            .order("sort_order")
        : { data: [] as any[] };

      return {
        ...(tour as any),
        tour_dates: ((tour as any).tour_dates ?? [])
          .filter((d: MobileTourDate) => d.is_active !== false && d.departure_date >= today)
          .sort((a: MobileTourDate, b: MobileTourDate) =>
            a.departure_date.localeCompare(b.departure_date),
          ),
        inclusions: inclusions.data ?? [],
        tariffs: tariffs.data ?? [],
        extras: extras.data ?? [],
        pickups: pickups.data ?? [],
      } as MobileTour & {
        inclusions: any[];
        tariffs: any[];
        extras: any[];
        pickups: any[];
      };
    },
  });
}

export const seatsLeft = (d?: MobileTourDate | null): number | null => {
  if (!d || d.total_seats == null) return null;
  return Math.max(0, d.total_seats - (d.booked_seats ?? 0));
};
