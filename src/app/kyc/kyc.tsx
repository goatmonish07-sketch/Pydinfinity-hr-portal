"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, UserPen, PenLine, Printer, CheckCircle2 } from "lucide-react";
import { useHR } from "@/lib/store";
import { fmtDate, fullName, kycPercent, todayISO } from "@/lib/utils";
import { Button, Card, CardHeader, Empty, Modal, Progress } from "@/components/ui";
import { DocumentRow } from "@/components/doc-row";
import { PhotoUpload, SignaturePad } from "@/components/photo";
import { PersonFormModal } from "@/components/person-form";
import { ResumePanel } from "@/components/resume";
import { FreelancerFormSheet } from "@/components/freelancer-form";

/** Self-service onboarding link: the person adds their photo, details, resume and KYC documents; HR only verifies. */
export function KycLinkPage() {
  const id = useSearchParams().get("id") ?? "";
  const person = useHR((s) => s.people.find((p) => p.id === id));
  const docs = useHR((s) => s.documents).filter((d) => d.personId === id);
  const company = useHR((s) => s.settings.companyName);
  const update = useHR((s) => s.updatePerson);
  const [editing, setEditing] = useState(false);
  const [signing, setSigning] = useState(false);
  if (!person) return <Card><Empty title="This onboarding link is invalid or has expired" /></Card>;
  const pct = kycPercent(docs);
  const steps = [
    { label: "Photo", done: !!person.photo },
    { label: "Personal details", done: !!(person.location && person.personalEmail) },
    { label: "Resume", done: !!(person.resume?.education.length || person.resume?.file) },
    { label: "Documents", done: docs.every((d) => d.status === "Uploaded" || d.status === "Verified") },
    ...(person.freelancer ? [{ label: "Signed form", done: !!person.freelancer.signature }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card className="overflow-hidden">
        <div className="aura-hero flex flex-wrap items-center gap-4 rounded-none p-5 sm:p-6">
          <span className="rounded-full bg-white p-1">
            <PhotoUpload person={person} size={84} editable onChange={(photo) => update(person.id, { photo })} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-85">{company} · Onboarding</p>
            <h1 className="text-2xl font-extrabold">Welcome, {person.firstName}!</h1>
            <p className="text-sm opacity-90">Complete your profile below. HR will verify your documents.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{fullName(person)}</span><span className="font-semibold">KYC {pct}% verified</span></div>
          <Progress value={pct} label="KYC" />
          <ul className="mt-4 flex flex-wrap gap-2">
            {steps.map((s) => (
              <li key={s.label} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${s.done ? "border-success/40 text-success" : "border-line text-muted"}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> {s.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={UserPen} onClick={() => setEditing(true)}>{person.freelancer ? "Fill freelancer form" : "Complete my details"}</Button>
            {person.freelancer && <Button variant="outline" icon={PenLine} onClick={() => setSigning(true)}>{person.freelancer.signature ? "Re-sign form" : "Sign form"}</Button>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Documents" subtitle="Upload each document — consent is captured under the DPDP Act" icon={ShieldCheck} />
        <ul className="divide-y divide-line">{docs.map((d) => <DocumentRow key={d.id} doc={d} canVerify={false} canUpload />)}</ul>
      </Card>

      <ResumePanel person={person} editable />

      {person.freelancer && (
        <Card>
          <CardHeader title="Your freelancer details form" subtitle={person.freelancer.signature ? `Signed ${fmtDate(person.freelancer.signedOn)}` : "Preview — sign when everything is correct"} action={<Button size="sm" variant="ghost" icon={Printer} onClick={() => window.print()}>Print</Button>} />
          <div className="scroll-thin overflow-x-auto bg-surface-3 p-3 sm:p-6">
            <FreelancerFormSheet person={person} />
          </div>
        </Card>
      )}

      <p className="flex items-center justify-center gap-2 pb-4 text-center text-xs text-muted"><ShieldCheck className="h-4 w-4" /> Encrypted storage · DPDP Act consent captured on upload</p>

      {editing && <PersonFormModal open personId={person.id} initial={person} onClose={() => setEditing(false)} />}
      <Modal open={signing} onClose={() => setSigning(false)} title="Sign your freelancer form" subtitle="Draw your signature with a finger, stylus or mouse">
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
    </div>
  );
}
