import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmPayment, getPaymentConfig, money, startPayment } from "@/mobile/lib/appBooking";

interface Props {
  bookingNumber: string;
  amount: number;
  onPaid: () => void;
  onFailed?: (message: string) => void;
}

/**
 * Zahlung vollständig innerhalb der App – kein Redirect auf die Website
 * und kein externer Browser. Der Zahlungsstatus wird ausschließlich
 * serverseitig (Edge Function `app-booking`, Aktion `confirm`) gesetzt.
 */
export function InAppPayment({ bookingNumber, amount, onPaid, onFailed }: Props) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ stripePublishableKey }, payment] = await Promise.all([
          getPaymentConfig(),
          startPayment(bookingNumber),
        ]);
        if (cancelled) return;
        if (payment.alreadyPaid) {
          onPaid();
          return;
        }
        if (!stripePublishableKey) {
          setError(
            "Die Kartenzahlung ist noch nicht freigeschaltet. Bitte wähle „Rechnung / Überweisung“.",
          );
          return;
        }
        setStripePromise(loadStripe(stripePublishableKey));
        setClientSecret(payment.clientSecret ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Zahlung konnte nicht gestartet werden.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingNumber, onPaid]);

  const options = useMemo(
    () =>
      clientSecret
        ? ({
            clientSecret,
            appearance: { theme: "night" as const, variables: { colorPrimary: "#00CC36" } },
          })
        : null,
    [clientSecret],
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
        {error}
      </div>
    );
  }

  if (!stripePromise || !options) {
    return <Skeleton className="h-56 rounded-2xl" />;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm bookingNumber={bookingNumber} amount={amount} onPaid={onPaid} onFailed={onFailed} />
    </Elements>
  );
}

function PaymentForm({ bookingNumber, amount, onPaid, onFailed }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required", // bleibt in der App
      });
      if (error) {
        setMessage(error.message ?? "Zahlung fehlgeschlagen.");
        await confirmPayment(bookingNumber).catch(() => undefined);
        onFailed?.(error.message ?? "Zahlung fehlgeschlagen.");
        return;
      }
      // Statusbestimmung ausschließlich serverseitig
      const result = await confirmPayment(bookingNumber);
      if (result.paymentStatus === "paid") onPaid();
      else if (result.paymentStatus === "failed") {
        setMessage("Die Zahlung wurde abgelehnt.");
        onFailed?.("Die Zahlung wurde abgelehnt.");
      } else setMessage("Zahlung wird noch verarbeitet. Bitte kurz warten.");
    } catch (e: any) {
      setMessage(e?.message ?? "Zahlung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {message && <p className="text-sm text-destructive">{message}</p>}
      <Button className="h-12 w-full text-base" disabled={!stripe || busy} onClick={submit}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {money(amount)} jetzt bezahlen
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Sichere Zahlung – du bleibst in der App
      </p>
    </div>
  );
}

export default InAppPayment;
