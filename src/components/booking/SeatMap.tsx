import { useState, useEffect } from 'react';
import { Seat, SeatWithStatus, SeatDisplayStatus, Stop } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/hooks/useSessionId';
import { cn } from '@/lib/utils';
import { User, Wifi, Plug, Wind } from 'lucide-react';
import { toast } from 'sonner';

interface SeatMapProps {
  tripId: string;
  busId: string;
  originStopId: string;
  destinationStopId: string;
  originStopOrder: number;
  destinationStopOrder: number;
  selectedSeats: string[];
  onSeatSelect: (seatId: string, seatNumber: string) => void;
  maxSeats?: number;
}

export default function SeatMap({
  tripId,
  busId,
  originStopId,
  destinationStopId,
  originStopOrder,
  destinationStopOrder,
  selectedSeats,
  onSeatSelect,
  maxSeats = 1
}: SeatMapProps) {
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = getSessionId();

  useEffect(() => {
    loadSeats();
    
    // Set up realtime subscription for seat changes
    const channel = supabase
      .channel(`seats-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seat_holds',
        filter: `trip_id=eq.${tripId}`
      }, () => {
        loadSeats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `trip_id=eq.${tripId}`
      }, () => {
        loadSeats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, busId, originStopOrder, destinationStopOrder]);

  const loadSeats = async () => {
    try {
      // Fetch all seats for this bus
      const { data: allSeats, error: seatsError } = await supabase
        .from('seats')
        .select('*')
        .eq('bus_id', busId)
        .eq('is_active', true)
        .order('row_number')
        .order('column_number');

      if (seatsError) throw seatsError;

      // Fetch bookings that overlap with our segment
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          seat_id,
          origin_stop:origin_stop_id(stop_order),
          destination_stop:destination_stop_id(stop_order)
        `)
        .eq('trip_id', tripId)
        .in('status', ['pending', 'confirmed']);

      if (bookingsError) throw bookingsError;

      // Fetch active seat holds that overlap with our segment
      const { data: holds, error: holdsError } = await supabase
        .from('seat_holds')
        .select(`
          seat_id,
          session_id,
          origin_stop:origin_stop_id(stop_order),
          destination_stop:destination_stop_id(stop_order)
        `)
        .eq('trip_id', tripId)
        .gt('expires_at', new Date().toISOString());

      if (holdsError) throw holdsError;

      // Determine seat status for each seat
      const seatsWithStatus: SeatWithStatus[] = (allSeats || []).map((seat: Seat) => {
        let status: SeatDisplayStatus = 'available';
        let isSelectable = true;

        // Check if seat is in selected seats
        if (selectedSeats.includes(seat.id)) {
          status = 'selected';
        }

        // Check for overlapping bookings
        const hasOverlappingBooking = bookings?.some((booking: any) => {
          if (booking.seat_id !== seat.id) return false;
          const bookingOrigin = booking.origin_stop?.stop_order || 0;
          const bookingDest = booking.destination_stop?.stop_order || 0;
          // Segments overlap if NOT (one ends before the other starts)
          return !(bookingDest <= originStopOrder || bookingOrigin >= destinationStopOrder);
        });

        if (hasOverlappingBooking) {
          status = 'booked';
          isSelectable = false;
        }

        // Check for overlapping holds (except our own session)
        const hasOverlappingHold = holds?.some((hold: any) => {
          if (hold.seat_id !== seat.id) return false;
          if (hold.session_id === sessionId) return false; // Our own hold
          const holdOrigin = hold.origin_stop?.stop_order || 0;
          const holdDest = hold.destination_stop?.stop_order || 0;
          return !(holdDest <= originStopOrder || holdOrigin >= destinationStopOrder);
        });

        if (hasOverlappingHold && status !== 'booked') {
          status = 'reserved';
          isSelectable = false;
        }

        return {
          ...seat,
          status,
          isSelectable
        };
      });

      setSeats(seatsWithStatus);
    } catch (error) {
      console.error('Error loading seats:', error);
      toast.error('Fehler beim Laden der Sitzplätze');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = async (seat: SeatWithStatus) => {
    if (!seat.isSelectable && seat.status !== 'selected') {
      return;
    }

    // If already selected, remove the hold
    if (seat.status === 'selected' || selectedSeats.includes(seat.id)) {
      // Remove hold
      await supabase
        .from('seat_holds')
        .delete()
        .eq('trip_id', tripId)
        .eq('seat_id', seat.id)
        .eq('session_id', sessionId);
      
      onSeatSelect(seat.id, seat.seat_number);
      return;
    }

    // Check if max seats reached
    if (selectedSeats.length >= maxSeats) {
      toast.error(`Sie können maximal ${maxSeats} Sitzplätze auswählen`);
      return;
    }

    // Create a hold for this seat
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute hold

    const { error } = await supabase
      .from('seat_holds')
      .insert({
        trip_id: tripId,
        seat_id: seat.id,
        origin_stop_id: originStopId,
        destination_stop_id: destinationStopId,
        session_id: sessionId,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Error creating seat hold:', error);
      toast.error('Dieser Sitzplatz ist leider nicht mehr verfügbar');
      loadSeats(); // Refresh seats
      return;
    }

    onSeatSelect(seat.id, seat.seat_number);
    loadSeats();
  };

  // Group seats by row
  const seatsByRow: Record<number, SeatWithStatus[]> = {};
  seats.forEach(seat => {
    if (!seatsByRow[seat.row_number]) {
      seatsByRow[seat.row_number] = [];
    }
    seatsByRow[seat.row_number].push(seat);
  });

  const rows = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 lg:p-6 shadow-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Sitzplatz wählen</h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted border border-border" />
          <span className="text-muted-foreground">Frei</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary border border-primary" />
          <span className="text-muted-foreground">Ausgewählt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500" />
          <span className="text-muted-foreground">Reserviert</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-destructive/20 border border-destructive" />
          <span className="text-muted-foreground">Belegt</span>
        </div>
      </div>

      {/* Bus layout */}
      <div className="relative bg-muted/50 rounded-xl p-4 overflow-x-auto">
        {/* Driver area */}
        <div className="flex items-center justify-center mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="text-sm font-medium">Fahrer</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wifi className="w-4 h-4" />
              <span>WiFi</span>
            </div>
            <div className="flex items-center gap-1">
              <Plug className="w-4 h-4" />
              <span>Steckdose</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-4 h-4" />
              <span>Klima</span>
            </div>
          </div>
        </div>

        {/* Seat rows */}
        <div className="space-y-2">
          {rows.map(rowNum => {
            const rowSeats = seatsByRow[rowNum].sort((a, b) => a.column_number - b.column_number);
            const leftSeats = rowSeats.filter(s => s.column_number <= 2);
            const rightSeats = rowSeats.filter(s => s.column_number > 2);

            return (
              <div key={rowNum} className="flex items-center justify-center gap-8">
                {/* Left side seats */}
                <div className="flex gap-2">
                  {leftSeats.map(seat => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      onClick={() => handleSeatClick(seat)}
                    />
                  ))}
                </div>

                {/* Aisle */}
                <div className="w-8 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{rowNum}</span>
                </div>

                {/* Right side seats */}
                <div className="flex gap-2">
                  {rightSeats.map(seat => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      onClick={() => handleSeatClick(seat)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* WC area at the back */}
        <div className="flex items-center justify-center mt-6 pt-4 border-t border-border">
          <div className="px-4 py-2 bg-secondary/50 rounded-lg text-xs text-muted-foreground">
            WC / Notausgang
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Reservierung gilt für 10 Minuten. Preis kann bei hoher Auslastung steigen.
      </p>
    </div>
  );
}

function SeatButton({ seat, onClick }: { seat: SeatWithStatus; onClick: () => void }) {
  const statusStyles: Record<SeatDisplayStatus, string> = {
    available: 'bg-muted border-border hover:border-primary hover:bg-primary/10 cursor-pointer',
    selected: 'bg-primary border-primary text-primary-foreground cursor-pointer',
    reserved: 'bg-amber-500/20 border-amber-500 cursor-not-allowed',
    booked: 'bg-destructive/20 border-destructive cursor-not-allowed'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!seat.isSelectable && seat.status !== 'selected'}
      className={cn(
        'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all',
        statusStyles[seat.status]
      )}
      title={seat.status === 'booked' ? 'Bereits gebucht' : seat.status === 'reserved' ? 'Von anderem Nutzer reserviert' : `Sitz ${seat.seat_number}`}
    >
      {seat.seat_number}
    </button>
  );
}
