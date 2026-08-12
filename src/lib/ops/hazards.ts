/**
 * Verkehrs- und Gefahrenlage fuer das OPS Center.
 *
 * Rechtlicher Hinweis (Deutschland, § 23 Abs. 1c StVO):
 * Feste Geschwindigkeitsmessstellen duerfen im Disponenten-Cockpit als
 * Routen-/Verkehrsinformation dargestellt werden. Die Fahrer-App darf daraus
 * KEINE aktive Blitzerwarnung erzeugen (kein Ton, kein Warn-Popup waehrend der
 * Fahrt). Deshalb sind Messstellen hier als `driverVisible: false` markiert und
 * werden ausschliesslich im OPS Center gerendert.
 */

export type HazardType =
  | "construction"
  | "closure"
  | "accident"
  | "danger"
  | "traffic"
  | "jam"
  | "speed_camera_fixed"
  | "speed_camera_mobile";

export interface OpsHazard {
  id: string;
  hazard_type: HazardType;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  speed_limit_kmh: number | null;
  severity: "low" | "medium" | "high";
  source: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface HazardMeta {
  label: string;
  icon: string;
  color: string;
  /** Darf die Information in der Fahrer-Navi aktiv angezeigt/angesagt werden? */
  driverVisible: boolean;
  layer: OpsLayerKey;
}

export type OpsLayerKey =
  | "buses"
  | "routes"
  | "traffic"
  | "construction"
  | "closures"
  | "hazards"
  | "danger"
  | "cameras";

export const HAZARD_META: Record<HazardType, HazardMeta> = {
  construction: { label: "Baustelle", icon: "🚧", color: "#f59e0b", driverVisible: true, layer: "construction" },
  closure: { label: "Straßensperrung", icon: "⛔", color: "#ef4444", driverVisible: true, layer: "closures" },
  accident: { label: "Unfall", icon: "⚠️", color: "#f97316", driverVisible: true, layer: "hazards" },
  danger: { label: "Gefahrenstelle", icon: "🚨", color: "#dc2626", driverVisible: true, layer: "danger" },
  traffic: { label: "Verkehrsbehinderung", icon: "🚦", color: "#eab308", driverVisible: true, layer: "traffic" },
  jam: { label: "Stau", icon: "🛣️", color: "#fb923c", driverVisible: true, layer: "traffic" },
  speed_camera_fixed: { label: "Feste Messstelle", icon: "📍", color: "#38bdf8", driverVisible: false, layer: "cameras" },
  speed_camera_mobile: { label: "Mobile Messstelle", icon: "📍", color: "#818cf8", driverVisible: false, layer: "cameras" },
};

export const OPS_LAYERS: { key: OpsLayerKey; label: string }[] = [
  { key: "buses", label: "Busse" },
  { key: "routes", label: "Routen" },
  { key: "traffic", label: "Verkehr" },
  { key: "construction", label: "Baustellen" },
  { key: "closures", label: "Sperrungen" },
  { key: "hazards", label: "Hindernisse" },
  { key: "danger", label: "Gefahrenstellen" },
  { key: "cameras", label: "Feste Messstellen" },
];

export const DEFAULT_LAYERS: Record<OpsLayerKey, boolean> = {
  buses: true,
  routes: true,
  traffic: true,
  construction: true,
  closures: true,
  hazards: true,
  danger: true,
  cameras: true,
};

/** Hindernis-Typen, die eine Umfahrung rechtfertigen. */
export const BLOCKING_TYPES: HazardType[] = ["closure", "accident", "construction", "danger"];
