import type { Leave, LeaveType, Settings } from "./types";

export function leaveBalance(personId: string, leaves: Leave[], quota: Settings["leaveQuota"]) {
  const year = new Date().getFullYear();
  const used: Record<LeaveType, number> = { CL: 0, SL: 0, EL: 0, LOP: 0 };
  for (const l of leaves) {
    if (l.personId !== personId || l.status !== "Approved" || new Date(l.from).getFullYear() !== year) continue;
    used[l.type] += l.days;
  }
  return (Object.keys(quota) as LeaveType[]).map((t) => ({ type: t, quota: quota[t], used: used[t], left: Math.max(quota[t] - used[t], 0) }));
}

export const LEAVE_NAMES: Record<LeaveType, string> = { CL: "Casual", SL: "Sick", EL: "Earned", LOP: "Loss of Pay" };
