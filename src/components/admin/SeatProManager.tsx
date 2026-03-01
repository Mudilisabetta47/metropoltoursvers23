import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Lock, Unlock, Download, AlertTriangle, CheckCircle,
  Loader2, UserX
} from "lucide-react";

interface SeatProManagerProps {
  tourDateId?: string;
  tourId?: string;
}

interface SeatAssignment {
  bookingId: string;
  bookingNumber: string;
  passengerName: string;
  seatNumber: string | null;
  participants: number;
  passengerDetails: any[];
}

interface SeatConflict {
  seatNumber: string;
  bookings: string[];
}

const SeatProManager = ({ tourDateId, tourId }: SeatProManagerProps) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<SeatAssignment[]>([]);
  const [conflicts, setConflicts] = useState<SeatConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    if (tourDateId) loadBookings();
  }, [tourDateId]);

  const loadBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tour_bookings")
      .select("id, booking_number, contact_first_name, contact_last_name, participants, passenger_details")
      .eq("tour_date_id", tourDateId!)
      .in("status", ["pending", "confirmed"])
      .order("created_at");

    const assignments: SeatAssignment[] = (data || []).map((b: any) => ({
      bookingId: b.id,
      bookingNumber: b.booking_number,
      passengerName: `${b.contact_first_name} ${b.contact_last_name}`,
      seatNumber: null, // Seat logic - in tour context seats are bus-independent
      participants: b.participants,
      passengerDetails: b.passenger_details,
    }));

    // Load existing seat assignments from passenger_details
    assignments.forEach(a => {
      if (Array.isArray(a.passengerDetails)) {
        a.passengerDetails.forEach(p => {
          if (p?.seat_number) a.seatNumber = p.seat_number;
        });
      }
    });

    setBookings(assignments);
    checkConflicts(assignments);
    setLoading(false);
  };

  const checkConflicts = (assignments: SeatAssignment[]) => {
    // Check for seat conflicts (same seat assigned to multiple bookings)
    const seatMap: Record<string, string[]> = {};
    assignments.forEach(a => {
      if (a.seatNumber) {
        if (!seatMap[a.seatNumber]) seatMap[a.seatNumber] = [];
        seatMap[a.seatNumber].push(a.bookingNumber);
      }
    });
    const conflictList = Object.entries(seatMap)
      .filter(([_, bks]) => bks.length > 1)
      .map(([seat, bks]) => ({ seatNumber: seat, bookings: bks }));
    setConflicts(conflictList);
  };

  const autoAssignSeats = async () => {
    setAutoAssigning(true);
    try {
      // Simple auto-assignment: assign sequential seats, keep groups together
      let seatCounter = 1;
      const updates: { id: string; details: any[] }[] = [];

      for (const booking of bookings) {
        const details = Array.isArray(booking.passengerDetails) ? [...booking.passengerDetails] : [];

        // Assign seats to each participant in the group
        for (let i = 0; i < booking.participants; i++) {
          const seatNum = `S${String(seatCounter).padStart(2, "0")}`;
          if (details[i]) {
            details[i].seat_number = seatNum;
          } else {
            details.push({ seat_number: seatNum });
          }
          seatCounter++;
        }

        updates.push({ id: booking.bookingId, details });
      }

      // Save all updates
      for (const u of updates) {
        await supabase
          .from("tour_bookings")
          .update({ passenger_details: u.details as any })
          .eq("id", u.id);
      }

      toast({ title: `✅ ${seatCounter - 1} Sitzplätze automatisch zugewiesen` });
      loadBookings();
    } catch (err) {
      toast({ title: "Fehler bei der Sitzplatzzuweisung", variant: "destructive" });
    }
    setAutoAssigning(false);
  };

  const exportSeatPlan = () => {
    const rows = ["Sitzplatz;Passagier;Buchung;Teilnehmer"];
    bookings.forEach(b => {
      rows.push(`${b.seatNumber || "–"};${b.passengerName};${b.bookingNumber};${b.participants}`);
    });
    const csv = rows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sitzplan_${tourDateId?.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDriverList = () => {
    const rows = ["Nr;Name;Buchungsnr;Teilnehmer;Sitzplatz"];
    bookings.forEach((b, i) => {
      rows.push(`${i + 1};${b.passengerName};${b.bookingNumber};${b.participants};${b.seatNumber || "–"}`);
    });
    const csv = rows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fahrerliste_${tourDateId?.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>;
  }

  const totalPax = bookings.reduce((s, b) => s + b.participants, 0);
  const unassigned = bookings.filter(b => !b.seatNumber).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-3 pb-3">
            <div className="text-2xl font-bold text-white">{bookings.length}</div>
            <div className="text-xs text-zinc-500">Buchungen</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-3 pb-3">
            <div className="text-2xl font-bold text-white">{totalPax}</div>
            <div className="text-xs text-zinc-500">Passagiere</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-3 pb-3">
            <div className={`text-2xl font-bold ${unassigned > 0 ? "text-amber-400" : "text-emerald-400"}`}>{unassigned}</div>
            <div className="text-xs text-zinc-500">Ohne Sitzplatz</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-3 pb-3">
            <div className={`text-2xl font-bold ${conflicts.length > 0 ? "text-red-400" : "text-emerald-400"}`}>{conflicts.length}</div>
            <div className="text-xs text-zinc-500">Konflikte</div>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card className="bg-red-950/30 border-red-800/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">Sitzplatz-Konflikte</span>
            </div>
            {conflicts.map(c => (
              <div key={c.seatNumber} className="text-xs text-red-400 ml-6">
                Sitz {c.seatNumber}: {c.bookings.join(", ")}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={autoAssignSeats} disabled={autoAssigning}>
          {autoAssigning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Users className="w-3 h-3 mr-1" />}
          Auto-Sitzplätze (Gruppen zusammen)
        </Button>
        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={exportSeatPlan}>
          <Download className="w-3 h-3 mr-1" /> Sitzplan CSV
        </Button>
        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={exportDriverList}>
          <Download className="w-3 h-3 mr-1" /> Fahrerliste CSV
        </Button>
      </div>

      {/* Booking List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-4">
          <div className="space-y-1.5">
            {bookings.map((b, idx) => (
              <div key={b.bookingId} className="flex items-center justify-between p-2 rounded bg-zinc-800/50 border border-zinc-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-6">{idx + 1}</span>
                  <div>
                    <div className="text-sm text-white font-medium">{b.passengerName}</div>
                    <div className="text-[11px] text-zinc-500">{b.bookingNumber} · {b.participants} Pax</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.seatNumber ? (
                    <Badge className="bg-emerald-600/20 text-emerald-400">{b.seatNumber}</Badge>
                  ) : (
                    <Badge className="bg-zinc-700/50 text-zinc-400">Kein Sitz</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatProManager;
