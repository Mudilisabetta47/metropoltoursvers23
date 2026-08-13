import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ShopImage from "@/components/shop/ShopImage";
import { StatWidget } from "@/components/admin/core/StatWidget";
import {
  ShopProduct, ShopCategory, ShopOrder, ORDER_STATUS, PAYMENT_STATUS,
  formatEur, slugify, normalizeImages, SHOP_BUCKET,
} from "@/lib/shop";
import { Package, ShoppingCart, Euro, Layers, Plus, Pencil, Trash2, Upload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyProduct = (): Partial<ShopProduct> => ({
  name: "",
  slug: "",
  sku: "",
  short_description: "",
  description: "",
  price: 0,
  compare_at_price: null,
  tax_rate: 19,
  stock: 0,
  track_stock: true,
  images: [],
  is_new: false,
  is_bestseller: false,
  is_sale: false,
  is_published: false,
  sort_order: 0,
  category_id: null,
  seo_title: "",
  seo_description: "",
});

export default function AdminShop() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Partial<ShopProduct> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [catEditing, setCatEditing] = useState<Partial<ShopCategory> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c, o] = await Promise.all([
      supabase.from("shop_products").select("*").order("created_at", { ascending: false }),
      supabase.from("shop_categories").select("*").order("sort_order"),
      supabase.from("shop_orders").select("*, shop_order_items(*)").order("created_at", { ascending: false }).limit(200),
    ]);
    if (p.error || c.error || o.error) {
      toast({ title: "Fehler beim Laden", description: (p.error || c.error || o.error)?.message, variant: "destructive" });
    }
    setProducts(((p.data as any[]) || []).map((x) => ({ ...x, images: normalizeImages(x.images) })) as ShopProduct[]);
    setCategories((c.data as any as ShopCategory[]) || []);
    setOrders((o.data as any as ShopOrder[]) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => o.payment_status === "paid")
      .reduce((s, o) => s + Number(o.total || 0), 0);
    const open = orders.filter((o) => o.status === "new" || o.status === "processing").length;
    return {
      revenue,
      open,
      products: products.length,
      published: products.filter((p) => p.is_published).length,
    };
  }, [orders, products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.slug].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [products, search]);

  const saveProduct = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) {
      toast({ title: "Name fehlt", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      category_id: editing.category_id || null,
      name: editing.name.trim(),
      slug: (editing.slug?.trim() || slugify(editing.name)),
      sku: editing.sku || null,
      short_description: editing.short_description || null,
      description: editing.description || null,
      price: Number(editing.price) || 0,
      compare_at_price: editing.compare_at_price ? Number(editing.compare_at_price) : null,
      tax_rate: Number(editing.tax_rate ?? 19),
      stock: Number(editing.stock) || 0,
      track_stock: !!editing.track_stock,
      images: editing.images || [],
      is_new: !!editing.is_new,
      is_bestseller: !!editing.is_bestseller,
      is_sale: !!editing.is_sale,
      is_published: !!editing.is_published,
      sort_order: Number(editing.sort_order) || 0,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
    };
    const res = editing.id
      ? await supabase.from("shop_products").update(payload).eq("id", editing.id)
      : await supabase.from("shop_products").insert(payload);
    setSaving(false);
    if (res.error) {
      toast({ title: "Speichern fehlgeschlagen", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Produkt gespeichert" });
    setEditing(null);
    load();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Produkt wirklich löschen?")) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", id);
    if (error) return toast({ title: "Löschen fehlgeschlagen", description: error.message, variant: "destructive" });
    toast({ title: "Produkt gelöscht" });
    load();
  };

  const togglePublish = async (p: ShopProduct) => {
    const { error } = await supabase.from("shop_products").update({ is_published: !p.is_published }).eq("id", p.id);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)));
  };

  const uploadImage = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    const path = `${slugify(editing.name || "produkt")}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from(SHOP_BUCKET).upload(path, file, { upsert: false });
    setUploading(false);
    if (error) return toast({ title: "Upload fehlgeschlagen", description: error.message, variant: "destructive" });
    setEditing({ ...editing, images: [...(editing.images || []), path] });
  };

  const saveCategory = async () => {
    if (!catEditing?.name?.trim()) return;
    const payload = {
      name: catEditing.name.trim(),
      slug: catEditing.slug?.trim() || slugify(catEditing.name),
      description: catEditing.description || null,
      sort_order: Number(catEditing.sort_order) || 0,
      is_active: catEditing.is_active ?? true,
    };
    const res = catEditing.id
      ? await supabase.from("shop_categories").update(payload).eq("id", catEditing.id)
      : await supabase.from("shop_categories").insert(payload);
    if (res.error) return toast({ title: "Fehler", description: res.error.message, variant: "destructive" });
    toast({ title: "Kategorie gespeichert" });
    setCatEditing(null);
    load();
  };

  const updateOrder = async (id: string, patch: Record<string, string>) => {
    const { error } = await supabase.from("shop_orders").update(patch).eq("id", id);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } as ShopOrder : o)));
  };

  return (
    <AdminLayout
      title="Shop"
      subtitle="Produkte, Bestellungen und Kategorien verwalten"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> Aktualisieren
          </Button>
          <Button size="sm" onClick={() => setEditing(emptyProduct())}>
            <Plus className="w-4 h-4 mr-2" /> Neues Produkt
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatWidget label="Umsatz (bezahlt)" value={formatEur(stats.revenue)} icon={<Euro className="w-4 h-4" />} accent="success" />
        <StatWidget label="Offene Bestellungen" value={stats.open} icon={<ShoppingCart className="w-4 h-4" />} accent={stats.open ? "warning" : "default"} />
        <StatWidget label="Produkte" value={stats.products} hint={`${stats.published} veröffentlicht`} icon={<Package className="w-4 h-4" />} />
        <StatWidget label="Kategorien" value={categories.length} icon={<Layers className="w-4 h-4" />} />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produkte</TabsTrigger>
          <TabsTrigger value="orders">Bestellungen</TabsTrigger>
          <TabsTrigger value="categories">Kategorien</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 space-y-3">
          <Input
            placeholder="Produkt suchen (Name, SKU, Slug)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Produkt</th>
                  <th className="text-left p-3">Preis</th>
                  <th className="text-left p-3">Bestand</th>
                  <th className="text-left p-3">Live</th>
                  <th className="text-right p-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <ShopImage src={p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-md object-cover" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.sku || p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 tabular-nums">{formatEur(p.price)}</td>
                    <td className="p-3 tabular-nums">{p.track_stock ? p.stock : "∞"}</td>
                    <td className="p-3">
                      <Switch checked={p.is_published} onCheckedChange={() => togglePublish(p)} aria-label="Veröffentlichen" />
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ ...p })}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!filteredProducts.length && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Keine Produkte vorhanden.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("de-DE")} · {o.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium", PAYMENT_STATUS[o.payment_status]?.className)}>
                      {PAYMENT_STATUS[o.payment_status]?.label || o.payment_status}
                    </span>
                    <Select value={o.status} onValueChange={(v) => updateOrder(o.id, { status: v })}>
                      <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORDER_STATUS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="font-semibold tabular-nums">{formatEur(o.total)}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {(o.shop_order_items || []).map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.quantity}× {it.product_name}{it.variant_label ? ` (${it.variant_label})` : ""}</span>
                      <span className="tabular-nums">{formatEur(it.line_total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Sendungsnummer"
                    defaultValue={o.tracking_number || ""}
                    onBlur={(e) => e.target.value !== (o.tracking_number || "") && updateOrder(o.id, { tracking_number: e.target.value })}
                    className="max-w-xs h-9"
                  />
                </div>
              </div>
            ))}
            {!orders.length && <div className="p-8 text-center text-muted-foreground">Noch keine Bestellungen.</div>}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-3">
          <Button size="sm" onClick={() => setCatEditing({ name: "", slug: "", is_active: true, sort_order: 0 })}>
            <Plus className="w-4 h-4 mr-2" /> Neue Kategorie
          </Button>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug} · {c.is_active ? "aktiv" : "inaktiv"}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCatEditing({ ...c })}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Produkt-Dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Produkt bearbeiten" : "Neues Produkt"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="p-slug">Slug</Label>
                <Input id="p-slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-sku">SKU</Label>
                <Input id="p-sku" value={editing.sku || ""} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-price">Preis (€)</Label>
                <Input id="p-price" type="number" step="0.01" value={editing.price ?? 0}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="p-compare">Streichpreis (€)</Label>
                <Input id="p-compare" type="number" step="0.01" value={editing.compare_at_price ?? ""}
                  onChange={(e) => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label htmlFor="p-stock">Bestand</Label>
                <Input id="p-stock" type="number" value={editing.stock ?? 0}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="p-tax">MwSt. (%)</Label>
                <Input id="p-tax" type="number" step="0.1" value={editing.tax_rate ?? 19}
                  onChange={(e) => setEditing({ ...editing, tax_rate: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Kategorie</Label>
                <Select value={editing.category_id || "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ohne Kategorie</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="p-short">Kurzbeschreibung</Label>
                <Textarea id="p-short" rows={2} value={editing.short_description || ""}
                  onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="p-desc">Beschreibung</Label>
                <Textarea id="p-desc" rows={5} value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Bilder</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(editing.images || []).map((img) => (
                    <div key={img} className="relative">
                      <ShopImage src={img} alt="Produktbild" className="w-20 h-20 rounded-md object-cover" />
                      <button
                        type="button"
                        aria-label="Bild entfernen"
                        onClick={() => setEditing({ ...editing, images: (editing.images || []).filter((i) => i !== img) })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >×</button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-md border border-dashed border-border flex items-center justify-center cursor-pointer">
                    <Upload className={cn("w-5 h-5 text-muted-foreground", uploading && "animate-pulse")} />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-6">
                {([
                  ["is_published", "Veröffentlicht"],
                  ["is_new", "Neu"],
                  ["is_bestseller", "Bestseller"],
                  ["is_sale", "Sale"],
                  ["track_stock", "Bestand verfolgen"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <Switch checked={!!(editing as any)[key]} onCheckedChange={(v) => setEditing({ ...editing, [key]: v })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Abbrechen</Button>
            <Button onClick={saveProduct} disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kategorie-Dialog */}
      <Dialog open={!!catEditing} onOpenChange={(v) => !v && setCatEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{catEditing?.id ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle></DialogHeader>
          {catEditing && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={catEditing.name || ""}
                  onChange={(e) => setCatEditing({ ...catEditing, name: e.target.value, slug: catEditing.id ? catEditing.slug : slugify(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="c-slug">Slug</Label>
                <Input id="c-slug" value={catEditing.slug || ""} onChange={(e) => setCatEditing({ ...catEditing, slug: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="c-sort">Sortierung</Label>
                <Input id="c-sort" type="number" value={catEditing.sort_order ?? 0}
                  onChange={(e) => setCatEditing({ ...catEditing, sort_order: Number(e.target.value) })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={catEditing.is_active ?? true} onCheckedChange={(v) => setCatEditing({ ...catEditing, is_active: v })} />
                Aktiv
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatEditing(null)}>Abbrechen</Button>
            <Button onClick={saveCategory}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
