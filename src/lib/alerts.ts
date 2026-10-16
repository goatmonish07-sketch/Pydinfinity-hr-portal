"use client";

import { useMemo } from "react";
import { can, useHR, useMe } from "./store";
import { daysBetween, fullName, todayISO } from "./utils";

export interface Alert {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "warning" | "danger" | "info";
  kind: "approval" | "kyc" | "expiry" | "intern" | "contract" | "leave" | "celebration";
}

/** Derived HR alerts: pending approvals, KYC queue, expiring docs (30 days), internships/contracts ending, leave requests, birthdays. */
export function useAlerts() {
  const people = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const leaves = useHR((s) => s.leaves);
  const { role, me } = useMe();
  return useMemo(() => {
    const today = todayISO();
    const byId = new Map(people.map((p) => [p.id, p]));
    const out: Alert[] = [];
    for (const p of people) {
      if (p.status === "Pending Approval") out.push({ id: `ap-${p.id}`, title: `Approve ${fullName(p)}`, detail: `${p.designation} · ID will be issued on approval`, href: `/people/view?id=${p.id}`, tone: "warning", kind: "approval" });
      if (p.status === "Exited") continue;
      if (p.intern) {
        const left = daysBetween(today, p.intern.endDate);
        if (left >= 0 && left <= 14) out.push({ id: `in-${p.id}`, title: `Internship ending ${left === 0 ? "today" : `in ${left}d`}`, detail: `${fullName(p)} — issue certificate or convert`, href: `/interns`, tone: "info", kind: "intern" });
      }
      if (p.freelancer) {
        const left = daysBetween(today, p.freelancer.contractEnd);
        if (left >= 0 && left <= 30) out.push({ id: `fr-${p.id}`, title: `Contract renewal due in ${left}d`, detail: fullName(p), href: `/freelancers`, tone: "warning", kind: "contract" });
      }
      const dob = new Date(p.dob);
      const bday = new Date(new Date().getFullYear(), dob.getMonth(), dob.getDate());
      const toB = daysBetween(today, bday);
      if (toB >= 0 && toB <= 7) out.push({ id: `bd-${p.id}`, title: toB === 0 ? `Happy birthday ${p.firstName}!` : `${p.firstName}'s birthday in ${toB}d`, detail: p.designation, href: `/announcements`, tone: "info", kind: "celebration" });
    }
    const uploaded = documents.filter((d) => d.status === "Uploaded" && byId.get(d.personId)?.status !== "Exited");
    if (uploaded.length) out.push({ id: "kyc-queue", title: `${uploaded.length} documents awaiting verification`, detail: "Review uploads in the KYC vault", href: "/documents?status=Uploaded", tone: "warning", kind: "kyc" });
    for (const d of documents) {
      if (!d.expiry || d.status !== "Verified") continue;
      const left = daysBetween(today, d.expiry);
      if (left <= 30) {
        const p = byId.get(d.personId);
        if (!p || p.status === "Exited") continue;
        out.push({ id: `ex-${d.id}`, title: `${d.kind} ${left < 0 ? "expired" : `expires in ${left}d`}`, detail: fullName(p), href: `/documents?status=Expiring`, tone: left < 0 ? "danger" : "warning", kind: "expiry" });
      }
    }
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
    if (pendingLeaves) out.push({ id: "lv", title: `${pendingLeaves} leave requests pending`, detail: "Approve or reject from Attendance & Leave", href: "/attendance", tone: "info", kind: "leave" });
    if (can(role, "people.manage")) return out;
    if (role === "Manager") {
      const team = new Set(people.filter((p) => p.managerId === me.id).map((p) => p.id));
      const teamLeaves = leaves.filter((l) => l.status === "Pending" && team.has(l.personId)).length;
      return [
        ...(teamLeaves ? [{ id: "lv-team", title: `${teamLeaves} team leave requests pending`, detail: "Approve or reject from Attendance & Leave", href: "/attendance", tone: "info" as const, kind: "leave" as const }] : []),
        ...out.filter((a) => a.kind === "intern" || a.kind === "celebration"),
      ];
    }
    // Self-service: own KYC gaps + celebrations
    const mine = documents.filter((d) => d.personId === me.id && (d.status === "Pending" || d.status === "Rejected"));
    return [
      ...(mine.length ? [{ id: "my-kyc", title: `${mine.length} of your documents need upload`, detail: "Complete your KYC", href: "/documents", tone: "warning" as const, kind: "kyc" as const }] : []),
      ...out.filter((a) => a.kind === "celebration"),
    ];
  }, [people, documents, leaves, role, me.id]);
}
