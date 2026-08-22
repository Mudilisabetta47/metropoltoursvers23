import { useMemo, useRef } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "@vis.gl/react-mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Bus } from "lucide-react";
import { FLEET_STATUS_COLOR, FLEET_STATUS_LABEL, FleetPosition } from "@/hooks/useFleet";
import { cn } from "@/lib/utils";

interface FleetMapProps {
  token: string;
  positions: FleetPosition[];
  labels: Record<string, { driver: string; bus: string }>;
  selectedDriverId: string | null;
  onSelect: (driverUserId: string) => void;
  routeGeometry?: GeoJSON.LineString | null;
  destination?: { lat: number; lng: number; name?: string } | null;
  mapStyle?: string;
}

const FleetMap = ({
  token,
  positions,
  labels,
  selectedDriverId,
  onSelect,
  routeGeometry,
  destination,
  mapStyle = "mapbox://styles/mapbox/dark-v11",
}: FleetMapProps) => {
  const mapRef = useRef<any>(null);

  const center = useMemo(() => {
    if (positions.length === 0) return { latitude: 51.2, longitude: 10.0, zoom: 5.2 };
    const lat = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
    const lng = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
    return { latitude: lat, longitude: lng, zoom: positions.length === 1 ? 11 : 6 };
  }, [positions.length]);

  const routeFeature = routeGeometry
    ? { type: "Feature" as const, geometry: routeGeometry, properties: {} }
    : null;

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={token}
      initialViewState={center}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {routeFeature && (
        <Source id="fleet-route" type="geojson" data={routeFeature}>
          <Layer
            id="fleet-route-casing"
            type="line"
            paint={{ "line-color": "#064e3b", "line-width": 9, "line-opacity": 0.8 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
          <Layer
            id="fleet-route-line"
            type="line"
            paint={{ "line-color": "#00CC36", "line-width": 5 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      )}

      {destination && (
        <Marker latitude={destination.lat} longitude={destination.lng} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="px-2 py-1 rounded-md bg-zinc-900/90 border border-zinc-700 text-[11px] text-white whitespace-nowrap">
              Ziel: {destination.name ?? "Zieladresse"}
            </div>
            <div className="w-4 h-4 rotate-45 bg-red-500 border-2 border-white mt-1" />
          </div>
        </Marker>
      )}

      {positions.map((p) => {
        const isSelected = p.driver_user_id === selectedDriverId;
        const color = FLEET_STATUS_COLOR[p.status] ?? "#6b7280";
        const label = labels[p.driver_user_id];
        return (
          <Marker
            key={p.id}
            latitude={p.latitude}
            longitude={p.longitude}
            anchor="center"
            onClick={(e: any) => {
              e?.originalEvent?.stopPropagation?.();
              onSelect(p.driver_user_id);
            }}
          >
            <div className="flex flex-col items-center cursor-pointer">
              <div
                className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap mb-1 border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-zinc-900/90 text-white border-zinc-700",
                )}
              >
                {label?.bus ?? "Bus"} · {label?.driver ?? "Fahrer"}
                
              </div>
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform",
                  isSelected && "scale-125 ring-4 ring-white/30",
                )}
                style={{ backgroundColor: color, border: "3px solid white" }}
                title={FLEET_STATUS_LABEL[p.status]}
              >
                <Bus className="w-4 h-4 text-white" style={{ transform: `rotate(${p.heading}deg)` }} />
              </div>
            </div>
          </Marker>
        );
      })}
    </Map>
  );
};

export default FleetMap;
