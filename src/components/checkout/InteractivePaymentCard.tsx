import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, CreditCard, Loader2, Lock, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentBrandLogos } from "@/components/checkout/PaymentBrandLogos";
import { cn } from "@/lib/utils";
import "./InteractivePaymentCard.css";

export type PremiumPaymentMethod = "card" | "paypal";

export interface PaymentSummaryItem {
  label: string;
  value: string;
}

interface InteractivePaymentCardProps {
  total: number;
  currency?: string;
  route: string;
  date: string;
  passengers: number;
  bookingId?: string | null;
  customerName?: string;
  seats?: string[];
  extras?: PaymentSummaryItem[];
  paymentMethod: PremiumPaymentMethod;
  onPaymentMethodChange: (method: PremiumPaymentMethod) => void;
  onPay: () => void | Promise<void>;
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  error?: string | null;
  legal?: ReactNode;
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(value);

export default function InteractivePaymentCard({
  total,
  currency = "EUR",
  route,
  date,
  passengers,
  bookingId,
  customerName = "",
  seats = [],
  extras = [],
  paymentMethod,
  onPaymentMethodChange,
  onPay,
  loading = false,
  success = false,
  disabled = false,
  error,
  legal,
}: InteractivePaymentCardProps) {
  const [holder, setHolder] = useState(customerName);
  const [flipped, setFlipped] = useState(false);
  const [savePaymentData, setSavePaymentData] = useState(false);
  const displayHolder = holder.trim() || customerName.trim() || "KARTENINHABER";
  const extraText = useMemo(() => extras.filter((item) => item.value).slice(0, 4), [extras]);

  return (
    <section className="mt-premium-checkout" aria-labelledby="premium-payment-title">
      <div className="mt-premium-summary">
        <div className="mt-summary-heading">
          <span>Ihre Reise</span>
          <strong>{route}</strong>
        </div>
        <dl className="mt-summary-list">
          <div><dt>Reisedatum</dt><dd>{date}</dd></div>
          <div><dt>Reisende</dt><dd>{passengers}</dd></div>
          {seats.length > 0 && <div><dt>Sitzplätze</dt><dd>{seats.join(", ")}</dd></div>}
          <div><dt>Buchungsnummer</dt><dd>{bookingId || "Wird beim Bezahlen erstellt"}</dd></div>
          {extraText.map((item) => <div key={`${item.label}-${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
        </dl>
        <div className="mt-summary-total"><span>Gesamtbetrag</span><strong>{money(total, currency)}</strong></div>
      </div>

      <div className="mt-payment-visual">
        <div className={cn("mt-card-scene", flipped && "is-flipped")} aria-label="Animierte METROPOL TOURS Zahlungskarte">
          <div className="mt-card-3d">
            <div className="mt-payment-card mt-payment-card-front">
              <div className="mt-card-shine" />
              <div className="mt-card-topline">
                <div className="mt-card-wordmark"><span>METROPOL</span><small>TOURS</small></div>
                <div className="mt-card-chip" aria-hidden="true"><i /><i /><i /><i /></div>
              </div>
              <p className="mt-card-number" aria-hidden="true">••••&nbsp; ••••&nbsp; ••••&nbsp; ••••</p>
              <div className="mt-card-footer">
                <div><small>Karteninhaber</small><strong>{displayHolder.toLocaleUpperCase("de-DE")}</strong></div>
                <div><small>Gültig bis</small><strong>••/••</strong></div>
                <PaymentBrandLogos brands={["visa", "mastercard", "amex"]} className="mt-card-brands" />
              </div>
            </div>
            <div className="mt-payment-card mt-payment-card-back">
              <div className="mt-magstripe" />
              <div className="mt-signature"><span>Sicherheitscode</span><strong>•••</strong></div>
              <div className="mt-back-brand">METROPOL TOURS · SICHER BEZAHLEN</div>
            </div>
          </div>
        </div>
        <p className="mt-card-safety"><ShieldCheck /> Ihre Kartendaten werden ausschließlich in der geschützten Stripe-Zahlungsmaske eingegeben.</p>
      </div>

      <div className="mt-payment-form">
        <div className="mt-form-heading">
          <span>ZAHLUNG</span>
          <h2 id="premium-payment-title">Zahlung abschließen</h2>
          <p>Wählen Sie Ihre bevorzugte, sichere Zahlungsart.</p>
        </div>

        <div className="mt-method-switch" role="radiogroup" aria-label="Zahlungsart">
          <Button type="button" variant={paymentMethod === "card" ? "default" : "ghost"} onClick={() => onPaymentMethodChange("card")} role="radio" aria-checked={paymentMethod === "card"}>
            <CreditCard /> Kreditkarte
          </Button>
          <Button type="button" variant={paymentMethod === "paypal" ? "default" : "ghost"} onClick={() => onPaymentMethodChange("paypal")} role="radio" aria-checked={paymentMethod === "paypal"}>
            <WalletCards /> PayPal
          </Button>
        </div>

        {paymentMethod === "card" ? (
          <div className="mt-card-fields">
            <div className="mt-safe-field">
              <Label htmlFor="premium-card-holder">Karteninhaber</Label>
              <Input id="premium-card-holder" autoComplete="cc-name" maxLength={100} value={holder} onChange={(event) => setHolder(event.target.value)} onFocus={() => setFlipped(false)} placeholder="Name wie auf der Karte" />
            </div>
            <div className="mt-secure-placeholder" tabIndex={0} onFocus={() => setFlipped(false)}>
              <div><span>Kartennummer</span><strong>Wird sicher bei Stripe eingegeben</strong></div>
              <PaymentBrandLogos brands={["visa", "mastercard", "amex"]} />
            </div>
            <div className="mt-inline-secure-fields">
              <div className="mt-secure-placeholder compact" tabIndex={0} onFocus={() => setFlipped(false)}><div><span>Ablaufdatum</span><strong>MM / JJ</strong></div></div>
              <div className="mt-secure-placeholder compact" tabIndex={0} onFocus={() => setFlipped(true)} onBlur={() => setFlipped(false)}><div><span>CVC</span><strong>•••</strong></div></div>
            </div>
            <label className="mt-save-payment">
              <Checkbox checked={savePaymentData} onCheckedChange={(value) => setSavePaymentData(Boolean(value))} />
              <span><strong>Zahlungsdaten bei Stripe speichern</strong><small>Die Auswahl wird auf der sicheren Zahlungsseite übernommen, sofern verfügbar.</small></span>
            </label>
          </div>
        ) : (
          <div className="mt-paypal-panel"><PaymentBrandLogos brands={["paypal"]} /><div><strong>Mit PayPal bezahlen</strong><span>Sie melden sich im nächsten Schritt sicher bei PayPal an.</span></div></div>
        )}

        {legal}
        {error && <div className="mt-payment-error" role="alert">{error}</div>}

        <Button type="button" size="xl" className={cn("mt-payment-button", success && "is-success")} onClick={onPay} disabled={disabled || loading || success}>
          {loading ? <><Loader2 className="animate-spin" />Zahlung wird vorbereitet…</> : success ? <><Check />Zahlung erfolgreich</> : <><Lock />Bezahlen – {money(total, currency)}<ArrowRight className="mt-payment-arrow" /></>}
        </Button>
        <div className="mt-security-row"><Lock /><span>Sichere Zahlung</span><i />SSL-verschlüsselt<i />PCI-konforme Verarbeitung durch Stripe</div>
      </div>
    </section>
  );
}