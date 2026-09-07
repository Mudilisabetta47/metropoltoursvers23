import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Trash2, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DispoLayout from "../DispoLayout";
import { EmptyState } from "../components/ui";
import { dateDE } from "../lib/format";

const db = supabase as any;

interface Example {
  id: string;
  subject: string | null;
  body_text: string;
  from_email: string | null;
  is_inquiry: boolean;
  note: string | null;
  use_for_training: boolean;
  extracted: any;
  created_at: string;
}

export default function DispoTraining() {
  const [rows, setRows] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"alle" | "anfrage" | "keine">("alle");
  const [form, setForm] = useState({ subject: "", body_text: "", is_inquiry: true, note: "" });

  const load = useCallback(async () => {
    const { data } = await db
      .from("dispo_ai_examples")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Example[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = rows.filter((r) =>
    filter === "alle" ? true : filter === "anfrage" ? r.is_inquiry : !r.is_inquiry,
  );

  const toggle = async (row: Example) => {
    await db.from("dispo_ai_examples").update({ use_for_training: !row.use_for_training }).eq("id", row.id);
    load();
  };

  const remove = async (row: Example) => {
    await db.from("dispo_ai_examples").delete().eq("id", row.id);
    toast.success("Beispiel gelöscht");
    load();
  };

  const add = async () => {
    if (!form.body_text.trim()) return toast.error("Bitte den E-Mail-Text einfügen.");
    const { error } = await db.from("dispo_ai_examples").insert({
      subject: form.subject || null,
      body_text: form.body_text,
      is_inquiry: form.is_inquiry,
      note: form.note || null,
      label: form.is_inquiry ? "anfrage" : "keine_anfrage",
    });
    if (error) return toast.error(error.message);
    toast.success("Beispiel gespeichert – die KI lernt daraus.");
    setForm({ subject: "", body_text: "", is_inquiry: true, note: "" });
    load();
  };

  const counts = {
    anfrage: rows.filter((r) => r.is_inquiry && r.use_for_training).length,
    keine: rows.filter((r) => !r.is_inquiry && r.use_for_training).length,
  };

  return (
    <DispoLayout
      title="KI-Training"
      subtitle="Geprüfte Beispiele, aus denen die Anfrage-Erkennung lernt"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="dispo-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(["alle", "anfrage", "keine"] as const).map((f) => (
              <button
                key={f}
                className={`dispo-btn ${filter === f ? "dispo-btn-primary" : "dispo-btn-ghost"}`}
                onClick={() => setFilter(f)}
              >
                {f === "alle" ? "Alle" : f === "anfrage" ? `Busanfragen (${counts.anfrage})` : `Keine Anfrage (${counts.keine})`}
              </button>
            ))}
          </div>

          {loading ? (
            <EmptyState text="Lade…" />
          ) : list.length === 0 ? (
            <EmptyState text="Noch keine Lernbeispiele. Markiere E-Mails im Postfach als richtig oder falsch." />
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "hsl(var(--dispo-border))" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="dispo-chip"
                      style={r.is_inquiry
                        ? { color: "#065f46", background: "#d1fae5" }
                        : { color: "#7f1d1d", background: "#fee2e2" }}
                    >
                      {r.is_inquiry ? "Busanfrage" : "Keine Anfrage"}
                    </span>
                    <span className="font-semibold dispo-strong">{r.subject || "(ohne Betreff)"}</span>
                    <span className="text-xs dispo-muted">{r.from_email}</span>
                    <span className="ml-auto text-xs dispo-muted">{dateDE(r.created_at?.slice(0, 10))}</span>
                  </div>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap dispo-muted">{r.body_text.slice(0, 400)}</p>
                  {r.note && <p className="mt-1 text-xs dispo-muted">Notiz: {r.note}</p>}
                  <div className="mt-2 flex gap-2">
                    <button className="dispo-btn dispo-btn-ghost" onClick={() => toggle(r)}>
                      {r.use_for_training ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      {r.use_for_training ? "Wird trainiert" : "Pausiert"}
                    </button>
                    <button className="dispo-btn dispo-btn-ghost" onClick={() => remove(r)}>
                      <Trash2 className="h-4 w-4" /> Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dispo-card space-y-2 p-4">
          <div className="flex items-center gap-2 font-semibold dispo-strong">
            <GraduationCap className="h-4 w-4" /> Beispiel selbst anlegen
          </div>
          <input
            className="dispo-input"
            placeholder="Betreff"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <textarea
            className="dispo-input min-h-[180px]"
            placeholder="E-Mail-Text einfügen"
            value={form.body_text}
            onChange={(e) => setForm({ ...form, body_text: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              className={`dispo-btn ${form.is_inquiry ? "dispo-btn-primary" : "dispo-btn-ghost"}`}
              onClick={() => setForm({ ...form, is_inquiry: true })}
            >
              Busanfrage
            </button>
            <button
              className={`dispo-btn ${!form.is_inquiry ? "dispo-btn-primary" : "dispo-btn-ghost"}`}
              onClick={() => setForm({ ...form, is_inquiry: false })}
            >
              Keine Anfrage
            </button>
          </div>
          <input
            className="dispo-input"
            placeholder="Notiz (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <button className="dispo-btn dispo-btn-primary w-full" onClick={add}>
            <Plus className="h-4 w-4" /> Beispiel speichern
          </button>
          <p className="text-xs dispo-muted">
            Die KI nutzt die neuesten geprüften Beispiele bei jeder Analyse. Je mehr echte Fälle hinterlegt sind,
            desto sicherer erkennt sie Anfragen.
          </p>
        </div>
      </div>
    </DispoLayout>
  );
}
