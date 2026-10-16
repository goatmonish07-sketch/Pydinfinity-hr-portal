"use client";

import { useMemo, useState } from "react";
import { Printer, PenLine, FileSignature, History } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import type { Person } from "@/lib/types";
import { addDays, cn, fmtDate, fmtINR, fullName, qp, todayISO } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Field, PageHeader } from "@/components/ui";

const TEMPLATES = [
  { id: "offer", name: "Offer letter", for: ["employee", "intern"] },
  { id: "appointment", name: "Appointment letter", for: ["employee"] },
  { id: "certificate", name: "Internship certificate", for: ["intern"] },
  { id: "experience", name: "Experience letter", for: ["employee", "intern"] },
  { id: "relieving", name: "Relieving letter", for: ["employee"] },
  { id: "salary", name: "Salary revision", for: ["employee"] },
  { id: "warning", name: "Warning letter", for: ["employee", "intern"] },
  { id: "contract", name: "Freelance agreement", for: ["freelancer"] },
] as const;
type TemplateId = (typeof TEMPLATES)[number]["id"];

function body(t: TemplateId, p: Person, company: string, extra: { revised: number }) {
  const name = fullName(p);
  const he = p.gender === "Female" ? "she" : p.gender === "Male" ? "he" : "they";
  const his = p.gender === "Female" ? "her" : p.gender === "Male" ? "his" : "their";
  switch (t) {
    case "offer":
      return [`Dear ${p.firstName},`, `We are delighted to offer you the position of ${p.designation} in our ${p.department} team at ${company}, based at ${p.branch}. Your expected date of joining is ${fmtDate(p.joiningDate)}.`, p.type === "employee" ? `Your annual cost to company will be ${fmtINR(p.ctc ?? 0)}, the detailed break-up of which is enclosed.` : `You will receive a monthly stipend of ${fmtINR(p.intern?.stipend ?? 0)} for the duration of the internship.`, `This offer is subject to verification of your documents and background. Please sign and return a copy of this letter as acceptance.`, `We look forward to welcoming you aboard.`];
    case "appointment":
      return [`Dear ${p.firstName},`, `Further to your acceptance of our offer, we are pleased to appoint you as ${p.designation} with effect from ${fmtDate(p.joiningDate)}. Your employee ID is ${p.code ?? "to be issued"}.`, `You will be on probation for a period of six months, during which either party may terminate employment with 15 days' notice. Thereafter, the notice period will be 60 days.`, `You will be governed by the policies of ${company} as amended from time to time.`];
    case "certificate":
      return [`TO WHOM IT MAY CONCERN`, `This is to certify that ${name}, a student of ${p.intern?.course ?? ""} at ${p.intern?.college ?? ""}, has successfully completed ${his} internship with ${company} from ${fmtDate(p.intern?.startDate)} to ${fmtDate(p.intern?.endDate)}.`, `During this period ${he} worked on “${p.intern?.project ?? ""}” in our ${p.department} team and demonstrated sincerity, a strong learning attitude and excellent teamwork.`, `We wish ${p.firstName} every success in the future.`];
    case "experience":
      return [`TO WHOM IT MAY CONCERN`, `This is to certify that ${name} (ID ${p.code}) was associated with ${company} as ${p.designation} in the ${p.department} department from ${fmtDate(p.joiningDate)} to ${fmtDate(todayISO())}.`, `During ${his} tenure we found ${p.firstName} to be hard-working, dependable and a valued member of the team.`, `We wish ${p.firstName} the very best in all future endeavours.`];
    case "relieving":
      return [`Dear ${p.firstName},`, `This is to confirm that your resignation has been accepted and you are relieved from your duties as ${p.designation} at ${company} with effect from close of business on ${fmtDate(todayISO())}.`, `Your full and final settlement has been processed and all company assets have been returned. We thank you for your contributions and wish you success ahead.`];
    case "salary":
      return [`Dear ${p.firstName},`, `In recognition of your performance and contribution, we are pleased to revise your annual cost to company from ${fmtINR(p.ctc ?? 0)} to ${fmtINR(extra.revised)}, effective ${fmtDate(addDays(todayISO(), 15))}.`, `All other terms and conditions of your employment remain unchanged. Keep up the great work!`];
    case "warning":
      return [`Dear ${p.firstName},`, `This letter serves as a formal warning regarding repeated non-adherence to company attendance and conduct policies, which has been discussed with you previously.`, `You are expected to show immediate and sustained improvement. Further instances may lead to stricter disciplinary action as per company policy.`, `Please acknowledge receipt of this letter.`];
    case "contract":
      return [`This Freelance Services Agreement is entered into between ${company} and ${name} (PAN ${p.pan ? p.pan.slice(0, 2) + "XXXX" + p.pan.slice(6) : "—"}).`, `Term: ${fmtDate(p.freelancer?.contractStart)} to ${fmtDate(p.freelancer?.contractEnd)}. Rate: ${fmtINR(p.freelancer?.rate ?? 0)} ${p.freelancer?.rateType === "Hourly" ? "per hour" : "per project"}.`, `Invoices will be paid within 15 days of approval, subject to TDS under section 194J${p.freelancer?.gstin ? " and applicable GST" : ""}.`, `All work product created under this agreement shall be the exclusive property of ${company}. Both parties agree to the confidentiality terms in the attached NDA.`];
  }
}

export default function LettersPage() {
  const { role, me } = useMe();
  const people = useHR((s) => s.people);
  const company = useHR((s) => s.settings.companyName);
  const branches = useHR((s) => s.settings.branches);
  const letters = useHR((s) => s.letters);
  const addLetter = useHR((s) => s.addLetter);
  const self = !can(role, "letters.generate");
  const [personId, setPersonId] = useState(self ? me.id : qp("person") || people.find((p) => p.type === "employee" && p.status === "Active")!.id);
  const person = people.find((p) => p.id === personId)!;
  const available = TEMPLATES.filter((t) => (t.for as readonly string[]).includes(person.type));
  const [tpl, setTpl] = useState<TemplateId>((qp("template") as TemplateId) || available[0].id);
  const template = available.find((t) => t.id === tpl) ?? available[0];
  const [signed, setSigned] = useState(true);
  const [revised, setRevised] = useState(Math.round(((person.ctc ?? 600000) * 1.12) / 1000) * 1000);
  const paras = useMemo(() => body(template.id, person, company, { revised }), [template.id, person, company, revised]);
  const signer = people.find((p) => p.id === "p2");
  const ref = `${company.split(" ")[0].slice(0, 3).toUpperCase()}/HR/${new Date().getFullYear()}/${String(letters.length + 101).padStart(4, "0")}`;

  return (
    <div>
      <PageHeader eyebrow="Module 9 · Letter Generator" title="Letters" subtitle="Auto-filled from profile data, on company letterhead, with e-sign." />
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            {!self && (
              <Field label="Person">{(id) => (
                <select id={id} className="input" value={personId} onChange={(e) => { setPersonId(e.target.value); const np = people.find((x) => x.id === e.target.value)!; const av = TEMPLATES.filter((t) => (t.for as readonly string[]).includes(np.type)); if (!av.some((a) => a.id === tpl)) setTpl(av[0].id); }}>
                  {people.filter((p) => p.code).map((p) => <option key={p.id} value={p.id}>{fullName(p)} · {p.code}</option>)}
                </select>
              )}</Field>
            )}
            <div>
              <p className="label">Template</p>
              <div className="grid grid-cols-2 gap-2">
                {available.map((t) => (
                  <button key={t.id} onClick={() => setTpl(t.id)} className={cn("min-h-11 rounded-[calc(var(--radius)*0.7)] border px-3 py-2 text-left text-[13px] font-medium", template.id === t.id ? "border-primary bg-primary-soft text-primary" : "border-line-strong text-fg-2 hover:bg-surface-2")}>{t.name}</button>
                ))}
              </div>
            </div>
            {template.id === "salary" && <Field label="Revised CTC (₹)">{(id) => <input id={id} type="number" className="input" value={revised} onChange={(e) => setRevised(Number(e.target.value))} />}</Field>}
            <label className="flex cursor-pointer items-center gap-3 rounded-[calc(var(--radius)*0.7)] border border-line p-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
              <PenLine className="h-4 w-4 text-primary" /> Apply e-signature
            </label>
            <Button className="w-full" icon={Printer} onClick={() => { addLetter(person.id, template.name, signed); window.print(); }}>Download / Print PDF</Button>
          </Card>
          <Card>
            <CardHeader title="Recently generated" icon={History} />
            <ul className="divide-y divide-line">
              {letters.filter((l) => !self || l.personId === me.id).slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="min-w-0"><span className="block truncate font-medium">{l.template}</span><span className="block truncate text-xs text-muted">{fullName(people.find((p) => p.id === l.personId))} · {fmtDate(l.date)}</span></span>
                  {l.signed && <Badge tone="success">e-signed</Badge>}
                </li>
              ))}
              {letters.length === 0 && <li className="p-5 text-sm text-muted">No letters yet.</li>}
            </ul>
          </Card>
        </div>

        <div className="scroll-thin overflow-x-auto rounded-[var(--radius)] bg-surface-3 p-3 sm:p-6">
          <article className="print-area mx-auto w-full max-w-[794px] bg-white text-[#1f2430] shadow-xl print:shadow-none" style={{ minHeight: 900 }}>
            <header className="gradient-brand flex items-center justify-between px-8 py-6 text-white sm:px-12" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20"><FileSignature className="h-6 w-6" /></span>
                <div><p className="font-[family-name:var(--font-display)] text-xl font-bold">{company}</p><p className="text-xs opacity-85">{branches.filter((b) => b !== "Remote").join(" · ")}</p></div>
              </div>
            </header>
            <div className="px-8 py-8 font-serif text-[14.5px] leading-7 sm:px-12">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-[#6b7280]"><span>Ref: {ref}</span><span>Date: {fmtDate(todayISO(), { day: "numeric", month: "long", year: "numeric" })}</span></div>
              {!["certificate", "experience", "contract"].includes(template.id) && (
                <p className="mt-6">{fullName(person)}<br /><span className="text-[#4b5563]">{person.address}</span></p>
              )}
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-wide">{template.name}</h2>
              <div className="mt-4 space-y-4">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>
              <div className="mt-12">
                <p>For {company},</p>
                <div className="mt-2 h-14">
                  {signed && <p className="font-[cursive] text-3xl italic" style={{ color: "var(--primary)" }}>{signer?.firstName} {signer?.lastName}</p>}
                </div>
                <p className="font-semibold">{fullName(signer)}</p>
                <p className="text-sm text-[#4b5563]">{signer?.designation}</p>
                {signed && <p className="mt-1 text-[11px] text-[#6b7280]">Digitally signed on {fmtDate(todayISO())} · {ref}</p>}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
