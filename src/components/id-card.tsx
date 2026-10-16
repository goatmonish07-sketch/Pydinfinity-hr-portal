"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Person } from "@/lib/types";
import { useHR } from "@/lib/store";
import { fullName, TYPE_LABEL } from "@/lib/utils";

export function useQR(text: string) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 0, width: 220, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } }).then(setSrc).catch(() => setSrc(""));
  }, [text]);
  return src;
}

/** CR80 portrait ID card (54 × 86 mm ratio). Prints at true size inside .print-area. */
export function IdCard({ person }: { person: Person }) {
  const company = useHR((s) => s.settings.companyName);
  const qr = useQR(JSON.stringify({ id: person.code, name: fullName(person), org: company }));
  const typeColor = person.type === "employee" ? "var(--primary)" : person.type === "intern" ? "#2563eb" : "#d97706";
  return (
    <div className="id-card relative flex aspect-[54/86] w-[216px] shrink-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-[#1f2430] shadow-xl print:shadow-none" style={{ breakInside: "avoid" }}>
      <div className="gradient-brand relative h-[92px] px-4 pt-3 text-white" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pyd-logo.png" alt="" className="h-6 w-6 rounded-full bg-white" />
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em]">{company}</span>
        </div>
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 rounded-full bg-white p-1">
          {person.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photo} alt={`Photo of ${fullName(person)}`} className="h-[72px] w-[72px] rounded-full object-cover" />
          ) : (
            <span
              className="grid h-[72px] w-[72px] place-items-center rounded-full text-2xl font-bold text-white"
              style={{ backgroundImage: `linear-gradient(135deg, hsl(${person.hue} 70% 58%), hsl(${(person.hue + 40) % 360} 65% 45%))`, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
            >
              {person.firstName[0]}
              {person.lastName[0]}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center px-3 pt-11 text-center">
        <p className="font-[family-name:var(--font-display)] text-[15px] font-bold leading-tight">{fullName(person)}</p>
        <p className="text-[10.5px] text-[#4b5563]">{person.designation}</p>
        <span className="mt-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: typeColor, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          {TYPE_LABEL[person.type]}
        </span>
        <p className="mt-2 font-mono text-[12px] font-bold tracking-wide">{person.code ?? "PENDING"}</p>
        <div className="mt-auto flex w-full items-end justify-between gap-2 pb-3 text-left">
          <dl className="space-y-0.5 text-[8.5px] leading-tight">
            <div><dt className="inline text-[#6b7280]">Blood </dt><dd className="inline font-semibold">{person.bloodGroup || "—"}</dd></div>
            <div><dt className="text-[#6b7280]">Emergency</dt><dd className="font-semibold">{person.emergencyContact.phone || "—"}</dd></div>
            <div><dt className="inline text-[#6b7280]">Dept </dt><dd className="inline font-semibold">{person.department}</dd></div>
          </dl>
          {qr ? <img src={qr} alt={`QR code for ${person.code}`} className="h-14 w-14" /> : <span className="h-14 w-14 rounded bg-[#eee]" />}
        </div>
      </div>
      <div className="gradient-brand h-1.5" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} />
    </div>
  );
}
