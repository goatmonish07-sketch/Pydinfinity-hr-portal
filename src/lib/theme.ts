"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mode = "light" | "dark" | "system";
export type DarkSurface = "midnight" | "charcoal" | "oled" | "tinted";
export type Radius = "sharp" | "default" | "round";

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  accent2: string;
}

export const PRESETS: ThemePreset[] = [
  { id: "boutique", name: "Boutique Rose", primary: "#e91e63", accent2: "#8e24aa" },
  { id: "indigo", name: "Indigo Royale", primary: "#6366f1", accent2: "#a855f7" },
  { id: "ocean", name: "Ocean Blue", primary: "#0ea5e9", accent2: "#6366f1" },
  { id: "emerald", name: "Emerald", primary: "#10b981", accent2: "#0ea5e9" },
  { id: "violet", name: "Violet Dusk", primary: "#8b5cf6", accent2: "#ec4899" },
  { id: "rosegold", name: "Rose Gold", primary: "#e11d48", accent2: "#f59e0b" },
  { id: "amber", name: "Amber Sun", primary: "#f59e0b", accent2: "#ef4444" },
  { id: "teal", name: "Teal Mint", primary: "#14b8a6", accent2: "#84cc16" },
  { id: "graphite", name: "Graphite", primary: "#64748b", accent2: "#334155" },
];

export const DARK_SURFACES: { id: DarkSurface; name: string; swatch: string }[] = [
  { id: "midnight", name: "Midnight", swatch: "#11151f" },
  { id: "charcoal", name: "Charcoal", swatch: "#161618" },
  { id: "oled", name: "OLED Black", swatch: "#000000" },
  { id: "tinted", name: "Accent Tinted", swatch: "" },
];

export interface ThemeState {
  mode: Mode;
  presetId: string; // "custom" when user picks their own colours
  primary: string;
  accent2: string;
  surface: DarkSurface;
  radius: Radius;
  compact: boolean;
  setMode: (m: Mode) => void;
  setPreset: (p: ThemePreset) => void;
  setCustom: (primary: string, accent2: string) => void;
  setSurface: (s: DarkSurface) => void;
  setRadius: (r: Radius) => void;
  setCompact: (c: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  mode: "system" as Mode,
  presetId: "boutique",
  primary: "#e91e63",
  accent2: "#8e24aa",
  surface: "midnight" as DarkSurface,
  radius: "default" as Radius,
  compact: false,
};

export const THEME_KEY = "pyd-hr-theme";

/** Pick black or white foreground for a given background hex (WCAG relative luminance). */
export function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return L > 0.42 ? "#0b0d12" : "#ffffff";
}

export function applyTheme(s: Pick<ThemeState, "mode" | "primary" | "accent2" | "surface" | "radius" | "compact">) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = s.mode === "dark" || (s.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.mode = dark ? "dark" : "light";
  root.dataset.surface = s.surface;
  root.dataset.radius = s.radius;
  root.dataset.density = s.compact ? "compact" : "comfortable";
  root.style.setProperty("--primary", s.primary);
  root.style.setProperty("--accent2", s.accent2);
  root.style.setProperty("--primary-fg", readableOn(s.primary));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0a0d14" : s.primary);
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMode: (mode) => set({ mode }),
      setPreset: (p) => set({ presetId: p.id, primary: p.primary, accent2: p.accent2 }),
      setCustom: (primary, accent2) => set({ presetId: "custom", primary, accent2 }),
      setSurface: (surface) => set({ surface }),
      setRadius: (radius) => set({ radius }),
      setCompact: (compact) => set({ compact }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: THEME_KEY }
  )
);

/**
 * Runs before first paint (inlined in <head>) so there is no flash of the wrong theme.
 * Kept as a string because it executes outside React.
 */
export const themeBootScript = `(function(){try{var r=document.documentElement;var raw=localStorage.getItem('${THEME_KEY}');var s=raw?JSON.parse(raw).state:{};var m=s.mode||'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.mode=d?'dark':'light';r.dataset.surface=s.surface||'midnight';r.dataset.radius=s.radius||'default';if(s.primary){r.style.setProperty('--primary',s.primary);}if(s.accent2){r.style.setProperty('--accent2',s.accent2);}}catch(e){document.documentElement.dataset.mode='light';}})();`;
