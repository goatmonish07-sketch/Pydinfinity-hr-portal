"use client";

import { useState } from "react";
import { Palette, Sun, Moon, Monitor, Check, Building2, RotateCcw, ShieldCheck, Lock, KeyRound, DatabaseBackup, Fingerprint, Users, CalendarDays } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { DARK_SURFACES, PRESETS, readableOn, useTheme, type Radius } from "@/lib/theme";
import { cn, formatPersonCode } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Field, PageHeader, Progress, StatusBadge } from "@/components/ui";
import type { LeaveType } from "@/lib/types";

export default function SettingsPage() {
  const { role } = useMe();
  const t = useTheme();
  const settings = useHR((s) => s.settings);
  const updateSettings = useHR((s) => s.updateSettings);
  const resetDemo = useHR((s) => s.resetDemo);
  const [primary, setPrimary] = useState(t.primary);
  const [accent2, setAccent2] = useState(t.accent2);
  const [company, setCompany] = useState(settings.companyName);
  const [code, setCode] = useState(settings.companyCode);
  const [branches, setBranches] = useState(settings.branches.join(", "));
  const [departments, setDepartments] = useState(settings.departments.join(", "));
  const [quota, setQuota] = useState(settings.leaveQuota);
  const admin = can(role, "settings");

  return (
    <div>
      <PageHeader eyebrow="System" title="Settings & themes" subtitle="Make the portal yours — colours, dark mode style, corner radius and company setup." />

      {/* ---------------- Theme studio ---------------- */}
      <Card className="mb-5">
        <CardHeader title="Theme studio" subtitle="Saved on this device" icon={Palette} action={<Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => { t.reset(); setPrimary("#e91e63"); setAccent2("#8e24aa"); }}>Reset</Button>} />
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section>
              <p className="label">Mode</p>
              <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                {([["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]] as const).map(([m, I, l]) => (
                  <button key={m} onClick={() => t.setMode(m)} aria-pressed={t.mode === m} className={cn("flex h-20 flex-col items-center justify-center gap-1.5 rounded-[var(--radius)] border-2 text-sm font-semibold transition-colors", t.mode === m ? "border-primary bg-primary-soft text-primary" : "border-line hover:border-line-strong")}>
                    <I className="h-5 w-5" /> {l}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="label">Colour theme</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {PRESETS.map((p) => (
                  <button key={p.id} onClick={() => { t.setPreset(p); setPrimary(p.primary); setAccent2(p.accent2); }} aria-pressed={t.presetId === p.id} className={cn("group relative overflow-hidden rounded-[var(--radius)] border-2 p-1.5 text-left transition-colors", t.presetId === p.id ? "border-primary" : "border-line hover:border-line-strong")}>
                    <span className="block h-14 rounded-[calc(var(--radius)*0.7)]" style={{ backgroundImage: `linear-gradient(135deg, ${p.primary}, ${p.accent2})` }} />
                    <span className="flex items-center justify-between px-1 pb-0.5 pt-1.5 text-xs font-semibold">{p.name}{t.presetId === p.id && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="label">Custom brand colours</p>
              <div className="flex flex-wrap items-end gap-3">
                {([["Primary", primary, setPrimary], ["Gradient accent", accent2, setAccent2]] as const).map(([l, v, set]) => (
                  <label key={l} className="flex items-center gap-2 rounded-[var(--radius)] border border-line p-2 pr-3">
                    <input type="color" value={v} onChange={(e) => { set(e.target.value); l === "Primary" ? t.setCustom(e.target.value, accent2) : t.setCustom(primary, e.target.value); }} className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label={l} />
                    <span><span className="block text-xs text-muted">{l}</span><input value={v} onChange={(e) => { set(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) l === "Primary" ? t.setCustom(e.target.value, accent2) : t.setCustom(primary, e.target.value); }} className="w-24 bg-transparent font-mono text-sm font-semibold uppercase outline-none" aria-label={`${l} hex`} /></span>
                  </label>
                ))}
                <span className="text-xs text-muted">Button text auto-switches to {readableOn(primary) === "#ffffff" ? "white" : "dark"} for contrast.</span>
              </div>
            </section>

            <section>
              <p className="label">Dark mode style</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DARK_SURFACES.map((s) => (
                  <button key={s.id} onClick={() => { t.setSurface(s.id); if (t.mode === "light") t.setMode("dark"); }} aria-pressed={t.surface === s.id} className={cn("rounded-[var(--radius)] border-2 p-1.5 text-left", t.surface === s.id ? "border-primary" : "border-line hover:border-line-strong")}>
                    <span className="flex h-12 items-end gap-1 rounded-[calc(var(--radius)*0.7)] p-2" style={{ background: s.swatch || `color-mix(in oklab, ${t.primary} 14%, #0e1016)` }}>
                      <span className="h-2 w-6 rounded-full" style={{ background: t.primary }} />
                      <span className="h-2 w-4 rounded-full bg-white/30" />
                    </span>
                    <span className="block px-1 pt-1.5 text-xs font-semibold">{s.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="label">Corner style</p>
              <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                {(["sharp", "default", "round"] as Radius[]).map((r) => (
                  <button key={r} onClick={() => t.setRadius(r)} aria-pressed={t.radius === r} className={cn("h-11 border-2 text-sm font-semibold capitalize", t.radius === r ? "border-primary bg-primary-soft text-primary" : "border-line")} style={{ borderRadius: r === "sharp" ? 6 : r === "round" ? 20 : 14 }}>{r}</button>
                ))}
              </div>
            </section>
          </div>

          {/* Live preview */}
          <div className="rounded-[var(--radius)] border border-line bg-bg p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Live preview</p>
            <div className="gradient-brand rounded-[var(--radius)] p-4 text-primary-fg">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-85">Good morning</p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold">42 people · 7 departments</p>
            </div>
            <div className="card mt-3 space-y-3 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">KYC completion</p><Badge tone="primary">78%</Badge></div>
              <Progress value={78} label="Preview" />
              <div className="flex flex-wrap gap-2"><StatusBadge status="Verified" /><StatusBadge status="Pending" /><StatusBadge status="Rejected" /></div>
              <div className="flex gap-2"><Button size="sm">Primary</Button><Button size="sm" variant="soft">Soft</Button><Button size="sm" variant="secondary">Secondary</Button></div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- Company ---------------- */}
      {admin && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Company & ID format" icon={Building2} />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Company name">{(id) => <input id={id} className="input" value={company} onChange={(e) => setCompany(e.target.value)} />}</Field>
              <Field label="Company code" hint={`Next: ${formatPersonCode(code || "XXX", "employee", new Date().getFullYear(), 1)}`}>{(id) => <input id={id} className="input font-mono uppercase" maxLength={5} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />}</Field>
              <Field label="Branches" hint="Comma separated" className="sm:col-span-2">{(id) => <input id={id} className="input" value={branches} onChange={(e) => setBranches(e.target.value)} />}</Field>
              <Field label="Departments" hint="Comma separated" className="sm:col-span-2">{(id) => <input id={id} className="input" value={departments} onChange={(e) => setDepartments(e.target.value)} />}</Field>
              <p className="text-xs text-muted sm:col-span-2">Changing the code affects new IDs only — issued IDs are locked.</p>
            </div>
            <div className="border-t border-line p-4 sm:px-5">
              <Button onClick={() => updateSettings({ companyName: company.trim() || settings.companyName, companyCode: code || settings.companyCode, branches: branches.split(",").map((s) => s.trim()).filter(Boolean), departments: departments.split(",").map((s) => s.trim()).filter(Boolean) })}>Save company settings</Button>
            </div>
          </Card>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Leave policy" subtitle="Annual quota per person" icon={CalendarDays} />
              <div className="grid grid-cols-3 gap-3 p-4 sm:p-5">
                {(["CL", "SL", "EL"] as LeaveType[]).map((k) => (
                  <Field key={k} label={k}>{(id) => <input id={id} type="number" min={0} className="input" value={quota[k]} onChange={(e) => setQuota({ ...quota, [k]: Number(e.target.value) })} />}</Field>
                ))}
              </div>
              <div className="border-t border-line p-4 sm:px-5"><Button variant="secondary" onClick={() => updateSettings({ leaveQuota: quota })}>Save leave policy</Button></div>
            </Card>
            <Card>
              <CardHeader title="Security & compliance" icon={ShieldCheck} />
              <ul className="divide-y divide-line text-sm">
                {[
                  [Fingerprint, "Two-factor authentication", "Required for all admin & HR users"],
                  [Users, "Role-based access + row-level security", "Super Admin · HR · Manager · Self-service"],
                  [Lock, "Private encrypted document storage", "Short-lived signed links only"],
                  [KeyRound, "DPDP Act consent", "Captured at every document upload"],
                  [DatabaseBackup, "Daily automatic backups", "Retention / deletion after exit"],
                ].map(([I, a, b]) => {
                  const Icon = I as typeof Lock;
                  return (
                    <li key={a as string} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-success-soft text-success"><Icon className="h-4 w-4" /></span>
                      <span className="flex-1"><span className="block font-medium">{a as string}</span><span className="block text-xs text-muted">{b as string}</span></span>
                      <Badge tone="success">On</Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div><p className="text-sm font-semibold">Demo data</p><p className="text-xs text-muted">Restore the sample workspace</p></div>
              <Button variant="secondary" icon={RotateCcw} onClick={() => { if (confirm("Reset all demo data? Your changes will be lost.")) resetDemo(); }}>Reset demo</Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
