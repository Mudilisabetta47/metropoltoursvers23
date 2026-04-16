import { useState, useEffect, useCallback } from "react";
import { Settings2, GripVertical, Eye, EyeOff, RotateCcw, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface PanelConfig {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  zone: "bottom-left" | "right";
}

const DEFAULT_LAYOUT: PanelConfig[] = [
  // Bottom-left panels
  { id: "scanner", label: "Ticketprüfung", icon: "🎫", visible: true, zone: "bottom-left" },
  { id: "command", label: "Leitstelle", icon: "⚡", visible: true, zone: "bottom-left" },
  { id: "weather", label: "Wetter", icon: "🌤", visible: true, zone: "bottom-left" },
  { id: "occupancy", label: "Auslastung", icon: "👥", visible: true, zone: "bottom-left" },
  // Right column panels
  { id: "incidents", label: "Vorfälle", icon: "⚠️", visible: true, zone: "right" },
  { id: "delay", label: "Verspätungsprognose", icon: "🧠", visible: true, zone: "right" },
  { id: "employees", label: "Personal", icon: "👤", visible: true, zone: "right" },
  { id: "handover", label: "Schichtübergabe", icon: "🔄", visible: true, zone: "right" },
  { id: "notes", label: "Interne Notizen", icon: "📝", visible: true, zone: "right" },
  { id: "logs", label: "Protokolle", icon: "📋", visible: true, zone: "right" },
  { id: "messaging", label: "Fahrer-Nachrichten", icon: "💬", visible: false, zone: "right" },
  { id: "maintenance", label: "Wartungsplaner", icon: "🔧", visible: false, zone: "right" },
  { id: "radio", label: "Funk (Walkie-Talkie)", icon: "📻", visible: true, zone: "right" },
];

const STORAGE_KEY = "ops-layout-config";

export const useLayoutConfig = () => {
  const [panels, setPanels] = useState<PanelConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PanelConfig[];
        // Merge with defaults to handle new panels added later
        const ids = new Set(parsed.map(p => p.id));
        const merged = [
          ...parsed,
          ...DEFAULT_LAYOUT.filter(d => !ids.has(d.id)),
        ];
        return merged;
      }
    } catch {}
    return DEFAULT_LAYOUT;
  });

  const save = useCallback((updated: PanelConfig[]) => {
    setPanels(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    save(panels.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  }, [panels, save]);

  const movePanel = useCallback((id: string, direction: "up" | "down") => {
    const idx = panels.findIndex(p => p.id === id);
    if (idx === -1) return;
    const panel = panels[idx];
    // Find siblings in same zone
    const zoneIds = panels.filter(p => p.zone === panel.zone).map(p => p.id);
    const zoneIdx = zoneIds.indexOf(id);
    const swapZoneIdx = direction === "up" ? zoneIdx - 1 : zoneIdx + 1;
    if (swapZoneIdx < 0 || swapZoneIdx >= zoneIds.length) return;
    const swapId = zoneIds[swapZoneIdx];
    const swapGlobalIdx = panels.findIndex(p => p.id === swapId);

    const updated = [...panels];
    [updated[idx], updated[swapGlobalIdx]] = [updated[swapGlobalIdx], updated[idx]];
    save(updated);
  }, [panels, save]);

  const changeZone = useCallback((id: string, zone: PanelConfig["zone"]) => {
    save(panels.map(p => p.id === id ? { ...p, zone } : p));
  }, [panels, save]);

  const resetLayout = useCallback(() => {
    save([...DEFAULT_LAYOUT]);
  }, [save]);

  const getVisiblePanels = useCallback((zone: PanelConfig["zone"]) => {
    return panels.filter(p => p.zone === zone && p.visible);
  }, [panels]);

  return { panels, toggleVisibility, movePanel, changeZone, resetLayout, getVisiblePanels };
};

interface LayoutConfiguratorProps {
  panels: PanelConfig[];
  onToggle: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onChangeZone: (id: string, zone: PanelConfig["zone"]) => void;
  onReset: () => void;
}

const LayoutConfigurator = ({ panels, onToggle, onMove, onChangeZone, onReset }: LayoutConfiguratorProps) => {
  const zones: { key: PanelConfig["zone"]; label: string }[] = [
    { key: "bottom-left", label: "Hauptbereich (unten)" },
    { key: "right", label: "Seitenleiste (rechts)" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-[#111a28] transition-colors"
          title="Layout anpassen"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-[#0e1420] border-[#1a2436] text-white w-80 p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-[#1a2436]">
          <SheetTitle className="text-zinc-200 text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            Layout anpassen
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-4 overflow-auto max-h-[calc(100vh-80px)]">
          {zones.map(zone => {
            const zonePanels = panels.filter(p => p.zone === zone.key);
            return (
              <div key={zone.key}>
                <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  {zone.label}
                </h3>
                <div className="space-y-1">
                  {zonePanels.map((panel, idx) => (
                    <div
                      key={panel.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                        panel.visible
                          ? "bg-[#111a28] border-[#1e2836]"
                          : "bg-[#0c1018] border-[#141e2e] opacity-60"
                      )}
                    >
                      <span className="text-sm">{panel.icon}</span>
                      <span className="text-[11px] font-medium text-zinc-300 flex-1 truncate">
                        {panel.label}
                      </span>

                      {/* Move up/down */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => onMove(panel.id, "up")}
                          disabled={idx === 0}
                          className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onMove(panel.id, "down")}
                          disabled={idx === zonePanels.length - 1}
                          className="p-0.5 text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Zone switch */}
                      <button
                        onClick={() => onChangeZone(panel.id, zone.key === "right" ? "bottom-left" : "right")}
                        className="p-1 rounded text-zinc-600 hover:text-zinc-400 hover:bg-[#1e2836] text-[9px]"
                        title={zone.key === "right" ? "Nach links verschieben" : "Nach rechts verschieben"}
                      >
                        {zone.key === "right" ? "←" : "→"}
                      </button>

                      {/* Toggle visibility */}
                      <button
                        onClick={() => onToggle(panel.id)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          panel.visible
                            ? "text-emerald-400 hover:bg-emerald-500/10"
                            : "text-zinc-600 hover:bg-[#1e2836]"
                        )}
                      >
                        {panel.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pt-2 border-t border-[#1a2436]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full text-zinc-500 hover:text-white hover:bg-[#111a28] text-[11px] h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Standard-Layout wiederherstellen
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LayoutConfigurator;
