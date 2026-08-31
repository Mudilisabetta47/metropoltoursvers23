const CLEANUP_VERSION = "metours-sw-cleanup-2026-07-28";
const RELOAD_FLAG = `${CLEANUP_VERSION}-reloaded`;
const NATIVE_RELOAD_FLAG = `${CLEANUP_VERSION}-native-reloaded`;

function isNativeContainer() {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  return ["capacitor:", "ionic:"].includes(window.location.protocol);
}

function isAppShellWorker(url: string) {
  try {
    const workerUrl = new URL(url);
    return workerUrl.origin === window.location.origin && ["/sw.js", "/service-worker.js"].includes(workerUrl.pathname);
  } catch {
    return false;
  }
}

function isAppShellCache(name: string) {
  return /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-|^workbox-|vite-pwa|google-fonts-cache|gstatic-fonts-cache/.test(name);
}

function shouldReloadAfterCleanup() {
  const path = window.location.pathname;
  return path === "/admin/driver" || path.startsWith("/admin/driver/") || path === "/fahrer" || path.startsWith("/fahrer/");
}

/**
 * Im nativen Capacitor-Container darf niemals ein Service Worker aktiv sein:
 * alle Registrierungen und der komplette (app-eigene, origin-isolierte)
 * Cache-Storage werden entfernt, damit die WKWebView immer die frischen
 * Assets aus dem Bundle lädt.
 */
async function cleanupNativeContainer() {
  let removedSomething = false;

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) {
      removedSomething = true;
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    }
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    if (cacheNames.length > 0) {
      removedSomething = true;
      await Promise.allSettled(cacheNames.map((name) => caches.delete(name)));
    }
  }

  if (removedSomething && !window.sessionStorage.getItem(NATIVE_RELOAD_FLAG)) {
    window.sessionStorage.setItem(NATIVE_RELOAD_FLAG, "1");
    window.location.reload();
  }
}

export async function cleanupStaleAppShellServiceWorkers() {
  if (typeof window === "undefined") return;

  const supportsServiceWorker = "serviceWorker" in navigator;
  const supportsCaches = "caches" in window;
  let removedSomething = false;

  try {
    if (isNativeContainer()) {
      await cleanupNativeContainer();
      return;
    }

    if (supportsServiceWorker) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appRegistrations = registrations.filter((registration) => {
        const urls = [registration.active?.scriptURL, registration.waiting?.scriptURL, registration.installing?.scriptURL].filter(
          (url): url is string => Boolean(url),
        );
        return urls.some(isAppShellWorker);
      });

      if (appRegistrations.length > 0) {
        removedSomething = true;
        await Promise.allSettled(appRegistrations.map((registration) => registration.unregister()));
      }
    }

    if (supportsCaches) {
      const cacheNames = await caches.keys();
      const appCacheNames = cacheNames.filter(isAppShellCache);
      if (appCacheNames.length > 0) {
        removedSomething = true;
        await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
      }
    }

    if (removedSomething && shouldReloadAfterCleanup() && !window.sessionStorage.getItem(RELOAD_FLAG)) {
      window.sessionStorage.setItem(RELOAD_FLAG, "1");
      const freshUrl = new URL(window.location.href);
      freshUrl.searchParams.set("fresh", Date.now().toString());
      window.location.replace(freshUrl.toString());
    }
  } catch (error) {
    console.warn("Stale app cache cleanup skipped", error);
  } finally {
    window.localStorage.setItem(CLEANUP_VERSION, "done");
  }
}
