import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'metropol_cookie_consent';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }
    setIsLoading(false);
  }, []);

  const hasAnalyticsConsent = consent?.analytics ?? false;
  const hasMarketingConsent = consent?.marketing ?? false;
  const hasNecessaryConsent = consent?.necessary ?? false;
  const hasAnyConsent = consent !== null;

  return {
    consent,
    isLoading,
    hasAnalyticsConsent,
    hasMarketingConsent,
    hasNecessaryConsent,
    hasAnyConsent,
  };
}
