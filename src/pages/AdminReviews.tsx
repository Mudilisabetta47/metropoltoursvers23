import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Star, X, BadgeCheck } from "lucide-react";

interface CustomerReview {
  id: string;
  author_name: string | null;
  title: string | null;
  comment: string | null;
  stars: number | null;
  is_published: boolean;
  is_verified: boolean;
  reply_text: string | null;
  source: string | null;
  created_at: string;
}

const EMPTY: Partial<CustomerReview> = {
  author_name: "",
  title: "",
  comment: "",
  stars: 5,
  is_published: true,
  is_verified: true,
  reply_text: "",
  source: "manuell",
};

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const AdminReviews = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CustomerReview> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("customer_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as CustomerReview[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, values: Partial<CustomerReview>) => {
    await supabase.from("customer_reviews").update(values).eq("id", id);
    load();
  };

  const remove = async (r: CustomerReview) => {
    if (!confirm("Bewertung wirklich löschen?")) return;
    await supabase.from("customer_reviews").delete().eq("id", r.id);
    load();
  };

  const save = async () => {
    if (!editing?.author_name?.trim() || !editing.comment?.trim()) {
      setError("Bitte Name und Bewertungstext angeben.");
      return;
    }
    setSaving(true);
    setError(null);
    const values = { ...editing, stars: Number(editing.stars ?? 5) };
    const q = editing.id
      ? supabase.from("customer_reviews").update(values).eq("id", editing.id)
      : supabase.from("customer_reviews").insert(values);
    const { error: err } = await q;
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditing(null);
    load();
  };

  const published = reviews.filter((r) => r.is_published);
  const avg = published.length
    ? (published.reduce((s, r) => s + (r.stars ?? 0), 0) / published.length).toFixed(1).replace(".", ",")
    : "–";

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gästebewertungen</h1>
            <p className="text-sm text-muted-foreground">
              Nur echte Bewertungen eintragen (z. B. aus Feedback-Mails oder Google). Veröffentlichte Bewertungen erscheinen
              auf der Startseite und in den Google-Suchergebnissen. Aktuell veröffentlicht: {published.length} (Ø {avg} Sterne).
            </p>
          </div>
          <button
            onClick={() => { setEditing({ ...EMPTY }); setError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Bewertung erfassen
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Lade Bewertungen…</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-muted-foreground">
            Noch keine Bewertungen erfasst. Tragen Sie echte Gäste-Feedbacks hier ein – die Startseiten-Sektion erscheint
            automatisch, sobald die erste Bewertung veröffentlicht ist.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Stars n={r.stars ?? 0} />
                      <span className="font-semibold text-foreground">{r.author_name || "Gast"}</span>
                      {r.is_verified && <BadgeCheck className="w-4 h-4 text-primary" aria-label="Verifiziert" />}
                      <span className="text-xs text-muted-foreground">· Quelle: {r.source || "unbekannt"}</span>
                    </div>
                    {r.title && <p className="font-medium text-foreground text-sm">{r.title}</p>}
                    <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{r.comment}</p>
                    {r.reply_text && (
                      <p className="mt-2 text-sm bg-primary/5 border border-primary/15 rounded-lg p-2 text-muted-foreground">
                        <span className="font-semibold text-primary">Antwort: </span>{r.reply_text}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={r.is_published} onChange={(e) => update(r.id, { is_published: e.target.checked })} className="accent-[hsl(var(--primary))]" />
                      Veröffentlicht
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={r.is_verified} onChange={(e) => update(r.id, { is_verified: e.target.checked })} className="accent-[hsl(var(--primary))]" />
                      Verifiziert
                    </label>
                    <button onClick={() => remove(r)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Löschen">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="font-bold text-foreground">Bewertung erfassen</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Gastname *</span>
                <input value={editing.author_name ?? ""} onChange={(e) => setEditing((s) => ({ ...s, author_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Sterne</span>
                <select value={editing.stars ?? 5} onChange={(e) => setEditing((s) => ({ ...s, stars: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Sterne</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Titel (optional)</span>
                <input value={editing.title ?? ""} onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Bewertungstext *</span>
                <textarea value={editing.comment ?? ""} onChange={(e) => setEditing((s) => ({ ...s, comment: e.target.value }))} rows={4}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Antwort von METROPOL TOURS (optional)</span>
                <textarea value={editing.reply_text ?? ""} onChange={(e) => setEditing((s) => ({ ...s, reply_text: e.target.value }))} rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Quelle</span>
                <input value={editing.source ?? ""} onChange={(e) => setEditing((s) => ({ ...s, source: e.target.value }))} placeholder="z. B. Feedback-Mail, Google"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-border text-foreground">Abbrechen</button>
                <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60">
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
