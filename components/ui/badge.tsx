import { Text, View } from "react-native";
import { cn } from "@/lib/utils";
import type { AbsenceType, CoverageReason, TimeSlot } from "@/shared/types";

type BadgeVariant =
  | "sick" | "personal" | "educational" | "other" | "unknown"
  | "subbing" | "iep" | "absent" | "class_coverage"
  | "morning_duty" | "lunch_duty" | "afternoon_duty" | "all_day" | "custom"
  | "primary" | "secondary" | "muted";

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  // Absence types
  sick:         { bg: "bg-sick",         text: "text-red-800 dark:text-red-200" },
  personal:     { bg: "bg-personal",     text: "text-purple-800 dark:text-purple-200" },
  educational:  { bg: "bg-educational",  text: "text-blue-800 dark:text-blue-200" },
  other:        { bg: "bg-muted/30",     text: "text-foreground" },
  unknown:      { bg: "bg-muted/20",     text: "text-muted" },
  // Coverage reasons
  subbing:      { bg: "bg-subbing",      text: "text-green-800 dark:text-green-200" },
  iep:          { bg: "bg-iep",          text: "text-orange-800 dark:text-orange-200" },
  absent:       { bg: "bg-absent",       text: "text-red-800 dark:text-red-200" },
  class_coverage: { bg: "bg-classCoverage", text: "text-emerald-800 dark:text-emerald-200" },
  // Time slots
  morning_duty: { bg: "bg-iep",          text: "text-orange-800 dark:text-orange-200" },
  lunch_duty:   { bg: "bg-subbing",      text: "text-green-800 dark:text-green-200" },
  afternoon_duty: { bg: "bg-educational", text: "text-blue-800 dark:text-blue-200" },
  all_day:      { bg: "bg-primary",      text: "text-white" },
  custom:       { bg: "bg-muted/30",     text: "text-foreground" },
  // Generic
  primary:      { bg: "bg-primary",      text: "text-white" },
  secondary:    { bg: "bg-secondary",    text: "text-foreground" },
  muted:        { bg: "bg-muted/20",     text: "text-muted" },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ label, variant = "muted", size = "sm", className }: BadgeProps) {
  if (!label) return null;
  const styles = BADGE_STYLES[variant] ?? BADGE_STYLES.muted;
  return (
    <View className={cn(
      "rounded-full px-2 py-0.5 self-start",
      styles.bg,
      size === "md" && "px-3 py-1",
      className
    )}>
      <Text className={cn(
        "font-medium",
        size === "sm" ? "text-xs" : "text-sm",
        styles.text
      )}>
        {label}
      </Text>
    </View>
  );
}

export function AbsenceTypeBadge({ type }: { type: AbsenceType }) {
  const labels: Record<AbsenceType, string> = {
    sick: "Sick", personal: "Personal", educational: "Educational", other: "Other", unknown: "",
  };
  const label = labels[type];
  if (!label) return null;
  return <Badge label={label} variant={type} />;
}

export function CoverageReasonBadge({ reason }: { reason: CoverageReason }) {
  const labels: Record<CoverageReason, string> = {
    subbing: "Subbing", iep: "IEP", absent: "Absent", class_coverage: "Class Cov.", other: "Other",
  };
  return <Badge label={labels[reason]} variant={reason} />;
}

export function TimeSlotBadge({ slot }: { slot: TimeSlot }) {
  const labels: Record<TimeSlot, string> = {
    morning_duty: "Morning Duty", lunch_duty: "Lunch Duty", afternoon_duty: "Afternoon Duty",
    all_day: "All Day", custom: "Custom",
  };
  return <Badge label={labels[slot]} variant={slot} />;
}
