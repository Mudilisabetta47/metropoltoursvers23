import { useEffect, useState } from "react";
import { Save, RefreshCw, Image as ImageIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMediaLibrary } from "@/hooks/useSiteContent";
import {
  APP_HOME_DEFAULTS,
  APP_HOME_SECTION,
  AppHomeContent,
  parseAppHome,
} from "@/mobile/hooks/useAppContent";

const AdminMobileApp = () => {
  const { toast } = useToast();
  const { media } = useMediaLibrary();
  const [form, setForm] = useState<AppHomeContent>(APP_HOME_DEFAULTS);
  const [rowId, setRowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("cms_content")
      .select("id, title, subtitle, metadata")
      .eq("section_key", APP_HOME_SECTION)
      .maybeSingle();
    setRowId(data?.id ?? null);
    setForm(parseAppHome(data ?? null));
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof AppHomeContent>(key: K, value: AppHomeContent[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setIsSaving(true);
    const payload = {
      section_key: APP_HOME_SECTION,
      title: form.heroTitle,
      subtitle: form.heroSubtitle,
      is_active: true,
      metadata: {
        heroImageUrl: form.heroImageUrl,
        sectionFeatured: form.sectionFeatured,
        sectionDestinations: form.sectionDestinations,
        sectionOffers: form.sectionOffers,
        sectionAll: form.sectionAll,
        showFeatured: form.showFeatured,
        showDestinations: form.showDestinations,
        showOffers: form.showOffers,
        showAll: form.showAll,
        bannerEnabled: form.bannerEnabled,
        bannerTitle: form.bannerTitle,
        bannerText: form.bannerText,
        bannerLink: form.bannerLink,
        footerNote: form.footerNote,
      },
    };

    const { error } = rowId
      ? await supabase.from("cms_content").update(payload).eq("id", rowId)
      : await supabase.from("cms_content").insert(payload);

    setIsSaving(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Gespeichert", description: "Die App-Startseite wurde aktualisiert." });
    load();
  };

  return (
    <AdminLayout
      title="Mobile App – Startseite"
      subtitle="Inhalte der METROPOL TOURS App (/app) zentral pflegen – ohne Code."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Neu laden
          </Button>
          <Button size="sm" onClick={save} disabled={isSaving || isLoading}>
            <Save className="mr-2 h-4 w-4" /> {isSaving ? "Speichert…" : "Speichern"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Startbild & Begrüßung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Überschrift</Label>
              <Input value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
            </div>
            <div>
              <Label>Untertitel</Label>
              <Textarea
                rows={2}
                value={form.heroSubtitle}
                onChange={(e) => set("heroSubtitle", e.target.value)}
              />
            </div>
            <div>
              <Label>Startbild (URL)</Label>
              <Input
                value={form.heroImageUrl}
                placeholder="Leer lassen = Bild der ersten empfohlenen Reise"
                onChange={(e) => set("heroImageUrl", e.target.value)}
              />
              {media.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {media.slice(0, 20).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => set("heroImageUrl", m.url)}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border ${
                        form.heroImageUrl === m.url ? "border-primary" : "border-border"
                      }`}
                      title={m.title ?? m.file_name}
                    >
                      <img
                        src={m.url}
                        alt={m.alt_text ?? m.file_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
              {form.heroImageUrl && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" /> Aktuelles Startbild ausgewählt
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sektionen der App-Startseite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["Empfehlungen", "sectionFeatured", "showFeatured"],
                ["Reiseziele", "sectionDestinations", "showDestinations"],
                ["Angebote", "sectionOffers", "showOffers"],
                ["Alle Reisen", "sectionAll", "showAll"],
              ] as [string, keyof AppHomeContent, keyof AppHomeContent][]
            ).map(([label, titleKey, toggleKey]) => (
              <div key={titleKey} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>{label} – Titel</Label>
                  <Input
                    value={form[titleKey] as string}
                    onChange={(e) => set(titleKey, e.target.value as never)}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    checked={form[toggleKey] as boolean}
                    onCheckedChange={(v) => set(toggleKey, v as never)}
                  />
                  <span className="text-xs text-muted-foreground">sichtbar</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktionsbanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.bannerEnabled}
                onCheckedChange={(v) => set("bannerEnabled", v)}
              />
              <span className="text-sm">Banner in der App anzeigen</span>
            </div>
            <div>
              <Label>Titel</Label>
              <Input
                value={form.bannerTitle}
                onChange={(e) => set("bannerTitle", e.target.value)}
                placeholder="z. B. Frühbucher-Aktion"
              />
            </div>
            <div>
              <Label>Text</Label>
              <Textarea
                rows={2}
                value={form.bannerText}
                onChange={(e) => set("bannerText", e.target.value)}
                placeholder="z. B. Bis 31.10. 50 € Rabatt auf alle Kroatien-Reisen"
              />
            </div>
            <div>
              <Label>Ziel-Link (in der App)</Label>
              <Input
                value={form.bannerLink}
                onChange={(e) => set("bannerLink", e.target.value)}
                placeholder="/app/reisen"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hinweistext am Seitenende</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={2}
              value={form.footerNote}
              onChange={(e) => set("footerNote", e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={isSaving || isLoading}>
            <Save className="mr-2 h-4 w-4" /> {isSaving ? "Speichert…" : "Speichern"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMobileApp;
