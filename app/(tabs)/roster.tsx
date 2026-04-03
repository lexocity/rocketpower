import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Quarter = "Q1_Q3" | "Q2_Q4" | "all";
type TimeOfDay = "am" | "lunch" | "pm" | "all";
type DutyType = "morning_duty" | "lunch_duty" | "afternoon_duty" | "carpool" | "class_coverage" | "iep" | "other";

const DUTY_TYPE_LABELS: Record<DutyType, string> = {
  morning_duty: "Morning Duty",
  lunch_duty: "Lunch Duty",
  afternoon_duty: "Afternoon Duty",
  carpool: "Carpool",
  class_coverage: "Class Coverage",
  iep: "IEP",
  other: "Other",
};

const DUTY_TYPE_COLORS: Record<DutyType, string> = {
  morning_duty: "#F59E0B",
  lunch_duty: "#22C55E",
  afternoon_duty: "#3B82F6",
  carpool: "#8B5CF6",
  class_coverage: "#EC4899",
  iep: "#EF4444",
  other: "#6B7280",
};

const QUARTERS: Quarter[] = ["Q1_Q3", "Q2_Q4", "all"];
const TIME_OF_DAY_TABS: { value: TimeOfDay; label: string }[] = [
  { value: "am", label: "AM" },
  { value: "lunch", label: "Lunch" },
  { value: "pm", label: "PM" },
];
const AM_DUTY_TYPES: DutyType[] = ["morning_duty", "carpool"];
const LUNCH_DUTY_TYPES: DutyType[] = ["lunch_duty"];
const PM_DUTY_TYPES: DutyType[] = ["afternoon_duty"];
const DUTY_TYPES: DutyType[] = ["morning_duty", "lunch_duty", "afternoon_duty", "carpool", "class_coverage", "iep", "other"];

const emptyForm = {
  id: undefined as number | undefined,
  staffName: "",
  dutyType: "morning_duty" as DutyType,
  dutyLabel: "",
  location: "",
  timeStart: "",
  timeEnd: "",
  quarter: "all" as Quarter,
  notes: "",
};

export default function RosterScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>("Q1_Q3");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay>("am");
  const [searchStaff, setSearchStaff] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  const { data: allDuties = [], isLoading } = trpc.duties.list.useQuery({ quarter: selectedQuarter === "all" ? undefined : selectedQuarter });

  // Filter by time-of-day sub-tab
  function getTimeOfDayTypes(tod: TimeOfDay): DutyType[] | null {
    if (tod === "am") return AM_DUTY_TYPES;
    if (tod === "lunch") return LUNCH_DUTY_TYPES;
    if (tod === "pm") return PM_DUTY_TYPES;
    return null;
  }
  const todTypes = getTimeOfDayTypes(selectedTimeOfDay);

  const upsertMutation = trpc.duties.upsert.useMutation({
    onSuccess: () => {
      utils.duties.list.invalidate();
      utils.duties.staffNames.invalidate();
      setShowForm(false);
      setForm({ ...emptyForm });
    },
    onError: (err) => {
      const msg = err.message || "Failed to save duty.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
    },
  });

  const deleteMutation = trpc.duties.delete.useMutation({
    onSuccess: () => {
      utils.duties.list.invalidate();
      utils.duties.staffNames.invalidate();
    },
  });

  // Group duties by staff name
  const filteredDuties = allDuties.filter((d) => {
    const matchesSearch = searchStaff.trim() === "" || d.staffName.toLowerCase().includes(searchStaff.toLowerCase());
    const matchesTod = todTypes === null || todTypes.includes(d.dutyType as DutyType);
    return matchesSearch && matchesTod;
  });
  const grouped = filteredDuties.reduce<Record<string, typeof allDuties>>((acc, duty) => {
    if (!acc[duty.staffName]) acc[duty.staffName] = [];
    acc[duty.staffName].push(duty);
    return acc;
  }, {});
  const staffNames = Object.keys(grouped).sort();

  function handleEdit(duty: typeof allDuties[0]) {
    setForm({
      id: duty.id,
      staffName: duty.staffName,
      dutyType: duty.dutyType as DutyType,
      dutyLabel: duty.dutyLabel ?? "",
      location: duty.location ?? "",
      timeStart: duty.timeStart ?? "",
      timeEnd: duty.timeEnd ?? "",
      quarter: duty.quarter as Quarter,
      notes: duty.notes ?? "",
    });
    setShowForm(true);
  }

  function handleDelete(id: number, staffName: string) {
    const doDelete = () => deleteMutation.mutate({ id });
    if (Platform.OS === "web") {
      if (window.confirm(`Remove this duty from ${staffName}?`)) doDelete();
    } else {
      Alert.alert("Remove Duty", `Remove this duty from ${staffName}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doDelete },
      ]);
    }
  }

  function handleSave() {
    if (!form.staffName.trim()) {
      const msg = "Staff name is required.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Missing Field", msg);
      return;
    }
    upsertMutation.mutate({
      id: form.id,
      staffName: form.staffName.trim(),
      dutyType: form.dutyType,
      dutyLabel: form.dutyLabel.trim() || null,
      location: form.location.trim() || null,
      timeStart: form.timeStart.trim() || null,
      timeEnd: form.timeEnd.trim() || null,
      quarter: form.quarter,
      notes: form.notes.trim() || null,
    });
  }

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white tracking-tight">Duty Roster</Text>
        <Text className="text-white/70 text-sm mt-0.5">Pre-loaded staff duties by quarter</Text>
      </View>

      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        {/* Quarter Filter */}
        <View className="px-4 pt-4 pb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(["Q1_Q3", "Q2_Q4"] as Quarter[]).map((q) => (
                <Pressable
                  key={q}
                  onPress={() => setSelectedQuarter(q)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className={`px-5 py-2 rounded-full border ${selectedQuarter === q ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                    <Text className={`text-sm font-bold ${selectedQuarter === q ? "text-white" : "text-muted"}`}>
                      {q === "Q1_Q3" ? "Q1/Q3" : "Q2/Q4"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* AM / Lunch / PM Sub-tabs */}
        <View className="px-4 pb-3">
          <View className="flex-row bg-surface rounded-xl border border-border p-1 gap-1">
            {TIME_OF_DAY_TABS.map((tab) => (
              <Pressable
                key={tab.value}
                onPress={() => setSelectedTimeOfDay(tab.value)}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
              >
                <View className={`py-2 rounded-lg items-center ${
                  selectedTimeOfDay === tab.value ? "bg-primary" : "bg-transparent"
                }`}>
                  <Text className={`text-sm font-bold ${
                    selectedTimeOfDay === tab.value ? "text-white" : "text-muted"
                  }`}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-3 gap-2">
            <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
            <TextInput
              value={searchStaff}
              onChangeText={setSearchStaff}
              placeholder="Search staff..."
              placeholderTextColor={colors.muted}
              className="flex-1 py-2.5 text-foreground"
              autoCapitalize="none"
            />
            {searchStaff.length > 0 && (
              <Pressable onPress={() => setSearchStaff("")}>
                <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Add Duty Button */}
        <View className="px-4 pb-3">
          <Pressable
            onPress={() => { setForm({ ...emptyForm }); setShowForm(true); }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="bg-secondary rounded-xl py-3 flex-row items-center justify-center gap-2">
              <IconSymbol name="plus" size={18} color="#490E67" />
              <Text className="text-primary font-bold">Add Duty</Text>
            </View>
          </Pressable>
        </View>

        {/* Form Modal */}
        {showForm && (
          <View className="mx-4 mb-4 bg-surface rounded-2xl border border-border p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-bold text-foreground text-base">
                {form.id ? "Edit Duty" : "Add New Duty"}
              </Text>
              <Pressable onPress={() => setShowForm(false)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <IconSymbol name="xmark" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Staff Name */}
              <FormField label="Staff Name *">
                <TextInput
                  value={form.staffName}
                  onChangeText={(v) => setForm((f) => ({ ...f, staffName: v }))}
                  placeholder="e.g., Nguyen"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                />
              </FormField>

              {/* Duty Type */}
              <FormField label="Duty Type *">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-1.5">
                    {DUTY_TYPES.map((dt) => (
                      <Pressable
                        key={dt}
                        onPress={() => setForm((f) => ({ ...f, dutyType: dt }))}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View className={`px-3 py-1.5 rounded-lg border ${form.dutyType === dt ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
                          <Text className={`text-xs font-semibold ${form.dutyType === dt ? "text-primary" : "text-muted"}`}>
                            {DUTY_TYPE_LABELS[dt]}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </FormField>

              {/* Duty Label */}
              <FormField label="Duty Label">
                <TextInput
                  value={form.dutyLabel}
                  onChangeText={(v) => setForm((f) => ({ ...f, dutyLabel: v }))}
                  placeholder="e.g., Carpool Purple, Lunch Duty"
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                />
              </FormField>

              {/* Location */}
              <FormField label="Location / Area">
                <TextInput
                  value={form.location}
                  onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
                  placeholder="e.g., Daughenbaugh Purple, Main Hallway"
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                />
              </FormField>

              {/* Time Range */}
              <FormField label="Time Range">
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Start</Text>
                    <TextInput
                      value={form.timeStart}
                      onChangeText={(v) => setForm((f) => ({ ...f, timeStart: v }))}
                      placeholder="e.g., 11:10"
                      placeholderTextColor={colors.muted}
                      className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">End</Text>
                    <TextInput
                      value={form.timeEnd}
                      onChangeText={(v) => setForm((f) => ({ ...f, timeEnd: v }))}
                      placeholder="e.g., 11:35"
                      placeholderTextColor={colors.muted}
                      className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                    />
                  </View>
                </View>
              </FormField>

              {/* Quarter */}
              <FormField label="Quarter">
                <View className="flex-row gap-1.5 flex-wrap">
                  {QUARTERS.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => setForm((f) => ({ ...f, quarter: q }))}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View className={`px-3 py-1.5 rounded-lg border ${form.quarter === q ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
                        <Text className={`text-xs font-semibold ${form.quarter === q ? "text-primary" : "text-muted"}`}>
                          {q === "all" ? "Every Quarter" : q === "Q1_Q3" ? "Q1/Q3" : "Q2/Q4"}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </FormField>

              {/* Notes */}
              <FormField label="Notes">
                <TextInput
                  value={form.notes}
                  onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                  placeholder="Any additional details..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={2}
                  className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                  style={{ minHeight: 60, textAlignVertical: "top" }}
                />
              </FormField>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setShowForm(false)}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View className="border border-border rounded-xl py-3 items-center">
                    <Text className="text-muted font-semibold">Cancel</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={upsertMutation.isPending}
                  style={({ pressed }) => [{ flex: 2, opacity: pressed || upsertMutation.isPending ? 0.7 : 1 }]}
                >
                  <View className="bg-primary rounded-xl py-3 items-center">
                    {upsertMutation.isPending
                      ? <ActivityIndicator color="white" size="small" />
                      : <Text className="text-white font-bold">{form.id ? "Save Changes" : "Add Duty"}</Text>
                    }
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Staff Duty List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : staffNames.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-5xl mb-4">📋</Text>
            <Text className="text-lg font-bold text-foreground mb-2 text-center">No Duties Pre-loaded</Text>
            <Text className="text-muted text-sm text-center">
              Tap "Add Duty" to start building your staff duty roster. Once added, duties will auto-fill when creating coverage assignments.
            </Text>
          </View>
        ) : (
          <FlatList
            data={staffNames}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            renderItem={({ item: staffName }) => {
              const duties = grouped[staffName] ?? [];
              const isExpanded = expandedStaff === staffName;
              return (
                <View className="bg-surface rounded-2xl border border-border mb-3 overflow-hidden">
                  {/* Staff Header */}
                  <Pressable
                    onPress={() => setExpandedStaff(isExpanded ? null : staffName)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View className="px-4 py-3 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                          <Text className="text-primary font-bold text-base">{staffName[0].toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text className="font-bold text-foreground">{staffName}</Text>
                          <Text className="text-muted text-xs">{duties.length} {duties.length === 1 ? "duty" : "duties"}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => { setForm({ ...emptyForm, staffName }); setShowForm(true); }}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <View className="bg-primary/10 rounded-lg px-2 py-1">
                            <IconSymbol name="plus" size={14} color={colors.primary} />
                          </View>
                        </Pressable>
                        <IconSymbol
                          name={isExpanded ? "chevron.down" : "chevron.right"}
                          size={16}
                          color={colors.muted}
                        />
                      </View>
                    </View>
                  </Pressable>

                  {/* Duty Items */}
                  {isExpanded && duties.map((duty, idx) => (
                    <View key={duty.id}>
                      <View className="h-px bg-border" />
                      <View className="px-4 py-3 flex-row items-start gap-3">
                        <View
                          className="w-2 h-2 rounded-full mt-1.5"
                          style={{ backgroundColor: DUTY_TYPE_COLORS[duty.dutyType as DutyType] }}
                        />
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 flex-wrap">
                            <Text className="font-semibold text-foreground text-sm">
                              {duty.dutyLabel || DUTY_TYPE_LABELS[duty.dutyType as DutyType]}
                            </Text>
                            <View className="bg-surface border border-border rounded-full px-2 py-0.5">
                              <Text className="text-muted text-xs">{duty.quarter === "all" ? "Every Qtr" : duty.quarter === "Q1_Q3" ? "Q1/Q3" : "Q2/Q4"}</Text>
                            </View>
                          </View>
                          {duty.location && (
                            <Text className="text-muted text-xs mt-0.5">📍 {duty.location}</Text>
                          )}
                          {(duty.timeStart || duty.timeEnd) && (
                            <Text className="text-muted text-xs mt-0.5">
                              🕐 {duty.timeStart}{duty.timeStart && duty.timeEnd ? " – " : ""}{duty.timeEnd}
                            </Text>
                          )}
                          {duty.notes && (
                            <Text className="text-muted text-xs mt-0.5 italic">{duty.notes}</Text>
                          )}
                        </View>
                        <View className="flex-row gap-1">
                          <Pressable
                            onPress={() => handleEdit(duty)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                          >
                            <View className="bg-primary/10 rounded-lg p-1.5">
                              <IconSymbol name="pencil" size={14} color={colors.primary} />
                            </View>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDelete(duty.id, staffName)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                          >
                            <View className="bg-error/10 rounded-lg p-1.5">
                              <IconSymbol name="trash" size={14} color={colors.error} />
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">{label}</Text>
      {children}
    </View>
  );
}
