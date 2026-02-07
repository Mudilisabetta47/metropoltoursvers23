import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bus, User, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    profile,
    signOut,
    isLoading
  } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navLinks = [{
    name: "Startseite",
    path: "/"
  }, {
    name: "Pauschalreisen",
    path: "/reisen"
  }, {
    name: "Wochenendtrips",
    path: "/wochenendtrips"
  }, {
    name: "Service & Info",
    path: "/service"
  }, {
    name: "Gruppenreisen",
    path: "/business"
  }, {
    name: "Meine Buchungen",
    path: "/bookings"
  }];
  const isActive = (path: string) => location.pathname === path;
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", isScrolled ? "bg-background/98 backdrop-blur-xl shadow-lg border-b border-border/50" : "bg-background/95 backdrop-blur-md border-b border-border/30")}>
      <div className="container mx-auto px-4">
        <div className={cn("flex items-center justify-between transition-all duration-300", isScrolled ? "h-16" : "h-18 lg:h-20")}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className={cn("bg-primary rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md", isScrolled ? "w-9 h-9" : "w-10 h-10")}>
              <Bus className={cn("text-primary-foreground transition-all", isScrolled ? "w-5 h-5" : "w-6 h-6")} />
            </div>
            <div className="flex flex-col">
              <span className={cn("font-bold text-foreground leading-tight transition-all", isScrolled ? "text-lg" : "text-xl")}>
                METROPOL <span className="text-primary">TOURS</span>
              </span>
              
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={cn("relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group", isActive(link.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/80")}>
                {link.name}
                {/* Active indicator */}
                <span className={cn("absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-300", isActive(link.path) ? "w-8" : "w-0 group-hover:w-6")} />
              </Link>)}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {!isLoading && (user ? <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {profile?.first_name || 'Konto'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div> : <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
                  <User className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>)}
            <Button size="sm" onClick={() => navigate('/reisen')} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
              Jetzt buchen
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
            {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn("lg:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-xl border-b border-border shadow-xl transition-all duration-300 overflow-hidden", isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
          {navLinks.map(link => <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className={cn("px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between", isActive(link.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              {link.name}
              <ChevronRight className={cn("w-4 h-4 transition-transform", isActive(link.path) && "text-primary")} />
            </Link>)}
          
          <div className="flex flex-col gap-2 pt-4 border-t border-border mt-3">
            {user ? <Button variant="outline" className="w-full justify-center" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button> : <Button variant="outline" className="w-full justify-center" onClick={() => {
            navigate('/auth');
            setIsMenuOpen(false);
          }}>
                <User className="w-4 h-4 mr-2" />
                Anmelden
              </Button>}
            <Button className="w-full justify-center gap-2 bg-primary hover:bg-primary/90" onClick={() => {
            navigate('/reisen');
            setIsMenuOpen(false);
          }}>
              Jetzt buchen
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>;
};
export default Header;