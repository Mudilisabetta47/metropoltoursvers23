import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Loader2, Lock, Tag, Truck, CheckCircle2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/seo/SEO";
import ShopImage from "@/components/shop/ShopImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatEur } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  free_above: number | null;
  delivery_time: string | null;
}

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description: string | null;
  surcharge: number;
}

const emptyAddress = {
  first_name: "", last_name: "", company: "", street: "", house_number: "", zip: "", city: "", country: "Deutschland",
};

const ShopCheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [shippingId, setShippingId] = useState<string>("");
  const [paymentCode, setPaymentCode] = useState<string>("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billing, setBilling] = useState({ ...emptyAddress });
  const [shipping, setShipping] = useState({ ...emptyAddress });
  const [shippingSame, setShippingSame] = useState(true);
  const [note, setNote] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [terms, setTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: sm }, { data: pm }] = await Promise.all([
        supabase.from("shop_shipping_methods").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("shop_payment_methods").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setShippingMethods((sm ?? []) as ShippingMethod[]);
      setPaymentMethods((pm ?? []) as PaymentMethod[]);
      if (sm?.[0]) setShippingId(sm[0].id);
      if (pm?.[0]) setPaymentCode(pm[0].code);
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.email) setEmail((e) => e || user.email!);
    if (profile) {
      setBilling((b) => ({
        ...b,
        first_name: b.first_name || profile.first_name || "",
        last_name: b.last_name || profile.last_name || "",
      }));
      setPhone((p) => p || profile.phone || "");
    }
  }, [user, profile]);

  const selectedShipping = shippingMethods.find((s) => s.id === shippingId) ?? null;
  const shippingCost = useMemo(() => {
    if (!selectedShipping) return 0;
    if (selectedShipping.free_above !== null && subtotal >= Number(selectedShipping.free_above)) return 0;
    return Number(selectedShipping.price);
  }, [selectedShipping, subtotal]);

  const surcharge = Number(paymentMethods.find((p) => p.code === paymentCode)?.surcharge ?? 0);
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, Math.round((subtotal - discount + shippingCost + surcharge) * 100) / 100);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    const { data, error } = await supabase.rpc("validate_shop_coupon", { _code: code, _subtotal: subtotal });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row?.valid) {
      setCoupon(null);
      toast.error(row?.error || "Gutscheincode ungültig");
      return;
    }
    const value = row.percent_off ? (subtotal * Number(row.percent_off)) / 100 : Number(row.amount_off ?? 0);
    setCoupon({ code: row.code, discount: Math.min(Math.round(value * 100) / 100, subtotal) });
    toast.success("Gutschein angewendet");
  };

  const submit = async () => {
    if (items.length === 0) return;
    if (!terms) {
      toast.error("Bitte akzeptiere AGB und Widerrufsbelehrung.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Bitte gib eine gültige E-Mail-Adresse an.");
      return;
    }
    for (const field of ["first_name", "last_name", "street", "zip", "city"] as const) {
      if (!billing[field].trim()) {
        toast.error("Bitte fülle die Rechnungsadresse vollständig aus.");
        return;
      }
    }
    setIsSubmitting(true);
    const { data, error } = await supabase.functions.invoke("shop-create-order", {
      body: {
        email,
        phone,
        billing_address: billing,
        shipping_address: shipping,
        shipping_same: shippingSame,
        shipping_method_id: shippingId || null,
        payment_method: paymentCode,
        coupon_code: coupon?.code ?? null,
        customer_note: note,
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
      },
    });
    setIsSubmitting(false);

    if (error || !data?.success) {
      toast.error(data?.error || "Bestellung konnte nicht abgeschlossen werden.");
      return;
    }
    clearCart();
    navigate(`/shop/bestellung/${data.order_number}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Dein Warenkorb ist leer</h1>
          <Button asChild className="mt-6"><Link to="/shop">Zum Shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const AddressFields = ({ value, onChange, idPrefix }: { value: typeof emptyAddress; onChange: (v: typeof emptyAddress) => void; idPrefix: string }) => (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor={`${idPrefix}-fn`}>Vorname *</Label>
        <Input id={`${idPrefix}-fn`} value={value.first_name} onChange={(e) => onChange({ ...value, first_name: e.target.value })} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-ln`}>Nachname *</Label>
        <Input id={`${idPrefix}-ln`} value={value.last_name} onChange={(e) => onChange({ ...value, last_name: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-co`}>Firma (optional)</Label>
        <Input id={`${idPrefix}-co`} value={value.company} onChange={(e) => onChange({ ...value, company: e.target.value })} />
      </div>
      <div className="sm:col-span-2 grid grid-cols-[1fr_100px] gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-st`}>Straße *</Label>
          <Input id={`${idPrefix}-st`} value={value.street} onChange={(e) => onChange({ ...value, street: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-hn`}>Nr.</Label>
          <Input id={`${idPrefix}-hn`} value={value.house_number} onChange={(e) => onChange({ ...value, house_number: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-zip`}>PLZ *</Label>
        <Input id={`${idPrefix}-zip`} value={value.zip} onChange={(e) => onChange({ ...value, zip: e.target.value })} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-city`}>Ort *</Label>
        <Input id={`${idPrefix}-city`} value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-country`}>Land</Label>
        <Input id={`${idPrefix}-country`} value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Kasse" description="Sicher bezahlen im METROPOL TOURS Shop." path="/shop/kasse" noindex />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Kasse</h1>
        <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Sichere SSL-verschlüsselte Übertragung
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!user && (
              <div className="rounded-2xl border border-border p-5 flex flex-wrap items-center justify-between gap-3 bg-muted/40">
                <p className="text-sm text-muted-foreground">Du bestellst als Gast. Mit Konto siehst du deine Bestellungen jederzeit.</p>
                <Button variant="outline" size="sm" asChild><Link to="/auth">Anmelden / Registrieren</Link></Button>
              </div>
            )}

            <section className="rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Kontakt</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="co-email">E-Mail *</Label>
                  <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="co-phone">Telefon</Label>
                  <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Rechnungsadresse</h2>
              <AddressFields value={billing} onChange={setBilling} idPrefix="bill" />
              <div className="flex items-center gap-2 mt-5">
                <Checkbox id="same-address" checked={shippingSame} onCheckedChange={(v) => setShippingSame(!!v)} />
                <Label htmlFor="same-address" className="font-normal cursor-pointer">Lieferadresse entspricht der Rechnungsadresse</Label>
              </div>
            </section>

            {!shippingSame && (
              <section className="rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Lieferadresse</h2>
                <AddressFields value={shipping} onChange={setShipping} idPrefix="ship" />
              </section>
            )}

            <section className="rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Truck className="w-4 h-4" /> Versand</h2>
              <div className="space-y-3">
                {shippingMethods.map((m) => {
                  const free = m.free_above !== null && subtotal >= Number(m.free_above);
                  return (
                    <button
                      key={m.id}
                      onClick={() => setShippingId(m.id)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 flex items-center justify-between gap-3 transition-colors",
                        shippingId === m.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                      )}
                    >
                      <div>
                        <p className="font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.delivery_time} {m.description ? `· ${m.description}` : ""}</p>
                      </div>
                      <span className="font-semibold text-foreground">{free ? "Gratis" : formatEur(m.price)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Zahlungsart</h2>
              {paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground">Derzeit ist keine Zahlungsart aktiv. Bitte kontaktiere uns.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {paymentMethods.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPaymentCode(p.code)}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-colors",
                        paymentCode === p.code ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
                      )}
                    >
                      <p className="font-medium text-foreground">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                      {Number(p.surcharge) > 0 && <p className="text-xs text-muted-foreground mt-1">+ {formatEur(p.surcharge)}</p>}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Anmerkung zur Bestellung</h2>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="Optional" />
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit lg:sticky lg:top-24 rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Deine Bestellung</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={`${i.product_id}-${i.variant_id ?? "base"}`} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    <ShopImage src={i.image} alt={i.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.quantity} × {formatEur(i.unit_price)}{i.variant_label ? ` · ${i.variant_label}` : ""}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatEur(i.unit_price * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <Label htmlFor="coupon" className="text-sm flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Gutscheincode</Label>
              <div className="flex gap-2 mt-2">
                <Input id="coupon" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="CODE" />
                <Button variant="outline" onClick={applyCoupon}>Einlösen</Button>
              </div>
              {coupon && (
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {coupon.code} angewendet
                </p>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Zwischensumme</span><span>{formatEur(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-primary"><span>Rabatt</span><span>-{formatEur(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Versand</span><span>{shippingCost === 0 ? "Gratis" : formatEur(shippingCost)}</span></div>
              {surcharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Zahlungsgebühr</span><span>{formatEur(surcharge)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-border"><span>Gesamt</span><span>{formatEur(total)}</span></div>
            </div>

            <div className="flex items-start gap-2 mt-5">
              <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
              <Label htmlFor="terms" className="text-xs font-normal leading-relaxed cursor-pointer text-muted-foreground">
                Ich akzeptiere die <Link to="/terms" className="text-primary underline">AGB</Link>, die{" "}
                <Link to="/privacy" className="text-primary underline">Datenschutzerklärung</Link> und die{" "}
                <Link to="/widerruf" className="text-primary underline">Widerrufsbelehrung</Link>. *
              </Label>
            </div>

            <Button size="lg" className="w-full mt-5 rounded-xl" onClick={submit} disabled={isSubmitting || paymentMethods.length === 0}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Bestellung wird geprüft…</> : `Zahlungspflichtig bestellen · ${formatEur(total)}`}
            </Button>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShopCheckoutPage;
