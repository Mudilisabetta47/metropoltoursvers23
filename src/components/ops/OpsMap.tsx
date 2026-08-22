import { useEffect, useMemo, useRef } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "@vis.gl/react-mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Bus } from "lucide-react";
import { FLEET_STATUS_COLOR, FLEET_STATUS_LABEL, FleetPosition, DispatchOrder } from "@/hooks/useFleet";
import { HAZARD_META, OpsHazard, OpsLayerKey } from "@/lib/ops/hazards";
import { gpsHealth } from "@/lib/ops/gps";
import { cn } from "@/lib/utils";

interface OpsMapProps {
  token: string;
  positions: FleetPosition[];
  labels: Record<string, { driver: string; bus: string }>;
  orderByDriver: Record<string, DispatchOrder | undefined>;
  hazards: OpsHazard[];
  layers: Record<OpsLayerKey, boolean>;
  selectedDriverId: string | null;
  onSelect: (driverUserId: string) => void;
  onMapClick?: (lngLat: { lat: number; lng: number }) => void;
  pickMode?: boolean;
}

const OpsMap = ({
  token,
  positions,
  labels,
  orderByDriver,
  hazards,
  layers,
  selectedDriverId,
  onSelect,
  onMapClick,
  pickMode,
}: OpsMapProps) => {
  const mapRef = useRef<any>(null);

  const initial = useMemo(() => {
    if (positions.length === 0) return { latitude: 51.2, longitude: 10.0, zoom: 5.4 };
    const lat = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
    const lng = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
    return { latitude: lat, longitude: lng, zoom: positions.length === 1 ? 10 : 5.8 };
  }, [positions.length]);

  // Auf ausgewaehlten Bus zoomen
  useEffect(() => {
    if (!selectedDriverId) return;
    const p = positions.find((x) => x.driver_user_id === selectedDriverId);
    if (!p) return;
    mapRef.current?.getMap?.()?.easeTo?.({ center: [p.longitude, p.latitude], zoom: 12, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriverId]);

  const routeFeatures = useMemo(() => {
    if (!layers.routes) return [];
    return Object.entries(orderByDriver)
      .filter(([driverId, o]) => !!o?.route_geometry && (selectedDriverId ? driverId === selectedDriverId : true))
      .map(([driverId, o]) => ({
        type: "Feature" as const,
        geometry: o!.route_geometry as GeoJSON.LineString,
        properties: { driverId, selected: driverId === selectedDriverId },
      }));
  }, [orderByDriver, layers.routes, selectedDriverId]);

  const visibleHazards = useMemo(
    () => hazards.filter((h) => layers[HAZARD_META[h.hazard_type]?.layer ?? "hazards"]),
    [hazards, layers],
  );

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={token}
      initialViewState={initial}
      style={{ width: "100%", height: "100%", cursor: pickMode ? "crosshair" : undefined }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      attributionControl={false}
      onClick={(e: any) => onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {routeFeatures.length > 0 && (
        <Source
          id="ops-routes"
          type="geojson"
          data={{ type: "FeatureCollection", features: routeFeatures } as any}
        >
          <Layer
            id="ops-route-casing"
            type="line"
            paint={{ "line-color": "#052e16", "line-width": 9, "line-opacity": 0.7 }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
          <Layer
            id="ops-route-line"
            type="line"
            paint={{
              "line-color": ["case", ["get", "selected"], "#00CC36", "#0ea5e9"],
              "line-width": ["case", ["get", "selected"], 5, 3],
              "line-opacity": ["case", ["get", "selected"], 1, 0.6],
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      )}

      {/* Ziele */}
      {layers.routes &&
        Object.entries(orderByDriver).map(([driverId, o]) =>
          o?.destination_lat && (!selectedDriverId || selectedDriverId === driverId) ? (
            <Marker
              key={`dest-${o.id}`}
              latitude={Number(o.destination_lat)}
              longitude={Number(o.destination_lng)}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[10px] text-white whitespace-nowrap">
                  {o.destination_name ?? "Ziel"}
                </div>
                <div className="w-3 h-3 rotate-45 bg-red-500 border-2 border-white mt-1" />
              </div>
            </Marker>
          ) : null,
        )}

      {/* Verkehr & Hindernisse */}
      {visibleHazards.map((h) => {
        const meta = HAZARD_META[h.hazard_type];
        return (
          <Marker key={h.id} latitude={h.latitude} longitude={h.longitude} anchor="center">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] text-white shadow-lg"
              style={{ backgroundColor: `${meta?.color ?? "#71717a"}dd`, borderColor: "rgba(255,255,255,.5)" }}
              title={`${meta?.label}: ${h.title}`}
            >
              <span>{meta?.icon}</span>
              <span className="max-w-[120px] truncate">
                {h.hazard_type.startsWith("speed_camera") && h.speed_limit_kmh
                  ? `${h.speed_limit_kmh} km/h`
                  : h.title}
              </span>
            </div>
          </Marker>
        );
      })}

      {/* Busse */}
      {layers.buses &&
        positions.map((p) => {
          const isSelected = p.driver_user_id === selectedDriverId;
          const health = gpsHealth(p.updated_at);
          const color =
            health === "offline" ? "#ef4444" : health === "lost" ? "#f97316" : FLEET_STATUS_COLOR[p.status] ?? "#6b7280";
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
                  {label?.bus ?? "Bus"} · {label?.driver ?? "Fahrer"} · {Math.round(p.speed_kmh)} km/h
                  
                </div>
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-700",
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

export default OpsMap;
