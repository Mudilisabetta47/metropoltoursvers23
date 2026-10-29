import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import { Download, ImageIcon, Loader2, RefreshCw, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { collectTravelImages, deliverMedia, fetchImage, imageFilename, type TravelImage } from "@/lib/travelMedia";
import { generalTravelAssets, resolveMediaReference } from "@/lib/travelMediaAssets";

export default function AdminTravelMedia() {
  const { user, isAdmin, isOffice } = useAuth();
  const allowed = Boolean(user && (isAdmin || isOffice));
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<{ blob: Blob; filename: string } | null>(null);
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-travel-media", user?.id], enabled: allowed,
    queryFn: async () => {
      const [tours, weekends] = await Promise.all([
        supabase.from("package_tours").select("id,destination,image_url,hero_image_url,gallery_images,og_image_url").order("destination"),
        supabase.from("weekend_trips").select("id,destination,image_url,hero_image_url,gallery_images").order("destination"),
      ]);
      if (tours.error || weekends.error) throw tours.error || weekends.error;
      return [
        ...collectTravelImages(tours.data || [], "Pauschalreisen", resolveMediaReference),
        ...collectTravelImages(weekends.data || [], "Kurzurlaube", resolveMediaReference),
        ...generalTravelAssets.map(asset => ({ id: asset.path, url: asset.url, name: asset.path.split("/").pop() || asset.path, group: "Allgemeine Bilder", usages: ["Website-Bild"] })),
      ];
    },
  });
  const filtered = useMemo(() => data.filter(image => (group === "all" || image.group === group) && `${image.name} ${image.usages.join(" ")}`.toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de"))), [data, group, search]);
  const toggle = (id: string) => setSelected(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const prepare = async (images: TravelImage[]) => {
    setError(null);
    setReady(null);
    setProgress("Bilder werden geladen…");
    try {
      if (images.length === 1) {
        const blob = await fetchImage(images[0].url);
        setReady({ blob, filename: imageFilename(images[0], 0, blob.type) });
      } else {
        const zip = new JSZip();
        const failures: string[] = [];
        const manifest: string[] = ["Datei\tReise / Bild\tBereich\tVerwendung"];
        let count = 0;
        let totalBytes = 0;
        for (let index = 0; index < images.length; index++) {
          setProgress(`Bild ${index + 1} von ${images.length}`);
          const image = images[index];
          let blob: Blob;
          try { blob = await fetchImage(image.url); }
          catch { failures.push(`${image.name} – ${image.usages.join(", ")}`); continue; }
          totalBytes += blob.size;
          if (totalBytes > 200 * 1024 * 1024) throw new Error("Die Auswahl ist größer als 200 MB. Bitte in kleineren Gruppen herunterladen.");
          const filename = `${image.group}/${imageFilename(image, index, blob.type)}`;
          zip.file(filename, blob);
          manifest.push([filename, image.name, image.group, image.usages.join(", ")].map(value => value.replace(/[\t\r\n]/g, " ")).join("\t"));
          count++;
        }
        if (!count) throw new Error("Keines der ausgewählten Bilder konnte geladen werden.");
        zip.file("Bilderzuordnung.tsv", "\uFEFF" + manifest.join("\n"));
        if (failures.length) { zip.file("Nicht-geladene-Bilder.txt", failures.join("\n")); setError(`${failures.length} Bilder konnten nicht geladen werden; sie sind im ZIP aufgelistet.`); }
        setProgress("ZIP wird erstellt…");
        const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
        setReady({ blob, filename: "Metropol-Tours-Bilder.zip" });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Download konnte nicht vorbereitet werden."); }
    finally { setProgress(null); }
  };

  return <AdminLayout title="Reisebilder" subtitle="Pauschalreisen · Kurzurlaube · Allgemeine Bilder">
    {!allowed ? <p className="text-muted-foreground">Zugang für Administration und Büro erforderlich.</p> : <div className="space-y-6 text-foreground">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Bilder suchen" placeholder="Reise oder Bild suchen" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={group} onValueChange={setGroup}><SelectTrigger className="w-52" aria-label="Bildbereich"><SelectValue /></SelectTrigger><SelectContent>{["all", "Pauschalreisen", "Kurzurlaube", "Allgemeine Bilder"].map(value => <SelectItem key={value} value={value}>{value === "all" ? "Alle Bereiche" : value}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" title="Aktualisieren" aria-label="Aktualisieren" onClick={() => void refetch()} disabled={Boolean(progress)}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <span className="text-sm text-muted-foreground">{filtered.length} Bilder · {selected.size} ausgewählt</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!filtered.length || Boolean(progress)} onClick={() => setSelected(new Set(filtered.map(image => image.id)))}>Alle angezeigten auswählen</Button>
          {selected.size > 0 && <Button variant="ghost" disabled={Boolean(progress)} onClick={() => setSelected(new Set())}>Auswahl aufheben</Button>}
          <Button disabled={!selected.size || Boolean(progress)} onClick={() => void prepare(data.filter(image => selected.has(image.id)))}><Download className="mr-2 h-4 w-4" />Auswahl als ZIP</Button>
        </div>
      </div>
      {progress && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{progress}</p>}
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      {isLoading ? <p role="status" className="text-muted-foreground">Bilder werden geladen…</p> : isError ? <p role="alert" className="text-destructive">Reisebilder konnten nicht geladen werden. Bitte erneut aktualisieren.</p> : !filtered.length ? <p className="text-muted-foreground">Keine Bilder gefunden.</p> :
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">{filtered.map(image => <article key={image.id} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
          <div className="relative aspect-[4/3] bg-muted"><img loading="lazy" src={image.url} alt={image.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.hidden = true; }} /><div className="absolute top-3 left-3 rounded bg-card p-2"><Checkbox checked={selected.has(image.id)} onCheckedChange={() => toggle(image.id)} aria-label={`${image.name} auswählen (${image.usages.join(", ")})`} /></div></div>
          <div className="p-4 space-y-2"><p className="text-xs text-muted-foreground">{image.group}</p><h2 className="font-semibold break-words">{image.name}</h2><p className="text-sm text-muted-foreground min-h-10">{image.usages.join(" · ")}</p><Button variant="outline" className="w-full" disabled={Boolean(progress)} onClick={() => void prepare([image])}><Download className="mr-2 h-4 w-4" />Bild herunterladen</Button></div>
        </article>)}</div>}
    </div>}
    <Dialog open={Boolean(ready)} onOpenChange={open => { if (!open) setReady(null); }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Download bereit</DialogTitle></DialogHeader><p className="break-all text-sm text-muted-foreground">{ready?.filename}</p><Button onClick={() => { if (ready) void deliverMedia(ready.blob, ready.filename); }}><Download className="mr-2 h-4 w-4" />Jetzt herunterladen</Button></DialogContent></Dialog>
  </AdminLayout>;
}