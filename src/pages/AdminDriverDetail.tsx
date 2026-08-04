import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Phone, Mail, IdCard, MapPin, Clock, Bus,
  AlertTriangle, Loader2, ExternalLink, ShieldCheck, Timer,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

const fmtTime = (v?: string | null) => {
  if (!v) return "–";
  const d = v.length <= 8 ? new Date(`1970-01-01T${v}`) : new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "HH:mm");
};

const fmtDuration = (sec?: number | null) => {
  const s = sec ?? 0;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

const AdminDriverDetail = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [duty, setDuty] = useState<any | null>(null);
  const [position, setPosition] = useState<any | null>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [busName, setBusName] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) return;
    let active = true;

    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      const [p, r, sh, dl, vp, lic, inc] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", driverId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", driverId),
        supabase.from("employee_shifts").select("*").eq("user_id", driverId)
          .gte("shift_date", today).order("shift_date").limit(10),
        supabase.from("driver_duty_log").select("*").eq("driver_user_id", driverId)
          .eq("log_date", today).maybeSingle(),
        supabase.from("vehicle_positions").select("*").eq("driver_user_id", driverId)
          .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("driver_licenses").select("*").eq("driver_id", driverId),
        supabase.from("incidents").select("*").eq("source_type", "driver")
          .eq("source_id", driverId).order("created_at", { ascending: false }).limit(15),
      ]);

      if (!active) return;
      setProfile((p.data as Profile) ?? null);
      setRoles((r.data ?? []).map((x: any) => x.role));
      setShifts(sh.data ?? []);
      setDuty(dl.data ?? null);
      setPosition(vp.data ?? null);
      setLicenses(lic.data ?? []);
      setIncidents(inc.data ?? []);

      const busId = (vp.data as any)?.bus_id || (sh.data?.[0] as any)?.assigned_bus_id;
      if (busId) {
        const { data: bus } = await supabase.from("buses").select("name, license_plate").eq("id", busId).maybeSingle();
        if (active && bus) setBusName(`${bus.name} · ${bus.license_plate}`);
      }
      setLoading(false);
    })();

    return () => { active = false; };
  }, [driverId]);

  const name = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
    : "Fahrer";

  const openIncident = incidents.find((i) => i.status !== "resolved" && i.severity === "critical");

  return (
    <AdminLayout title={name} subtitle="Fahrermaske · Stammdaten, Einsatz und Status">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !profile ? (
          <Card className="p-8 text-center text-muted-foreground">
            Keine Stammdaten für diesen Fahrer verfügbar (Admin-Rechte erforderlich).
          </Card>
        ) : (
          <>
            {openIncident && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-500">{openIncident.title}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{openIncident.description}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Stammdaten */}
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><IdCard className="w-4 h-4" /> Stammdaten</h3>
                <div className="text-2xl font-bold">{name}</div>
                <div className="flex flex-wrap gap-1">
                  {roles.length ? roles.map((r) => (
                    <Badge key={r} variant="secondary">{r}</Badge>
                  )) : <Badge variant="outline">keine Rolle</Badge>}
                </div>
                <div className="space-y-2 text-sm pt-2">
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:underline">
                    <Mail className="w-4 h-4 text-muted-foreground" />{profile.email}
                  </a>
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:underline">
                      <Phone className="w-4 h-4 text-muted-foreground" />{profile.phone}
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Seit {format(new Date(profile.created_at), "dd.MM.yyyy", { locale: de })}
                  </div>
                </div>
              </Card>

              {/* Status / Standort */}
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Status & Standort</h3>
                {position ? (
                  <div className="space-y-2 text-sm">
                    <Badge className="capitalize">{position.status}</Badge>
                    <div className="flex items-center gap-2"><Bus className="w-4 h-4 text-muted-foreground" />{busName ?? "Fahrzeug unbekannt"}</div>
                    <div>Geschwindigkeit: {position.speed_kmh ?? 0} km/h</div>
                    <div>Verspätung: {position.delay_minutes ?? 0} Min.</div>
                    <div className="text-muted-foreground">
                      Aktualisiert: {format(new Date(position.updated_at), "dd.MM. HH:mm", { locale: de })}
                    </div>
                    <a
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      Auf Karte öffnen <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Live-Position verfügbar.</p>
                )}
              </Card>

              {/* Lenkzeit */}
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Timer className="w-4 h-4" /> Lenk- & Ruhezeit heute</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Lenkzeit</div>
                    <div className="text-xl font-bold">{fmtDuration(duty?.driving_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Pause</div>
                    <div className="text-xl font-bold">{fmtDuration(duty?.break_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">KM Start</div>
                    <div>{duty?.km_start ?? "–"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">KM Ende</div>
                    <div>{duty?.km_end ?? "–"}</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Touren / Schichten */}
              <Card className="p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Bus className="w-4 h-4" /> Aktuelle & nächste Einsätze</h3>
                {shifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine geplanten Schichten.</p>
                ) : shifts.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {format(new Date(s.shift_date), "EEEE, dd.MM.", { locale: de })}
                      </div>
                      <div className="text-muted-foreground">
                        {fmtTime(s.shift_start)} – {fmtTime(s.shift_end)} · {s.role}
                        {s.dispatch_location ? ` · ${s.dispatch_location}` : ""}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{s.status}</Badge>
                  </div>
                ))}
              </Card>

              {/* Lizenzen + Vorfälle */}
              <div className="space-y-4">
                <Card className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Führerschein & Qualifikation</h3>
                  {licenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine Lizenzdaten hinterlegt.</p>
                  ) : licenses.map((l) => (
                    <div key={l.id} className="text-sm rounded-lg border p-3">
                      <div className="font-medium">Klasse {l.license_class} · {l.license_number}</div>
                      <div className="text-muted-foreground">
                        Gültig bis {format(new Date(l.expires_at), "dd.MM.yyyy", { locale: de })}
                        {l.module_95_expires ? ` · Modul 95 bis ${format(new Date(l.module_95_expires), "dd.MM.yyyy", { locale: de })}` : ""}
                      </div>
                    </div>
                  ))}
                </Card>

                <Card className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Meldungen dieses Fahrers</h3>
                  {incidents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine Vorfälle gemeldet.</p>
                  ) : incidents.map((i) => (
                    <div key={i.id} className="text-sm rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{i.title}</span>
                        <Badge variant={i.severity === "critical" ? "destructive" : "secondary"}>{i.severity}</Badge>
                      </div>
                      <div className="text-muted-foreground whitespace-pre-line">{i.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(i.created_at), "dd.MM.yyyy HH:mm", { locale: de })} · {i.status}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDriverDetail;
