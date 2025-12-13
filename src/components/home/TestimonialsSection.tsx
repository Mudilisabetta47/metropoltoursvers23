import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Anna Müller",
    location: "Berlin",
    rating: 5,
    text: "Fantastischer Service! Die Busse sind super sauber, das WLAN funktioniert einwandfrei und die Preise sind unschlagbar. Ich buche nur noch bei GreenBus.",
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
    text: "Ich reise regelmäßig zwischen Hamburg und Berlin. GreenBus bietet die beste Kombination aus Preis und Komfort. Die Sitze sind wirklich bequem!",
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

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 lg:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Das sagen unsere <span className="text-primary">Kunden</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Über 2 Millionen zufriedene Reisende vertrauen GreenBus.
          </p>
        </div>

        {/* Testimonial Slider */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 rounded-full bg-card shadow-card flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 rounded-full bg-card shadow-card flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>

          {/* Testimonial Cards */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-card rounded-2xl p-8 lg:p-12 shadow-card text-center">
                    <Quote className="w-12 h-12 text-primary/20 mx-auto mb-6" />
                    
                    <p className="text-lg lg:text-xl text-foreground mb-8 leading-relaxed">
                      "{testimonial.text}"
                    </p>

                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < testimonial.rating
                              ? "text-accent fill-accent"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "4.8", label: "Google Bewertung" },
            { value: "2M+", label: "Zufriedene Kunden" },
            { value: "99%", label: "Pünktlichkeit" },
            { value: "24/7", label: "Kundensupport" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
