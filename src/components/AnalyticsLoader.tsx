import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const CLARITY_ID = 'wbkrsuuaps';
const GA_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined;

const NO_TRACK = ['/admin', '/dispo', '/driver', '/fahrer', '/operations', '/wallboard'];

/**
 * Lädt Microsoft Clarity und Google Analytics ausschließlich, wenn der Nutzer
 * Analyse-Cookies bestätigt hat (DSGVO / TDDDG). Interne Bereiche werden nicht erfasst.
 */
export default function AnalyticsLoader() {
  const { hasAnalyticsConsent } = useCookieConsent();
  const location = useLocation();
  const w = window as any;

  useEffect(() => {
    if (!hasAnalyticsConsent) return;

    if (!w.clarity && !document.getElementById('ms-clarity-loader')) {
      const s = document.createElement('script');
      s.id = 'ms-clarity-loader';
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
      document.head.appendChild(s);
      w.clarity = w.clarity || function () {
        (w.clarity.q = w.clarity.q || []).push(arguments);
      };
    }

    if (GA_ID && !document.getElementById('ga-gtag-loader')) {
      const g = document.createElement('script');
      g.id = 'ga-gtag-loader';
      g.async = true;
      g.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(g);
      w.dataLayer = w.dataLayer || [];
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
      w.gtag('set', 'developer_id.dZjgwMW', true);
      w.gtag('js', new Date());
      w.gtag('config', GA_ID, { anonymize_ip: true, send_page_view: false });
    }
  }, [hasAnalyticsConsent]);

  useEffect(() => {
    if (!hasAnalyticsConsent || !GA_ID || !w.gtag) return;
    if (NO_TRACK.some((p) => location.pathname.startsWith(p))) return;
    w.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [hasAnalyticsConsent, location.pathname, location.search]);

  return null;
}
