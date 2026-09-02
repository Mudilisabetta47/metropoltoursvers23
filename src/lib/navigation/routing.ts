/**
 * Modulare Routing-Schicht (Mapbox Directions / Geocoding).
 *
 * Wichtig: Die Mapbox Directions API liefert im Profil "driving-traffic" KEINE
 * vollstaendigen LKW-/Busbeschraenkungen (Hoehe, Gewicht, Durchfahrtsverbote).
 * Deshalb ist das Fahrzeugprofil hier bewusst als eigene Schicht modelliert und
 * wird als `vehicleProfile` durchgereicht: sobald ein Truck-faehiger Provider
 * angebunden wird, muss nur `requestRoute()` erweitert werden.
 */

const MAPBOX_BASE = "https://api.mapbox.com";

export interface VehicleProfile {
  busNumber?: string | null;
  heightCm?: number | null;
  widthCm?: number | null;
  lengthCm?: number | null;
  weightKg?: number | null;
  axles?: number | null;
  routingNotes?: string | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  modifier?: string;
  location: [number, number];
  voiceInstruction?: string;
}

export interface TollSegment {
  name: string;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  distanceFromStartKm: number;
  lengthKm: number;
}

export interface TollCost {
  currency: string;
  cash: number | null;
  electronic: number | null;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  geometry: GeoJSON.LineString;
  steps: RouteStep[];
  maxspeeds: (number | null)[];
  /** Mautabschnitte laut Routing-Provider (leer, wenn keine Maut auf der Strecke). */
  tolls: TollSegment[];
  /** false = Provider liefert fuer diese Route keine Mautinformationen. */
  tollDataAvailable: boolean;
  /** Kostenangabe des Providers, sonst null (es wird nichts geschaetzt). */
  tollCost: TollCost | null;
  fetchedAt: string;
}

export interface GeocodeResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/** Standardprofil unseres Reisebusses, falls dem Auftrag kein Fahrzeug zugeordnet ist. */
export const DEFAULT_COACH_PROFILE: VehicleProfile = {
  busNumber: null,
  heightCm: 360,
  widthCm: 255,
  lengthCm: 1250,
  weightKg: 18000,
  axles: 3,
  routingNotes: null,
};

export const buildVehicleProfile = (bus: any | null | undefined): VehicleProfile => {
  if (!bus) return DEFAULT_COACH_PROFILE;
  return {
    busNumber: bus.bus_number ?? bus.name ?? null,
    heightCm: bus.height_cm ?? DEFAULT_COACH_PROFILE.heightCm,
    widthCm: bus.width_cm ?? DEFAULT_COACH_PROFILE.widthCm,
    lengthCm: bus.length_cm ?? DEFAULT_COACH_PROFILE.lengthCm,
    weightKg: bus.weight_kg ?? DEFAULT_COACH_PROFILE.weightKg,
    axles: bus.axles ?? DEFAULT_COACH_PROFILE.axles,
    routingNotes: bus.routing_notes ?? null,
  };
};

/** Hinweise, die aus dem Fahrzeugprofil abgeleitet werden. */
export const vehicleProfileWarnings = (p: VehicleProfile | null): string[] => {
  if (!p) return [];
  const w: string[] = [];
  if (p.heightCm && p.heightCm >= 350) w.push(`Fahrzeughöhe ${(p.heightCm / 100).toFixed(2)} m – Unterführungen prüfen`);
  if (p.weightKg && p.weightKg >= 12000) w.push(`Gesamtgewicht ${(p.weightKg / 1000).toFixed(1)} t – Brücken-/Gewichtsbeschränkungen prüfen`);
  if (p.lengthCm && p.lengthCm >= 1300) w.push(`Fahrzeuglänge ${(p.lengthCm / 100).toFixed(1)} m – enge Ortsdurchfahrten meiden`);
  if (p.axles && p.axles >= 3) w.push(`${p.axles} Achsen – Mautklasse und Achslasten beachten`);
  if (p.routingNotes) w.push(p.routingNotes);
  return w;
};


export async function requestRoute(
  token: string,
  points: GeoPoint[],
  opts: { vehicleProfile?: VehicleProfile | null; language?: string } = {},
): Promise<RouteResult> {
  if (!token) throw new Error("Mapbox-Token fehlt");
  if (points.length < 2) throw new Error("Mindestens Start und Ziel erforderlich");

  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const params = new URLSearchParams({
    access_token: token,
    geometries: "geojson",
    overview: "full",
    steps: "true",
    language: opts.language ?? "de",
    annotations: "maxspeed,duration,distance",
    voice_instructions: "true",
    banner_instructions: "true",
    voice_units: "metric",
    compute_toll_cost: "true",
  });

  const res = await fetch(`${MAPBOX_BASE}/directions/v5/mapbox/driving-traffic/${coords}?${params}`);
  if (!res.ok) throw new Error(`Routing fehlgeschlagen (${res.status})`);
  const json = await res.json();
  const route = json.routes?.[0];
  if (!route) throw new Error("Keine Route gefunden");

  const steps: RouteStep[] = (route.legs ?? []).flatMap((leg: any) =>
    (leg.steps ?? []).map((s: any) => ({
      instruction: s.maneuver?.instruction ?? "",
      distance: s.distance ?? 0,
      duration: s.duration ?? 0,
      maneuver: s.maneuver?.type ?? "",
      modifier: s.maneuver?.modifier,
      location: s.maneuver?.location ?? [0, 0],
      voiceInstruction: s.voiceInstructions?.[0]?.announcement,
    })),
  );

  const maxspeeds: (number | null)[] = (route.legs ?? []).flatMap((leg: any) =>
    (leg.annotation?.maxspeed ?? []).map((m: any) =>
      m?.speed && m?.unit === "km/h" ? m.speed : null,
    ),
  );

  const toll = extractTolls(route);

  return {
    distanceKm: (route.distance ?? 0) / 1000,
    durationMin: Math.round((route.duration ?? 0) / 60),
    geometry: route.geometry,
    steps,
    maxspeeds,
    tolls: toll.segments,
    tollDataAvailable: toll.available,
    tollCost: toll.cost,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Mautabschnitte aus der Mapbox-Directions-Antwort lesen.
 * Es werden ausschliesslich Daten uebernommen, die die API tatsaechlich liefert
 * (`intersections[].classes` enthaelt "toll", `route.toll_costs`).
 * Fehlen diese Felder, wird `available = false` gemeldet – es werden KEINE
 * Mautdaten geschaetzt oder erfunden.
 */
function extractTolls(route: any): {
  segments: TollSegment[];
  available: boolean;
  cost: TollCost | null;
} {
  const legs: any[] = route.legs ?? [];
  const hasIntersectionData = legs.some((l) =>
    (l.steps ?? []).some((s: any) => Array.isArray(s.intersections) && s.intersections.length > 0),
  );

  const segments: TollSegment[] = [];
  let distanceAcc = 0;
  let openSegment: TollSegment | null = null;

  for (const leg of legs) {
    const admins: any[] = leg.admins ?? [];
    for (const s of leg.steps ?? []) {
      const intersections: any[] = s.intersections ?? [];
      const isToll = intersections.some((i) => (i.classes ?? []).includes("toll"));
      const adminIdx = intersections[0]?.admin_index ?? 0;
      const country = admins[adminIdx]?.iso_3166_1 ?? null;

      if (isToll) {
        if (!openSegment || openSegment.countryCode !== country) {
          openSegment = {
            name: s.name || s.ref || "Mautpflichtiger Abschnitt",
            countryCode: country,
            lat: s.maneuver?.location?.[1] ?? null,
            lng: s.maneuver?.location?.[0] ?? null,
            distanceFromStartKm: Math.round((distanceAcc / 1000) * 10) / 10,
            lengthKm: 0,
          };
          segments.push(openSegment);
        }
        openSegment.lengthKm += (s.distance ?? 0) / 1000;
      } else {
        openSegment = null;
      }
      distanceAcc += s.distance ?? 0;
    }
  }

  const rawCost = route.toll_costs?.[0];
  const cost: TollCost | null = rawCost
    ? {
        currency: rawCost.currency ?? "EUR",
        cash: rawCost.payment_methods?.cash ?? null,
        electronic: rawCost.payment_methods?.etc ?? rawCost.payment_methods?.["etc-x"] ?? null,
      }
    : null;

  return {
    segments: segments.map((s) => ({ ...s, lengthKm: Math.round(s.lengthKm * 10) / 10 })),
    available: hasIntersectionData,
    cost,
  };
}


export async function geocodeAddress(token: string, query: string): Promise<GeocodeResult[]> {
  if (!token || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    access_token: token,
    language: "de",
    country: "de,at,ch,nl,be,fr,it,hr,rs,ba,mk,al,si,me,xk,cz,pl,dk",
    limit: "6",
  });
  const res = await fetch(
    `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.features ?? []).map((f: any) => ({
    name: f.text ?? f.place_name,
    address: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
  }));
}

/** Luftlinie in Metern (Haversine) – fuer Off-Route-Erkennung und Fortschritt. */
export const haversineMeters = (a: GeoPoint, b: GeoPoint): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const distanceToRouteMeters = (pos: GeoPoint, line: GeoJSON.LineString): number => {
  let min = Infinity;
  for (const c of line.coordinates) {
    const d = haversineMeters(pos, { lat: c[1], lng: c[0] });
    if (d < min) min = d;
  }
  return min;
};

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
export const formatDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${Math.max(0, Math.round(min))} min`;
export const etaFrom = (min: number) =>
  new Date(Date.now() + min * 60000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

/** Sprachausgabe (rechtlich unkritische Navigationsansagen). */
export const speak = (text: string, enabled: boolean) => {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
};
