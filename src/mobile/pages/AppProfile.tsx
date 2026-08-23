import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  Phone,
  Shield,
  Smartphone,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MobileHeader } from "@/mobile/MobileAppShell";
import { useAuth } from "@/hooks/useAuth";
import { APP_STORE_KEYS, deviceStore, nativePlatform } from "@/mobile/lib/native";
import { requestGuestAccess } from "@/mobile/hooks/useMyTrips";

export default function AppProfile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [mail, setMail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    deviceStore.get(APP_STORE_KEYS.guestEmail).then(setGuestEmail);
  }, []);

  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    guestEmail ||
    "Gast";

  const sendLink = async () => {
    if (!mail.includes("@")) return toast.error("Bitte gültige E-Mail eingeben.");
    setSending(true);
    try {
      await requestGuestAccess(mail);
      setGuestEmail(mail.trim().toLowerCase());
      toast.success("Zugangslink gesendet – prüfe dein Postfach.");
    } catch (e: any) {
      toast.error(e?.message ?? "Senden fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  };

  const logout = async () => {
    await signOut();
    await deviceStore.remove(APP_STORE_KEYS.guestToken);
    await deviceStore.remove(APP_STORE_KEYS.offlineTickets);
    toast.success("Abgemeldet.");
    navigate("/app");
  };

  return (
    <div className="pb-8">
      <MobileHeader title="Profil" subtitle="Konto, Hilfe & Rechtliches" />

      <div className="px-5 pt-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UserIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email ?? guestEmail ?? "Nicht angemeldet"}
            </p>
          </div>
        </div>

        {!user && (
          <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Anmelden oder Buchung abrufen</p>
            <Button className="h-12 w-full rounded-2xl" onClick={() => navigate("/auth")}>
              Mit Konto anmelden
            </Button>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> oder als Gast <span className="h-px flex-1 bg-border" />
            </div>
            <Input
              type="email"
              inputMode="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder="E-Mail aus der Buchung"
              className="h-12 rounded-2xl"
            />
            <Button
              variant="secondary"
              className="h-12 w-full rounded-2xl"
              disabled={sending}
              onClick={sendLink}
            >
              {sending ? "Wird gesendet…" : "Zugangslink senden"}
            </Button>
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <Row to="/app/meine-reisen" icon={FileText} label="Meine Buchungen & Tickets" />
          <Row href="mailto:info@app.metours.de" icon={Mail} label="Kontakt per E-Mail" />
          <Row href="tel:+4951199999999" icon={Phone} label="Telefonische Beratung" />
          <Row to="/service" icon={HelpCircle} label="Hilfe & Service" />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <Row to="/terms" icon={FileText} label="AGB" />
          <Row to="/privacy" icon={Shield} label="Datenschutz" />
          <Row to="/widerruf" icon={FileText} label="Widerrufsbelehrung" />
          <Row to="/imprint" icon={FileText} label="Impressum" />
        </div>

        {user && (
          <Button variant="ghost" className="mt-5 w-full text-destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </Button>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          METROPOL TOURS App · {nativePlatform()}
        </p>
      </div>
    </div>
  );
}

function Row({
  to,
  href,
  icon: Icon,
  label,
}: {
  to?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const inner = (
    <>
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  const cls =
    "flex items-center gap-3 border-b border-border/50 px-4 py-3.5 last:border-b-0 active:bg-muted/50";
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={to ?? "/app"} className={cls}>
      {inner}
    </Link>
  );
}
