import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveShopImage } from "@/lib/shop";
import { ImageIcon } from "lucide-react";

interface ShopImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/** Renders a product image from an absolute URL or a storage path. */
export default function ShopImage({ src, alt, className, loading = "lazy" }: ShopImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUrl(null);
    resolveShopImage(src).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [src]);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageIcon className="w-8 h-8 opacity-40" aria-hidden="true" />
      </div>
    );
  }

  return <img src={url} alt={alt} loading={loading} className={className} />;
}
