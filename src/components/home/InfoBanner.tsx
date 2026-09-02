import { Link } from "react-router-dom";
import { Bus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InfoBanner() {
  return (
    <section className="relative w-full border-b border-primary/10 bg-gradient-to-r from-primary/[0.06] via-background to-primary/[0.04] pt-16 lg:pt-20">
      <div className="container mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div
              className={cn(
                "hidden sm:flex shrink-0 items-center justify-center rounded-full",
                "h-9 w-9 bg-primary/10 text-primary"
              )}
              aria-hidden="true"
            >
              <Bus className="h-[18px] w-[18px]" />
            </div>
            <p className="text-sm sm:text-[15px] leading-snug text-foreground">
              <span className="font-semibold">Unsere Promotionfahrt 2026 nach{" "}</span>
              <span className="font-semibold text-primary">Novalja</span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span>Ab dem</span>{" "}
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs sm:text-sm font-semibold text-primary">
                03.09.2026
              </span>{" "}
              <span className="text-muted-foreground hidden sm:inline">
                geht es los – unsere erste Fahrt nach Novalja (Kroatien).
              </span>
            </p>
          </div>

          <Button
            asChild
            size="sm"
            className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <Link to="/reisen">
              Jetzt Fahrt entdecken
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
