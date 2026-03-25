import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (!error && data?.token) {
          setToken(data.token);
        }
      } catch (e) {
        console.error("Failed to fetch Mapbox token:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  return { token, isLoading };
};
