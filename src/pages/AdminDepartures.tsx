import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Bus, Download, ArrowLeft, Loader2, Users, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const AdminDepartures = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [dates, setDates] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && isAdmin) loadData();
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    const [datesRes, toursRes, bookingsRes] = await Promise.all([
      supabase.from("tour_dates").select("*").order("departure_date", { ascending: true }),
      supabase.from("package_tours").select("id, destination, location, country"),
      supabase.from("tour_bookings").select("*").neq("status", "cancelled"),
    ]);
    setDates(datesRes.data || []);
    setTours(toursRes.data || []);
    setBookings(bookingsRes.data || []);
    setIsLoading(false);
  };

  const getTour = (tourId: string) => tours.find((t: any) => t.id === tourId);
  const getBookingsForDate = (dateId: string) => bookings.filter((b: any) => b.tour_date_id === dateId);

  const exportPassengerList = (dateEntry: any) => {
    const tour = getTour(dateEntry.tour_id);
    const dateBookings = getBookingsForDate(dateEntry.id);
    
    let passengers: string[] = [];
    dateBookings.forEach((b: any) => {
      const details = Array.isArray(b.passenger_details) ? b.passenger_details : [];
      if (details.length > 0) {
        details.forEach((p: any, i: number) => {
          passengers.push(`${i + 1};${p.firstName || p.first_name || b.contact_first_name};${p.lastName || p.last_name || b.contact_last_name};${b.booking_number};${b.contact_phone || ""}`);
        });
      } else {
        passengers.push(`1;${b.contact_first_name};${b.contact_last_name};${b.booking_number};${b.contact_phone || ""}`);
      }
    });

    const csv = [
      `Passagierliste – ${tour?.destination || "Reise"} – ${format(new Date(dateEntry.departure_date), "dd.MM.yyyy")}`,
      "",
      "Nr;Vorname;Nachname;Buchung;Telefon",
      ...passengers
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `passagierliste-${tour?.destination || "reise"}-${dateEntry.departure_date}.csv`;
    a.click();
    toast({ title: "✅ Passagierliste exportiert" });
  };

  if (authLoading || isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  if (!user || !isAdmin) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Kein Zugriff</div>;

  const upcomingDates = dates.filter(d => new Date(d.departure_date) >= new Date());
  const pastDates = dates.filter(d => new Date(d.departure_date) < new Date());

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")} className="text-zinc-400"><ArrowLeft className="w-4 h-4 mr-1" /> Admin</Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Bus className="w-6 h-6 text-emerald-400" /> Abfahrten</h1>
            <p className="text-sm text-zinc-500">{upcomingDates.length} kommende • {pastDates.length} vergangene</p>
          </div>
        </div>

        {/* Upcoming */}
        <h2 className="text-lg font-semibold mb-3 text-white">Kommende Abfahrten</h2>
        <div className="space-y-3 mb-8">
          {upcomingDates.length === 0 ? (
            <p className="text-zinc-500 text-sm">Keine kommenden Abfahrten</p>
          ) : (
            upcomingDates.map((d: any) => {
              const tour = getTour(d.tour_id);
              const dateBookings = getBookingsForDate(d.id);
              const pax = dateBookings.reduce((s: number, b: any) => s + b.participants, 0);
              return (
                <Card key={d.id} className={`bg-zinc-900 border-zinc-800 cursor-pointer hover:border-emerald-600/50 transition-colors ${selectedDate?.id === d.id ? "border-emerald-600" : ""}`} onClick={() => setSelectedDate(d)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-600/20 p-3 rounded-lg">
                          <Bus className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{tour?.destination || "–"} <span className="text-zinc-500 font-normal">({tour?.country})</span></div>
                          <div className="text-sm text-zinc-400">{format(new Date(d.departure_date), "dd.MM.yyyy", { locale: de })} – {format(new Date(d.return_date), "dd.MM.yyyy", { locale: de })}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm"><span className="text-emerald-400 font-bold">{pax}</span><span className="text-zinc-500">/{d.total_seats}</span></div>
                          <div className="text-xs text-zinc-500">Passagiere</div>
                        </div>
                        <Badge className={pax >= d.total_seats ? "bg-red-600" : pax > d.total_seats * 0.7 ? "bg-amber-600" : "bg-emerald-600"}>
                          {Math.round((pax / d.total_seats) * 100)}%
                        </Badge>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={(e) => { e.stopPropagation(); exportPassengerList(d); }}>
                          <Download className="w-3 h-3 mr-1" /> Liste
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Selected departure detail */}
        {selectedDate && (
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">Passagierliste – {getTour(selectedDate.tour_id)?.destination} – {format(new Date(selectedDate.departure_date), "dd.MM.yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              {getBookingsForDate(selectedDate.id).length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">Keine Buchungen</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">#</TableHead>
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Buchung</TableHead>
                      <TableHead className="text-zinc-400">Personen</TableHead>
                      <TableHead className="text-zinc-400">Telefon</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getBookingsForDate(selectedDate.id).map((b: any, i: number) => (
                      <TableRow key={b.id} className="border-zinc-800 cursor-pointer hover:bg-zinc-800" onClick={() => navigate(`/admin/booking/${b.id}`)}>
                        <TableCell className="text-zinc-500">{i + 1}</TableCell>
                        <TableCell className="text-white font-medium">{b.contact_first_name} {b.contact_last_name}</TableCell>
                        <TableCell className="text-emerald-400 font-mono">{b.booking_number}</TableCell>
                        <TableCell className="text-zinc-300">{b.participants}x</TableCell>
                        <TableCell className="text-zinc-400">{b.contact_phone || "–"}</TableCell>
                        <TableCell><Badge className={b.status === "confirmed" ? "bg-emerald-600" : "bg-amber-600"}>{b.status === "confirmed" ? "Bezahlt" : "Offen"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Past */}
        <h2 className="text-lg font-semibold mb-3 text-zinc-400">Vergangene Abfahrten</h2>
        <div className="space-y-2">
          {pastDates.slice(0, 10).map((d: any) => {
            const tour = getTour(d.tour_id);
            const pax = getBookingsForDate(d.id).reduce((s: number, b: any) => s + b.participants, 0);
            return (
              <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <Bus className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">{tour?.destination}</span>
                  <span className="text-zinc-500 text-sm">{format(new Date(d.departure_date), "dd.MM.yyyy")}</span>
                </div>
                <span className="text-zinc-400 text-sm">{pax} Pax</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDepartures;
