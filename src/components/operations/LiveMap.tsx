import { useRef, useState, useEffect } from "react";
import Map, { Marker, NavigationControl } from "@vis.gl/react-mapbox";
import { useVehiclePositions, VehiclePosition } from "@/hooks/useOperations";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import {
  Bus,
  MapPin,
  Maximize2,
  Minimize2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import VehicleActionPanel from "./VehicleActionPanel";
import "mapbox-gl/dist/mapbox-gl.css";

// Removed old VehicleDetailPanel - using VehicleActionPanel instead

const LiveMap = () => {
  const mapRef = useRef<any>(null);
  const { vehicles } = useVehiclePositions();
  const { token: mapboxToken } = useMapboxToken();
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");

  // Trigger map resize when fullscreen toggles
  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.getMap?.()?.resize?.();
    }, 100);
  }, [isFullscreen]);

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

  // Token missing fallback
  if (!mapboxToken) {
    return (
      <div
        className={cn(
          "relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden",
          isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full"
        )}
      >
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
                onClick={() => setMapStyle(mapStyle === "dark" ? "satellite" : "dark")}
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Placeholder Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSIjMTgxODFiIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjcyNzJhIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] opacity-50" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
          <MapPin className="w-16 h-16 mb-4 text-zinc-600" />
          <p className="text-lg font-medium">Live-Karte nicht verfügbar</p>
          <p className="text-sm text-zinc-600 mt-1">VITE_MAPBOX_TOKEN ist nicht gesetzt.</p>

          {/* Simulated Vehicle List */}
          <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
            {vehicles.slice(0, 4).map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      vehicle.status === "on_time"
                        ? "bg-emerald-400"
                        : vehicle.status === "delayed"
                          ? "bg-amber-400"
                          : vehicle.status === "incident"
                            ? "bg-red-400"
                            : "bg-zinc-400"
                    )}
                  />
                  <span className="text-xs text-white">Bus #{vehicle.bus_id.slice(0, 6)}</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  {vehicle.speed_kmh} km/h • {vehicle.passenger_count} Pax
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Vehicle Detail Panel */}
        <VehicleDetailPanel 
          vehicle={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
        />
      </div>
    );
  }

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
              onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
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
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          latitude: 51.0,
          longitude: 10.0,
          zoom: 5,
        }}
        style={{ width: "100%", height: "100%", minHeight: "400px" }}
        mapStyle={mapStyle === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/satellite-streets-v12'
        }
      >
        <NavigationControl position="top-right" />
        
        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            latitude={vehicle.latitude}
            longitude={vehicle.longitude}
            anchor="center"
            rotation={vehicle.heading}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
              style={{ 
                backgroundColor: getMarkerColor(vehicle.status),
                border: '3px solid white'
              }}
            >
              🚌
            </div>
          </Marker>
        ))}
      </Map>

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
