import React, { useState, useEffect } from 'react';
import { Seat, SeatWithStatus, SeatDisplayStatus } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/hooks/useSessionId';
import { cn } from '@/lib/utils';
import { User, Wifi, Plug, Wind, DoorOpen, Bath } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  stops?: { id: string; name: string; stop_order: number }[];
}

interface SeatBookingInfo {
  originName: string;
  destinationName: string;
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
  maxSeats = 1,
  stops = []
}: SeatMapProps) {
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [seatBookingInfo, setSeatBookingInfo] = useState<Record<string, SeatBookingInfo>>({});
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
          origin_stop:origin_stop_id(stop_order, name),
          destination_stop:destination_stop_id(stop_order, name)
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
          origin_stop:origin_stop_id(stop_order, name),
          destination_stop:destination_stop_id(stop_order, name)
        `)
        .eq('trip_id', tripId)
        .gt('expires_at', new Date().toISOString());

      if (holdsError) throw holdsError;

      // Build booking info map for tooltips
      const bookingInfoMap: Record<string, SeatBookingInfo> = {};

      // Determine seat status for each seat
      const seatsWithStatus: SeatWithStatus[] = (allSeats || []).map((seat: Seat) => {
        let status: SeatDisplayStatus = 'available';
        let isSelectable = true;

        // Check if seat is in selected seats
        if (selectedSeats.includes(seat.id)) {
          status = 'selected';
        }

        // Check for overlapping bookings
        const overlappingBooking = bookings?.find((booking: any) => {
          if (booking.seat_id !== seat.id) return false;
          const bookingOrigin = booking.origin_stop?.stop_order || 0;
          const bookingDest = booking.destination_stop?.stop_order || 0;
          // Segments overlap if NOT (one ends before the other starts)
          return !(bookingDest <= originStopOrder || bookingOrigin >= destinationStopOrder);
        });

        if (overlappingBooking) {
          status = 'booked';
          isSelectable = false;
          bookingInfoMap[seat.id] = {
            originName: (overlappingBooking as any).origin_stop?.name || 'Unbekannt',
            destinationName: (overlappingBooking as any).destination_stop?.name || 'Unbekannt'
          };
        }

        // Check for overlapping holds (except our own session)
        const overlappingHold = holds?.find((hold: any) => {
          if (hold.seat_id !== seat.id) return false;
          if (hold.session_id === sessionId) return false; // Our own hold
          const holdOrigin = hold.origin_stop?.stop_order || 0;
          const holdDest = hold.destination_stop?.stop_order || 0;
          return !(holdDest <= originStopOrder || holdOrigin >= destinationStopOrder);
        });

        if (overlappingHold && status !== 'booked') {
          status = 'reserved';
          isSelectable = false;
          bookingInfoMap[seat.id] = {
            originName: (overlappingHold as any).origin_stop?.name || 'Unbekannt',
            destinationName: (overlappingHold as any).destination_stop?.name || 'Unbekannt'
          };
        }

        return {
          ...seat,
          status,
          isSelectable
        };
      });

      setSeatBookingInfo(bookingInfoMap);
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
  const totalRows = rows.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-card rounded-xl p-3 sm:p-4 lg:p-6 shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Sitzplatz wählen</h3>
        
        {/* Legend - responsive layout */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-muted border-2 border-border" />
            <span className="text-muted-foreground">Frei</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-primary border-2 border-primary" />
            <span className="text-muted-foreground">Ausgewählt</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-amber-500/20 border-2 border-amber-500" />
            <span className="text-muted-foreground">Reserviert</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-destructive/20 border-2 border-destructive" />
            <span className="text-muted-foreground">Belegt</span>
          </div>
        </div>

        {/* Bus layout container - scrollable on mobile */}
        <div className="relative bg-gradient-to-b from-muted/30 to-muted/60 rounded-2xl border-2 border-border overflow-hidden">
          {/* Bus exterior styling */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-border to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-border to-transparent" />
          </div>

          {/* Scrollable seat area */}
          <div className="overflow-x-auto">
            <div className="min-w-[280px] p-3 sm:p-4">
              {/* Driver/Front area */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-secondary flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-medium text-muted-foreground">Fahrer</span>
                  </div>
                </div>
                
                {/* Amenities */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary/50 flex items-center justify-center">
                        <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Kostenloses WLAN</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary/50 flex items-center justify-center">
                        <Plug className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Steckdose am Platz</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary/50 flex items-center justify-center">
                        <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Klimaanlage</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Direction indicator */}
              <div className="flex justify-center mb-3">
                <div className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">
                  ← Fenster | Gang | Fenster →
                </div>
              </div>

              {/* Seat rows */}
              <div className="space-y-1.5 sm:space-y-2">
                {rows.map((rowNum, rowIndex) => {
                  const rowSeats = seatsByRow[rowNum].sort((a, b) => a.column_number - b.column_number);
                  const leftSeats = rowSeats.filter(s => s.column_number <= 2);
                  const rightSeats = rowSeats.filter(s => s.column_number > 2);

                  return (
                    <div key={rowNum} className="flex items-center justify-center gap-3 sm:gap-6">
                      {/* Left side seats (window + aisle) */}
                      <div className="flex gap-1 sm:gap-1.5">
                        {[1, 2].map(col => {
                          const seat = leftSeats.find(s => s.column_number === col);
                          return seat ? (
                            <SeatButton
                              key={seat.id}
                              seat={seat}
                              onClick={() => handleSeatClick(seat)}
                              bookingInfo={seatBookingInfo[seat.id]}
                            />
                          ) : (
                            <div key={col} className="w-8 h-8 sm:w-10 sm:h-10" />
                          );
                        })}
                      </div>

                      {/* Aisle with row number */}
                      <div className="w-6 sm:w-8 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/70 bg-muted/50 rounded px-1.5 py-0.5">
                          {rowNum}
                        </span>
                      </div>

                      {/* Right side seats (aisle + window) */}
                      <div className="flex gap-1 sm:gap-1.5">
                        {[3, 4].map(col => {
                          const seat = rightSeats.find(s => s.column_number === col);
                          return seat ? (
                            <SeatButton
                              key={seat.id}
                              seat={seat}
                              onClick={() => handleSeatClick(seat)}
                              bookingInfo={seatBookingInfo[seat.id]}
                            />
                          ) : (
                            <div key={col} className="w-8 h-8 sm:w-10 sm:h-10" />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WC/Emergency exit area at the back */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t-2 border-dashed border-border/60">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-lg cursor-default">
                      <Bath className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">WC</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bordtoilette</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-lg cursor-default">
                      <DoorOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">Notausgang</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notausgang</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Info text */}
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
          Reservierung gilt für 10 Minuten. Preis kann bei hoher Auslastung steigen.
        </p>
      </div>
    </TooltipProvider>
  );
}

interface SeatButtonProps {
  seat: SeatWithStatus;
  onClick: () => void;
  bookingInfo?: SeatBookingInfo;
}

function SeatButton({ seat, onClick, bookingInfo }: SeatButtonProps) {
  const statusStyles: Record<SeatDisplayStatus, string> = {
    available: 'bg-muted border-border hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer shadow-sm',
    selected: 'bg-primary border-primary text-primary-foreground cursor-pointer shadow-md ring-2 ring-primary/30 scale-105',
    reserved: 'bg-amber-500/20 border-amber-500/70 text-amber-700 dark:text-amber-400 cursor-not-allowed',
    booked: 'bg-destructive/20 border-destructive/70 text-destructive cursor-not-allowed'
  };

  const getTooltipContent = () => {
    if (seat.status === 'booked' && bookingInfo) {
      return `Belegt für ${bookingInfo.originName} → ${bookingInfo.destinationName}`;
    }
    if (seat.status === 'reserved' && bookingInfo) {
      return `Reserviert für ${bookingInfo.originName} → ${bookingInfo.destinationName}`;
    }
    if (seat.status === 'reserved') {
      return 'Von anderem Nutzer reserviert';
    }
    if (seat.status === 'booked') {
      return 'Bereits gebucht';
    }
    if (seat.status === 'selected') {
      return `Sitz ${seat.seat_number} (ausgewählt) - Klicken zum Abwählen`;
    }
    return `Sitz ${seat.seat_number} - Klicken zum Auswählen`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={!seat.isSelectable && seat.status !== 'selected'}
          className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center',
            'text-[10px] sm:text-xs font-semibold transition-all duration-150',
            statusStyles[seat.status]
          )}
          aria-label={getTooltipContent()}
        >
          {seat.seat_number}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-center">
        <p className="text-xs">{getTooltipContent()}</p>
      </TooltipContent>
    </Tooltip>
  );
}