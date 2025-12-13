import SearchForm from "@/components/booking/SearchForm";
import heroBus from "@/assets/hero-bus.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBus})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 via-secondary/50 to-secondary/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Entdecke Europa mit{" "}
            <span className="text-primary">GreenBus</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Günstige Fernbusse zu über 2.500 Zielen. Reise nachhaltig, bequem 
            und erschwinglich durch ganz Europa.
          </p>
        </div>

        {/* Search Form */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <SearchForm variant="hero" />
        </div>

        {/* Popular Routes */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <span className="text-primary-foreground/60 text-sm">Beliebte Routen:</span>
          {["Berlin → München", "Hamburg → Köln", "Frankfurt → Wien", "Stuttgart → Zürich"].map((route) => (
            <button
              key={route}
              className="text-sm px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
            >
              {route}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full bg-primary-foreground/50" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
