"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Eraser } from "lucide-react";
import { useHR } from "@/lib/store";
import { resizeImage } from "@/lib/files";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "./ui";

/** Avatar with a camera button to upload / replace / remove the profile photo. */
export function PhotoUpload({ person, size = 96, editable, onChange }: { person: Pick<Person, "firstName" | "lastName" | "hue" | "photo">; size?: number; editable: boolean; onChange: (dataUrl: string | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const toast = useHR((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await resizeImage(f));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <Avatar person={person} size={size} />
      {editable && (
        <>
          <input ref={ref} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            aria-label={person.photo ? "Change profile photo" : "Upload profile photo"}
            className={cn("absolute -bottom-0.5 -right-0.5 grid h-9 w-9 place-items-center rounded-full border-[3px] border-surface bg-primary text-primary-fg shadow-md transition-transform hover:scale-105", busy && "animate-pulse")}
          >
            <Camera className="h-4 w-4" />
          </button>
          {person.photo && (
            <button type="button" onClick={() => onChange(undefined)} aria-label="Remove profile photo" className="absolute -left-0.5 -top-0.5 grid h-8 w-8 place-items-center rounded-full border-[3px] border-surface bg-surface-2 text-danger shadow">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Finger / mouse signature pad → PNG data URL. */
export function SignaturePad({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);
  useEffect(() => {
    const c = canvas.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#141a3a";
  }, []);
  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  return (
    <div>
      <canvas
        ref={canvas}
        className="h-44 w-full touch-none rounded-[16px] border-2 border-dashed border-line-strong bg-white"
        aria-label="Signature area — draw your signature"
        onPointerDown={(e) => {
          drawing.current = true;
          canvas.current!.setPointerCapture(e.pointerId);
          const ctx = canvas.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvas.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          setEmpty(false);
        }}
        onPointerUp={() => (drawing.current = false)}
      />
      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={Eraser}
          onClick={() => {
            const c = canvas.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setEmpty(true);
          }}
        >
          Clear
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" disabled={empty} onClick={() => onSave(canvas.current!.toDataURL("image/png"))}>Save signature</Button>
        </div>
      </div>
    </div>
  );
}
