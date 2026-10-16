import type { DocKind, HRDocument, Person, PersonType } from "./types";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

let counter = 0;
export function uid(prefix = "id") {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const DAY = 86_400_000;
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (d: string | Date, n: number) => new Date(new Date(d).getTime() + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string | Date, b: string | Date) =>
  Math.round((new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0)) / DAY);

export function fmtDate(d?: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", opts);
}
export function fmtTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
export function fmtINR(n: number, compact = false) {
  if (compact) {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
export function relative(d: string) {
  const diff = daysBetween(todayISO(), d);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export const fullName = (p?: Pick<Person, "firstName" | "lastName">) => (p ? `${p.firstName} ${p.lastName}` : "—");
export const initials = (p: Pick<Person, "firstName" | "lastName">) => `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();

export const TYPE_CODE: Record<PersonType, string> = { employee: "EMP", intern: "INT", freelancer: "FRL" };
export const TYPE_LABEL: Record<PersonType, string> = { employee: "Employee", intern: "Intern", freelancer: "Freelancer" };

/** PYD-EMP-26-0001 : company code, type, 2-digit year, running number */
export function formatPersonCode(company: string, type: PersonType, year: number, seq: number) {
  return `${company}-${TYPE_CODE[type]}-${String(year % 100).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;
}

export const REQUIRED_DOCS: Record<PersonType, DocKind[]> = {
  employee: [
    "Aadhaar",
    "PAN",
    "Bank / Cancelled Cheque",
    "Address Proof",
    "Photo",
    "Education Certificate",
    "Previous Relieving Letter",
    "Signed Offer Letter",
    "NDA",
  ],
  intern: ["Aadhaar", "PAN", "Bank / Cancelled Cheque", "Photo", "College ID", "NDA"],
  freelancer: ["Aadhaar", "PAN", "Bank / Cancelled Cheque", "Contract", "NDA"],
};

export function kycPercent(docs: HRDocument[]) {
  if (!docs.length) return 0;
  return Math.round((docs.filter((d) => d.status === "Verified").length / docs.length) * 100);
}

export function maskAadhaar(last4: string) {
  return `XXXX XXXX ${last4}`;
}
export function maskPan(pan: string) {
  return pan ? `${pan.slice(0, 2)}XXXX${pan.slice(6)}` : "—";
}

export function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Simple salary breakup from annual CTC (India) */
export function salaryBreakup(ctc: number) {
  const monthly = ctc / 12;
  const basic = Math.round(monthly * 0.5);
  const hra = Math.round(basic * 0.4);
  const special = Math.round(monthly * 0.25);
  const lta = Math.round(monthly * 0.05);
  const gross = basic + hra + special + lta;
  const pf = Math.round(Math.min(basic, 15000) * 0.12);
  const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const pt = 200;
  const tds = ctc > 1_000_000 ? Math.round(monthly * 0.08) : ctc > 700_000 ? Math.round(monthly * 0.04) : 0;
  const deductions = pf + esi + pt + tds;
  return { basic, hra, special, lta, gross, pf, esi, pt, tds, deductions, net: gross - deductions };
}

/** Read a URL query param on the client (pages render after mount, so window is available). */
export function qp(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}
