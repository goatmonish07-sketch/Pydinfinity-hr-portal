"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Check, X, Eye, CalendarClock, AlertTriangle } from "lucide-react";
import { useHR } from "@/lib/store";
import type { HRDocument } from "@/lib/types";
import { cn, daysBetween, fmtDate, fullName, todayISO } from "@/lib/utils";
import { Avatar, Button, Field, Modal, StatusBadge } from "./ui";

export function DocumentRow({ doc, canVerify, canUpload, showPerson }: { doc: HRDocument; canVerify: boolean; canUpload: boolean; showPerson?: boolean }) {
  const person = useHR((s) => s.people.find((p) => p.id === doc.personId));
  const setStatus = useHR((s) => s.setDocStatus);
  const upload = useHR((s) => s.uploadDoc);
  const log = useHR((s) => s.log);
  const toast = useHR((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [expiry, setExpiry] = useState(doc.expiry ?? "");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const left = doc.expiry ? daysBetween(todayISO(), doc.expiry) : null;
  const iconTone = { Verified: "bg-success-soft text-success", Uploaded: "bg-info-soft text-info", Rejected: "bg-danger-soft text-danger", Pending: "bg-surface-3 text-muted" }[doc.status];

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showPerson && person ? <Avatar person={person} size={40} /> : <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[calc(var(--radius)*0.6)]", iconTone)}><FileText className="h-5 w-5" aria-hidden /></span>}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{showPerson && person ? `${doc.kind} · ${fullName(person)}` : doc.kind}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
            {doc.fileName ? <span className="truncate">{doc.fileName}</span> : <span>Not uploaded yet</span>}
            {doc.uploadedAt && <span>· {fmtDate(doc.uploadedAt)}</span>}
            {left !== null && (
              <span className={cn("inline-flex items-center gap-1 font-medium", left < 0 ? "text-danger" : left <= 30 ? "text-warning" : "")}>
                <CalendarClock className="h-3 w-3" aria-hidden /> {left < 0 ? "Expired" : `Expires ${fmtDate(doc.expiry)}`}
              </span>
            )}
          </p>
          {doc.status === "Rejected" && doc.rejectReason && (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-danger"><AlertTriangle className="h-3 w-3" aria-hidden /> {doc.rejectReason} — please re-upload</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusBadge status={doc.status} />
        {doc.fileName && (
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => { log("view", `${doc.kind} of ${fullName(person)}`); toast("Opened via a signed link · expires in 60s", "info"); }}>
            View
          </Button>
        )}
        {canUpload && doc.status !== "Verified" && (
          <>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && setPending(e.target.files[0])} />
            <Button size="sm" variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>{doc.status === "Pending" ? "Upload" : "Re-upload"}</Button>
          </>
        )}
        {canVerify && doc.status === "Uploaded" && (
          <>
            <Button size="sm" variant="success" icon={Check} onClick={() => setStatus(doc.id, "Verified")}>Verify</Button>
            <Button size="sm" variant="ghost" icon={X} className="text-danger" onClick={() => setRejecting(true)}>Reject</Button>
          </>
        )}
      </div>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={`Upload ${doc.kind}`}
        subtitle={pending?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button disabled={!consent} onClick={() => { upload(doc.id, pending!.name, expiry || undefined); setPending(null); setConsent(false); toast(`${doc.kind} uploaded — awaiting verification`); }}>Upload securely</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Expiry date" hint="Optional — reminders are sent 30 days before expiry.">{(id) => <input id={id} type="date" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />}</Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-[calc(var(--radius)*0.7)] border border-line bg-surface-2 p-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--primary)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I consent to Pydinfinity Solutions storing and processing this document for HR and statutory purposes, as per the Digital Personal Data Protection (DPDP) Act, 2023.</span>
          </label>
        </div>
      </Modal>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={`Reject ${doc.kind}`}
        subtitle="The person will be asked to re-upload."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(false)}>Cancel</Button>
            <Button variant="danger" disabled={!reason.trim()} onClick={() => { setStatus(doc.id, "Rejected", reason.trim()); setRejecting(false); setReason(""); }}>Reject document</Button>
          </>
        }
      >
        <Field label="Reason" required>{(id) => (
          <>
            <input id={id} className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Image is blurry" />
            <div className="mt-2 flex flex-wrap gap-2">
              {["Image is blurry", "Name mismatch", "Document expired", "Incomplete pages"].map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className="h-9 rounded-full border border-line-strong px-3 text-xs font-medium hover:bg-surface-2">{r}</button>
              ))}
            </div>
          </>
        )}</Field>
      </Modal>
    </li>
  );
}
