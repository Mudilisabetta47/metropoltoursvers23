import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Bus, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = [{
    name: "Startseite",
    path: "/"
  }, {
    name: "Fahrten suchen",
    path: "/search"
  }, {
    name: "Service",
    path: "/service"
  }, {
    name: "Meine Buchungen",
    path: "/bookings"
  }];
  const isActive = (path: string) => location.pathname === path;
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <Bus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Metropol  <span className="text-primary"> Tours</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200", isActive(link.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                {link.name}
              </Link>)}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Anmelden
            </Button>
            <Button size="sm">
              Jetzt buchen
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
            {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn("lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border transition-all duration-300 overflow-hidden", isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
          {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className={cn("px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", isActive(link.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              {link.name}
            </Link>)}
          <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
            <Button variant="outline" className="w-full">
              <User className="w-4 h-4 mr-2" />
              Anmelden
            </Button>
            <Button className="w-full">
              Jetzt buchen
            </Button>
          </div>
        </nav>
      </div>
    </header>;
};
export default Header;