import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isNativeApp } from "@/mobile/lib/native";

const APP_PATHS = ["/app", "/auth", "/reisen/checkout", "/terms", "/privacy", "/imprint", "/widerruf"];

function nativePathFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "metropoltours:") {
      const path = `/${url.host}${url.pathname}`.replace(/\/{2,}/g, "/");
      return `${path || "/app"}${url.search}${url.hash}`;
    }
    if (["app.metours.de", "www.metours.de", "metours.de"].includes(url.hostname)) {
      if (url.pathname.startsWith("/reisen/checkout")) return `${url.pathname}${url.search}${url.hash}`;
      if (url.pathname.startsWith("/reisen/")) {
        const slug = url.pathname.slice("/reisen/".length);
        return `/app/reisen/${slug}${url.search}${url.hash}`;
      }
      return url.pathname.startsWith("/app") ? `${url.pathname}${url.search}${url.hash}` : "/app";
    }
  } catch {
    return null;
  }
  return null;
}

/** Aktiviert ausschließlich im installierten Capacitor-Container native iOS-Verhalten. */
export default function NativeAppBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isNativeApp()) return;

    document.documentElement.classList.add("native-ios-app");
    const handles: Array<{ remove: () => Promise<void> }> = [];

    void (async () => {
      const [{ App }, { StatusBar, Style }, { Keyboard, KeyboardResize }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/status-bar"),
        import("@capacitor/keyboard"),
      ]);

      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light });
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      handles.push(
        await App.addListener("appUrlOpen", ({ url }) => {
          const destination = nativePathFromUrl(url);
          if (destination) navigate(destination);
        }),
        await App.addListener("resume", () => {
          void queryClient.invalidateQueries();
          window.dispatchEvent(new Event("metours:native-resume"));
        }),
        await Keyboard.addListener("keyboardWillShow", () => document.documentElement.classList.add("native-keyboard-open")),
        await Keyboard.addListener("keyboardWillHide", () => document.documentElement.classList.remove("native-keyboard-open")),
      );
    })().catch((error) => console.error("Native app initialization failed", error));

    return () => {
      document.documentElement.classList.remove("native-ios-app", "native-keyboard-open");
      handles.forEach((handle) => void handle.remove());
    };
  }, [navigate, queryClient]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const allowed = APP_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
    if (!allowed) navigate("/app", { replace: true });
  }, [location.pathname, navigate]);

  return null;
}