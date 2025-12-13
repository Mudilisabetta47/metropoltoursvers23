import { ArrowRight, Clock, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const routes = [
  {
    from: "Berlin",
    to: "München",
    duration: "6h 30min",
    price: 24.99,
    departures: 12,
  },
  {
    from: "Hamburg",
    to: "Köln",
    duration: "5h 15min",
    price: 19.99,
    departures: 8,
  },
  {
    from: "Frankfurt",
    to: "Wien",
    duration: "7h 45min",
    price: 34.99,
    departures: 6,
  },
  {
    from: "Stuttgart",
    to: "Zürich",
    duration: "3h 30min",
    price: 29.99,
    departures: 10,
  },
  {
    from: "Düsseldorf",
    to: "Amsterdam",
    duration: "3h 00min",
    price: 22.99,
    departures: 7,
  },
  {
    from: "München",
    to: "Prag",
    duration: "4h 45min",
    price: 27.99,
    departures: 5,
  },
];

const PopularRoutesSection = () => {
  const navigate = useNavigate();

  const handleBookRoute = (from: string, to: string) => {
    navigate(`/search?from=${from}&to=${to}`);
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Beliebte <span className="text-primary">Verbindungen</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Entdecken Sie unsere meistgebuchten Strecken zu günstigen Preisen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, index) => (
            <div
              key={`${route.from}-${route.to}`}
              className="card-elevated p-6 group cursor-pointer"
              onClick={() => handleBookRoute(route.from, route.to)}
            >
              {/* Route Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <span>{route.from}</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span>{route.to}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">ab</span>
                  <div className="text-2xl font-bold text-primary">
                    €{route.price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Route Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{route.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bus className="w-4 h-4" />
                  <span>{route.departures} Abfahrten/Tag</span>
                </div>
              </div>

              {/* CTA */}
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
              >
                Jetzt buchen
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" onClick={() => navigate("/search")}>
            Alle Verbindungen anzeigen
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PopularRoutesSection;
