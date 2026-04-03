/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ─── RocketPower Domain Types & Labels ───────────────────────────────────────────────────────────────
export type TimeRange = "all_day" | "morning" | "afternoon" | "custom";
export type SubStatus = "assigned" | "no_sub" | "new_sub" | "split";
export type AbsenceType = "sick" | "personal" | "educational" | "other" | "unknown";
export type CoverageReason = "subbing" | "iep" | "absent" | "class_coverage" | "other";
export type TimeSlot = "morning_duty" | "lunch_duty" | "afternoon_duty" | "custom" | "all_day";

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  all_day: "All Day",
  morning: "8:30 AM - 12:30 PM",
  afternoon: "12:30 PM - 4:30 PM",
  custom: "Custom",
};

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  sick: "Sick",
  personal: "Personal",
  educational: "Educational",
  other: "Other",
  unknown: "",
};

export const COVERAGE_REASON_LABELS: Record<CoverageReason, string> = {
  subbing: "Subbing",
  iep: "IEP",
  absent: "Absent",
  class_coverage: "Class Cov.",
  other: "Other",
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning_duty: "Morning Duty",
  lunch_duty: "Lunch Duty",
  afternoon_duty: "Afternoon Duty",
  all_day: "All Day",
  custom: "Custom",
};

export const SUB_STATUS_LABELS: Record<SubStatus, string> = {
  assigned: "",
  no_sub: "No sub",
  new_sub: "New Sub?",
  split: "Split",
};
