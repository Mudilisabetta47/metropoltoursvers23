// Native Capacitor-Brücke. Die Web-Version bleibt vollständig funktionsfähig.

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

type SecureStorageApi = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  setKeyPrefix: (prefix: string) => Promise<void>;
};

let secureStorage: SecureStorageApi | null = null;
let secureStorageReady = false;
const loadSecureStorage = async (): Promise<SecureStorageApi | null> => {
  if (!isNativeApp()) return null;
  if (secureStorageReady) return secureStorage;
  try {
    const mod = await import("@aparajita/capacitor-secure-storage");
    secureStorage = mod.SecureStorage as unknown as SecureStorageApi;
    await secureStorage.setKeyPrefix("metropol_tours_");
    secureStorageReady = true;
    return secureStorage;
  } catch {
    secureStorageReady = true;
    return null;
  }
};

/** Sensible App-Daten: nativ iOS Keychain, im Browser lokaler Web-Fallback. */
export const deviceStore = {
  async get(key: string): Promise<string | null> {
    const storage = await loadSecureStorage();
    if (storage) return storage.getItem(key);
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    const storage = await loadSecureStorage();
    if (storage) return void (await storage.setItem(key, value));
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  async remove(key: string): Promise<void> {
    const storage = await loadSecureStorage();
    if (storage) return void (await storage.removeItem(key));
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const nativeHaptic = async (kind: "light" | "selection" = "selection") => {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    if (kind === "light") await Haptics.impact({ style: ImpactStyle.Light });
    else await Haptics.selectionChanged();
  } catch {
    // Haptik ist eine progressive Verbesserung.
  }
};

export const shareNative = async (title: string, text: string, url?: string) => {
  if (isNativeApp()) {
    const { Share } = await import("@capacitor/share");
    await Share.share({ title, text, url, dialogTitle: title });
    return;
  }
  if (navigator.share) await navigator.share({ title, text, url });
  else if (url) await navigator.clipboard.writeText(url);
};

/** Öffnet externe HTTPS-Inhalte im nativen Browser statt im App-WebView. */
export const openNativeUrl = async (url: string) => {
  if (isNativeApp()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover" });
    return;
  }
  window.location.assign(url);
};

export const APP_STORE_KEYS = {
  guestEmail: "metours.app.guestEmail",
  guestToken: "metours.app.guestToken",
  offlineTickets: "metours.app.offlineTickets",
} as const;
