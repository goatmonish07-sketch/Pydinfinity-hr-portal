"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building2,
  CalendarDays,
  Droplet,
  UserCheck,
  BadgeCheck,
  GraduationCap,
  IdCard as IdIcon,
  History,
  ShieldCheck,
  Briefcase,
  Laptop,
  Repeat,
  Printer,
  PenLine,
  DoorOpen,
  type LucideIcon,
} from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import type { PersonStatus, TimelineEntry } from "@/lib/types";
import { cn, daysBetween, fmtDate, fmtINR, fullName, kycPercent, maskAadhaar, maskPan, todayISO, TYPE_LABEL } from "@/lib/utils";
import { leaveBalance, LEAVE_NAMES } from "@/lib/hr";
import { Avatar, Badge, Button, Card, CardHeader, ChipTabs, Empty, Field, Modal, Progress, Stars, StatusBadge } from "@/components/ui";
import { PersonFormModal } from "@/components/person-form";
import { IdCard } from "@/components/id-card";
import { DocumentRow } from "@/components/doc-row";
import { InternPanel } from "@/components/intern-panel";
import { PhotoUpload, SignaturePad } from "@/components/photo";
import { ResumePanel } from "@/components/resume";
import { FreelancerFormSheet } from "@/components/freelancer-form";

type Tab = "overview" | "resume" | "form" | "documents" | "work" | "timeline";

const TL_ICON: Record<TimelineEntry["kind"], LucideIcon> = {
  join: UserCheck,
  id: IdIcon,
  role: Briefcase,
  doc: ShieldCheck,
  convert: Repeat,
  status: BadgeCheck,
  note: History,
  exit: DoorOpen,
};

export function PersonPage() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { role, me } = useMe();
  const person = useHR((s) => s.people.find((p) => p.id === id));
  const people = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const assets = useHR((s) => s.assets);
  const leaves = useHR((s) => s.leaves);
  const invoices = useHR((s) => s.invoices);
  const quota = useHR((s) => s.settings.leaveQuota);
  const approve = useHR((s) => s.approvePerson);
  const update = useHR((s) => s.updatePerson);
  const log = useHR((s) => s.log);
  const tabParam = useSearchParams().get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(tabParam ?? "overview");
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showAcct, setShowAcct] = useState(false);

  useEffect(() => {
    if (person) log("view", `Profile of ${fullName(person)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!person) return <Card><Empty title="Person not found" hint="They may have been removed." action={<Button onClick={() => router.push("/people")}>Back to directory</Button>} /></Card>;

  const isSelf = person.id === me.id;
  const allowed = can(role, "people.viewAll") || isSelf || (role === "Manager" && person.managerId === me.id);
  if (!allowed) return <Card><Empty icon={Lock} title="You don't have access to this profile" hint="Row-level security: you can only view your own profile or your team." /></Card>;

  const manage = can(role, "people.manage");
  const docs = documents.filter((d) => d.personId === person.id);
  const kyc = kycPercent(docs);
  const manager = people.find((p) => p.id === person.managerId);
  const reports = people.filter((p) => p.managerId === person.id && p.status !== "Exited");
  const myAssets = assets.filter((a) => a.assignedTo === person.id);
  const bal = leaveBalance(person.id, leaves, quota);

  const info: [LucideIcon, string, string][] = [
    [Mail, "Email", person.email],
    [Phone, "Phone", person.phone || "—"],
    [Building2, "Department", `${person.department} · ${person.branch}`],
    [CalendarDays, "Joined", fmtDate(person.joiningDate)],
    [Droplet, "Blood group", person.bloodGroup || "—"],
    [MapPin, "Location", person.location || "—"],
    [MapPin, "Current address", person.address || "—"],
    [MapPin, "Permanent address", person.permanentAddress || person.address || "—"],
    [Mail, "Personal email", person.personalEmail || "—"],
    [Phone, "Alternate phone", person.altPhone || "—"],
    [UserCheck, "Father / spouse", person.guardianName || "—"],
    [CalendarDays, "Date of birth", `${fmtDate(person.dob)} · ${person.gender}`],
    [BadgeCheck, "Marital status · nationality", [person.maritalStatus, person.nationality].filter(Boolean).join(" · ") || "—"],
  ];

  return (
    <div className="space-y-5">
      <Link href={can(role, "people.viewAll") || role === "Manager" ? "/people" : "/"} className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="aura-hero h-24 rounded-none sm:h-32" />
        <div className="px-4 pb-5 sm:px-6">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="-mt-12 w-fit shrink-0 rounded-full bg-surface p-1.5 sm:-mt-14"><PhotoUpload person={person} size={96} editable={manage || isSelf} onChange={(photo) => update(person.id, { photo }, photo ? "Profile photo updated" : "Profile photo removed")} /></span>
            <div className="min-w-0 flex-1 sm:pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{fullName(person)}</h1>
                <StatusBadge status={person.status} />
              </div>
              <p className="text-fg-2">{person.designation}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={person.type === "employee" ? "primary" : person.type === "intern" ? "info" : "warning"}>{TYPE_LABEL[person.type]}</Badge>
                {person.code ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 font-mono text-xs font-semibold" title="Locked: IDs are never edited or reused">
                    <Lock className="h-3 w-3 text-muted" aria-hidden /> {person.code}
                  </span>
                ) : (
                  <Badge tone="warning">ID issued on approval</Badge>
                )}
                {person.previousCodes.map((c) => (
                  <span key={c} className="rounded-full bg-surface-3 px-2.5 py-0.5 font-mono text-xs text-muted line-through decoration-1" title="Previous ID (kept in history)">{c}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-3">
              {person.status === "Pending Approval" && can(role, "ids.issue") && <Button icon={BadgeCheck} onClick={() => approve(person.id)}>Approve & issue ID</Button>}
              {person.code && <Button variant="secondary" icon={IdIcon} onClick={() => setShowCard(true)}>ID card</Button>}
              {person.type === "intern" && manage && person.status !== "Exited" && <Button variant="soft" icon={Repeat} onClick={() => setConverting(true)}>Convert to employee</Button>}
              {(manage || isSelf) && <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>}
            </div>
          </div>
        </div>
      </Card>

      <ChipTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview" },
          { value: "resume", label: "Resume" },
          ...(person.type === "freelancer" ? [{ value: "form" as Tab, label: "Freelancer form" }] : []),
          { value: "documents", label: "Documents & KYC", count: docs.length },
          { value: "work", label: person.type === "intern" ? "Internship" : person.type === "freelancer" ? "Contract & invoices" : "Work & leave" },
          { value: "timeline", label: "History", count: person.timeline.length },
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Profile" icon={UserCheck} />
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              {info.map(([I, k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted"><I className="h-4 w-4" aria-hidden /></span>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="break-words text-sm font-medium">{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-3">
              <div><p className="text-xs text-muted">Aadhaar</p><p className="font-mono text-sm font-medium">{person.aadhaarLast4 ? maskAadhaar(person.aadhaarLast4) : "—"}</p></div>
              <div><p className="text-xs text-muted">PAN</p><p className="font-mono text-sm font-medium">{maskPan(person.pan)}</p></div>
              <div>
                <p className="text-xs text-muted">Bank account</p>
                <p className="text-sm font-medium">{person.bank.name || "—"}</p>
                <p className="flex items-center gap-2 font-mono text-xs text-fg-2">
                  {showAcct && person.bank.accountNumber ? person.bank.accountNumber : person.bank.accountLast4 ? `XXXX XXXX ${person.bank.accountLast4}` : "—"}
                  {(manage || isSelf) && person.bank.accountNumber && (
                    <button onClick={() => { if (!showAcct) log("view", `Bank account of ${fullName(person)}`); setShowAcct((v) => !v); }} className="font-sans text-[11px] font-semibold text-primary hover:underline">{showAcct ? "Hide" : "Reveal"}</button>
                  )}
                </p>
                <p className="font-mono text-xs text-muted">{[person.bank.ifsc, person.bank.upi].filter(Boolean).join(" · ")}</p>
              </div>
              <div><p className="text-xs text-muted">Emergency contact</p><p className="text-sm font-medium">{person.emergencyContact.name || "—"}{person.emergencyContact.relation && <span className="font-normal text-muted"> · {person.emergencyContact.relation}</span>}</p><p className="text-xs text-fg-2">{person.emergencyContact.phone}</p></div>
              {person.linkedIn && <div><p className="text-xs text-muted">LinkedIn</p><a href={person.linkedIn.startsWith("http") ? person.linkedIn : `https://${person.linkedIn}`} target="_blank" rel="noreferrer" className="break-all text-sm font-medium text-primary hover:underline">{person.linkedIn}</a></div>}
              {person.ctc && (manage || isSelf) && <div><p className="text-xs text-muted">Annual CTC</p><p className="text-sm font-medium">{fmtINR(person.ctc)}</p></div>}
            </div>
          </Card>
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">KYC completion</p>
                <span className="font-[family-name:var(--font-display)] text-xl font-bold tabular">{kyc}%</span>
              </div>
              <Progress value={kyc} tone={kyc === 100 ? "success" : "primary"} className="mt-3" label="KYC completion" />
              <p className="mt-2 text-xs text-muted">{docs.filter((d) => d.status === "Verified").length} verified · {docs.filter((d) => d.status === "Uploaded").length} awaiting · {docs.filter((d) => d.status === "Pending" || d.status === "Rejected").length} missing</p>
            </Card>
            <Card>
              <CardHeader title="Reporting" icon={Building2} />
              <div className="p-4">
                {manager ? (
                  <Link href={`/people/view?id=${manager.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-2">
                    <Avatar person={manager} size={36} />
                    <span><span className="block text-sm font-medium">{fullName(manager)}</span><span className="block text-xs text-muted">Reports to · {manager.designation}</span></span>
                  </Link>
                ) : <p className="p-2 text-sm text-muted">No reporting manager</p>}
                {reports.length > 0 && (
                  <>
                    <p className="mt-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Direct reports · {reports.length}</p>
                    <div className="mt-2 flex flex-wrap gap-1 px-2">
                      {reports.slice(0, 12).map((r) => (
                        <Link key={r.id} href={`/people/view?id=${r.id}`} title={fullName(r)}><Avatar person={r} size={32} ring /></Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
            {myAssets.length > 0 && (
              <Card>
                <CardHeader title="Assets issued" icon={Laptop} />
                <ul className="divide-y divide-line">
                  {myAssets.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span><span className="block font-medium">{a.kind}</span><span className="text-xs text-muted">{a.model}</span></span>
                      <span className="font-mono text-xs text-muted">{a.tag}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          {manage && (
            <Card className="p-5 lg:col-span-3">
              <p className="text-sm font-semibold">Change status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["Active", "Notice Period", "On Hold", "Exited"] as PersonStatus[]).map((s) => (
                  <button key={s} disabled={person.status === "Pending Approval"} onClick={() => update(person.id, { status: s })} className={cn("h-10 rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-40", person.status === s ? "border-primary bg-primary-soft text-primary" : "border-line-strong hover:bg-surface-2")}>
                    {s}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "resume" && <ResumePanel person={person} editable={manage || isSelf} />}

      {tab === "form" && person.freelancer && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div>
              <p className="font-bold">Freelancer Details Form · <span className="font-mono">{person.freelancer.formId ?? "—"}</span></p>
              <p className="text-sm text-muted">{person.freelancer.signature ? `Signed by the freelancer on ${fmtDate(person.freelancer.signedOn)}` : "Not signed yet"} · fills automatically from the profile</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(manage || isSelf) && <Button variant="outline" icon={Pencil} onClick={() => setEditing(true)}>Edit details</Button>}
              {(manage || isSelf) && <Button variant="outline" icon={PenLine} onClick={() => setSigning(true)}>{person.freelancer.signature ? "Re-sign" : "Sign form"}</Button>}
              <Button icon={Printer} onClick={() => { log("download", `Freelancer form of ${fullName(person)}`); window.print(); }}>Print / PDF</Button>
            </div>
          </Card>
          <div className="scroll-thin overflow-x-auto rounded-[var(--radius-card)] bg-surface-3 p-3 sm:p-6">
            <FreelancerFormSheet person={person} />
          </div>
        </div>
      )}

      {tab === "documents" && (
        <Card>
          <CardHeader title="Document & KYC vault" subtitle="Files are stored privately and opened via short-lived links" icon={ShieldCheck} action={<Badge tone={kyc === 100 ? "success" : "warning"}>{kyc}% complete</Badge>} />
          <ul className="divide-y divide-line">
            {docs.map((d) => <DocumentRow key={d.id} doc={d} canVerify={can(role, "kyc.verify")} canUpload={manage || isSelf} />)}
          </ul>
        </Card>
      )}

      {tab === "work" && person.type === "intern" && person.intern && <InternPanel personId={person.id} />}
      {tab === "work" && person.type === "freelancer" && person.freelancer && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm font-semibold">Contract</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Period</dt><dd>{fmtDate(person.freelancer.contractStart)} – {fmtDate(person.freelancer.contractEnd)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Rate</dt><dd>{fmtINR(person.freelancer.rate)} / {person.freelancer.rateType === "Hourly" ? "hr" : "project"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">GSTIN</dt><dd className="font-mono text-xs">{person.freelancer.gstin ?? "Not registered"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Renewal</dt><dd>{daysBetween(todayISO(), person.freelancer.contractEnd) < 0 ? "Expired" : `in ${daysBetween(todayISO(), person.freelancer.contractEnd)} days`}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">{person.freelancer.skills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Invoices" icon={Briefcase} action={<Link href="/freelancers" className="text-xs font-semibold text-primary">Manage</Link>} />
            <ul className="divide-y divide-line">
              {invoices.filter((i) => i.personId === person.id).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0"><span className="block font-medium">{i.number}</span><span className="block truncate text-xs text-muted">{i.description}</span></span>
                  <span className="text-right"><span className="block font-semibold tabular">{fmtINR(i.amount)}</span><StatusBadge status={i.status} /></span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      {tab === "work" && person.type === "employee" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm font-semibold">Leave balance · {new Date().getFullYear()}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {bal.map((b) => (
                <div key={b.type} className="rounded-[calc(var(--radius)*0.7)] bg-surface-2 p-3">
                  <p className="text-xs text-muted">{LEAVE_NAMES[b.type]}</p>
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold tabular">{b.type === "LOP" ? b.used : b.left}<span className="text-xs font-normal text-muted">{b.type === "LOP" ? " used" : ` / ${b.quota}`}</span></p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Recent leave" icon={CalendarDays} />
            <ul className="divide-y divide-line">
              {leaves.filter((l) => l.personId === person.id).slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm"><span>{LEAVE_NAMES[l.type]} · {fmtDate(l.from)} · {l.days}d</span><StatusBadge status={l.status} /></li>
              ))}
              {!leaves.some((l) => l.personId === person.id) && <li className="p-5 text-sm text-muted">No leave records.</li>}
            </ul>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <Card className="p-5 sm:p-6">
          <ol className="relative space-y-6 border-l-2 border-line pl-6">
            {[...person.timeline].sort((a, b) => b.date.localeCompare(a.date)).map((t) => {
              const I = TL_ICON[t.kind];
              return (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[39px] grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-primary-soft text-primary"><I className="h-4 w-4" aria-hidden /></span>
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.detail && <p className="text-sm text-fg-2">{t.detail}</p>}
                  <p className="mt-0.5 text-xs text-muted">{fmtDate(t.date)}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <Modal open={signing} onClose={() => setSigning(false)} title="Sign the freelancer form" subtitle="Draw the signature with a finger, stylus or mouse">
        {signing && (
          <SignaturePad
            onCancel={() => setSigning(false)}
            onSave={(sig) => {
              update(person.id, { freelancer: { ...person.freelancer!, signature: sig, signedOn: todayISO() } }, "Freelancer form signed");
              setSigning(false);
            }}
          />
        )}
      </Modal>
      {editing && <PersonFormModal open personId={person.id} initial={person} onClose={() => setEditing(false)} />}
      {converting && <ConvertModal personId={person.id} onClose={() => setConverting(false)} />}
      <Modal open={showCard} onClose={() => setShowCard(false)} title="ID card" subtitle="Print on CR80 card stock" footer={<><Button variant="secondary" onClick={() => setShowCard(false)}>Close</Button><Button icon={Printer} onClick={() => { log("download", `ID card of ${fullName(person)}`); window.print(); }}>Print</Button></>}>
        <div className="print-area flex justify-center py-2"><IdCard person={person} /></div>
      </Modal>
    </div>
  );
}

function ConvertModal({ personId, onClose }: { personId: string; onClose: () => void }) {
  const p = useHR((s) => s.people.find((x) => x.id === personId))!;
  const convert = useHR((s) => s.convertIntern);
  const [designation, setDesignation] = useState(p.designation.replace(/ ?Intern/i, "") || "Associate");
  const [ctc, setCtc] = useState(500000);
  return (
    <Modal open onClose={onClose} title={`Convert ${p.firstName} to employee`} subtitle="Profile data carries over. A new EMP ID is issued; the intern ID stays linked in history." footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Repeat} onClick={() => { convert(personId, designation, ctc); onClose(); }}>Convert & issue EMP ID</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New designation" required>{(id) => <input id={id} className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} />}</Field>
        <Field label="Annual CTC (₹)">{(id) => <input id={id} type="number" inputMode="numeric" className="input" value={ctc} onChange={(e) => setCtc(Number(e.target.value))} />}</Field>
      </div>
    </Modal>
  );
}
