"use client";

import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useHR } from "@/lib/store";
import { fullName, kycPercent } from "@/lib/utils";
import { Avatar, Card, Empty, Progress } from "@/components/ui";
import { DocumentRow } from "@/components/doc-row";

/** Self-service KYC link: the person uploads their own documents, HR only verifies. */
export function KycLinkPage() {
  const id = useSearchParams().get("id") ?? "";
  const person = useHR((s) => s.people.find((p) => p.id === id));
  const docs = useHR((s) => s.documents).filter((d) => d.personId === id);
  const company = useHR((s) => s.settings.companyName);
  if (!person) return <Card><Empty title="This KYC link is invalid or has expired" /></Card>;
  const pct = kycPercent(docs);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="overflow-hidden">
        <div className="aura-hero flex items-center gap-4 rounded-none p-5">
          <Avatar person={person} size={56} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-85">{company} · KYC</p>
            <h1 className="text-xl font-bold">Welcome, {person.firstName}!</h1>
            <p className="text-sm opacity-90">Upload your documents below. HR will verify them.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-2 flex justify-between text-sm"><span className="font-medium">{fullName(person)}</span><span className="font-semibold">{pct}% verified</span></div>
          <Progress value={pct} label="KYC" />
        </div>
      </Card>
      <Card>
        <ul className="divide-y divide-line">{docs.map((d) => <DocumentRow key={d.id} doc={d} canVerify={false} canUpload />)}</ul>
      </Card>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted"><ShieldCheck className="h-4 w-4" /> Encrypted storage · DPDP Act consent captured on upload</p>
    </div>
  );
}
