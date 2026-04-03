import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { CoverageReasonBadge, TimeSlotBadge } from "@/components/ui/badge";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import type { CoverageAssignment } from "@/shared/types";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const TIME_SLOT_ORDER = ["morning_duty", "all_day", "lunch_duty", "afternoon_duty", "custom"];

export default function MyDutiesScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const today = formatDate(new Date());

  const { data, isLoading, refetch, isRefetching } = trpc.coverage.getByDate.useQuery(
    { date: today },
    { enabled: isAuthenticated }
  );

  const allCoverage = data?.coverage ?? [];

  // Filter to only the current user's assignments (by display name match)
  const myName = user?.name ?? "";
  const myDuties = myName
    ? allCoverage.filter((c) =>
        c.coveringStaffName.toLowerCase().includes(myName.toLowerCase()) ||
        myName.toLowerCase().includes(c.coveringStaffName.toLowerCase())
      )
    : [];

  // Sort by time slot order
  const sorted = [...myDuties].sort(
    (a, b) => TIME_SLOT_ORDER.indexOf(a.timeSlot) - TIME_SLOT_ORDER.indexOf(b.timeSlot)
  );

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Text className="text-4xl mb-4">🚀</Text>
        <Text className="text-xl font-bold text-foreground text-center mb-2">Sign In Required</Text>
        <Text className="text-muted text-center text-sm">
          Please sign in to view your personal duty assignments.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white tracking-tight">My Duties</Text>
        <Text className="text-white/70 text-sm mt-0.5">{formatDateHeader(today)}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={[{ key: "content" }]}
            keyExtractor={(item) => item.key}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            renderItem={() => (
              <View className="px-4 py-4">
                {sorted.length === 0 ? (
                  <View className="flex-1 items-center justify-center pt-16">
                    <Text className="text-5xl mb-4">🚀</Text>
                    <Text className="text-xl font-bold text-foreground text-center mb-2">
                      No Duties Today!
                    </Text>
                    <Text className="text-muted text-center text-sm px-8">
                      You have no coverage assignments for today. Enjoy your day!
                    </Text>
                  </View>
                ) : (
                  <>
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-base font-bold text-foreground">
                        {sorted.length} {sorted.length === 1 ? "Assignment" : "Assignments"}
                      </Text>
                      <View className="bg-primary/10 rounded-full px-3 py-1">
                        <Text className="text-primary text-xs font-bold">
                          {user?.name ?? ""}
                        </Text>
                      </View>
                    </View>
                    {sorted.map((assignment) => (
                      <MyDutyCard key={assignment.id} assignment={assignment} />
                    ))}
                  </>
                )}
                <View className="h-8" />
              </View>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function MyDutyCard({ assignment }: { assignment: CoverageAssignment }) {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
      <View className="flex-row items-start justify-between gap-2 mb-2">
        <TimeSlotBadge slot={assignment.timeSlot} />
        <CoverageReasonBadge reason={assignment.coverageReason} />
      </View>
      <Text className="font-bold text-foreground text-base">
        Covering: {assignment.coveringFor}
      </Text>
      {assignment.location ? (
        <View className="flex-row items-center gap-1 mt-1">
          <Text className="text-muted text-sm">{assignment.location}</Text>
        </View>
      ) : null}
      {assignment.customTimeStart && assignment.customTimeEnd ? (
        <Text className="text-muted text-xs mt-1">
          {assignment.customTimeStart} – {assignment.customTimeEnd}
        </Text>
      ) : null}
      {assignment.notes ? (
        <View className="bg-warning/10 rounded-lg px-3 py-2 mt-2">
          <Text className="text-xs text-foreground">{assignment.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}
