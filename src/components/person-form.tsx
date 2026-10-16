"use client";

import { useState } from "react";
import { useHR } from "@/lib/store";
import type { Person, PersonType } from "@/lib/types";
import { addDays, fullName, todayISO, TYPE_LABEL } from "@/lib/utils";
import { Button, Field, Modal } from "./ui";

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
    freelancer: type === "freelancer" ? { contractStart: today, contractEnd: addDays(today, 180), rateType: "Per Project", rate: 50000, skills: [], projects: [] } : undefined,
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
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    if (personId) {
      updatePerson(personId, d);
      toast("Profile updated");
      onSaved?.(personId);
    } else {
      const id = addPerson(d, approve);
      if (!approve) toast(`${fullName(d)} added — awaiting approval`);
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

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">Identity & contact</legend>
          <Field label="First name" required>{(id) => <><input id={id} aria-invalid={!!errors.firstName} className="input" autoComplete="given-name" value={d.firstName} onChange={(e) => set("firstName", e.target.value)} />{err("firstName")}</>}</Field>
          <Field label="Last name" required>{(id) => <><input id={id} aria-invalid={!!errors.lastName} className="input" autoComplete="family-name" value={d.lastName} onChange={(e) => set("lastName", e.target.value)} />{err("lastName")}</>}</Field>
          <Field label="Work email" required>{(id) => <><input id={id} type="email" aria-invalid={!!errors.email} className="input" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} />{err("email")}</>}</Field>
          <Field label="Phone">{(id) => <input id={id} type="tel" className="input" autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} />}</Field>
          <Field label="Gender">{(id) => <select id={id} className="input" value={d.gender} onChange={(e) => set("gender", e.target.value as Draft["gender"])}><option>Female</option><option>Male</option><option>Other</option></select>}</Field>
          <Field label="Date of birth">{(id) => <input id={id} type="date" className="input" value={d.dob} onChange={(e) => set("dob", e.target.value)} />}</Field>
          <Field label="Blood group">{(id) => <select id={id} className="input" value={d.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>{["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => <option key={b}>{b}</option>)}</select>}</Field>
          <Field label="Address">{(id) => <input id={id} className="input" autoComplete="street-address" value={d.address} onChange={(e) => set("address", e.target.value)} />}</Field>
          <Field label="Emergency contact name">{(id) => <input id={id} className="input" value={d.emergencyContact.name} onChange={(e) => set("emergencyContact", { ...d.emergencyContact, name: e.target.value })} />}</Field>
          <Field label="Emergency contact phone">{(id) => <input id={id} type="tel" className="input" value={d.emergencyContact.phone} onChange={(e) => set("emergencyContact", { ...d.emergencyContact, phone: e.target.value })} />}</Field>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">Work</legend>
          <Field label="Designation" required>{(id) => <><input id={id} aria-invalid={!!errors.designation} className="input" value={d.designation} onChange={(e) => set("designation", e.target.value)} />{err("designation")}</>}</Field>
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

        {d.type === "freelancer" && d.freelancer && (
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold">Contract</legend>
            <Field label="Contract start">{(id) => <input id={id} type="date" className="input" value={d.freelancer!.contractStart} onChange={(e) => set("freelancer", { ...d.freelancer!, contractStart: e.target.value })} />}</Field>
            <Field label="Contract end">{(id) => <input id={id} type="date" className="input" value={d.freelancer!.contractEnd} onChange={(e) => set("freelancer", { ...d.freelancer!, contractEnd: e.target.value })} />}</Field>
            <Field label="Rate type">{(id) => <select id={id} className="input" value={d.freelancer!.rateType} onChange={(e) => set("freelancer", { ...d.freelancer!, rateType: e.target.value as "Hourly" | "Per Project" })}><option>Hourly</option><option>Per Project</option></select>}</Field>
            <Field label="Rate (₹)">{(id) => <input id={id} type="number" inputMode="numeric" className="input" value={d.freelancer!.rate} onChange={(e) => set("freelancer", { ...d.freelancer!, rate: Number(e.target.value) })} />}</Field>
            <Field label="Skills" hint="Comma separated">{(id) => <input id={id} className="input" value={d.freelancer!.skills.join(", ")} onChange={(e) => set("freelancer", { ...d.freelancer!, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />}</Field>
            <Field label="GSTIN" hint="If registered">{(id) => <input id={id} className="input uppercase" value={d.freelancer!.gstin ?? ""} onChange={(e) => set("freelancer", { ...d.freelancer!, gstin: e.target.value.toUpperCase() || undefined })} />}</Field>
          </fieldset>
        )}

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">KYC & bank</legend>
          <Field label="PAN">{(id) => <><input id={id} aria-invalid={!!errors.pan} className="input uppercase" maxLength={10} value={d.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} />{err("pan")}</>}</Field>
          <Field label="Aadhaar (last 4 digits only)" hint="Full Aadhaar numbers are never stored or displayed.">{(id) => <><input id={id} aria-invalid={!!errors.aadhaarLast4} inputMode="numeric" className="input" maxLength={4} value={d.aadhaarLast4} onChange={(e) => set("aadhaarLast4", e.target.value.replace(/\D/g, ""))} />{err("aadhaarLast4")}</>}</Field>
          <Field label="Bank name">{(id) => <input id={id} className="input" value={d.bank.name} onChange={(e) => set("bank", { ...d.bank, name: e.target.value })} />}</Field>
          <Field label="IFSC">{(id) => <input id={id} className="input uppercase" value={d.bank.ifsc} onChange={(e) => set("bank", { ...d.bank, ifsc: e.target.value.toUpperCase() })} />}</Field>
        </fieldset>
      </div>
    </Modal>
  );
}
