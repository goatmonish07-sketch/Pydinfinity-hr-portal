"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mode = "light" | "dark" | "system";
export type DarkSurface = "aura" | "charcoal" | "oled" | "tinted";
export type Radius = "sharp" | "default" | "round";

/** A skin sets primary + accent separately for light and dark (stepped for each surface, AuraPOS style). */
export interface ThemePreset {
  id: string;
  name: string;
  light: [primary: string, accent: string];
  dark: [primary: string, accent: string];
}

export const PRESETS: ThemePreset[] = [
  { id: "emerald", name: "Aura Emerald", light: ["#266244", "#c9973f"], dark: ["#5cb080", "#e2b870"] },
  { id: "pyd", name: "Pydinfinity Blue", light: ["#1d4ed8", "#38bdf8"], dark: ["#60a5fa", "#7dd3fc"] },
  { id: "rose", name: "Boutique Rose", light: ["#a04062", "#c8965a"], dark: ["#e480a4", "#e2b478"] },
  { id: "midnight", name: "Midnight", light: ["#4848a8", "#3f8ea3"], dark: ["#8c8cf0", "#78d2e4"] },
  { id: "ocean", name: "Ocean", light: ["#187084", "#c96f35"], dark: ["#56bed4", "#f0a878"] },
  { id: "sand", name: "Sand", light: ["#966828", "#5d7a54"], dark: ["#deae62", "#96ba8a"] },
  { id: "berry", name: "Berry", light: ["#b0215c", "#7a4fc9"], dark: ["#f06a9e", "#b49af0"] },
  { id: "violet", name: "Violet", light: ["#6a3fb8", "#d0883a"], dark: ["#a98af0", "#e8ae6e"] },
  { id: "graphite", name: "Graphite", light: ["#3d4a5c", "#b08440"], dark: ["#9fb0c6", "#d8b06e"] },
];

export const DARK_SURFACES: { id: DarkSurface; name: string; swatch: string }[] = [
  { id: "aura", name: "Aura Forest", swatch: "#141b17" },
  { id: "charcoal", name: "Charcoal", swatch: "#17181a" },
  { id: "oled", name: "OLED Black", swatch: "#000000" },
  { id: "tinted", name: "Skin Tinted", swatch: "" },
];

export interface ThemeState {
  mode: Mode;
  presetId: string; // "custom" for the colour picker
  custom: [primary: string, accent: string];
  surface: DarkSurface;
  radius: Radius;
  setMode: (m: Mode) => void;
  setPreset: (id: string) => void;
  setCustom: (primary: string, accent: string) => void;
  setSurface: (s: DarkSurface) => void;
  setRadius: (r: Radius) => void;
  reset: () => void;
}

const DEFAULTS = {
  mode: "system" as Mode,
  presetId: "emerald",
  custom: ["#266244", "#c9973f"] as [string, string],
  surface: "aura" as DarkSurface,
  radius: "default" as Radius,
};

export const THEME_KEY = "pyd-hr-theme-v2";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Black or white text for a given background (WCAG relative luminance). */
export function readableOn(hex: string) {
  return luminance(hex) > 0.36 ? "#0a140e" : "#f7fbf8";
}
/** Mix a hex toward white (t>0) or black (t<0). */
export function shade(hex: string, t: number) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(t > 0 ? c + (255 - c) * t : c * (1 + t));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function resolveColors(s: Pick<ThemeState, "presetId" | "custom">, dark: boolean): [string, string] {
  const p = PRESETS.find((x) => x.id === s.presetId);
  if (p) return dark ? p.dark : p.light;
  const [pr, ac] = s.custom;
  // a custom colour is lifted for dark surfaces so it keeps contrast
  return dark ? [luminance(pr) < 0.25 ? shade(pr, 0.38) : pr, luminance(ac) < 0.25 ? shade(ac, 0.3) : ac] : [pr, ac];
}

export function isDarkMode(mode: Mode) {
  return mode === "dark" || (mode === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function applyTheme(s: Pick<ThemeState, "mode" | "presetId" | "custom" | "surface" | "radius">) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = isDarkMode(s.mode);
  const [primary, accent] = resolveColors(s, dark);
  root.dataset.mode = dark ? "dark" : "light";
  root.dataset.surface = s.surface;
  root.dataset.skin = s.presetId;
  root.dataset.radius = s.radius;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--primary-fg", readableOn(primary));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0c110e" : "#eef0eb");
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMode: (mode) => set({ mode }),
      setPreset: (presetId) => set({ presetId }),
      setCustom: (primary, accent) => set({ presetId: "custom", custom: [primary, accent] }),
      setSurface: (surface) => set({ surface }),
      setRadius: (radius) => set({ radius }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: THEME_KEY }
  )
);

/** Runs before first paint (inlined in <head>) so there's no flash of the wrong theme. */
export const themeBootScript = `(function(){try{var P=${JSON.stringify(Object.fromEntries(PRESETS.map((p) => [p.id, [p.light, p.dark]])))};var r=document.documentElement;var raw=localStorage.getItem('${THEME_KEY}');var s=raw?JSON.parse(raw).state:{};var m=s.mode||'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.mode=d?'dark':'light';r.dataset.surface=s.surface||'aura';r.dataset.skin=s.presetId||'emerald';r.dataset.radius=s.radius||'default';var p=P[s.presetId||'emerald'];var c=p?p[d?1:0]:(s.custom||null);if(c){r.style.setProperty('--primary',c[0]);r.style.setProperty('--accent',c[1]);}}catch(e){document.documentElement.dataset.mode='light';}})();`;
