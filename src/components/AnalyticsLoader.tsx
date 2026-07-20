import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const CLARITY_ID = 'wbkrsuuaps';

/**
 * Lädt Microsoft Clarity ausschließlich, wenn der Nutzer Analyse-Cookies
 * bestätigt hat. Verhindert eine Ladung vor Consent (DSGVO / TDDDG).
 */
export default function AnalyticsLoader() {
  const { hasAnalyticsConsent } = useCookieConsent();

  useEffect(() => {
    if (!hasAnalyticsConsent) return;
    if (typeof window === 'undefined') return;
    if ((window as any).clarity) return;
    if (document.getElementById('ms-clarity-loader')) return;

    const s = document.createElement('script');
    s.id = 'ms-clarity-loader';
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
    document.head.appendChild(s);

    (window as any).clarity = (window as any).clarity || function () {
      ((window as any).clarity.q = (window as any).clarity.q || []).push(arguments);
    };
  }, [hasAnalyticsConsent]);

  return null;
}
