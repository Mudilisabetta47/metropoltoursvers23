import { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, CreditCard, FlaskConical, ExternalLink, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

interface TestCard {
  brand: string;
  number: string;
  cvc: string;
  expiry: string;
  result: string;
  tone: "ok" | "warn" | "fail";
}

const TEST_CARDS: TestCard[] = [
  { brand: "Visa", number: "4242 4242 4242 4242", cvc: "beliebig (3-stellig)", expiry: "beliebig in der Zukunft", result: "Zahlung erfolgreich", tone: "ok" },
  { brand: "Mastercard", number: "5555 5555 5555 4444", cvc: "beliebig (3-stellig)", expiry: "beliebig in der Zukunft", result: "Zahlung erfolgreich", tone: "ok" },
  { brand: "Visa (3D Secure)", number: "4000 0027 6000 3184", cvc: "beliebig (3-stellig)", expiry: "beliebig in der Zukunft", result: "Erfordert 3D-Secure-Bestätigung", tone: "warn" },
  { brand: "Visa (Abgelehnt)", number: "4000 0000 0000 9995", cvc: "beliebig (3-stellig)", expiry: "beliebig in der Zukunft", result: "Zahlung abgelehnt – unzureichende Deckung", tone: "fail" },
  { brand: "Visa (Karte gesperrt)", number: "4000 0000 0000 0002", cvc: "beliebig (3-stellig)", expiry: "beliebig in der Zukunft", result: "Zahlung abgelehnt – generischer Fehler", tone: "fail" },
];

const toneClass: Record<TestCard["tone"], string> = {
  ok: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
  warn: "bg-amber-600/20 text-amber-300 border-amber-600/40",
  fail: "bg-rose-600/20 text-rose-300 border-rose-600/40",
};

const AdminTestData = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value.replace(/\s/g, ""));
    setCopied(label);
    toast.success(`${label} kopiert`);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Testdaten &amp; Testzahlungen
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Interne Karten- und Zahlungsdaten für Testbuchungen. Nur für Mitarbeitende – niemals an Kunden weitergeben.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-600/10 p-4">
          <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-100">
            <p className="font-semibold">Nur im Sandbox-/Testmodus verwenden</p>
            <p className="text-amber-200/80 mt-1">
              Diese Kartennummern funktionieren ausschließlich mit Test-Zugangsdaten des Zahlungsanbieters.
              Wähle im Checkout die Zahlungsart <strong>„Testzahlung (nur intern, Sandbox)"</strong> – die Buchung wird
              dann als Testbuchung markiert und das Ticket trägt den Hinweis „TESTBUCHUNG – NICHT GÜLTIG".
            </p>
          </div>
        </div>

        <Card className="bg-[#151a21] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-primary" /> Test-Kreditkarten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TEST_CARDS.map((c) => (
              <div
                key={c.number}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-[#0f1218] p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{c.brand}</span>
                    <Badge variant="outline" className={toneClass[c.tone]}>{c.result}</Badge>
                  </div>
                  <p className="font-mono text-lg text-white mt-1.5 tracking-wider">{c.number}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ablaufdatum: {c.expiry} · CVC: {c.cvc} · PLZ: beliebig
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => copy(c.number, `${c.brand}-Nummer`)}
                >
                  {copied === `${c.brand}-Nummer` ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  Kopieren
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#151a21] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">PayPal Sandbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p>
              Für PayPal-Tests wird ein Sandbox-Käuferkonto benötigt. Die Zugangsdaten liegen aus Sicherheitsgründen
              nicht in dieser Oberfläche – sie werden von der Administration bereitgestellt.
            </p>
            <p className="text-zinc-400">
              Im Sandbox-Modus wird kein echtes Geld bewegt. Jede Transaktion erscheint anschließend im Zahlungs-Audit.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#151a21] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Testbuchung durchführen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="text-sm text-zinc-300 space-y-1.5 list-decimal list-inside">
              <li>Eine buchbare Fahrt auf der Website öffnen und in den Checkout gehen.</li>
              <li>Im Schritt „Zahlung" die Option <strong>Testzahlung (nur intern, Sandbox)</strong> wählen.</li>
              <li>Buchung abschließen – das erzeugte Ticket ist als Testbuchung gekennzeichnet.</li>
              <li>Ergebnis im Zahlungs-Audit bzw. in den Buchungen prüfen.</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" size="sm">
                <a href="/busreisen" target="_blank" rel="noopener noreferrer">
                  Zur Website <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/bus-bookings">Bus-Buchungen</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/payment-audit">Zahlungs-Audit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTestData;
