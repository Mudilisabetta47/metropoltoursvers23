import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Anna Müller",
    location: "Berlin",
    rating: 5,
    text: "Fantastischer Service! Die Busse sind super sauber, das WLAN funktioniert einwandfrei und die Preise sind unschlagbar. Ich buche nur noch bei METROPOL TOURS.",
    avatar: "AM",
  },
  {
    id: 2,
    name: "Thomas Schmidt",
    location: "München",
    rating: 5,
    text: "Pünktlich, komfortabel und günstig. Was will man mehr? Die App macht das Buchen zum Kinderspiel. Absolute Empfehlung!",
    avatar: "TS",
  },
  {
    id: 3,
    name: "Lisa Weber",
    location: "Hamburg",
    rating: 5,
    text: "Ich reise regelmäßig zwischen Hamburg und Berlin. METROPOL TOURS bietet die beste Kombination aus Preis und Komfort. Die Sitze sind wirklich bequem!",
    avatar: "LW",
  },
  {
    id: 4,
    name: "Michael Braun",
    location: "Köln",
    rating: 4,
    text: "Sehr zufrieden mit dem Service. Die Fahrer sind freundlich und die Busse modern. Kleine Verspätung, aber insgesamt eine tolle Erfahrung.",
    avatar: "MB",
  },
  {
    id: 5,
    name: "Sarah Fischer",
    location: "Frankfurt",
    rating: 5,
    text: "Perfekt für Wochenendtrips! Ich liebe die Flexibilität bei der Buchung und die transparenten Preise. Keine versteckten Gebühren!",
    avatar: "SF",
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const testimonial = testimonials[currentIndex];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background with gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
          >
            <Star className="w-4 h-4 fill-primary" />
            Kundenbewertungen
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Das sagen unsere <span className="text-primary">Kunden</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Über 2 Millionen zufriedene Reisende vertrauen METROPOL TOURS.
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <div className="relative max-w-4xl mx-auto">
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-14 z-10 w-12 h-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
            aria-label="Vorherige Bewertung"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-14 z-10 w-12 h-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
            aria-label="Nächste Bewertung"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          <div className="overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -80 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card rounded-3xl p-10 lg:p-14 border border-border/50 shadow-lg text-center"
              >
                {/* Large quote icon */}
                <div className="relative inline-block mb-8">
                  <Quote className="w-16 h-16 text-primary/10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl" />
                </div>
                
                <p className="text-xl lg:text-2xl text-foreground mb-10 leading-relaxed font-medium max-w-2xl mx-auto">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          i < testimonial.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted fill-muted"
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
                    {testimonial.avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2.5 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  index === currentIndex
                    ? "bg-primary w-10"
                    : "bg-primary/20 hover:bg-primary/40 w-2.5"
                }`}
                aria-label={`Bewertung ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Stats */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {[
            { value: "4.8", label: "Google Bewertung" },
            { value: "2M+", label: "Zufriedene Kunden" },
            { value: "99%", label: "Pünktlichkeit" },
            { value: "24/7", label: "Kundensupport" },
          ].map((stat) => (
            <motion.div 
              key={stat.label} 
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, type: "spring" } }
              }}
              className="text-center group"
            >
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
