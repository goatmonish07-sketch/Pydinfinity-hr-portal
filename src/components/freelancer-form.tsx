"use client";

import type { ReactNode } from "react";
import { useHR } from "@/lib/store";
import type { Person } from "@/lib/types";
import { fmtDate, fmtINR, fullName } from "@/lib/utils";

const NAVY = "#241860";

/** Faithful on-screen + print version of the "Freelancer Details Form" (Pydinfinity Solutions LLP). Paper stays white in dark mode. */
export function FreelancerFormSheet({ person }: { person: Person }) {
  const company = useHR((s) => s.settings.companyName);
  const people = useHR((s) => s.people);
  const f = person.freelancer;
  const contact = people.find((p) => p.id === (f?.contactPersonId ?? person.managerId));
  const d = f?.formDate ? new Date(f.formDate) : undefined;
  const rate = f ? `${fmtINR(f.rate)} ${f.rateType === "Hourly" ? "per hour" : "per project"}` : "";

  const Row = ({ a, av, b, bv, wide }: { a: ReactNode; av?: ReactNode; b?: ReactNode; bv?: ReactNode; wide?: boolean }) => (
    <tr>
      <th>{a}</th>
      {wide ? <td colSpan={3}>{av}</td> : <><td>{av}</td><th>{b}</th><td>{bv}</td></>}
    </tr>
  );

  return (
    <article className="print-area freelancer-form mx-auto w-full max-w-[794px] bg-white p-6 text-[#1b1b1b] shadow-xl sm:p-10 print:shadow-none" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style>{`
        .freelancer-form table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
        .freelancer-form th,.freelancer-form td{border:1px solid #9a9a9a;padding:6px 8px;text-align:left;vertical-align:middle;height:30px}
        .freelancer-form th{background:#f1f2f6;font-weight:400;width:24%}
        .freelancer-form td{width:26%;font-weight:600}
        .freelancer-form h3{font-size:13px;font-weight:700;margin-top:22px;letter-spacing:.01em}
        .freelancer-form small{display:block;font-size:9px;color:#555;font-weight:400}
      `}</style>
      <header className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pyd-logo.png" alt="Pydinfinity logo" className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
        <div className="flex-1 pt-2 text-center">
          <p className="text-[17px] font-bold tracking-[0.06em] sm:text-[20px]" style={{ color: NAVY }}>{company.toUpperCase()}</p>
          <p className="mt-1 text-[12px] font-bold tracking-[0.08em] sm:text-[13px]">FREELANCER DETAILS FORM</p>
        </div>
        <div className="grid h-[104px] w-[84px] shrink-0 place-items-center overflow-hidden border border-[#9a9a9a] text-[9px] text-[#888]">
          {person.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photo} alt={`Photo of ${fullName(person)}`} className="h-full w-full object-cover" />
          ) : (
            "PHOTO"
          )}
        </div>
      </header>
      <div className="mt-4 h-[2px]" style={{ background: NAVY, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} />
      <div className="mt-5 flex flex-wrap justify-between gap-3 text-[12px] font-bold">
        <span>FORM ID: <span className="inline-block min-w-[120px] border-b border-[#1b1b1b] px-1 font-mono font-semibold">{f?.formId ?? ""}</span></span>
        <span>DATE: <span className="inline-block min-w-[110px] border-b border-[#1b1b1b] px-1 font-semibold">{d ? `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}` : "  /  /"}</span></span>
      </div>

      <h3>1. PERSONAL DETAILS</h3>
      <table><tbody>
        <Row a="Full Name" av={fullName(person)} b="Gender" bv={person.gender} />
        <Row a="Date of Birth" av={fmtDate(person.dob)} b="Contact No." bv={person.phone} />
        <Row a="Email ID" av={person.email} b="Location" bv={person.location} />
        <Row a="Address" av={person.address} wide />
      </tbody></table>

      <h3>2. PROFESSIONAL DETAILS</h3>
      <table><tbody>
        <Row a="Freelancer ID" av={<span className="font-mono">{person.code ?? "Issued on approval"}</span>} b="Professional Title / Role" bv={person.designation} />
        <Row a="Area of Expertise" av={f?.areaOfExpertise} b="Years of Experience" bv={f?.yearsOfExperience !== undefined ? `${f.yearsOfExperience} years` : ""} />
        <Row a="LinkedIn Profile" av={person.linkedIn} wide />
      </tbody></table>

      <h3>3. WORK DETAILS</h3>
      <table><tbody>
        <Row a="Project / Service" av={f?.projects.join(", ")} b="Department / Functional Area" bv={person.department} />
        <Row a="Contact Person" av={fullName(contact)} b={<>Engagement Type<small>(Project-based / Hourly / Retainer / Contract)</small></>} bv={f?.engagementType} />
        <Row a="Start Date" av={fmtDate(f?.contractStart)} b="End Date" bv={fmtDate(f?.contractEnd)} />
        <Row a="Work Mode" av={f?.workMode} b="Work Location" bv={f?.workLocation} />
        <Row a={<>Engagement Status<small>(Active / Completed / Discontinued)</small></>} av={f?.engagementStatus} wide />
      </tbody></table>

      <h3>4. PAYMENT &amp; TAX DETAILS</h3>
      <table><tbody>
        <Row a="Payment Type" av={f?.paymentType} b="Agreed Rate / Pay per project" bv={rate} />
        <Row a="Payment Frequency" av={f?.paymentFrequency} b="PAN" bv={<span className="font-mono">{person.pan}</span>} />
        <Row a="GSTIN" av={<span className="font-mono">{f?.gstin ?? "Not registered"}</span>} b="Bank Account No." bv={<span className="font-mono">{person.bank.accountNumber ?? (person.bank.accountLast4 ? `XXXX${person.bank.accountLast4}` : "")}</span>} />
      </tbody></table>

      <div className="mt-12 flex flex-wrap items-end gap-3 text-[12px] font-bold">
        <span>FREELANCER SIGNATURE :</span>
        <span className="relative inline-block h-12 min-w-[200px] border-b border-[#1b1b1b]">
          {f?.signature && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.signature} alt="Freelancer signature" className="absolute bottom-0 left-2 h-12 max-w-[220px] object-contain" />
          )}
        </span>
        {f?.signedOn && <span className="text-[10px] font-normal text-[#555]">Signed {fmtDate(f.signedOn)}</span>}
      </div>
    </article>
  );
}
