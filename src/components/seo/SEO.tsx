import { useEffect } from "react";
import { absoluteUrl, SITE_NAME, withBrand } from "@/lib/seo";

interface SEOProps {
  /** Seitentitel ohne Marke – die Marke wird automatisch angehängt. */
  title: string;
  description: string;
  /** Pfad der Seite, z. B. "/busreisen". Wird zu canonical + og:url. */
  path: string;
  /** Bild-URL für Social Previews (optional). */
  image?: string | null;
  /** true → Seite wird nicht indexiert. */
  noindex?: boolean;
  type?: "website" | "article";
  /** JSON-LD Objekte (Organization, Breadcrumb, FAQ …). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const LD_ID = "seo-jsonld";

const upsertMeta = (key: "name" | "property", value: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const removeMeta = (key: "name" | "property", value: string) => {
  document.head.querySelector(`meta[${key}="${value}"]`)?.remove();
};

/**
 * Setzt Titel, Meta-Description, Canonical, Open-Graph/Twitter-Daten und
 * JSON-LD für eine öffentliche Seite.
 *
 * Bewusst imperativ statt über Helmet: die statischen Tags aus index.html
 * werden direkt aktualisiert, damit im <head> keine doppelten
 * description-/og-/robots-Tags entstehen.
 */
export default function SEO({
  title,
  description,
  path,
  image,
  noindex = false,
  type = "website",
  jsonLd,
}: SEOProps) {
  const fullTitle = withBrand(title);
  const url = absoluteUrl(path);
  const absImage = image ? absoluteUrl(image) : null;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const schemaKey = JSON.stringify(schemas);

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, follow" : DEFAULT_ROBOTS);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "de_DE");
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:url", url);

    if (absImage) {
      upsertMeta("property", "og:image", absImage);
      upsertMeta("name", "twitter:image", absImage);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    document.getElementById(LD_ID)?.remove();
    if (schemas.length > 0) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = LD_ID;
      script.text = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(LD_ID)?.remove();
    };
  }, [fullTitle, description, url, absImage, noindex, type, schemaKey]);

  return null;
}
