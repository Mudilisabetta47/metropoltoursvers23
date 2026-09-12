import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  hero_image_url: string | null;
  author_name: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
}

const EMPTY: Partial<BlogPost> = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  hero_image_url: "",
  author_name: "METROPOL TOURS Redaktion",
  tags: [],
  meta_title: "",
  meta_description: "",
  is_published: false,
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing?.title?.trim()) { setError("Bitte Titel angeben."); return; }
    setSaving(true);
    setError(null);
    const slug = (editing.slug || editing.title)
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    const values = { ...editing, slug };
    const q = editing.id
      ? supabase.from("blog_posts").update(values).eq("id", editing.id)
      : supabase.from("blog_posts").insert(values);
    const { error: err } = await q;
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditing(null);
    load();
  };

  const togglePublish = async (p: BlogPost) => {
    await supabase.from("blog_posts").update({ is_published: !p.is_published }).eq("id", p.id);
    load();
  };

  const remove = async (p: BlogPost) => {
    if (!confirm(`Artikel „${p.title}" wirklich löschen?`)) return;
    await supabase.from("blog_posts").delete().eq("id", p.id);
    load();
  };

  const f = (field: keyof BlogPost, value: any) =>
    setEditing((e) => ({ ...e, [field]: value }));

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Magazin / Blog</h1>
            <p className="text-sm text-muted-foreground">Artikel für das öffentliche Reise-Magazin (/blog) verwalten.</p>
          </div>
          <button
            onClick={() => { setEditing({ ...EMPTY }); setError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Neuer Artikel
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Lade Artikel…</p>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Titel</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">/blog/{p.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.is_published ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {p.is_published ? "Veröffentlicht" : "Entwurf"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => togglePublish(p)} className="p-2 rounded-lg hover:bg-muted mr-1" title={p.is_published ? "Unveröffentlichen" : "Veröffentlichen"}>
                        {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditing(p); setError(null); }} className="p-2 rounded-lg hover:bg-muted mr-1" title="Bearbeiten">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(p)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Löschen">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Noch keine Artikel.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
              <h2 className="font-bold text-foreground">{editing.id ? "Artikel bearbeiten" : "Neuer Artikel"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">Titel *</span>
                <input value={editing.title ?? ""} onChange={(e) => f("title", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Slug (leer = aus Titel)</span>
                  <input value={editing.slug ?? ""} onChange={(e) => f("slug", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Autor</span>
                  <input value={editing.author_name ?? ""} onChange={(e) => f("author_name", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Kurzfassung (Excerpt)</span>
                <textarea value={editing.excerpt ?? ""} onChange={(e) => f("excerpt", e.target.value)} rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Inhalt (Markdown, ## = Überschrift)</span>
                <textarea value={editing.content ?? ""} onChange={(e) => f("content", e.target.value)} rows={12}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">SEO-Titel</span>
                  <input value={editing.meta_title ?? ""} onChange={(e) => f("meta_title", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">SEO-Beschreibung</span>
                  <input value={editing.meta_description ?? ""} onChange={(e) => f("meta_description", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Tags (Komma-getrennt)</span>
                <input value={(editing.tags ?? []).join(", ")} onChange={(e) => f("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!editing.is_published} onChange={(e) => f("is_published", e.target.checked as any)} className="accent-[hsl(var(--primary))]" />
                <span className="text-sm text-foreground">Sofort veröffentlichen</span>
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

export default AdminBlog;
