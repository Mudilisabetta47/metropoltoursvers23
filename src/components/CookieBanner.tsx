import { useState, useEffect } from 'react';
import { X, Settings, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'metropol_cookie_consent';

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = {
      ...newConsent,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: ''
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: ''
    });
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl bg-card rounded-2xl shadow-elevated border border-border animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Cookie-Einstellungen</h3>
              <p className="text-sm text-muted-foreground">Wir respektieren Ihre Privatsphäre</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!showSettings ? (
            <p className="text-sm text-muted-foreground mb-4">
              Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. 
              Einige Cookies sind notwendig für den Betrieb der Website, während andere uns 
              helfen, die Website zu analysieren und zu verbessern.{' '}
              <a href="/privacy" className="text-primary hover:underline">Mehr erfahren</a>
            </p>
          ) : (
            <div className="space-y-4 mb-4">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Notwendige Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Diese Cookies sind für den Betrieb der Website erforderlich.
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Analyse-Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Helfen uns zu verstehen, wie Besucher die Website nutzen.
                  </p>
                </div>
                <Switch 
                  checked={consent.analytics} 
                  onCheckedChange={(checked) => setConsent({ ...consent, analytics: checked })}
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Marketing-Cookies</Label>
                  <p className="text-sm text-muted-foreground">
                    Werden verwendet, um relevante Werbung anzuzeigen.
                  </p>
                </div>
                <Switch 
                  checked={consent.marketing} 
                  onCheckedChange={(checked) => setConsent({ ...consent, marketing: checked })}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!showSettings ? (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleRejectAll}
                >
                  Ablehnen
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Einstellungen
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleAcceptAll}
                >
                  Alle akzeptieren
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowSettings(false)}
                >
                  Zurück
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSaveSettings}
                >
                  Einstellungen speichern
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a function to open cookie settings from anywhere
export function openCookieSettings() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.location.reload();
}
