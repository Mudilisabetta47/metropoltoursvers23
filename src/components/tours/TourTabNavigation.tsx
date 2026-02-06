import { Button } from "@/components/ui/button";

interface TourTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'leistungen', label: 'Leistungen & Tarife' },
  { id: 'termine', label: 'Termine & Preise' },
  { id: 'route', label: 'Route & Zustiege' },
  { id: 'infos', label: 'Infos' },
  { id: 'agb', label: 'AGB & Reiseschutz' },
];

const TourTabNavigation = ({ activeTab, onTabChange }: TourTabNavigationProps) => {
  const scrollToSection = (tabId: string) => {
    onTabChange(tabId);
    // Smooth scroll behavior
    const element = document.getElementById(`section-${tabId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
          
          <div className="hidden md:block pl-4 border-l">
            <Button 
              onClick={() => scrollToSection('termine')}
              className="bg-primary hover:bg-primary-dark"
            >
              Termine
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TourTabNavigation;
