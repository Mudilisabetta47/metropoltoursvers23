import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogoLight } from "@/components/brand/Logo";

// Typed wrapper around the beta supabase.auth.oauth namespace so TS is happy.
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(
        authorizationId,
      );
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0f1218] text-white p-6">
        <div className="max-w-md w-full space-y-4">
          <LogoLight />
          <h1 className="text-2xl font-semibold">Autorisierung fehlgeschlagen</h1>
          <p className="text-white/70">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0f1218] text-white">
        <p>Lädt…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "Diese Anwendung";

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f1218] text-white p-6">
      <div className="max-w-md w-full space-y-6 bg-white/5 border border-white/10 rounded-2xl p-8">
        <LogoLight />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {clientName} mit deinem Konto verbinden
          </h1>
          <p className="text-white/70">
            {clientName} erhält Zugriff auf METROPOL TOURS in deinem Namen und
            kann die freigegebenen Tools nutzen.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 bg-[#00CC36] hover:bg-[#00b530] text-black"
          >
            Zulassen
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(false)}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Ablehnen
          </Button>
        </div>
      </div>
    </main>
  );
}
