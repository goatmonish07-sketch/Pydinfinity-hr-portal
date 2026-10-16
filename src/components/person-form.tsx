"use client";

import { useState } from "react";
import { useHR } from "@/lib/store";
import type { EngagementStatus, EngagementType, PaymentFrequency, PaymentType, Person, PersonType, WorkMode } from "@/lib/types";
import { addDays, fullName, todayISO, TYPE_LABEL } from "@/lib/utils";
import { Button, Field, Modal } from "./ui";
import { PhotoUpload } from "./photo";

type Draft = Omit<Person, "id" | "timeline" | "previousCodes" | "status" | "hue" | "code">;

export function blankPerson(type: PersonType = "employee"): Draft {
  const today = todayISO();
  return {
    type,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "Female",
    dob: addDays(today, -25 * 365),
    bloodGroup: "O+",
    department: "Engineering",
    designation: "",
    branch: "Bengaluru HQ",
    joiningDate: today,
    address: "",
    emergencyContact: { name: "", phone: "" },
    aadhaarLast4: "",
    pan: "",
    bank: { name: "", accountLast4: "", ifsc: "" },
    ctc: type === "employee" ? 600000 : undefined,
    intern: type === "intern" ? { college: "", course: "", startDate: today, endDate: addDays(today, 180), project: "", stipend: 15000, feedback: [] } : undefined,
    freelancer:
      type === "freelancer"
        ? { formDate: today, contractStart: today, contractEnd: addDays(today, 180), rateType: "Per Project", rate: 50000, skills: [], projects: [], engagementType: "Project-based", workMode: "Remote", workLocation: "Remote", engagementStatus: "Active", paymentType: "Bank transfer", paymentFrequency: "Per project" }
        : undefined,
  };
}

export function PersonFormModal({ open, onClose, initial, personId, onSaved }: { open: boolean; onClose: () => void; initial?: Draft; personId?: string; onSaved?: (id: string) => void }) {
  const settings = useHR((s) => s.settings);
  const people = useHR((s) => s.people);
  const addPerson = useHR((s) => s.addPerson);
  const updatePerson = useHR((s) => s.updatePerson);
  const toast = useHR((s) => s.toast);
  const [d, setD] = useState<Draft>(initial ?? blankPerson());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const changeType = (t: PersonType) => setD((x) => ({ ...blankPerson(t), ...x, type: t, intern: t === "intern" ? x.intern ?? blankPerson("intern").intern : undefined, freelancer: t === "freelancer" ? x.freelancer ?? blankPerson("freelancer").freelancer : undefined, ctc: t === "employee" ? x.ctc ?? 600000 : undefined }));

  const managers = people.filter((p) => p.type === "employee" && p.status !== "Exited" && p.id !== personId);

  const submit = (approve: boolean) => {
    const e: Record<string, string> = {};
    if (!d.firstName.trim()) e.firstName = "First name is required";
    if (!d.lastName.trim()) e.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Enter a valid email, e.g. name@pydinfinity.com";
    if (!d.designation.trim()) e.designation = "Designation is required";
    if (d.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(d.pan)) e.pan = "PAN format: ABCDE1234F";
    if (d.aadhaarLast4 && !/^\d{4}$/.test(d.aadhaarLast4)) e.aadhaarLast4 = "Only the last 4 digits";
    if (d.bank.accountNumber && !/^\d{9,18}$/.test(d.bank.accountNumber)) e.accountNumber = "Account number is 9–18 digits";
    if (d.freelancer?.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(d.freelancer.gstin)) e.gstin = "GSTIN format: 29ABCDE1234F1Z5";
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    const out: Draft = {
      ...d,
      bank: d.bank.accountNumber ? { ...d.bank, accountLast4: d.bank.accountNumber.slice(-4) } : d.bank,
      freelancer: d.freelancer && !d.freelancer.formId ? { ...d.freelancer, formId: `PYD-FRM-${String(Date.now()).slice(-4)}` } : d.freelancer,
    };
    if (personId) {
      updatePerson(personId, out);
      toast("Profile updated");
      onSaved?.(personId);
    } else {
      const id = addPerson(out, approve);
      if (!approve) toast(`${fullName(out)} added — awaiting approval`);
      onSaved?.(id);
    }
    onClose();
  };

  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs font-medium text-danger">{errors[k]}</p>;

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={personId ? "Edit profile" : "Add a person"}
      subtitle={personId ? "The issued ID is locked and cannot be edited." : "An ID is generated automatically when the profile is approved."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {!personId && <Button variant="soft" onClick={() => submit(false)}>Save for approval</Button>}
          <Button onClick={() => submit(!personId)}>{personId ? "Save changes" : "Approve & issue ID"}</Button>
        </>
      }
    >
      <div className="space-y-6">
        {!personId && (
          <div>
            <p className="label">Person type</p>
            <div className="grid grid-cols-3 gap-2">
              {(["employee", "intern", "freelancer"] as PersonType[]).map((t) => (
                <button key={t} type="button" onClick={() => changeType(t)} className={`h-11 rounded-[calc(var(--radius)*0.7)] border text-sm font-semibold transition-colors ${d.type === t ? "border-primary bg-primary-soft text-primary" : "border-line-strong text-fg-2 hover:bg-surface-2"}`}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 rounded-[20px] bg-surface-2 p-4">
          <PhotoUpload person={{ ...d, hue: 210, firstName: d.firstName || "?", lastName: d.lastName || " " }} size={76} editable onChange={(photo) => set("photo", photo)} />
          <div>
            <p className="font-semibold">Profile photo</p>
            <p className="text-xs text-muted">Shown on the profile, ID card and freelancer form. Tap the camera to upload or take a photo.</p>
          </div>
        </div>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">1. Personal details</legend>
          <Field label="First name" required>{(id) => <><input id={id} aria-invalid={!!errors.firstName} className="input" autoComplete="given-name" value={d.firstName} onChange={(e) => set("firstName", e.target.value)} />{err("firstName")}</>}</Field>
          <Field label="Last name" required>{(id) => <><input id={id} aria-invalid={!!errors.lastName} className="input" autoComplete="family-name" value={d.lastName} onChange={(e) => set("lastName", e.target.value)} />{err("lastName")}</>}</Field>
          <Field label="Work email" required>{(id) => <><input id={id} type="email" aria-invalid={!!errors.email} className="input" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} />{err("email")}</>}</Field>
          <Field label="Phone">{(id) => <input id={id} type="tel" className="input" autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} />}</Field>
          <Field label="Gender">{(id) => <select id={id} className="input" value={d.gender} onChange={(e) => set("gender", e.target.value as Draft["gender"])}><option>Female</option><option>Male</option><option>Other</option></select>}</Field>
          <Field label="Date of birth">{(id) => <input id={id} type="date" className="input" value={d.dob} onChange={(e) => set("dob", e.target.value)} />}</Field>
          <Field label="Blood group">{(id) => <select id={id} className="input" value={d.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>{["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => <option key={b}>{b}</option>)}</select>}</Field>
          <Field label="Location (city)">{(id) => <input id={id} className="input" autoComplete="address-level2" value={d.location ?? ""} onChange={(e) => set("location", e.target.value)} />}</Field>
          <Field label="Current address" className="sm:col-span-2">{(id) => <input id={id} className="input" autoComplete="street-address" value={d.address} onChange={(e) => set("address", e.target.value)} />}</Field>
          <Field label="Permanent address" className="sm:col-span-2">{(id) => <input id={id} className="input" placeholder="Same as current if blank" value={d.permanentAddress ?? ""} onChange={(e) => set("permanentAddress", e.target.value)} />}</Field>
          <Field label="Personal email">{(id) => <input id={id} type="email" className="input" value={d.personalEmail ?? ""} onChange={(e) => set("personalEmail", e.target.value)} />}</Field>
          <Field label="Alternate phone">{(id) => <input id={id} type="tel" className="input" value={d.altPhone ?? ""} onChange={(e) => set("altPhone", e.target.value)} />}</Field>
          <Field label="Father / spouse name">{(id) => <input id={id} className="input" value={d.guardianName ?? ""} onChange={(e) => set("guardianName", e.target.value)} />}</Field>
          <Field label="Marital status">{(id) => <select id={id} className="input" value={d.maritalStatus ?? ""} onChange={(e) => set("maritalStatus", (e.target.value || undefined) as Draft["maritalStatus"])}><option value="">—</option><option>Single</option><option>Married</option><option>Prefer not to say</option></select>}</Field>
          <Field label="Nationality">{(id) => <input id={id} className="input" value={d.nationality ?? ""} onChange={(e) => set("nationality", e.target.value)} />}</Field>
          <Field label="LinkedIn profile">{(id) => <input id={id} className="input" placeholder="linkedin.com/in/…" value={d.linkedIn ?? ""} onChange={(e) => set("linkedIn", e.target.value)} />}</Field>
          <Field label="Emergency contact name">{(id) => <input id={id} className="input" value={d.emergencyContact.name} onChange={(e) => set("emergencyContact", { ...d.emergencyContact, name: e.target.value })} />}</Field>
          <Field label="Emergency contact phone">{(id) => <input id={id} type="tel" className="input" value={d.emergencyContact.phone} onChange={(e) => set("emergencyContact", { ...d.emergencyContact, phone: e.target.value })} />}</Field>
          <Field label="Relationship">{(id) => <input id={id} className="input" placeholder="Mother, spouse…" value={d.emergencyContact.relation ?? ""} onChange={(e) => set("emergencyContact", { ...d.emergencyContact, relation: e.target.value })} />}</Field>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">{d.type === "freelancer" ? "2. Professional details" : "Work"}</legend>
          <Field label={d.type === "freelancer" ? "Professional title / role" : "Designation"} required>{(id) => <><input id={id} aria-invalid={!!errors.designation} className="input" value={d.designation} onChange={(e) => set("designation", e.target.value)} />{err("designation")}</>}</Field>
          <Field label="Department">{(id) => <select id={id} className="input" value={d.department} onChange={(e) => set("department", e.target.value)}>{settings.departments.map((x) => <option key={x}>{x}</option>)}</select>}</Field>
          <Field label="Branch">{(id) => <select id={id} className="input" value={d.branch} onChange={(e) => set("branch", e.target.value)}>{settings.branches.map((x) => <option key={x}>{x}</option>)}</select>}</Field>
          <Field label="Reporting manager">{(id) => <select id={id} className="input" value={d.managerId ?? ""} onChange={(e) => set("managerId", e.target.value || undefined)}><option value="">— None —</option>{managers.map((m) => <option key={m.id} value={m.id}>{fullName(m)} · {m.designation}</option>)}</select>}</Field>
          <Field label="Joining date">{(id) => <input id={id} type="date" className="input" value={d.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />}</Field>
          {d.type === "employee" && <Field label="Annual CTC (₹)">{(id) => <input id={id} type="number" inputMode="numeric" className="input" value={d.ctc ?? 0} onChange={(e) => set("ctc", Number(e.target.value))} />}</Field>}
        </fieldset>

        {d.type === "intern" && d.intern && (
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold">Internship</legend>
            <Field label="College">{(id) => <input id={id} className="input" value={d.intern!.college} onChange={(e) => set("intern", { ...d.intern!, college: e.target.value })} />}</Field>
            <Field label="Course">{(id) => <input id={id} className="input" value={d.intern!.course} onChange={(e) => set("intern", { ...d.intern!, course: e.target.value })} />}</Field>
            <Field label="Start date">{(id) => <input id={id} type="date" className="input" value={d.intern!.startDate} onChange={(e) => set("intern", { ...d.intern!, startDate: e.target.value })} />}</Field>
            <Field label="End date">{(id) => <input id={id} type="date" className="input" value={d.intern!.endDate} onChange={(e) => set("intern", { ...d.intern!, endDate: e.target.value })} />}</Field>
            <Field label="Project">{(id) => <input id={id} className="input" value={d.intern!.project} onChange={(e) => set("intern", { ...d.intern!, project: e.target.value })} />}</Field>
            <Field label="Monthly stipend (₹)">{(id) => <input id={id} type="number" inputMode="numeric" className="input" value={d.intern!.stipend} onChange={(e) => set("intern", { ...d.intern!, stipend: Number(e.target.value) })} />}</Field>
          </fieldset>
        )}

        {d.type === "freelancer" && d.freelancer && (() => {
          const f = d.freelancer!;
          const setF = (patch: Partial<typeof f>) => set("freelancer", { ...f, ...patch });
          return (
            <>
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold">Freelancer form · professional</legend>
                <Field label="Form ID" hint="Auto-generated if blank">{(id) => <input id={id} className="input font-mono" value={f.formId ?? ""} onChange={(e) => setF({ formId: e.target.value })} />}</Field>
                <Field label="Form date">{(id) => <input id={id} type="date" className="input" value={f.formDate ?? ""} onChange={(e) => setF({ formDate: e.target.value })} />}</Field>
                <Field label="Area of expertise">{(id) => <input id={id} className="input" placeholder="e.g. UI/UX design" value={f.areaOfExpertise ?? ""} onChange={(e) => setF({ areaOfExpertise: e.target.value })} />}</Field>
                <Field label="Years of experience">{(id) => <input id={id} type="number" min={0} inputMode="numeric" className="input" value={f.yearsOfExperience ?? ""} onChange={(e) => setF({ yearsOfExperience: e.target.value === "" ? undefined : Number(e.target.value) })} />}</Field>
                <Field label="Skills" hint="Comma separated" className="sm:col-span-2">{(id) => <input id={id} className="input" value={f.skills.join(", ")} onChange={(e) => setF({ skills: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />}</Field>
              </fieldset>
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold">3. Work details</legend>
                <Field label="Project / service" hint="Comma separated">{(id) => <input id={id} className="input" value={f.projects.join(", ")} onChange={(e) => setF({ projects: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />}</Field>
                <Field label="Contact person">{(id) => <select id={id} className="input" value={f.contactPersonId ?? ""} onChange={(e) => setF({ contactPersonId: e.target.value || undefined })}><option value="">— Select —</option>{managers.map((m) => <option key={m.id} value={m.id}>{fullName(m)} · {m.designation}</option>)}</select>}</Field>
                <Field label="Engagement type">{(id) => <select id={id} className="input" value={f.engagementType ?? ""} onChange={(e) => setF({ engagementType: e.target.value as EngagementType })}>{(["Project-based", "Hourly", "Retainer", "Contract"] as const).map((x) => <option key={x}>{x}</option>)}</select>}</Field>
                <Field label="Engagement status">{(id) => <select id={id} className="input" value={f.engagementStatus ?? "Active"} onChange={(e) => setF({ engagementStatus: e.target.value as EngagementStatus })}>{(["Active", "Completed", "Discontinued"] as const).map((x) => <option key={x}>{x}</option>)}</select>}</Field>
                <Field label="Start date">{(id) => <input id={id} type="date" className="input" value={f.contractStart} onChange={(e) => setF({ contractStart: e.target.value })} />}</Field>
                <Field label="End date">{(id) => <input id={id} type="date" className="input" value={f.contractEnd} onChange={(e) => setF({ contractEnd: e.target.value })} />}</Field>
                <Field label="Work mode">{(id) => <select id={id} className="input" value={f.workMode ?? "Remote"} onChange={(e) => setF({ workMode: e.target.value as WorkMode })}>{(["Remote", "Onsite", "Hybrid"] as const).map((x) => <option key={x}>{x}</option>)}</select>}</Field>
                <Field label="Work location">{(id) => <input id={id} className="input" value={f.workLocation ?? ""} onChange={(e) => setF({ workLocation: e.target.value })} />}</Field>
              </fieldset>
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold">4. Payment & tax details</legend>
                <Field label="Payment type">{(id) => <select id={id} className="input" value={f.paymentType ?? "Bank transfer"} onChange={(e) => setF({ paymentType: e.target.value as PaymentType })}>{(["Bank transfer", "UPI", "Cheque"] as const).map((x) => <option key={x}>{x}</option>)}</select>}</Field>
                <Field label="Payment frequency">{(id) => <select id={id} className="input" value={f.paymentFrequency ?? "Per project"} onChange={(e) => setF({ paymentFrequency: e.target.value as PaymentFrequency })}>{(["Per project", "Milestone-based", "Weekly", "Bi-weekly", "Monthly"] as const).map((x) => <option key={x}>{x}</option>)}</select>}</Field>
                <Field label="Rate basis">{(id) => <select id={id} className="input" value={f.rateType} onChange={(e) => setF({ rateType: e.target.value as "Hourly" | "Per Project" })}><option>Per Project</option><option>Hourly</option></select>}</Field>
                <Field label="Agreed rate (₹)">{(id) => <input id={id} type="number" inputMode="numeric" className="input" value={f.rate} onChange={(e) => setF({ rate: Number(e.target.value) })} />}</Field>
                <Field label="GSTIN" hint="If registered">{(id) => <><input id={id} aria-invalid={!!errors.gstin} className="input font-mono uppercase" maxLength={15} value={f.gstin ?? ""} onChange={(e) => setF({ gstin: e.target.value.toUpperCase() || undefined })} />{err("gstin")}</>}</Field>
              </fieldset>
            </>
          );
        })()}

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">KYC & bank</legend>
          <Field label="Bank account number">{(id) => <><input id={id} aria-invalid={!!errors.accountNumber} inputMode="numeric" autoComplete="off" className="input font-mono" value={d.bank.accountNumber ?? ""} onChange={(e) => set("bank", { ...d.bank, accountNumber: e.target.value.replace(/\D/g, "") || undefined })} />{err("accountNumber")}</>}</Field>
          <Field label="Account holder name">{(id) => <input id={id} className="input" value={d.bank.holderName ?? ""} onChange={(e) => set("bank", { ...d.bank, holderName: e.target.value })} />}</Field>
          <Field label="PAN">{(id) => <><input id={id} aria-invalid={!!errors.pan} className="input uppercase" maxLength={10} value={d.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} />{err("pan")}</>}</Field>
          <Field label="Aadhaar (last 4 digits only)" hint="Full Aadhaar numbers are never stored or displayed.">{(id) => <><input id={id} aria-invalid={!!errors.aadhaarLast4} inputMode="numeric" className="input" maxLength={4} value={d.aadhaarLast4} onChange={(e) => set("aadhaarLast4", e.target.value.replace(/\D/g, ""))} />{err("aadhaarLast4")}</>}</Field>
          <Field label="Bank name">{(id) => <input id={id} className="input" value={d.bank.name} onChange={(e) => set("bank", { ...d.bank, name: e.target.value })} />}</Field>
          <Field label="IFSC">{(id) => <input id={id} className="input uppercase" value={d.bank.ifsc} onChange={(e) => set("bank", { ...d.bank, ifsc: e.target.value.toUpperCase() })} />}</Field>
          <Field label="UPI ID">{(id) => <input id={id} className="input" placeholder="name@bank" value={d.bank.upi ?? ""} onChange={(e) => set("bank", { ...d.bank, upi: e.target.value })} />}</Field>
        </fieldset>
      </div>
    </Modal>
  );
}
