import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, Search, ArrowRight, Wifi, Snowflake, Armchair, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBus from "@/assets/hero-bus.jpg";

const HeroSlider = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <img
          src={heroBus}
          alt="Metropol Tours Bus"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      </motion.div>

      {/* Bus Branding Overlay - Large Typography on Bus */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Main Brand Text - Positioned to overlay on bus area */}
          <h2 className="text-[8vw] md:text-[6vw] lg:text-[5vw] font-black tracking-tight leading-none text-center">
            <span className="block text-white/20 mix-blend-overlay">METROPOL</span>
            <span className="block text-primary/40 mix-blend-screen -mt-2">TOURS</span>
          </h2>
        </motion.div>
      </div>
      <div className="absolute inset-0 flex flex-col justify-center">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="max-w-5xl"
          >
            {/* Brand Label */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-12 h-[2px] bg-primary" />
              <span className="text-primary font-medium tracking-wider uppercase text-sm">
                Ihr Reiseunternehmen
              </span>
            </motion.div>

            {/* Large Brand Name - Split Typography */}
            <div className="relative mb-6">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[9rem] font-black leading-[0.85] tracking-tight"
              >
                <span className="text-white/90 block">Komfortabel</span>
                <span className="text-primary block mt-2">Reisen</span>
              </motion.h1>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-xl md:text-2xl text-white/80 max-w-2xl mb-8 font-light"
            >
              Busreisen zu den schönsten Zielen in Europa – 
              <span className="text-primary font-medium"> individuell</span>, als Gruppe oder mit Rundum-Sorglos-Paket.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              {[
                { icon: Wifi, label: "Gratis WLAN" },
                { icon: Snowflake, label: "Klimaanlage" },
                { icon: Armchair, label: "Komfortsitze" },
                { icon: Plug, label: "Steckdosen" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white text-sm"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span>{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold gap-2 group"
                onClick={() => navigate("/service")}
              >
                Pauschalreisen entdecken
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg"
                onClick={() => navigate("/search")}
              >
                Fahrten suchen
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Promo Badge */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute top-24 right-8 lg:right-16 z-20 hidden md:block"
      >
        <div className="bg-accent text-accent-foreground px-6 py-4 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
          <div className="text-sm font-medium">Wochenend-Aktion</div>
          <div className="text-2xl font-black">Bis -25%</div>
        </div>
      </motion.div>

      {/* TUI-Style Search Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          className="bg-white/95 backdrop-blur-lg border-t-4 border-primary shadow-2xl"
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row items-stretch gap-4">
              {/* Destination Input */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                  Wo soll es hin gehen?
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="z.B. Kroatien, Montenegro..."
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Date Input */}
              <div className="flex-1 lg:max-w-xs">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                  Wann & wie lange?
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Reisezeitraum wählen"
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Travelers Input */}
              <div className="flex-1 lg:max-w-xs">
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
                  Wer reist mit?
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="2 Erwachsene"
                    className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button 
                  size="lg" 
                  className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 text-lg font-semibold gap-2 rounded-xl"
                  onClick={() => navigate("/service")}
                >
                  <Search className="w-5 h-5" />
                  Angebote finden
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute left-8 bottom-40 z-10 hidden lg:flex flex-col gap-3"
      >
        {[1, 2, 3].map((_, index) => (
          <div
            key={index}
            className={`h-[3px] bg-primary/50 ${
              index === 0 ? 'w-8' : index === 1 ? 'w-6' : 'w-4'
            }`}
          />
        ))}
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-36 lg:bottom-32 z-10 hidden md:block"
      >
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs uppercase tracking-widest">Scrollen</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <div className="w-1 h-3 rounded-full bg-white/50" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSlider;
