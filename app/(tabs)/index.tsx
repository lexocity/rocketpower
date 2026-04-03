import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AbsenceTypeBadge, CoverageReasonBadge, TimeSlotBadge } from "@/components/ui/badge";
import { TimeRangeBadge } from "@/components/ui/time-range-badge";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { Absence, CoverageAssignment } from "@/shared/types";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getSubDisplay(absence: Absence): string {
  if (absence.subStatus === "no_sub") return "No sub";
  if (absence.subStatus === "new_sub") return "New Sub?";
  if (absence.subStatus === "split") return "Split";
  return absence.subName ?? "";
}

export default function TodayScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const { data, isLoading, refetch, isRefetching } = trpc.coverage.getByDate.useQuery(
    { date: selectedDate },
    { refetchOnWindowFocus: true }
  );

  const absences = data?.absences ?? [];
  const coverage = data?.coverage ?? [];

  function shiftDate(days: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + days);
    setSelectedDate(formatDate(next));
  }

  const isWeb = Platform.OS === "web";

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-2xl font-bold text-white tracking-tight">RocketPower</Text>
          <Text className="text-secondary text-xs font-semibold">ROGERS LANE ES</Text>
        </View>
        {/* Date Navigator */}
        <View className="flex-row items-center justify-between bg-white/10 rounded-xl px-3 py-2 mt-1">
          <Pressable
            onPress={() => shiftDate(-1)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name="chevron.left" size={20} color="white" />
          </Pressable>
          <Text className="text-white font-semibold text-sm flex-1 text-center">
            {formatDateHeader(selectedDate)}
          </Text>
          <Pressable
            onPress={() => shiftDate(1)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name="chevron.right" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-3 text-sm">Loading coverage...</Text>
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
              <View className={isWeb ? "max-w-4xl self-center w-full px-4 py-4" : "px-4 py-4"}>
                {/* Out of the Building Section */}
                <SectionHeader title="Out of the Building" count={absences.length} />
                {absences.length === 0 ? (
                  <EmptyCard message="No absences today" />
                ) : (
                  absences.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} />
                  ))
                )}

                {/* Coverage Assignments Section */}
                <SectionHeader title="Coverage Assignments" count={coverage.length} className="mt-6" />
                {coverage.length === 0 ? (
                  <EmptyCard message="No coverage assignments today" />
                ) : (
                  coverage.map((assignment) => (
                    <CoverageCard key={assignment.id} assignment={assignment} />
                  ))
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

function SectionHeader({ title, count, className }: { title: string; count: number; className?: string }) {
  return (
    <View className={`flex-row items-center justify-between mb-3 ${className ?? ""}`}>
      <View className="flex-row items-center gap-2">
        <View className="w-1 h-5 bg-primary rounded-full" />
        <Text className="text-base font-bold text-foreground">{title}</Text>
      </View>
      <View className="bg-primary/10 rounded-full px-2.5 py-0.5">
        <Text className="text-primary text-xs font-bold">{count}</Text>
      </View>
    </View>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <View className="bg-surface rounded-xl p-4 items-center border border-border mb-2">
      <Text className="text-muted text-sm">{message}</Text>
    </View>
  );
}

function AbsenceCard({ absence }: { absence: Absence }) {
  const subDisplay = getSubDisplay(absence);
  return (
    <View className="bg-surface rounded-xl p-3.5 mb-2 border border-border">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="font-bold text-foreground text-base">{absence.staffName}</Text>
          {subDisplay ? (
            <Text className="text-muted text-sm mt-0.5">Sub: {subDisplay}</Text>
          ) : null}
          {absence.employeeNumber ? (
            <Text className="text-muted text-xs mt-0.5">
              Emp #{absence.employeeNumber}
              {absence.subNumber ? `  ·  Sub #{absence.subNumber}` : ""}
            </Text>
          ) : null}
        </View>
        <View className="items-end gap-1.5">
          <TimeRangeBadge
            timeRange={absence.timeRange}
            customStart={absence.customTimeStart}
            customEnd={absence.customTimeEnd}
          />
          {absence.absenceType !== "unknown" && (
            <AbsenceTypeBadge type={absence.absenceType} />
          )}
          {absence.isOAM && (
            <View className="bg-secondary/30 rounded-full px-2 py-0.5">
              <Text className="text-xs font-semibold text-foreground">OAM</Text>
            </View>
          )}
        </View>
      </View>
      {absence.notes ? (
        <Text className="text-muted text-xs mt-2 italic">{absence.notes}</Text>
      ) : null}
    </View>
  );
}

function CoverageCard({ assignment }: { assignment: CoverageAssignment }) {
  return (
    <View className="bg-surface rounded-xl p-3.5 mb-2 border border-border">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="font-bold text-foreground text-base">{assignment.coveringStaffName}</Text>
          <Text className="text-muted text-sm mt-0.5">
            Covering: <Text className="text-foreground font-medium">{assignment.coveringFor}</Text>
          </Text>
          {assignment.location ? (
            <Text className="text-muted text-xs mt-0.5">{assignment.location}</Text>
          ) : null}
        </View>
        <View className="items-end gap-1.5">
          <TimeSlotBadge slot={assignment.timeSlot} />
          <CoverageReasonBadge reason={assignment.coverageReason} />
        </View>
      </View>
      {assignment.notes ? (
        <Text className="text-muted text-xs mt-2 italic">{assignment.notes}</Text>
      ) : null}
    </View>
  );
}
