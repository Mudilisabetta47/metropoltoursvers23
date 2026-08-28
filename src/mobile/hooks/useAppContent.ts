import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Inhalte der Mobile-App (Sektion "app_home" in cms_content).
 * Alles wird im Admin unter /admin/app gepflegt – im Code stehen nur Fallbacks.
 */

export const APP_HOME_SECTION = "app_home";

export interface AppHomeContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  sectionFeatured: string;
  sectionDestinations: string;
  sectionOffers: string;
  sectionAll: string;
  showFeatured: boolean;
  showDestinations: boolean;
  showOffers: boolean;
  showAll: boolean;
  bannerEnabled: boolean;
  bannerTitle: string;
  bannerText: string;
  bannerLink: string;
  footerNote: string;
}

export const APP_HOME_DEFAULTS: AppHomeContent = {
  heroTitle: "Deine nächste Reise beginnt hier.",
  heroSubtitle:
    "Handverlesene Busreisen durch Europa – komfortabel, sicher und persönlich begleitet.",
  heroImageUrl: "",
  sectionFeatured: "Empfohlene Reisen",
  sectionDestinations: "Beliebte Reiseziele",
  sectionOffers: "Aktuelle Angebote",
  sectionAll: "Alle Reisen",
  showFeatured: true,
  showDestinations: true,
  showOffers: true,
  showAll: true,
  bannerEnabled: false,
  bannerTitle: "",
  bannerText: "",
  bannerLink: "/app/reisen",
  footerNote: "ab-Preise pro Person. Endpreis inkl. Zustieg & Extras im Buchungsschritt.",
};

type MetaRecord = Record<string, unknown>;

export function parseAppHome(
  row: { title?: string | null; subtitle?: string | null; metadata?: unknown } | null,
): AppHomeContent {
  const meta = (row?.metadata ?? {}) as MetaRecord;
  const str = (key: keyof AppHomeContent, fallback: string) =>
    typeof meta[key] === "string" && (meta[key] as string).length > 0
      ? (meta[key] as string)
      : fallback;
  const bool = (key: keyof AppHomeContent, fallback: boolean) =>
    typeof meta[key] === "boolean" ? (meta[key] as boolean) : fallback;

  return {
    heroTitle: row?.title || APP_HOME_DEFAULTS.heroTitle,
    heroSubtitle: row?.subtitle || APP_HOME_DEFAULTS.heroSubtitle,
    heroImageUrl: str("heroImageUrl", APP_HOME_DEFAULTS.heroImageUrl),
    sectionFeatured: str("sectionFeatured", APP_HOME_DEFAULTS.sectionFeatured),
    sectionDestinations: str("sectionDestinations", APP_HOME_DEFAULTS.sectionDestinations),
    sectionOffers: str("sectionOffers", APP_HOME_DEFAULTS.sectionOffers),
    sectionAll: str("sectionAll", APP_HOME_DEFAULTS.sectionAll),
    showFeatured: bool("showFeatured", APP_HOME_DEFAULTS.showFeatured),
    showDestinations: bool("showDestinations", APP_HOME_DEFAULTS.showDestinations),
    showOffers: bool("showOffers", APP_HOME_DEFAULTS.showOffers),
    showAll: bool("showAll", APP_HOME_DEFAULTS.showAll),
    bannerEnabled: bool("bannerEnabled", APP_HOME_DEFAULTS.bannerEnabled),
    bannerTitle: str("bannerTitle", APP_HOME_DEFAULTS.bannerTitle),
    bannerText: str("bannerText", APP_HOME_DEFAULTS.bannerText),
    bannerLink: str("bannerLink", APP_HOME_DEFAULTS.bannerLink),
    footerNote: str("footerNote", APP_HOME_DEFAULTS.footerNote),
  };
}

export function useAppHomeContent() {
  const [content, setContent] = useState<AppHomeContent>(APP_HOME_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("cms_content")
      .select("title, subtitle, metadata, is_active")
      .eq("section_key", APP_HOME_SECTION)
      .maybeSingle();
    setContent(parseAppHome(data?.is_active === false ? null : data));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { content, isLoading, reload: load };
}
