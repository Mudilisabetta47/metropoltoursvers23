import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { isNativeApp, nativeHaptic } from "@/mobile/lib/native";

const TRIGGER_DISTANCE = 72;

export function NativePullToRefresh({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const startY = useRef<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isNativeApp() || window.scrollY > 0 || refreshing) return;
    startY.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (startY.current == null || window.scrollY > 0) return;
    const currentY = event.touches[0]?.clientY ?? startY.current;
    setDistance(Math.min(92, Math.max(0, (currentY - startY.current) * 0.45)));
  };

  const finish = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (distance < TRIGGER_DISTANCE) {
      setDistance(0);
      return;
    }
    setRefreshing(true);
    setDistance(52);
    await nativeHaptic("light");
    await queryClient.invalidateQueries();
    window.dispatchEvent(new Event("metours:native-refresh"));
    setRefreshing(false);
    setDistance(0);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => void finish()}>
      {(distance > 0 || refreshing) && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-[60] flex justify-center transition-transform"
          style={{ transform: `translateY(${Math.max(8, distance - 44)}px)` }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-card">
            <RefreshCw className={`h-4 w-4 text-primary ${refreshing ? "animate-spin" : ""}`} />
          </span>
        </div>
      )}
      {children}
    </div>
  );
}