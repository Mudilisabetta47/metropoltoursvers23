import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let cachedSiteKey: string | null = null;
let scriptLoadPromise: Promise<void> | null = null;

const fetchSiteKey = async (): Promise<string> => {
  if (cachedSiteKey) return cachedSiteKey;
  const { data, error } = await supabase.functions.invoke("get-recaptcha-key");
  if (error) throw error;
  cachedSiteKey = (data as { siteKey: string })?.siteKey ?? "";
  return cachedSiteKey;
};

const loadScript = (siteKey: string): Promise<void> => {
  if (scriptLoadPromise) return scriptLoadPromise;
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-recaptcha="v3"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    s.defer = true;
    s.dataset.recaptcha = "v3";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(s);
  });
  return scriptLoadPromise;
};

/**
 * useRecaptcha - load Google reCAPTCHA v3 and execute on demand.
 * Returns executeRecaptcha(action) -> token | null (null if disabled / unavailable).
 */
export const useRecaptcha = () => {
  const [ready, setReady] = useState(false);
  const siteKeyRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchSiteKey();
        if (!key) { setReady(false); return; }
        siteKeyRef.current = key;
        await loadScript(key);
        if (cancelled) return;
        setReady(true);
      } catch (e) {
        console.warn("[recaptcha] init failed", e);
        setReady(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    try {
      const key = siteKeyRef.current || (await fetchSiteKey());
      if (!key || !window.grecaptcha) return null;
      await new Promise<void>((res) => window.grecaptcha!.ready(res));
      return await window.grecaptcha!.execute(key, { action });
    } catch (e) {
      console.warn("[recaptcha] execute failed", e);
      return null;
    }
  }, []);

  /**
   * Verify a token server-side. Resolves true if human (score >= minScore), false otherwise.
   * If no token (e.g. script blocked), defaults to true to avoid blocking real users.
   */
  const verifyToken = useCallback(async (token: string | null, action: string, minScore = 0.5): Promise<boolean> => {
    if (!token) return true;
    try {
      const { data, error } = await supabase.functions.invoke("verify-recaptcha", {
        body: { token, action, minScore },
      });
      if (error) {
        console.warn("[recaptcha] verify error", error);
        return true; // fail-open to avoid blocking legitimate users on infra issues
      }
      return Boolean((data as { success?: boolean })?.success);
    } catch (e) {
      console.warn("[recaptcha] verify exception", e);
      return true;
    }
  }, []);

  /** Helper: execute + verify in one call. Returns true if human. */
  const protect = useCallback(async (action: string, minScore = 0.5): Promise<boolean> => {
    const token = await executeRecaptcha(action);
    return verifyToken(token, action, minScore);
  }, [executeRecaptcha, verifyToken]);

  return { ready, executeRecaptcha, verifyToken, protect };
};
