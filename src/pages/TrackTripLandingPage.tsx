import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";

const TrackTripLandingPage = () => {
  const [tripNumber, setTripNumber] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tripNumber.trim();
    if (t) navigate(`/verfolge/${encodeURIComponent(t)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Fahrt verfolgen</h1>
            <p className="text-muted-foreground">
              Gib deine Fahrtnummer ein, um den Live-Standort deines Busses zu sehen.
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                value={tripNumber}
                onChange={(e) => setTripNumber(e.target.value)}
                placeholder="z.B. 2434219419"
                className="flex-1 h-12 text-base"
                aria-label="Fahrtnummer"
              />
              <Button type="submit" size="lg" className="gap-2">
                <Search className="w-4 h-4" />
                Verfolgen
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Die Fahrtnummer findest du in deiner Buchungsbestätigung oder auf deinem Ticket.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackTripLandingPage;
