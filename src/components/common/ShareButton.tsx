import { useState } from "react";
import { Share2, Copy, Check, Mail, MessageCircle, Facebook, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
  label?: string;
}

const ShareButton = ({
  title,
  text,
  url,
  size = "sm",
  variant = "outline",
  className = "gap-1.5",
  label = "Teilen",
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || title;

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return true;
      } catch {
        return true; // Abbruch durch Nutzer – kein Fallback nötig
      }
    }
    return false;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link kopiert");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
  };

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const enc = encodeURIComponent;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={async (e) => {
            const shared = await nativeShare();
            if (shared) {
              e.preventDefault();
            }
          }}
        >
          <Share2 className="w-4 h-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <DropdownMenuItem onClick={copyLink}>
          {copied ? <Check className="w-4 h-4 mr-2 text-primary" /> : <Copy className="w-4 h-4 mr-2" />}
          Link kopieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://wa.me/?text=${enc(`${shareText} ${shareUrl}`)}`)}>
          <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(shareText)}`)}>
          <Send className="w-4 h-4 mr-2" /> Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`)}>
          <Facebook className="w-4 h-4 mr-2" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => open(`mailto:?subject=${enc(title)}&body=${enc(`${shareText}\n\n${shareUrl}`)}`)}
        >
          <Mail className="w-4 h-4 mr-2" /> E-Mail
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
