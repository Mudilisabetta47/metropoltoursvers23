import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import DispoLayout from "../DispoLayout";
import { useDispoData, busName, driverName } from "../hooks/useDispoData";
import { isoDate } from "../lib/format";

const EXAMPLES = [
  "Welche Busse sind am 24.10. frei?",
  "Welche Fahrten haben heute noch keinen Fahrer?",
  "Ist dieser Auftrag mit einem Fahrer machbar?",
  "Wie hoch sollte der Verkaufspreis sein?",
  "Welche Aufträge bringen diesen Monat den höchsten Deckungsbeitrag?",
  "Erstelle eine Antwort an den Kunden.",
];

interface Msg { role: "user" | "assistant"; content: string }

export default function DispoAssistant() {
  const { orders, buses, drivers } = useDispoData();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    const context = {
      heute: isoDate(new Date()),
      auftraege: orders.slice(0, 60).map((o) => ({
        nummer: o.order_number, status: o.status, kunde: o.customer_name,
        datum: o.departure_date, abfahrt: o.departure_time, rueck: o.return_date,
        von: o.origin, nach: o.destination, personen: o.passengers, km: o.distance_km,
        bus: busName(buses, o.bus_id), fahrer: driverName(drivers, o.driver_user_id),
        zweiter_fahrer: driverName(drivers, o.second_driver_user_id),
        netto: o.price_net, brutto: o.price_gross, kosten: o.estimated_cost, deckungsbeitrag: o.margin,
      })),
      busse: buses.map((b: any) => ({ name: b.name, kennzeichen: b.license_plate, sitze: b.total_seats, aktiv: b.is_active })),
      fahrer: drivers.map((d) => ({ name: d.name, id: d.user_id })),
    };

    const { data, error } = await supabase.functions.invoke("dispo-ai", {
      body: { action: "assistant", messages: next, context },
    });
    setBusy(false);
    setMessages([
      ...next,
      { role: "assistant", content: error ? `Fehler: ${error.message}` : (data?.reply ?? "Keine Antwort erhalten.") },
    ]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <DispoLayout title="KI-Assistent" subtitle="Unterstützt bei Disposition, Kalkulation und Kundenkommunikation">
      <div className="dispo-card flex h-[72vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm dispo-muted">
                Der Assistent kennt Ihre Aufträge, Busse und Fahrer. Hinweise zu Lenk- und Ruhezeiten sind Prüfhinweise und keine rechtsverbindliche Bewertung.
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((e) => (
                  <button key={e} className="dispo-btn dispo-btn-ghost text-xs" onClick={() => send(e)}>
                    <Sparkles className="h-3.5 w-3.5" /> {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-xl p-3 text-sm ${m.role === "user" ? "ml-auto bg-[hsl(var(--dispo-green-800))] text-white" : "bg-[hsl(var(--dispo-bg))]"}`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              ) : m.content}
            </div>
          ))}
          {busy && <div className="text-sm dispo-muted">Assistent denkt nach…</div>}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t p-3" style={{ borderColor: "hsl(var(--dispo-border))" }}>
          <input
            className="dispo-input"
            placeholder="Frage an den Dispo-Assistenten…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
          />
          <button className="dispo-btn dispo-btn-primary" onClick={() => send(input)} disabled={busy}>
            <Send className="h-4 w-4" /> Senden
          </button>
        </div>
      </div>
    </DispoLayout>
  );
}
