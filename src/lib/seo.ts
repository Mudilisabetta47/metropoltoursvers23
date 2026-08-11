/**
 * Zentrale SEO-Konstanten für die öffentliche METROPOL TOURS Website.
 * Es werden ausschließlich real vorhandene Unternehmensdaten verwendet
 * (siehe Impressum / Footer) – keine erfundenen Angaben.
 */

export const SITE_URL = "https://www.metours.de";
export const SITE_NAME = "METROPOL TOURS";
export const BRAND_SUFFIX = " | Metropol Tours";

export const COMPANY = {
  legalName: "METROPOL TOURS GmbH",
  email: "info@metours.de",
  phone: "+49 511 80781106",
  city: "Hannover",
  country: "DE",
} as const;

/** Absolute URL für canonical / og:url erzeugen. */
export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL + "/";
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
};

/** Titel mit Marken-Suffix, sofern nicht bereits enthalten. */
export const withBrand = (title: string): string =>
  /metropol tours/i.test(title) ? title : `${title}${BRAND_SUFFIX}`;

/** Organisation / Reiseveranstalter – nur belegte Daten. */
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: COMPANY.legalName,
  url: SITE_URL,
  email: COMPANY.email,
  telephone: COMPANY.phone,
  address: {
    "@type": "PostalAddress",
    addressLocality: COMPANY.city,
    addressCountry: COMPANY.country,
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: COMPANY.phone,
    email: COMPANY.email,
    contactType: "customer service",
    availableLanguage: ["German", "English"],
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "de-DE",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export interface Crumb {
  name: string;
  path: string;
}

export const breadcrumbJsonLd = (crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path),
  })),
});

export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a },
  })),
});
