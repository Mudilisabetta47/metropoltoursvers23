import { useNavigate } from "react-router-dom";
import { 
  Calendar, Users, Bus, Luggage,
  Minus, Plus, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ExtendedPackageTour, TourDate, TourTariff } from "@/hooks/useTourBuilder";

interface TourStickySidebarProps {
  tour: ExtendedPackageTour;
  selectedDate: TourDate | null;
  selectedTariff: TourTariff | null;
  tariffs: TourTariff[];
  participants: number;
  availableSeats: number;
  lowestPrice: number;
  onParticipantsChange: (n: number) => void;
  onSelectTariff: (t: TourTariff) => void;
}

const TourStickySidebar = ({
  tour,
  selectedDate,
  selectedTariff,
  tariffs,
  participants,
  availableSeats,
  lowestPrice,
  onParticipantsChange,
  onSelectTariff,
}: TourStickySidebarProps) => {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  const calculatePrice = () => {
    if (!selectedDate || !selectedTariff) return lowestPrice;
    
    const basePrice = selectedTariff.slug === 'basic' ? selectedDate.price_basic :
                      selectedTariff.slug === 'smart' ? (selectedDate.price_smart || selectedDate.price_basic) :
                      selectedTariff.slug === 'flex' ? (selectedDate.price_flex || selectedDate.price_basic) :
                      (selectedDate.price_business || selectedDate.price_basic);
    
    return basePrice + selectedTariff.price_modifier;
  };

  const pricePerPerson = calculatePrice();
  const totalPrice = pricePerPerson * participants;

  const handleBooking = () => {
    // Navigate to booking flow with selected options
    const params = new URLSearchParams({
      tour: tour.id,
      date: selectedDate?.id || '',
      tariff: selectedTariff?.id || '',
      pax: participants.toString(),
    });
    navigate(`/checkout?${params.toString()}`);
  };

  return (
    <div className="sticky top-4">
      <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b pb-4">
          <h3 className="text-lg font-bold text-foreground">Dein Angebot:</h3>
        </CardHeader>
        
        <CardContent className="p-5 space-y-4">
          {/* Duration & Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                {selectedDate ? (
                  <>
                    {tour.duration_days || selectedDate.duration_days} Tage ab {formatDate(selectedDate.departure_date)}
                  </>
                ) : (
                  <>{tour.duration_days} Tage</>
                )}
              </p>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  Rückreise: {formatDate(selectedDate.return_date)}
                </p>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">{participants} Personen</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onParticipantsChange(Math.max(1, participants - 1))}
                disabled={participants <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{participants}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onParticipantsChange(Math.min(availableSeats || 10, participants + 1))}
                disabled={participants >= (availableSeats || 10)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tariff Selection */}
          <div className="flex items-start gap-3">
            <Luggage className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <Select
                value={selectedTariff?.id || ''}
                onValueChange={(id) => {
                  const tariff = tariffs.find(t => t.id === id);
                  if (tariff) onSelectTariff(tariff);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tarif wählen" />
                </SelectTrigger>
                <SelectContent>
                  {tariffs.map(tariff => (
                    <SelectItem key={tariff.id} value={tariff.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tariff.name}</span>
                        {tariff.is_recommended && (
                          <Badge variant="secondary" className="text-xs">Empfohlen</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTariff && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTariff.suitcase_included 
                    ? `Inkl. Koffer bis ${selectedTariff.suitcase_weight_kg || 20}kg`
                    : 'Nur Handgepäck'}
                </p>
              )}
            </div>
          </div>

          {/* Bus Icon */}
          <div className="flex items-center gap-3">
            <Bus className="w-5 h-5 text-primary" />
            <p className="text-sm text-foreground">Busreise mit METROPOL TOURS</p>
          </div>

          <Separator />

          {/* Price */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-end justify-between mb-1">
              <span className="text-sm text-muted-foreground">pro Person ab</span>
              <span className="text-3xl font-bold text-primary">{pricePerPerson.toFixed(0)} €</span>
            </div>
            {participants > 1 && (
              <div className="flex items-end justify-between">
                <span className="text-sm text-muted-foreground">Gesamtpreis ({participants} Pers.)</span>
                <span className="text-lg font-semibold text-foreground">{totalPrice.toFixed(0)} €</span>
              </div>
            )}
          </div>

          {/* Availability */}
          {selectedDate && availableSeats > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                availableSeats > 10 ? 'bg-emerald-500' : 
                availableSeats > 3 ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className={
                availableSeats > 10 ? 'text-emerald-600' : 
                availableSeats > 3 ? 'text-amber-600' : 'text-red-600'
              }>
                {availableSeats > 10 
                  ? 'Ausreichend Plätze verfügbar'
                  : `Nur noch ${availableSeats} Plätze frei!`}
              </span>
            </div>
          )}

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="w-full bg-primary hover:bg-primary-dark text-lg font-semibold py-6 shadow-lg"
            onClick={handleBooking}
            disabled={!selectedDate}
          >
            {selectedDate ? 'Jetzt buchen' : 'Termin auswählen'}
          </Button>

          {/* Trust Signals */}
          <div className="text-center text-xs text-muted-foreground">
            <p>✓ Sichere Zahlung • ✓ Bestpreis-Garantie</p>
          </div>
        </CardContent>
      </Card>

      {/* Early Bird Notice */}
      {selectedDate?.early_bird_discount_percent && selectedDate.early_bird_discount_percent > 0 && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">
                  Frühbucher-Rabatt: {selectedDate.early_bird_discount_percent}%
                </p>
                {selectedDate.early_bird_deadline && (
                  <p className="text-sm text-amber-700">
                    Gültig bis {formatDate(selectedDate.early_bird_deadline)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TourStickySidebar;
