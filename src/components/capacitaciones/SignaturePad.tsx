import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export interface SignaturePadHandle {
  getDataURL: () => string | null;   // PNG base64
  isEmpty: () => boolean;
  clear: () => void;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
}

const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  ({ width = 480, height = 180, className = "", disabled = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL("image/png");
      },
      isEmpty: () => {
        const canvas = canvasRef.current;
        if (!canvas) return true;
        const ctx = canvas.getContext("2d");
        if (!ctx) return true;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return !data.some((v, i) => i % 4 === 3 && v > 0);
      },
      clear: () => clearCanvas(),
    }));

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = "clientX" in e ? e.clientX : (e as Touch).clientX;
      const clientY = "clientY" in e ? e.clientY : (e as Touch).clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Mouse
      const onMouseDown = (e: MouseEvent) => {
        if (disabled) return;
        drawing.current = true;
        lastPos.current = getPos(e, canvas);
      };
      const onMouseMove = (e: MouseEvent) => {
        if (!drawing.current || !lastPos.current) return;
        const pos = getPos(e, canvas);
        drawLine(lastPos.current, pos);
        lastPos.current = pos;
      };
      const onMouseUp = () => { drawing.current = false; lastPos.current = null; };

      // Touch
      const onTouchStart = (e: TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        drawing.current = true;
        lastPos.current = getPos(e.touches[0], canvas);
      };
      const onTouchMove = (e: TouchEvent) => {
        if (!drawing.current || !lastPos.current) return;
        e.preventDefault();
        const pos = getPos(e.touches[0], canvas);
        drawLine(lastPos.current, pos);
        lastPos.current = pos;
      };
      const onTouchEnd = () => { drawing.current = false; lastPos.current = null; };

      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("touchstart", onTouchStart, { passive: false });
      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
      canvas.addEventListener("touchend", onTouchEnd);

      return () => {
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
      };
    }, [disabled]);

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className={`relative rounded-lg border-2 ${disabled ? "border-border bg-muted/30" : "border-slate-300 bg-white"} overflow-hidden`}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full touch-none"
            style={{ cursor: disabled ? "not-allowed" : "crosshair", display: "block" }}
          />
          {/* Baseline */}
          <div className="absolute bottom-8 left-8 right-8 border-b border-dashed border-slate-300 pointer-events-none" />
          <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-300 pointer-events-none select-none">
            Firma aquí
          </p>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-end text-xs h-7 gap-1 text-muted-foreground"
            onClick={clearCanvas}
          >
            <Eraser className="h-3.5 w-3.5" />
            Borrar
          </Button>
        )}
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
