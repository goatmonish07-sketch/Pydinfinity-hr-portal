"use client";

import { useEffect, useState } from "react";
import { Palette, Sun, Moon, Monitor, Check, Building2, RotateCcw, ShieldCheck, Lock, KeyRound, DatabaseBackup, Fingerprint, Users, CalendarDays, BellRing, Mail, MessageCircle } from "lucide-react";
import { can, useHR, useMe, type Permission } from "@/lib/store";
import { DARK_SURFACES, PRESETS, isDarkMode, readableOn, resolveColors, useTheme, type Radius } from "@/lib/theme";
import { cn, formatPersonCode } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Field, PageHeader, Progress, StatusBadge, Switch } from "@/components/ui";
import type { LeaveType, Role } from "@/lib/types";

const ROLES: Role[] = ["Super Admin", "HR", "Manager", "Self-service"];
const PERM_ROWS: [Permission, string][] = [
  ["people.manage", "Add & edit people"],
  ["people.viewAll", "View everyone"],
  ["ids.issue", "Issue IDs"],
  ["kyc.verify", "Verify KYC"],
  ["letters.generate", "Generate letters"],
  ["leave.approve", "Approve leave"],
  ["intern.feedback", "Intern feedback"],
  ["payroll", "Payroll"],
  ["recruit", "Recruitment"],
  ["audit", "Audit log"],
  ["settings", "Settings & ID format"],
];

const NOTIF_KEY = "pyd-hr-notif-prefs";
const NOTIF_ROWS = [
  { id: "kyc", label: "KYC uploads waiting", hint: "When someone uploads a document" },
  { id: "expiry", label: "Document expiry", hint: "30 days before a document expires" },
  { id: "intern", label: "Internships ending", hint: "14 days before the end date" },
  { id: "contract", label: "Contract renewals", hint: "30 days before a freelance contract ends" },
  { id: "leave", label: "Leave requests", hint: "New requests for your approval" },
  { id: "celebration", label: "Birthdays & anniversaries", hint: "Automatic wishes on the notice board" },
];

export default function SettingsPage() {
  const { role } = useMe();
  const t = useTheme();
  const settings = useHR((s) => s.settings);
  const updateSettings = useHR((s) => s.updateSettings);
  const resetDemo = useHR((s) => s.resetDemo);
  const toast = useHR((s) => s.toast);
  const dark = isDarkMode(t.mode);
  const [cur, curAccent] = resolveColors(t, false);
  const [primary, setPrimary] = useState(t.presetId === "custom" ? t.custom[0] : cur);
  const [accent, setAccent] = useState(t.presetId === "custom" ? t.custom[1] : curAccent);
  const [company, setCompany] = useState(settings.companyName);
  const [code, setCode] = useState(settings.companyCode);
  const [branches, setBranches] = useState(settings.branches.join(", "));
  const [departments, setDepartments] = useState(settings.departments.join(", "));
  const [quota, setQuota] = useState(settings.leaveQuota);
  const [prefs, setPrefs] = useState<Record<string, { app: boolean; email: boolean; whatsapp: boolean }>>({});
  const admin = can(role, "settings");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      setPrefs(raw ? JSON.parse(raw) : Object.fromEntries(NOTIF_ROWS.map((r) => [r.id, { app: true, email: r.id !== "celebration", whatsapp: r.id === "leave" || r.id === "expiry" }])));
    } catch {
      /* storage unavailable — keep defaults in memory */
    }
  }, []);
  const setPref = (id: string, ch: "app" | "email" | "whatsapp", v: boolean) => {
    const next = { ...prefs, [id]: { ...(prefs[id] ?? { app: true, email: true, whatsapp: false }), [ch]: v } };
    setPrefs(next);
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const applyCustom = (p: string, a: string) => /^#[0-9a-f]{6}$/i.test(p) && /^#[0-9a-f]{6}$/i.test(a) && t.setCustom(p, a);

  return (
    <div>
      <PageHeader eyebrow="System" title="Settings & themes" subtitle="Make the portal yours — skins, custom brand colours, dark mode style, corner radius and company setup." />

      {/* ---------------- Theme studio ---------------- */}
      <Card className="mb-4">
        <CardHeader
          title="Theme studio"
          subtitle="Saved on this device"
          icon={Palette}
          action={
            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => { t.reset(); setPrimary("#266244"); setAccent("#c9973f"); }}>
              Reset
            </Button>
          }
        />
        <div className="grid gap-6 p-4 sm:p-[22px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section>
              <p className="label">Mode</p>
              <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                {([["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]] as const).map(([m, I, l]) => (
                  <button key={m} onClick={() => t.setMode(m)} aria-pressed={t.mode === m} className={cn("flex h-20 flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 text-sm font-semibold transition-colors", t.mode === m ? "border-primary bg-primary-soft text-primary" : "border-line hover:border-line-strong")}>
                    <I className="h-5 w-5" /> {l}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="label">Skin</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESETS.map((p) => {
                  const [a, b] = dark ? p.dark : p.light;
                  return (
                    <button key={p.id} onClick={() => { t.setPreset(p.id); setPrimary(p.light[0]); setAccent(p.light[1]); }} aria-pressed={t.presetId === p.id} className={cn("lift rounded-[20px] border-2 p-1.5 text-left", t.presetId === p.id ? "border-primary" : "border-line hover:border-line-strong")}>
                      <span className="relative block h-14 overflow-hidden rounded-[14px]" style={{ background: `linear-gradient(135deg, ${a}, color-mix(in oklab, ${a} 62%, #000))` }}>
                        <span className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full" style={{ background: b }} />
                      </span>
                      <span className="flex items-center justify-between px-1 pb-0.5 pt-1.5 text-xs font-bold">
                        {p.name}
                        {t.presetId === p.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="label">Custom brand colours {t.presetId === "custom" && <Badge tone="primary" className="ml-1">Active</Badge>}</p>
              <div className="flex flex-wrap items-center gap-3">
                {([["Primary", primary, setPrimary], ["Accent", accent, setAccent]] as const).map(([l, v, set]) => (
                  <label key={l} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface-2 p-2 pr-4">
                    <span className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-surface shadow-[0_0_0_1px_var(--border)]" style={{ background: v }}>
                      <input
                        type="color"
                        value={v}
                        onChange={(e) => {
                          set(e.target.value);
                          l === "Primary" ? applyCustom(e.target.value, accent) : applyCustom(primary, e.target.value);
                        }}
                        className="absolute -inset-2 h-14 w-14 cursor-pointer opacity-0"
                        aria-label={`${l} colour`}
                      />
                    </span>
                    <span>
                      <span className="block text-xs text-muted">{l}</span>
                      <input
                        value={v}
                        onChange={(e) => {
                          set(e.target.value);
                          l === "Primary" ? applyCustom(e.target.value, accent) : applyCustom(primary, e.target.value);
                        }}
                        className="w-24 bg-transparent font-mono text-sm font-semibold uppercase outline-none"
                        aria-label={`${l} hex`}
                      />
                    </span>
                  </label>
                ))}
                <span className="text-xs text-muted">Button text switches to {readableOn(primary) === "#f7fbf8" ? "light" : "dark"} for contrast; colours are lifted automatically in dark mode.</span>
              </div>
            </section>

            <section>
              <p className="label">Dark mode style</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DARK_SURFACES.map((s) => (
                  <button key={s.id} onClick={() => { t.setSurface(s.id); if (t.mode === "light") t.setMode("dark"); }} aria-pressed={t.surface === s.id} className={cn("rounded-[20px] border-2 p-1.5 text-left", t.surface === s.id ? "border-primary" : "border-line hover:border-line-strong")}>
                    <span className="flex h-12 items-end gap-1 rounded-[14px] p-2" style={{ background: s.swatch || "color-mix(in oklab, var(--primary) 16%, #0e1016)" }}>
                      <span className="h-2 w-6 rounded-full bg-primary" />
                      <span className="h-2 w-4 rounded-full bg-white/30" />
                    </span>
                    <span className="block px-1 pt-1.5 text-xs font-bold">{s.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="label">Corner style</p>
              <div className="seg" role="group" aria-label="Corner style">
                {(["sharp", "default", "round"] as Radius[]).map((r) => (
                  <button key={r} aria-pressed={t.radius === r} onClick={() => t.setRadius(r)} className="capitalize">{r}</button>
                ))}
              </div>
            </section>
          </div>

          {/* Live preview */}
          <div className="rounded-[22px] border border-line bg-bg p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Live preview</p>
            <div className="aura-hero rounded-[22px] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><span className="live-dot" /> Active people</p>
              <p className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">42</p>
              <p className="mt-1 text-xs opacity-85">23 checked in right now</p>
            </div>
            <div className="card mt-3 space-y-3 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-bold">KYC completion</p><Badge tone="primary">78%</Badge></div>
              <Progress value={78} label="Preview" />
              <div className="flex flex-wrap gap-2"><StatusBadge status="Verified" /><StatusBadge status="Pending" /><StatusBadge status="Rejected" /></div>
              <div className="flex flex-wrap gap-2"><Button size="sm">Primary</Button><Button size="sm" variant="outline">Outline</Button><Button size="sm" variant="ghost">Ghost</Button></div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- Notifications ---------------- */}
      <Card className="mb-4">
        <CardHeader title="Notification preferences" subtitle="Where each alert is delivered" icon={BellRing} />
        <div className="px-4 pb-4 sm:px-[22px]">
          <div className="hidden grid-cols-[1fr_repeat(3,64px)] gap-2 border-b border-line pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted sm:grid">
            <span>Alert</span>
            <span className="flex items-center justify-center gap-1"><BellRing className="h-3.5 w-3.5" />App</span>
            <span className="flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" />Email</span>
            <span className="flex items-center justify-center gap-1"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</span>
          </div>
          {NOTIF_ROWS.map((r) => (
            <div key={r.id} className="grid grid-cols-1 items-center gap-2 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] py-3.5 last:border-0 sm:grid-cols-[1fr_repeat(3,64px)]">
              <span>
                <span className="block text-sm font-semibold">{r.label}</span>
                <span className="block text-xs text-muted">{r.hint}</span>
              </span>
              {(["app", "email", "whatsapp"] as const).map((ch) => (
                <span key={ch} className="flex items-center gap-2 sm:justify-center">
                  <Switch checked={prefs[r.id]?.[ch] ?? false} onChange={(v) => setPref(r.id, ch, v)} label={`${r.label} via ${ch}`} />
                  <span className="text-xs text-muted sm:hidden">{ch === "app" ? "In app" : ch === "email" ? "Email" : "WhatsApp"}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* ---------------- Roles ---------------- */}
      <Card className="mb-4">
        <CardHeader title="Roles & permissions" subtitle="Role-based access, enforced with row-level security on the server" icon={Users} />
        <div className="scroll-thin overflow-x-auto px-2 pb-4 sm:px-3.5">
          <table className="table min-w-[560px]">
            <thead>
              <tr>
                <th>Permission</th>
                {ROLES.map((r) => <th key={r} className="!text-center">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERM_ROWS.map(([perm, label]) => (
                <tr key={perm}>
                  <td className="font-medium">{label}</td>
                  {ROLES.map((r) => {
                    const on = can(r, perm);
                    return (
                      <td key={r} className="text-center">
                        <span className={cn("inline-grid h-8 w-8 place-items-center rounded-[10px] border-2", on ? "border-primary bg-primary text-primary-fg" : "border-line")} aria-label={on ? "Allowed" : "Not allowed"}>
                          {on && <Check className="h-4 w-4" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="font-medium">Own profile, documents, leave, letters & payslips</td>
                {ROLES.map((r) => (
                  <td key={r} className="text-center"><span className="inline-grid h-8 w-8 place-items-center rounded-[10px] border-2 border-primary bg-primary text-primary-fg"><Check className="h-4 w-4" /></span></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------------- Company ---------------- */}
      {admin && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Company & ID format" icon={Building2} />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-[22px] sm:pt-2">
              <Field label="Company name">{(id) => <input id={id} className="input" value={company} onChange={(e) => setCompany(e.target.value)} />}</Field>
              <Field label="Company code" hint={`Next: ${formatPersonCode(code || "XXX", "employee", new Date().getFullYear(), 1)}`}>{(id) => <input id={id} className="input font-mono uppercase" maxLength={5} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />}</Field>
              <Field label="Branches" hint="Comma separated" className="sm:col-span-2">{(id) => <input id={id} className="input" value={branches} onChange={(e) => setBranches(e.target.value)} />}</Field>
              <Field label="Departments" hint="Comma separated" className="sm:col-span-2">{(id) => <input id={id} className="input" value={departments} onChange={(e) => setDepartments(e.target.value)} />}</Field>
              <p className="text-xs text-muted sm:col-span-2">Changing the code affects new IDs only — issued IDs are locked.</p>
              <div className="sm:col-span-2">
                <Button onClick={() => updateSettings({ companyName: company.trim() || settings.companyName, companyCode: code || settings.companyCode, branches: branches.split(",").map((s) => s.trim()).filter(Boolean), departments: departments.split(",").map((s) => s.trim()).filter(Boolean) })}>Save company settings</Button>
              </div>
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Leave policy" subtitle="Annual quota per person" icon={CalendarDays} />
              <div className="grid grid-cols-3 gap-3 p-4 sm:p-[22px] sm:pt-2">
                {(["CL", "SL", "EL"] as LeaveType[]).map((k) => (
                  <Field key={k} label={k}>{(id) => <input id={id} type="number" min={0} className="input" value={quota[k]} onChange={(e) => setQuota({ ...quota, [k]: Number(e.target.value) })} />}</Field>
                ))}
                <div className="col-span-3"><Button variant="outline" onClick={() => updateSettings({ leaveQuota: quota })}>Save leave policy</Button></div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Security & compliance" icon={ShieldCheck} />
              <ul className="px-2 pb-3 text-sm sm:px-3.5">
                {[
                  [Fingerprint, "Two-factor authentication", "Required for admin & HR users"],
                  [Users, "Role-based access + row-level security", "Super Admin · HR · Manager · Self-service"],
                  [Lock, "Private encrypted document storage", "Short-lived signed links only"],
                  [KeyRound, "DPDP Act consent", "Captured at every document upload"],
                  [DatabaseBackup, "Daily automatic backups", "Retention / deletion after exit"],
                ].map(([I, a, b]) => {
                  const Icon = I as typeof Lock;
                  return (
                    <li key={a as string} className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-3 last:border-0">
                      <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-success-soft text-success"><Icon className="h-4 w-4" /></span>
                      <span className="flex-1"><span className="block font-semibold">{a as string}</span><span className="block text-xs text-muted">{b as string}</span></span>
                      <Badge tone="success">On</Badge>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-[22px]">
              <div><p className="font-bold">Demo data</p><p className="text-xs text-muted">Restore the sample workspace</p></div>
              <Button variant="danger" icon={RotateCcw} onClick={() => { if (confirm("Reset all demo data? Your changes will be lost.")) { resetDemo(); toast("Demo data restored"); } }}>Reset demo</Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
