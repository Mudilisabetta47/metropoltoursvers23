interface PaymentBrandLogosProps {
  brands: Array<"visa" | "mastercard" | "amex" | "paypal">;
  className?: string;
}

const LOGOS: Record<string, { src: string; alt: string }> = {
  visa: { src: "/payment/visa.svg", alt: "Visa" },
  mastercard: { src: "/payment/mastercard.svg", alt: "Mastercard" },
  amex: { src: "/payment/amex.svg", alt: "American Express" },
  paypal: { src: "/payment/paypal.svg", alt: "PayPal" },
};

/** Official payment brand marks – only render for methods that are actually enabled. */
export function PaymentBrandLogos({ brands, className }: PaymentBrandLogosProps) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ""}`}>
      {brands.map((brand) => {
        const logo = LOGOS[brand];
        if (!logo) return null;
        return (
          <img
            key={brand}
            src={logo.src}
            alt={`${logo.alt} Logo`}
            loading="lazy"
            width={38}
            height={24}
            className="h-6 w-auto rounded-[3px] bg-white ring-1 ring-border/50 object-contain shrink-0"
          />
        );
      })}
    </div>
  );
}

export default PaymentBrandLogos;
