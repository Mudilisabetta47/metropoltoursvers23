import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Zentrale Hooks für backend-gepflegte Inhalte (CMS).
 * Kein Inhalt darf im Frontend hart codiert sein – nur Fallbacks,
 * damit das Layout auch ohne Datenbankeintrag stabil bleibt.
 */

export interface SiteSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
}

export interface MediaItem {
  id: string;
  file_name: string;
  url: string;
  storage_path: string | null;
  title: string | null;
  alt_text: string | null;
  category: string;
  sort_order: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export const MEDIA_BUCKET = "tour-images";
export const MEDIA_PREFIX = "cms";

/** Einzelne Sektion (z. B. "app_hero", "site_contact") laden. */
export function useSiteSection(sectionKey: string) {
  const [section, setSection] = useState<SiteSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("cms_content")
      .select("*")
      .eq("section_key", sectionKey)
      .eq("is_active", true)
      .maybeSingle();
    setSection((data as SiteSection) ?? null);
    setIsLoading(false);
  }, [sectionKey]);

  useEffect(() => {
    load();
  }, [load]);

  const meta = (section?.metadata ?? {}) as Record<string, unknown>;
  const metaString = (key: string, fallback = "") =>
    typeof meta[key] === "string" && meta[key] ? (meta[key] as string) : fallback;

  return { section, meta, metaString, isLoading, reload: load };
}

/** Kontaktdaten aus dem Backend (mit sicheren Fallbacks). */
export function useContactInfo() {
  const { metaString, isLoading } = useSiteSection("site_contact");
  return {
    isLoading,
    phone: metaString("phone", "+49 511 80781106"),
    email: metaString("email", "kundenservice@metours.de"),
    address: metaString("address", "Hannover, Deutschland"),
    openingHours: metaString("opening_hours", "Mo–Fr: 8–20 Uhr, Sa–So: geschlossen"),
    instagram: metaString("instagram", "https://instagram.com/metropoltours"),
    facebook: metaString("facebook", "https://facebook.com/metropoltours"),
    tiktok: metaString("tiktok", ""),
    youtube: metaString("youtube", "https://youtube.com/metropoltours"),
  };
}

/** FAQ-Einträge (öffentlich, nur aktive). */
export function useFaqs(category?: string) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let query = supabase
        .from("cms_faq")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (category) query = query.eq("category", category);
      const { data } = await query;
      setFaqs((data as FaqItem[]) ?? []);
      setIsLoading(false);
    })();
  }, [category]);

  return { faqs, isLoading };
}

/** Medienbibliothek inkl. Upload/Löschen für das Admin-Backend. */
export function useMediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("cms_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setMedia((data as MediaItem[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = useCallback(
    async (file: File, category = "allgemein", title?: string) => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${MEDIA_PREFIX}/${category}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) return { error: uploadError };

      const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      const { error } = await supabase.from("cms_media").insert({
        file_name: file.name,
        url: pub.publicUrl,
        storage_path: path,
        title: title || file.name,
        category,
      } as never);
      if (!error) await load();
      return { error };
    },
    [load],
  );

  const update = useCallback(
    async (id: string, updates: Partial<MediaItem>) => {
      const { error } = await supabase.from("cms_media").update(updates as never).eq("id", id);
      if (!error) await load();
      return { error };
    },
    [load],
  );

  const remove = useCallback(
    async (item: MediaItem) => {
      if (item.storage_path) {
        await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
      }
      const { error } = await supabase.from("cms_media").delete().eq("id", item.id);
      if (!error) await load();
      return { error };
    },
    [load],
  );

  return { media, isLoading, reload: load, upload, update, remove };
}

/** Admin-Helfer: Sektion speichern (Upsert über section_key). */
export async function saveSection(
  sectionKey: string,
  values: { title?: string | null; subtitle?: string | null; content?: string | null; metadata?: Record<string, unknown> },
) {
  const { data: existing } = await supabase
    .from("cms_content")
    .select("id")
    .eq("section_key", sectionKey)
    .maybeSingle();

  if (existing?.id) {
    return supabase.from("cms_content").update(values as never).eq("id", existing.id);
  }
  return supabase.from("cms_content").insert({ section_key: sectionKey, is_active: true, ...values } as never);
}
