import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label: string;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, label, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setDirty(true);
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
    onChange(null);
  };

  const apply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const white = document.createElement("canvas");
    white.width = canvas.width;
    white.height = canvas.height;
    const wctx = white.getContext("2d")!;
    wctx.fillStyle = "#ffffff";
    wctx.fillRect(0, 0, white.width, white.height);
    wctx.drawImage(canvas, 0, 0);
    onChange(white.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        {value && <span className="text-[11px] text-[#00CC36]">gespeichert</span>}
      </div>
      {value ? (
        <div className="rounded-lg border border-zinc-700 bg-white p-2">
          <img src={value} alt={`Unterschrift ${label}`} className="h-16 object-contain" />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full h-[110px] rounded-lg border border-dashed border-zinc-600 bg-white touch-none cursor-crosshair"
        />
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" onClick={clear} disabled={disabled}>
          <Eraser className="w-3 h-3 mr-1.5" /> Löschen
        </Button>
        {!value && (
          <Button type="button" size="sm" className="h-8 text-xs" onClick={apply} disabled={disabled || !dirty}>
            <Check className="w-3 h-3 mr-1.5" /> Übernehmen
          </Button>
        )}
      </div>
    </div>
  );
}
