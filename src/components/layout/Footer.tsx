import { Link } from "react-router-dom";
import { 
  Facebook, Instagram, Youtube, Mail, Phone, MapPin, 
  Clock, CreditCard, Shield, Award, Headphones
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    reisen: [
      { name: "Pauschalreisen", path: "/service" },
      { name: "Linienfahrten", path: "/search" },
      { name: "Gruppenreisen", path: "/business" },
      { name: "Tagesausflüge", path: "/business" },
      { name: "Städtereisen", path: "/service" },
    ],
    services: [
      { name: "Schulfahrten", path: "/business" },
      { name: "Privatfahrten", path: "/business" },
      { name: "Shuttle-Service", path: "/business" },
      { name: "Flughafentransfer", path: "/business" },
      { name: "Eventfahrten", path: "/business" },
    ],
    service: [
      { name: "Hilfe & FAQ", path: "/service" },
      { name: "Gepäckregeln", path: "/service#luggage" },
      { name: "Stornierung & Umbuchung", path: "/service#cancellation" },
      { name: "Meine Buchungen", path: "/bookings" },
      { name: "Kontakt", path: "/service" },
    ],
    rechtliches: [
      { name: "Impressum", path: "/imprint" },
      { name: "Datenschutz", path: "/privacy" },
      { name: "AGB", path: "/terms" },
      { name: "Karriere", path: "/karriere" },
      { name: "Cookie-Einstellungen", path: "/privacy" },
    ],
  };

  const trustBadges = [
    { icon: Shield, text: "Sichere Zahlung" },
    { icon: Award, text: "SSL-gesicherter Checkout" },
    { icon: Headphones, text: "24/7 Kundenservice" },
    { icon: CreditCard, text: "Flexible Zahlungsarten" },
  ];

  const socialLinks = [
    { icon: Facebook, url: "https://facebook.com/metropoltours", label: "Facebook" },
    { icon: Instagram, url: "https://instagram.com/metropoltours", label: "Instagram" },
    { icon: Youtube, url: "https://youtube.com/metropoltours", label: "Youtube" },
  ];

  const popularRoutes = [
    "Hamburg → Zagreb",
    "Bremen → Split",
    "Hannover → Dubrovnik",
    "Berlin → Sarajevo",
    "München → Ljubljana",
    "Frankfurt → Belgrad",
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground" role="contentinfo">
      {/* Trust Badges Section */}
      <div className="border-b border-muted-foreground/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge) => (
              <div key={badge.text} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary-foreground">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4 group" aria-label="METROPOL TOURS Startseite">
              <Logo size="md" />
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Ihr zuverlässiger Partner für komfortable Busreisen in ganz Europa. 
              Wir bringen Sie sicher und bequem ans Ziel – 
              ob Linienfahrt, Pauschalreise oder Gruppenausflug.
            </p>
            
            {/* Contact Info */}
            <div className="flex flex-col gap-3 text-sm text-muted-foreground mb-6">
              <a 
                href="mailto:info@metropol-tours.de" 
                className="flex items-center gap-2 hover:text-primary transition-colors"
                aria-label="E-Mail an METROPOL TOURS"
              >
                <Mail className="w-4 h-4" />
                info@metropol-tours.de
              </a>
              <a 
                href="tel:+49511123456789" 
                className="flex items-center gap-2 hover:text-primary transition-colors"
                aria-label="Telefon METROPOL TOURS"
              >
                <Phone className="w-4 h-4" />
                +49 511 123 456 789
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Hannover, Deutschland</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Mo-Fr: 8-20 Uhr, Sa-So: 9-18 Uhr</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`METROPOL TOURS auf ${social.label}`}
                  className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <nav aria-label="Reiseangebote">
            <h4 className="font-semibold text-primary-foreground mb-4">Reiseangebote</h4>
            <ul className="space-y-3">
              {footerLinks.reisen.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Business Services">
            <h4 className="font-semibold text-primary-foreground mb-4">Für Unternehmen</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Service & Hilfe">
            <h4 className="font-semibold text-primary-foreground mb-4">Service & Hilfe</h4>
            <ul className="space-y-3">
              {footerLinks.service.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Rechtliches">
            <h4 className="font-semibold text-primary-foreground mb-4">Rechtliches</h4>
            <ul className="space-y-3">
              {footerLinks.rechtliches.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Popular Routes Section */}
        <div className="mt-12 pt-8 border-t border-muted-foreground/10">
          <h4 className="font-semibold text-primary-foreground mb-4">Beliebte Strecken</h4>
          <div className="flex flex-wrap gap-2">
            {popularRoutes.map((route) => (
              <Link
                key={route}
                to="/search"
                className="px-3 py-1.5 text-sm bg-muted-foreground/10 rounded-full text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {route}
              </Link>
            ))}
          </div>
        </div>

        {/* SEO Text */}
        <div className="mt-8 pt-8 border-t border-muted-foreground/10">
          <p className="text-xs text-muted-foreground/70 max-w-4xl">
            METROPOL TOURS – Ihr Spezialist für Fernbusreisen und Pauschalurlaub in Europa. 
            Wir bieten komfortable Busverbindungen von Hamburg, Bremen, Hannover, Berlin und vielen 
            weiteren deutschen Städten zu den schönsten Reisezielen in Kroatien, Slowenien, Montenegro, 
            Bosnien-Herzegowina, Serbien, Albanien und Nordmazedonien. Ob Städtereise, Strandurlaub 
            oder Rundreise – bei uns finden Sie das passende Angebot. Buchen Sie jetzt Ihre nächste 
            Busreise mit modernsten Reisebussen, kostenlosem WLAN und erstklassigem Service.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-muted-foreground/10 bg-secondary/80">
        <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} METROPOL TOURS GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>🇩🇪 Made in Germany</span>
            <span>•</span>
            <span>Sichere SSL-Verschlüsselung</span>
            <span>•</span>
            <Link 
              to="/admin" 
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Agentur Login
            </Link>
          </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
