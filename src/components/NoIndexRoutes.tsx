import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Bereiche, die komplett aus dem Index gehalten werden (Prefix-Match). */
const NOINDEX_PREFIXES = [
  '/admin',
  '/driver',
  '/fahrer',
  '/operations',
  '/wallboard',
  '/checkout',
  '/tour-checkout',
  '/reisen/checkout',
  '/bookings',
  '/track/',
  '/reset-password',
  '/auth',
  '/passagierdaten',
  '/verfolge',
  '/oauth',
  '/.lovable',
];

/** Einzelne Seiten ohne eigenständigen Indexierungswert (exakter Match). */
const NOINDEX_EXACT = ['/search'];

const ROBOTS_META_ID = 'robots-dynamic';
const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/**
 * Setzt <meta name="robots" content="noindex, nofollow"> für private/interne
 * Routen. Verhindert, dass Checkout, Login, Admin & Tracking-Seiten in
 * Suchmaschinen auftauchen.
 *
 * Hinweis: Öffentliche Seiten können den Wert über die SEO-Komponente
 * überschreiben (deren Effekt läuft nach diesem hier).
 */
export default function NoIndexRoutes() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const shouldNoIndex =
      NOINDEX_PREFIXES.some((p) => path.startsWith(p)) ||
      NOINDEX_EXACT.includes(path.replace(/\/$/, '') || '/');

    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      tag.id = ROBOTS_META_ID;
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', shouldNoIndex ? 'noindex, nofollow' : DEFAULT_ROBOTS);
  }, [location.pathname]);

  return null;
}
