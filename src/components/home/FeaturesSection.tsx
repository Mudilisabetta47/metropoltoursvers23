import { Wifi, Snowflake, Armchair, Plug, Coffee, Shield } from "lucide-react";

const features = [
  {
    icon: Wifi,
    title: "Kostenloses WLAN",
    description: "Surfen, streamen und arbeiten Sie während der gesamten Fahrt.",
  },
  {
    icon: Snowflake,
    title: "Klimaanlage",
    description: "Angenehme Temperatur bei jeder Witterung, das ganze Jahr über.",
  },
  {
    icon: Armchair,
    title: "Bequeme Sitze",
    description: "Großzügiger Sitzabstand und ergonomische Polsterung für Ihren Komfort.",
  },
  {
    icon: Plug,
    title: "Steckdosen",
    description: "Halten Sie Ihre Geräte während der Fahrt aufgeladen.",
  },
  {
    icon: Coffee,
    title: "Bordservice",
    description: "Snacks und Getränke für Ihre Erfrischung während der Reise.",
  },
  {
    icon: Shield,
    title: "Sichere Reise",
    description: "Erfahrene Fahrer und modernste Sicherheitstechnik an Bord.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Reisen mit <span className="text-primary">Komfort</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Unsere modernen Busse bieten alles, was Sie für eine entspannte Reise brauchen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-elevated p-6 lg:p-8 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
