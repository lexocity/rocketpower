/**
 * Lunch Duty Screen
 * Shows all lunch_duty coverage assignments for the selected date,
 * grouped by time slot for easy reference.
 */
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { CoverageAssignment } from "@/shared/types";

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

function formatTimeDisplay(assignment: CoverageAssignment): string {
  if (assignment.customTimeStart && assignment.customTimeEnd) {
    return `${assignment.customTimeStart} – ${assignment.customTimeEnd}`;
  }
  if (assignment.timeSlot === "morning_duty") return "Morning Duty";
  if (assignment.timeSlot === "lunch_duty") return "Lunch Duty";
  if (assignment.timeSlot === "afternoon_duty") return "Afternoon Duty";
  if (assignment.timeSlot === "all_day") return "All Day";
  return "Custom";
}

export default function LunchDutyScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const { data, isLoading, refetch, isRefetching } = trpc.coverage.getByDate.useQuery(
    { date: selectedDate },
    { refetchOnWindowFocus: true }
  );

  // Filter to only lunch_duty assignments
  const lunchAssignments = (data?.coverage ?? []).filter(
    (a) => a.timeSlot === "lunch_duty" || a.coverageReason === "class_coverage"
  );

  // Also include any with "lunch" in the location or notes
  const allLunch = (data?.coverage ?? []).filter(
    (a) =>
      a.timeSlot === "lunch_duty" ||
      a.location?.toLowerCase().includes("lunch") ||
      a.notes?.toLowerCase().includes("lunch")
  );

  // Deduplicate
  const seen = new Set<number>();
  const lunchDuties = [...lunchAssignments, ...allLunch].filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort by customTimeStart if available
  lunchDuties.sort((a, b) => {
    const ta = a.customTimeStart ?? "99:99";
    const tb = b.customTimeStart ?? "99:99";
    return ta.localeCompare(tb);
  });

  function shiftDate(days: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + days);
    setSelectedDate(formatDate(next));
  }

  const [searchQuery, setSearchQuery] = useState("");

  // Filter by search query across staff name, covering-for name, and location/duty
  const filteredDuties = searchQuery.trim()
    ? lunchDuties.filter((a) => {
        const q = searchQuery.toLowerCase();
        return (
          a.coveringStaffName.toLowerCase().includes(q) ||
          a.coveringFor.toLowerCase().includes(q) ||
          (a.location ?? "").toLowerCase().includes(q) ||
          (a.notes ?? "").toLowerCase().includes(q)
        );
      })
    : lunchDuties;

  const isWeb = Platform.OS === "web";

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-2xl font-bold text-white tracking-tight">Lunch Duty</Text>
          <View className="bg-secondary/30 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">{lunchDuties.length} assignments</Text>
          </View>
        </View>
        {/* Search Bar */}
        <View className="flex-row items-center bg-white/15 rounded-xl px-3 py-1.5 mt-2 mb-1">
          <IconSymbol name="magnifyingglass" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by staff, duty, or location..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, color: "white", fontSize: 13, marginLeft: 8, height: 28 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <IconSymbol name="xmark.circle.fill" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
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
            <Text className="text-muted mt-3 text-sm">Loading lunch duties...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDuties}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={
              isWeb
                ? { maxWidth: 720, alignSelf: "center", width: "100%", padding: 16 }
                : { padding: 16 }
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-20">
                <View className="bg-surface rounded-2xl p-8 items-center border border-border">
                  <IconSymbol name="clock" size={40} color={colors.muted} />
                  <Text className="text-foreground font-bold text-lg mt-4">No Lunch Duties</Text>
                  <Text className="text-muted text-sm text-center mt-2">
                    No lunch duty assignments found for this date.
                  </Text>
                </View>
              </View>
            }
            ListHeaderComponent={
              lunchDuties.length > 0 ? (
                <View className="flex-row items-center gap-2 mb-4">
                  <View className="w-1 h-5 bg-primary rounded-full" />
                  <Text className="text-base font-bold text-foreground">Today's Lunch Assignments</Text>
                  <View className="bg-primary/10 rounded-full px-2.5 py-0.5 ml-auto">
                    <Text className="text-primary text-xs font-bold">
                      {searchQuery ? `${filteredDuties.length} of ${lunchDuties.length}` : lunchDuties.length}
                    </Text>
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <LunchDutyCard assignment={item} index={index} />
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function LunchDutyCard({
  assignment,
  index,
}: {
  assignment: CoverageAssignment;
  index: number;
}) {
  const timeDisplay = formatTimeDisplay(assignment);

  // Alternating row tints for easy scanning (like a spreadsheet)
  const rowBg = index % 2 === 0 ? "bg-surface" : "bg-background";

  return (
    <View className={`${rowBg} rounded-xl p-3.5 mb-2 border border-border`}>
      <View className="flex-row items-center gap-3">
        {/* Index number */}
        <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
          <Text className="text-primary text-xs font-bold">{index + 1}</Text>
        </View>

        {/* Main info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between flex-wrap gap-1">
            <Text className="font-bold text-foreground text-base">
              {assignment.coveringStaffName}
            </Text>
            <View className="bg-primary/10 rounded-full px-2.5 py-0.5">
              <Text className="text-primary text-xs font-semibold">{timeDisplay}</Text>
            </View>
          </View>

          <Text className="text-muted text-sm mt-0.5">
            Covering:{" "}
            <Text className="text-foreground font-medium">{assignment.coveringFor}</Text>
          </Text>

          {assignment.location ? (
            <Text className="text-muted text-xs mt-0.5">
              📍 {assignment.location}
            </Text>
          ) : null}
        </View>
      </View>

      {assignment.notes ? (
        <Text className="text-muted text-xs mt-2 italic pl-10">
          {assignment.notes}
        </Text>
      ) : null}
    </View>
  );
}
