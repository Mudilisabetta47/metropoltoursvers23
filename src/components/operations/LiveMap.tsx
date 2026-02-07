import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useVehiclePositions, VehiclePosition } from "@/hooks/useOperations";
import { 
  Bus, MapPin, Clock, Users,
  Maximize2, Minimize2, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VehicleDetailPanelProps {
  vehicle: VehiclePosition | null;
  onClose: () => void;
}

const VehicleDetailPanel = ({ vehicle, onClose }: VehicleDetailPanelProps) => {
  if (!vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time': return 'text-emerald-400 bg-emerald-500/20';
      case 'delayed': return 'text-amber-400 bg-amber-500/20';
      case 'stopped': return 'text-blue-400 bg-blue-500/20';
      case 'offline': return 'text-zinc-400 bg-zinc-500/20';
      case 'incident': return 'text-red-400 bg-red-500/20';
      default: return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_time': return 'Pünktlich';
      case 'delayed': return 'Verspätet';
      case 'stopped': return 'Angehalten';
      case 'offline': return 'Offline';
      case 'incident': return 'Störung';
      default: return status;
    }
  };

  return (
    <div className="absolute bottom-4 left-4 w-80 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl z-10">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Bus #{vehicle.bus_id.slice(0, 8)}</h3>
              <p className="text-xs text-zinc-400">{vehicle.driver_name || 'Kein Fahrer zugewiesen'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <Badge className={cn("mb-3", getStatusColor(vehicle.status))}>
          {getStatusLabel(vehicle.status)}
          {vehicle.delay_minutes > 0 && ` (+${vehicle.delay_minutes} min)`}
        </Badge>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-zinc-800/50 rounded-lg">
            <div className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Position
            </div>
            <div className="text-white text-xs">
              {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
            </div>
          </div>
          
          <div className="p-2 bg-zinc-800/50 rounded-lg">
            <div className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Geschwindigkeit
            </div>
            <div className="text-white text-xs">
              {vehicle.speed_kmh} km/h
            </div>
          </div>
          
          <div className="p-2 bg-zinc-800/50 rounded-lg">
            <div className="text-zinc-400 text-xs mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Passagiere
            </div>
            <div className="text-white text-xs">
              {vehicle.passenger_count} an Bord
            </div>
          </div>
          
          <div className="p-2 bg-zinc-800/50 rounded-lg">
            <div className="text-zinc-400 text-xs mb-1">ETA</div>
            <div className="text-white text-xs">
              {vehicle.eta_next_stop 
                ? new Date(vehicle.eta_next_stop).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                : '-'
              }
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 text-xs border-zinc-700">
            Route anzeigen
          </Button>
          <Button size="sm" className="flex-1 text-xs bg-primary">
            Kontaktieren
          </Button>
        </div>
      </div>
    </div>
  );
};

// Map style URLs (free tile providers)
const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Fallback - no free satellite
};

const LiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const { vehicles } = useVehiclePositions();
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'light'>('dark');
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyle],
      center: [10.0, 51.0], // Center of Germany
      zoom: 5,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (map.current && mapReady) {
      map.current.setStyle(MAP_STYLES[mapStyle]);
    }
  }, [mapStyle, mapReady]);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Update or create markers for each vehicle
    vehicles.forEach((vehicle) => {
      const existingMarker = markers.current[vehicle.id];
      
      const getMarkerColor = (status: string) => {
        switch (status) {
          case 'on_time': return '#10b981';
          case 'delayed': return '#f59e0b';
          case 'stopped': return '#3b82f6';
          case 'offline': return '#6b7280';
          case 'incident': return '#ef4444';
          default: return '#6b7280';
        }
      };

      if (existingMarker) {
        existingMarker.setLngLat([vehicle.longitude, vehicle.latitude]);
      } else {
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = getMarkerColor(vehicle.status);
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.innerHTML = '🚌';
        el.style.fontSize = '16px';
        
        el.addEventListener('click', () => {
          setSelectedVehicle(vehicle);
        });

        const marker = new maplibregl.Marker({ element: el, rotation: vehicle.heading })
          .setLngLat([vehicle.longitude, vehicle.latitude])
          .addTo(map.current!);
        
        markers.current[vehicle.id] = marker;
      }
    });

    // Remove markers for vehicles that no longer exist
    Object.keys(markers.current).forEach((id) => {
      if (!vehicles.find(v => v.id === id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });
  }, [vehicles, mapReady]);

  return (
    <div className={cn(
      "relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full"
    )}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-zinc-900 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-white">Live-Tracking</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
              {vehicles.length} Fahrzeuge
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-zinc-400"
              onClick={() => setMapStyle(mapStyle === 'dark' ? 'light' : 'dark')}
            >
              <Layers className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-zinc-400"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 p-3 bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-700 text-xs">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-zinc-300">Pünktlich</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-zinc-300">Verspätet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-zinc-300">Störung</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-500" />
            <span className="text-zinc-300">Offline</span>
          </div>
        </div>
      </div>

      {/* Vehicle Detail Panel */}
      <VehicleDetailPanel 
        vehicle={selectedVehicle} 
        onClose={() => setSelectedVehicle(null)} 
      />
    </div>
  );
};

export default LiveMap;
