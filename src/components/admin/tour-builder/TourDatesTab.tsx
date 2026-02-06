import { useState } from "react";
import { TourDate, TourTariff } from "@/hooks/useTourBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Plus, Pencil, Trash2, Users, AlertTriangle } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

interface TourDatesTabProps {
  tourId?: string;
  dates: TourDate[];
  tariffs: TourTariff[];
  onCreate: (data: Omit<TourDate, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null }>;
  onUpdate: (id: string, data: Partial<TourDate>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

const statusOptions = [
  { value: 'available', label: 'Buchbar', color: 'bg-emerald-600' },
  { value: 'few_seats', label: 'Wenige Plätze', color: 'bg-amber-600' },
  { value: 'sold_out', label: 'Ausgebucht', color: 'bg-red-600' },
  { value: 'on_request', label: 'Auf Anfrage', color: 'bg-blue-600' },
  { value: 'cancelled', label: 'Abgesagt', color: 'bg-zinc-600' },
];

const emptyDate: Partial<TourDate> = {
  departure_date: format(new Date(), 'yyyy-MM-dd'),
  return_date: format(new Date(), 'yyyy-MM-dd'),
  duration_days: 7,
  price_basic: 199,
  price_smart: 214,
  price_flex: 224,
  price_business: 239,
  total_seats: 45,
  booked_seats: 0,
  status: 'available' as const,
  is_active: true,
  early_bird_discount_percent: 0,
  early_bird_deadline: null,
  promo_code: null,
  promo_discount_percent: 0,
  notes: null,
};

type DateStatus = 'available' | 'few_seats' | 'sold_out' | 'on_request' | 'cancelled';

const TourDatesTab = ({ tourId, dates, tariffs, onCreate, onUpdate, onDelete }: TourDatesTabProps) => {
  const [dialog, setDialog] = useState<{ open: boolean; date: Partial<TourDate> | null; isNew: boolean }>({
    open: false,
    date: null,
    isNew: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!dialog.date || !tourId) return;
    setIsSaving(true);

    try {
      // Calculate duration from dates
      const departure = parseISO(dialog.date.departure_date!);
      const returnD = parseISO(dialog.date.return_date!);
      const duration = differenceInDays(returnD, departure) + 1;

      if (dialog.isNew) {
        await onCreate({
          ...emptyDate,
          ...dialog.date,
          tour_id: tourId,
          duration_days: duration,
        });
      } else {
        const { id, ...updates } = dialog.date;
        await onUpdate(id!, { ...updates, duration_days: duration });
      }
      setDialog({ open: false, date: null, isNew: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diesen Termin wirklich löschen?')) return;
    await onDelete(id);
  };

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return (
      <Badge className={opt?.color || 'bg-zinc-600'}>
        {opt?.label || status}
      </Badge>
    );
  };

  const formatPrice = (price: number | null | undefined) => {
    return price ? `${price.toFixed(0)}€` : '-';
  };

  if (!tourId) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>Bitte speichern Sie zuerst die Basis-Informationen.</p>
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
        <p className="text-zinc-500 mb-4">Bitte erstellen Sie zuerst Tarife, bevor Sie Termine hinzufügen.</p>
        <p className="text-sm text-zinc-600">Die Preise werden pro Tarif und Termin festgelegt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Termine & Preise</h2>
          <p className="text-zinc-500">Reisetermine mit individuellen Preisen je Tarif</p>
        </div>
        <Button
          onClick={() => setDialog({ open: true, date: emptyDate, isNew: true })}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Termin hinzufügen
        </Button>
      </div>

      {/* Dates Table */}
      {dates.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500 mb-4">Noch keine Termine angelegt</p>
            <Button onClick={() => setDialog({ open: true, date: emptyDate, isNew: true })}>
              Ersten Termin hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Reisezeitraum</TableHead>
                <TableHead className="text-zinc-400">Dauer</TableHead>
                <TableHead className="text-zinc-400">Basic</TableHead>
                <TableHead className="text-zinc-400">Smart</TableHead>
                <TableHead className="text-zinc-400">Flex</TableHead>
                <TableHead className="text-zinc-400">Business</TableHead>
                <TableHead className="text-zinc-400">Plätze</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()).map((date) => (
                <TableRow key={date.id} className="border-zinc-800">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {format(parseISO(date.departure_date), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div className="text-xs text-zinc-500">
                        bis {format(parseISO(date.return_date), 'dd.MM.yyyy', { locale: de })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {date.duration_days} Tage
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {formatPrice(date.price_basic)}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {formatPrice(date.price_smart)}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {formatPrice(date.price_flex)}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {formatPrice(date.price_business)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <span className={date.booked_seats >= date.total_seats ? 'text-red-400' : 'text-zinc-400'}>
                        {date.booked_seats}/{date.total_seats}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(date.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ open: true, date, isNew: false })}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(date.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Early Bird / Promo Info */}
      {dates.some(d => d.early_bird_discount_percent && d.early_bird_discount_percent > 0) && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-4">
            <p className="text-amber-400 text-sm">
              💡 Tipp: Frühbucher-Rabatte können pro Termin individuell festgelegt werden.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, date: null, isNew: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.isNew ? 'Termin hinzufügen' : 'Termin bearbeiten'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hinreise *</Label>
                <Input
                  type="date"
                  value={dialog.date?.departure_date || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, departure_date: e.target.value }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Rückreise *</Label>
                <Input
                  type="date"
                  value={dialog.date?.return_date || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, return_date: e.target.value }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            {/* Prices */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Preise pro Person</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Basic (€)</Label>
                    <Input
                      type="number"
                      value={dialog.date?.price_basic || ''}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        date: { ...prev.date, price_basic: parseFloat(e.target.value) || 0 }
                      }))}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Smart (€)</Label>
                    <Input
                      type="number"
                      value={dialog.date?.price_smart || ''}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        date: { ...prev.date, price_smart: parseFloat(e.target.value) || 0 }
                      }))}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Flex (€)</Label>
                    <Input
                      type="number"
                      value={dialog.date?.price_flex || ''}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        date: { ...prev.date, price_flex: parseFloat(e.target.value) || 0 }
                      }))}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Business (€)</Label>
                    <Input
                      type="number"
                      value={dialog.date?.price_business || ''}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        date: { ...prev.date, price_business: parseFloat(e.target.value) || 0 }
                      }))}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacity */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Gesamtplätze</Label>
                <Input
                  type="number"
                  value={dialog.date?.total_seats || 45}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, total_seats: parseInt(e.target.value) || 45 }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Bereits gebucht</Label>
                <Input
                  type="number"
                  value={dialog.date?.booked_seats || 0}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, booked_seats: parseInt(e.target.value) || 0 }
                  }))}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={dialog.date?.status || 'available'}
                  onValueChange={(v: string) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, status: v as TourDate['status'] }
                  }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Early Bird */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Frühbucher-Rabatt (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rabatt (%)</Label>
                    <Input
                      type="number"
                      value={dialog.date?.early_bird_discount_percent || ''}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        date: { ...prev.date, early_bird_discount_percent: parseInt(e.target.value) || 0 }
                      }))}
                      placeholder="z.B. 10"
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Gültig bis</Label>
                    <Input
                      type="date"
                      value={dialog.date?.early_bird_deadline || ''}
                      onChange={(e) => setDialog(prev => ({
                        ...prev,
                        date: { ...prev.date, early_bird_deadline: e.target.value }
                      }))}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Promo-Code (optional)</Label>
                <Input
                  value={dialog.date?.promo_code || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, promo_code: e.target.value }
                  }))}
                  placeholder="z.B. SOMMER25"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Promo-Rabatt (%)</Label>
                <Input
                  type="number"
                  value={dialog.date?.promo_discount_percent || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    date: { ...prev.date, promo_discount_percent: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="z.B. 15"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog({ open: false, date: null, isNew: false })}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !dialog.date?.departure_date || !dialog.date?.return_date}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {dialog.isNew ? 'Hinzufügen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourDatesTab;
