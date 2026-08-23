// Erkennung des nativen Capacitor-Kontexts + sichere Geräte-Ablage.
// Fällt im Web automatisch auf localStorage zurück.

export const isNativeApp = (): boolean => {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

export const nativePlatform = (): "ios" | "android" | "web" => {
  if (typeof window === "undefined") return "web";
  const p = (window as any).Capacitor?.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
};

type PreferencesApi = {
  get: (o: { key: string }) => Promise<{ value: string | null }>;
  set: (o: { key: string; value: string }) => Promise<void>;
  remove: (o: { key: string }) => Promise<void>;
};

let prefs: PreferencesApi | null = null;
const loadPrefs = async (): Promise<PreferencesApi | null> => {
  if (!isNativeApp()) return null;
  if (prefs) return prefs;
  try {
    const mod = await import("@capacitor/preferences");
    prefs = mod.Preferences as unknown as PreferencesApi;
    return prefs;
  } catch {
    return null;
  }
};

/** Kleine Key-Value-Ablage: nativ Keychain/Keystore, im Web localStorage. */
export const deviceStore = {
  async get(key: string): Promise<string | null> {
    const p = await loadPrefs();
    if (p) return (await p.get({ key })).value;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    const p = await loadPrefs();
    if (p) return void (await p.set({ key, value }));
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  async remove(key: string): Promise<void> {
    const p = await loadPrefs();
    if (p) return void (await p.remove({ key }));
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const APP_STORE_KEYS = {
  guestEmail: "metours.app.guestEmail",
  guestToken: "metours.app.guestToken",
  offlineTickets: "metours.app.offlineTickets",
} as const;
