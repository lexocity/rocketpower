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

const isWeb = Platform.OS === "web";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  // Web: full-screen layout, no purple header (top nav handles branding)
  if (isWeb) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8f5fb" }}>
        {/* Date bar */}
        <View
          style={{
            backgroundColor: "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#e8e0f0",
            paddingHorizontal: 32,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => shiftDate(-1)}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.6 : 1,
                backgroundColor: "#490E67",
                borderRadius: 8,
                padding: 8,
              },
            ]}
          >
            <IconSymbol name="chevron.left" size={18} color="#fff" />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#490E67" }}>
              {formatDateHeader(selectedDate)}
            </Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              Daily Coverage Board
            </Text>
          </View>
          <Pressable
            onPress={() => shiftDate(1)}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.6 : 1,
                backgroundColor: "#490E67",
                borderRadius: 8,
                padding: 8,
              },
            ]}
          >
            <IconSymbol name="chevron.right" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#490E67" />
            <Text style={{ color: "#888", marginTop: 12, fontSize: 14 }}>Loading coverage...</Text>
          </View>
        ) : (
          <FlatList
            data={[{ key: "content" }]}
            keyExtractor={(item) => item.key}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#490E67" />
            }
            contentContainerStyle={{ padding: 32, maxWidth: 1200, alignSelf: "center", width: "100%" }}
            renderItem={() => (
              <View style={{ flexDirection: "row", gap: 28, alignItems: "flex-start" }}>
                {/* Left column: Out of the Building */}
                <View style={{ flex: 1 }}>
                  <WebSectionHeader
                    title="Out of the Building"
                    count={absences.length}
                    color="#490E67"
                    icon="person.fill"
                  />
                  {absences.length === 0 ? (
                    <WebEmptyCard message="No absences today 🎉" />
                  ) : (
                    absences.map((absence) => (
                      <WebAbsenceCard key={absence.id} absence={absence} />
                    ))
                  )}
                </View>

                {/* Right column: Coverage Assignments */}
                <View style={{ flex: 1 }}>
                  <WebSectionHeader
                    title="Coverage Assignments"
                    count={coverage.length}
                    color="#7c3aed"
                    icon="shield.fill"
                  />
                  {coverage.length === 0 ? (
                    <WebEmptyCard message="No coverage assignments today" />
                  ) : (
                    coverage.map((assignment) => (
                      <WebCoverageCard key={assignment.id} assignment={assignment} />
                    ))
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  // Mobile layout (unchanged)
  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Mobile Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-2xl font-bold text-white tracking-tight">RocketPower</Text>
          <Text className="text-secondary text-xs font-semibold">ROGERS LANE ES</Text>
        </View>
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
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            renderItem={() => (
              <View className="px-4 py-4">
                <SectionHeader title="Out of the Building" count={absences.length} />
                {absences.length === 0 ? (
                  <EmptyCard message="No absences today" />
                ) : (
                  absences.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} />
                  ))
                )}
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

// ─── Web Components ───────────────────────────────────────────────────────────

function WebSectionHeader({
  title,
  count,
  color,
  icon,
}: {
  title: string;
  count: number;
  color: string;
  icon: any;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: color,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name={icon} size={16} color="#fff" />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a2e" }}>{title}</Text>
      </View>
      <View
        style={{
          backgroundColor: color,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 3,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{count}</Text>
      </View>
    </View>
  );
}

function WebEmptyCard({ message }: { message: string }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e8e0f0",
        borderStyle: "dashed",
      }}
    >
      <Text style={{ color: "#999", fontSize: 14 }}>{message}</Text>
    </View>
  );
}

function WebAbsenceCard({ absence }: { absence: Absence }) {
  const subDisplay = getSubDisplay(absence);
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e8e0f0",
        // @ts-ignore
        boxShadow: "0 1px 4px rgba(73,14,103,0.07)",
        borderLeftWidth: 4,
        borderLeftColor: "#490E67",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1a1a2e" }}>{absence.staffName}</Text>
          {subDisplay ? (
            <Text style={{ color: "#666", fontSize: 13, marginTop: 3 }}>Sub: {subDisplay}</Text>
          ) : null}
          {absence.notes ? (
            <Text style={{ color: "#999", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
              {absence.notes}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <TimeRangeBadge
            timeRange={absence.timeRange}
            customStart={absence.customTimeStart}
            customEnd={absence.customTimeEnd}
          />
          {absence.absenceType !== "unknown" && <AbsenceTypeBadge type={absence.absenceType} />}
        </View>
      </View>
    </View>
  );
}

function WebCoverageCard({ assignment }: { assignment: CoverageAssignment }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e8e0f0",
        // @ts-ignore
        boxShadow: "0 1px 4px rgba(73,14,103,0.07)",
        borderLeftWidth: 4,
        borderLeftColor: "#7c3aed",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1a1a2e" }}>
            {assignment.coveringStaffName}
          </Text>
          <Text style={{ color: "#666", fontSize: 13, marginTop: 3 }}>
            Covering:{" "}
            <Text style={{ color: "#490E67", fontWeight: "600" }}>{assignment.coveringFor}</Text>
          </Text>
          {assignment.location ? (
            <Text style={{ color: "#999", fontSize: 12, marginTop: 2 }}>{assignment.location}</Text>
          ) : null}
          {assignment.notes ? (
            <Text style={{ color: "#999", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
              {assignment.notes}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <TimeSlotBadge slot={assignment.timeSlot} />
          <CoverageReasonBadge reason={assignment.coverageReason} />
        </View>
      </View>
    </View>
  );
}

// ─── Mobile Components ────────────────────────────────────────────────────────

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
        </View>
        <View className="items-end gap-1.5">
          <TimeRangeBadge
            timeRange={absence.timeRange}
            customStart={absence.customTimeStart}
            customEnd={absence.customTimeEnd}
          />
          {absence.absenceType !== "unknown" && <AbsenceTypeBadge type={absence.absenceType} />}
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
