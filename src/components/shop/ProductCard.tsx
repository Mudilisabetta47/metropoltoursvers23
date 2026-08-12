import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEur, ShopProduct } from "@/lib/shop";
import ShopImage from "./ShopImage";

interface ProductCardProps {
  product: ShopProduct;
  isSaved?: boolean;
  onToggleWishlist?: (product: ShopProduct) => void;
  onQuickAdd?: (product: ShopProduct) => void;
}

export default function ProductCard({ product, isSaved, onToggleWishlist, onQuickAdd }: ProductCardProps) {
  const soldOut = product.track_stock && product.stock <= 0;
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link to={`/shop/produkt/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
        <ShopImage
          src={product.images?.[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-primary text-primary-foreground">
              Neu
            </span>
          )}
          {product.is_bestseller && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-foreground text-background">
              Bestseller
            </span>
          )}
          {(product.is_sale || discount > 0) && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-destructive text-destructive-foreground">
              {discount > 0 ? `-${discount}%` : "Angebot"}
            </span>
          )}
        </div>
        {soldOut && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold">Ausverkauft</span>
          </div>
        )}
      </Link>

      {onToggleWishlist && (
        <button
          type="button"
          onClick={() => onToggleWishlist(product)}
          aria-label={isSaved ? `${product.name} von der Wunschliste entfernen` : `${product.name} zur Wunschliste hinzufügen`}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center border border-border hover:scale-110 transition-transform"
        >
          <Heart className={cn("w-4 h-4", isSaved ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
      )}

      <div className="flex flex-col flex-1 p-4 gap-2">
        <Link to={`/shop/produkt/${product.slug}`} className="font-semibold text-foreground leading-snug hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </Link>
        {product.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.short_description}</p>
        )}
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-bold text-foreground">{formatEur(product.price)}</div>
            {discount > 0 && (
              <div className="text-xs text-muted-foreground line-through">{formatEur(product.compare_at_price!)}</div>
            )}
          </div>
          {onQuickAdd && (
            <Button size="sm" disabled={soldOut} onClick={() => onQuickAdd(product)} className="rounded-full gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">In den Warenkorb</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
