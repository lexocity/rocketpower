import { Text, View } from "react-native";
import { cn } from "@/lib/utils";
import type { TimeRange } from "@/shared/types";

interface TimeRangeBadgeProps {
  timeRange: TimeRange;
  customStart?: string | null;
  customEnd?: string | null;
  className?: string;
}

export function TimeRangeBadge({ timeRange, customStart, customEnd, className }: TimeRangeBadgeProps) {
  let label = "";
  let isAllDay = false;

  switch (timeRange) {
    case "all_day":
      label = "All Day";
      isAllDay = true;
      break;
    case "morning":
      label = "8:30 AM - 12:30 PM";
      break;
    case "afternoon":
      label = "12:30 PM - 4:30 PM";
      break;
    case "custom":
      label = customStart && customEnd ? `${customStart} - ${customEnd}` : "Custom";
      break;
  }

  return (
    <View className={cn(
      "rounded-full px-3 py-1 self-start",
      isAllDay ? "bg-primary" : "bg-secondary",
      className
    )}>
      <Text className={cn(
        "text-xs font-semibold",
        isAllDay ? "text-white" : "text-foreground"
      )}>
        {label}
      </Text>
    </View>
  );
}
