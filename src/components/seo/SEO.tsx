import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { absoluteUrl, SITE_NAME, withBrand } from "@/lib/seo";

interface SEOProps {
  /** Seitentitel ohne Marke – die Marke wird automatisch angehängt. */
  title: string;
  description: string;
  /** Pfad der Seite, z. B. "/busreisen". Wird zu canonical + og:url. */
  path: string;
  /** Absolute Bild-URL für Social Previews (optional). */
  image?: string | null;
  /** true → Seite wird nicht indexiert. */
  noindex?: boolean;
  type?: "website" | "article";
  /** JSON-LD Objekte (Breadcrumb, FAQ, TouristTrip …). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

/**
 * Setzt Titel, Meta-Description, Canonical und Open-Graph/Twitter-Daten
 * für eine öffentliche Seite. Die robots-Angabe wird direkt am bestehenden
 * Tag gesetzt (gleiche Quelle wie NoIndexRoutes), damit es keine doppelten
 * robots-Meta-Tags gibt.
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
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  useEffect(() => {
    const tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!tag) return;
    tag.setAttribute("content", noindex ? "noindex, follow" : DEFAULT_ROBOTS);
  }, [noindex, path]);

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={url} />
      {image ? <meta name="twitter:image" content={image} /> : null}

      {schemas.map((schema, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
