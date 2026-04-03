import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AbsenceTypeBadge, CoverageReasonBadge, TimeSlotBadge } from "@/components/ui/badge";
import { TimeRangeBadge } from "@/components/ui/time-range-badge";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type {
  Absence,
  AbsenceType,
  CoverageAssignment,
  CoverageReason,
  TimeRange,
  TimeSlot,
} from "@/shared/types";

type AdminTab = "absences" | "coverage" | "notify" | "staff";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function AdminScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<AdminTab>("absences");
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const { data: me } = trpc.auth.me.useQuery();
  const isAdmin = (me as { role?: string } | null | undefined)?.role === "admin";

  if (!isAdmin) {
    return (
      <ScreenContainer className="items-center justify-center px-8">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-xl font-bold text-foreground text-center mb-2">Admin Only</Text>
        <Text className="text-muted text-center text-sm">
          This section is only accessible to administrators.
        </Text>
      </ScreenContainer>
    );
  }

  const isWeb = Platform.OS === "web";

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-2xl font-bold text-white tracking-tight">Admin</Text>
          <View className="bg-secondary rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-foreground">ADMIN</Text>
          </View>
        </View>
        {/* Date display */}
        <Text className="text-white/70 text-sm">{formatDateHeader(selectedDate)}</Text>
      </View>

      {/* Tab Bar */}
      <View className="bg-primary px-4 pb-3">
        <View className="flex-row bg-white/10 rounded-xl p-1 gap-1">
          {(["absences", "coverage", "notify", "staff"] as AdminTab[]).map((tab) => {
            const labels: Record<AdminTab, string> = {
              absences: "Absences",
              coverage: "Coverage",
              notify: "Notify",
              staff: "Staff",
            };
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flex: 1 }]}
              >
                <View className={`rounded-lg py-1.5 items-center ${activeTab === tab ? "bg-white" : ""}`}>
                  <Text className={`text-xs font-semibold ${activeTab === tab ? "text-primary" : "text-white"}`}>
                    {labels[tab]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        <View className={isWeb ? "flex-1 max-w-4xl self-center w-full" : "flex-1"}>
          {activeTab === "absences" && (
            <AbsencesTab selectedDate={selectedDate} colors={colors} />
          )}
          {activeTab === "coverage" && (
            <CoverageTab selectedDate={selectedDate} colors={colors} />
          )}
          {activeTab === "notify" && (
            <NotifyTab colors={colors} />
          )}
          {activeTab === "staff" && (
            <StaffTab colors={colors} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

// ─── Absences Tab ─────────────────────────────────────────────────────────────
function AbsencesTab({ selectedDate, colors }: { selectedDate: string; colors: ReturnType<typeof useColors> }) {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch, isRefetching } = trpc.coverage.getByDate.useQuery({ date: selectedDate });
  const createMutation = trpc.absences.create.useMutation({ onSuccess: () => { utils.coverage.getByDate.invalidate(); setShowForm(false); resetForm(); } });
  const deleteMutation = trpc.absences.delete.useMutation({ onSuccess: () => utils.coverage.getByDate.invalidate() });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  type SubStatus = "assigned" | "no_sub" | "new_sub" | "split";
  const [form, setForm] = useState<{
    staffName: string; subName: string; timeRange: TimeRange;
    customTimeStart: string; customTimeEnd: string; subStatus: SubStatus;
    isOAM: boolean; absenceType: AbsenceType;
    employeeNumber: string; subNumber: string; notes: string;
  }>({
    staffName: "", subName: "", timeRange: "all_day",
    customTimeStart: "", customTimeEnd: "", subStatus: "assigned",
    isOAM: false, absenceType: "unknown",
    employeeNumber: "", subNumber: "", notes: "",
  });

  const updateMutation = trpc.absences.update.useMutation({ onSuccess: () => { utils.coverage.getByDate.invalidate(); setEditingId(null); setShowForm(false); resetForm(); } });

  function resetForm() {
    setForm({ staffName: "", subName: "", timeRange: "all_day" as TimeRange, customTimeStart: "", customTimeEnd: "", subStatus: "assigned" as SubStatus, isOAM: false, absenceType: "unknown" as AbsenceType, employeeNumber: "", subNumber: "", notes: "" });
  }

  function handleEdit(absence: Absence) {
    setEditingId(absence.id);
    setForm({
      staffName: absence.staffName,
      subName: absence.subName ?? "",
      timeRange: absence.timeRange as TimeRange,
      customTimeStart: absence.customTimeStart ?? "",
      customTimeEnd: absence.customTimeEnd ?? "",
      subStatus: absence.subStatus as SubStatus,
      isOAM: absence.isOAM,
      absenceType: absence.absenceType as AbsenceType,
      employeeNumber: absence.employeeNumber ?? "",
      subNumber: absence.subNumber ?? "",
      notes: absence.notes ?? "",
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.staffName.trim()) return;
    const payload = {
      coverageDate: selectedDate,
      staffName: form.staffName.trim(),
      subName: form.subName.trim() || null,
      timeRange: form.timeRange,
      customTimeStart: form.customTimeStart || null,
      customTimeEnd: form.customTimeEnd || null,
      subStatus: form.subStatus,
      isOAM: form.isOAM,
      absenceType: form.absenceType,
      employeeNumber: form.employeeNumber.trim() || null,
      subNumber: form.subNumber.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(id: number) {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this absence entry?")) deleteMutation.mutate({ id });
    } else {
      Alert.alert("Delete Absence", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
      ]);
    }
  }

  const absences = data?.absences ?? [];

  return (
    <View className="flex-1">
      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(i) => i.key}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={() => (
          <View className="px-4 py-4">
            {/* Add Button */}
            <Pressable
              onPress={() => { resetForm(); setEditingId(null); setShowForm(!showForm); }}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-primary rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 mb-4">
                <IconSymbol name="plus" size={18} color="white" />
                <Text className="text-white font-semibold">Add Absence</Text>
              </View>
            </Pressable>

            {/* Form */}
            {showForm && (
              <AbsenceForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                isLoading={createMutation.isPending || updateMutation.isPending}
                isEditing={!!editingId}
              />
            )}

            {/* List */}
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : absences.length === 0 ? (
              <View className="bg-surface rounded-xl p-4 items-center border border-border">
                <Text className="text-muted text-sm">No absences for this date</Text>
              </View>
            ) : (
              absences.map((absence) => (
                <AdminAbsenceCard
                  key={absence.id}
                  absence={absence}
                  onEdit={() => handleEdit(absence)}
                  onDelete={() => handleDelete(absence.id)}
                />
              ))
            )}
            <View className="h-8" />
          </View>
        )}
      />
    </View>
  );
}

function AbsenceForm({
  form, setForm, onSave, onCancel, isLoading, isEditing,
}: {
  form: { staffName: string; subName: string; timeRange: TimeRange; customTimeStart: string; customTimeEnd: string; subStatus: "assigned" | "no_sub" | "new_sub" | "split"; isOAM: boolean; absenceType: AbsenceType; employeeNumber: string; subNumber: string; notes: string };
  setForm: (f: typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEditing: boolean;
}) {
  const colors = useColors();
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
      <Text className="font-bold text-foreground mb-3">{isEditing ? "Edit Absence" : "New Absence"}</Text>

      <FormField label="Staff Name *">
        <TextInput
          value={form.staffName}
          onChangeText={(v) => setForm({ ...form, staffName: v })}
          placeholder="Last name or full name"
          placeholderTextColor={colors.muted}
          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
          returnKeyType="next"
        />
      </FormField>

      <FormField label="Time Range">
        <SegmentedControl
          options={[
            { label: "All Day", value: "all_day" },
            { label: "Morning", value: "morning" },
            { label: "Afternoon", value: "afternoon" },
            { label: "Custom", value: "custom" },
          ]}
          value={form.timeRange}
          onChange={(v) => setForm({ ...form, timeRange: v as TimeRange })}
        />
      </FormField>

      {form.timeRange === "custom" && (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <FormField label="Start Time">
              <TextInput value={form.customTimeStart} onChangeText={(v) => setForm({ ...form, customTimeStart: v })} placeholder="8:30 AM" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="End Time">
              <TextInput value={form.customTimeEnd} onChangeText={(v) => setForm({ ...form, customTimeEnd: v })} placeholder="12:30 PM" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
            </FormField>
          </View>
        </View>
      )}

      <FormField label="Absence Type">
        <SegmentedControl
          options={[
            { label: "—", value: "unknown" },
            { label: "Sick", value: "sick" },
            { label: "Personal", value: "personal" },
            { label: "Educational", value: "educational" },
            { label: "Other", value: "other" },
          ]}
          value={form.absenceType}
          onChange={(v) => setForm({ ...form, absenceType: v as AbsenceType })}
          wrap
        />
      </FormField>

      <FormField label="Sub Status">
        <SegmentedControl
          options={[
            { label: "Assigned", value: "assigned" },
            { label: "No Sub", value: "no_sub" },
            { label: "New Sub?", value: "new_sub" },
            { label: "Split", value: "split" },
          ]}
          value={form.subStatus}
          onChange={(v) => setForm({ ...form, subStatus: v as "assigned" | "no_sub" | "new_sub" | "split" })}
          wrap
        />
      </FormField>

      {form.subStatus === "assigned" && (
        <FormField label="Sub Name">
          <TextInput value={form.subName} onChangeText={(v) => setForm({ ...form, subName: v })} placeholder="Substitute name" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
        </FormField>
      )}

      <View className="flex-row gap-2">
        <View className="flex-1">
          <FormField label="Employee #">
            <TextInput value={form.employeeNumber} onChangeText={(v) => setForm({ ...form, employeeNumber: v })} placeholder="123456" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" keyboardType="numeric" />
          </FormField>
        </View>
        <View className="flex-1">
          <FormField label="Sub #">
            <TextInput value={form.subNumber} onChangeText={(v) => setForm({ ...form, subNumber: v })} placeholder="123456" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" keyboardType="numeric" />
          </FormField>
        </View>
      </View>

      <FormField label="OAM">
        <Pressable onPress={() => setForm({ ...form, isOAM: !form.isOAM })} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <View className={`w-12 h-6 rounded-full ${form.isOAM ? "bg-primary" : "bg-border"} justify-center px-0.5`}>
            <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${form.isOAM ? "self-end" : "self-start"}`} />
          </View>
        </Pressable>
      </FormField>

      <FormField label="Notes">
        <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Optional notes..." placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" multiline numberOfLines={2} />
      </FormField>

      <View className="flex-row gap-2 mt-2">
        <Pressable onPress={onCancel} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <View className="border border-border rounded-xl py-3 items-center">
            <Text className="text-foreground font-semibold">Cancel</Text>
          </View>
        </Pressable>
        <Pressable onPress={onSave} disabled={isLoading} style={({ pressed }) => [{ flex: 1, opacity: pressed || isLoading ? 0.7 : 1 }]}>
          <View className="bg-primary rounded-xl py-3 items-center">
            {isLoading ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-semibold">{isEditing ? "Update" : "Save"}</Text>}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function AdminAbsenceCard({ absence, onEdit, onDelete }: { absence: Absence; onEdit: () => void; onDelete: () => void }) {
  return (
    <View className="bg-surface rounded-xl p-3.5 mb-2 border border-border">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="font-bold text-foreground">{absence.staffName}</Text>
          {absence.subName && <Text className="text-muted text-sm">Sub: {absence.subName}</Text>}
          {absence.employeeNumber && <Text className="text-muted text-xs">Emp #{absence.employeeNumber}{absence.subNumber ? ` · Sub #${absence.subNumber}` : ""}</Text>}
        </View>
        <View className="items-end gap-1">
          <TimeRangeBadge timeRange={absence.timeRange} customStart={absence.customTimeStart} customEnd={absence.customTimeEnd} />
          {absence.absenceType !== "unknown" && <AbsenceTypeBadge type={absence.absenceType} />}
        </View>
      </View>
      <View className="flex-row gap-2 mt-2">
        <Pressable onPress={onEdit} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <View className="border border-primary rounded-lg py-1.5 items-center flex-row justify-center gap-1">
            <IconSymbol name="pencil" size={14} color="#490E67" />
            <Text className="text-primary text-xs font-semibold">Edit</Text>
          </View>
        </Pressable>
        <Pressable onPress={onDelete} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <View className="border border-error rounded-lg py-1.5 items-center flex-row justify-center gap-1">
            <IconSymbol name="trash" size={14} color="#EF4444" />
            <Text className="text-error text-xs font-semibold">Delete</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Coverage Tab ─────────────────────────────────────────────────────────────
function CoverageTab({ selectedDate, colors }: { selectedDate: string; colors: ReturnType<typeof useColors> }) {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch, isRefetching } = trpc.coverage.getByDate.useQuery({ date: selectedDate });
  const createMutation = trpc.assignments.create.useMutation({ onSuccess: () => { utils.coverage.getByDate.invalidate(); setShowForm(false); resetForm(); } });
  const deleteMutation = trpc.assignments.delete.useMutation({ onSuccess: () => utils.coverage.getByDate.invalidate() });
  const updateMutation = trpc.assignments.update.useMutation({ onSuccess: () => { utils.coverage.getByDate.invalidate(); setEditingId(null); setShowForm(false); resetForm(); } });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    coveringStaffName: "", coveringFor: "", location: "",
    coverageReason: "subbing" as CoverageReason,
    timeSlot: "custom" as TimeSlot,
    customTimeStart: "", customTimeEnd: "", notes: "",
  });

  function resetForm() {
    setForm({ coveringStaffName: "", coveringFor: "", location: "", coverageReason: "subbing", timeSlot: "custom", customTimeStart: "", customTimeEnd: "", notes: "" });
  }

  function handleEdit(a: CoverageAssignment) {
    setEditingId(a.id);
    setForm({ coveringStaffName: a.coveringStaffName, coveringFor: a.coveringFor, location: a.location ?? "", coverageReason: a.coverageReason, timeSlot: a.timeSlot, customTimeStart: a.customTimeStart ?? "", customTimeEnd: a.customTimeEnd ?? "", notes: a.notes ?? "" });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.coveringStaffName.trim() || !form.coveringFor.trim()) return;
    const payload = {
      coverageDate: selectedDate,
      coveringStaffName: form.coveringStaffName.trim(),
      coveringFor: form.coveringFor.trim(),
      location: form.location.trim() || null,
      coverageReason: form.coverageReason,
      timeSlot: form.timeSlot,
      customTimeStart: form.customTimeStart || null,
      customTimeEnd: form.customTimeEnd || null,
      notes: form.notes.trim() || null,
    };
    if (editingId) { updateMutation.mutate({ id: editingId, data: payload }); }
    else { createMutation.mutate(payload); }
  }

  function handleDelete(id: number) {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this coverage assignment?")) deleteMutation.mutate({ id });
    } else {
      Alert.alert("Delete Coverage", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
      ]);
    }
  }

  const coverageList = data?.coverage ?? [];

  return (
    <View className="flex-1">
      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(i) => i.key}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={() => (
          <View className="px-4 py-4">
            <Pressable onPress={() => { resetForm(); setEditingId(null); setShowForm(!showForm); }} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <View className="bg-primary rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 mb-4">
                <IconSymbol name="plus" size={18} color="white" />
                <Text className="text-white font-semibold">Add Coverage</Text>
              </View>
            </Pressable>

            {showForm && (
              <CoverageForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingId(null); resetForm(); }} isLoading={createMutation.isPending || updateMutation.isPending} isEditing={!!editingId} />
            )}

            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : coverageList.length === 0 ? (
              <View className="bg-surface rounded-xl p-4 items-center border border-border">
                <Text className="text-muted text-sm">No coverage assignments for this date</Text>
              </View>
            ) : (
              coverageList.map((a) => (
                <AdminCoverageCard key={a.id} assignment={a} onEdit={() => handleEdit(a)} onDelete={() => handleDelete(a.id)} />
              ))
            )}
            <View className="h-8" />
          </View>
        )}
      />
    </View>
  );
}

function CoverageForm({ form, setForm, onSave, onCancel, isLoading, isEditing }: {
  form: { coveringStaffName: string; coveringFor: string; location: string; coverageReason: CoverageReason; timeSlot: TimeSlot; customTimeStart: string; customTimeEnd: string; notes: string };
  setForm: (f: typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEditing: boolean;
}) {
  const colors = useColors();
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
      <Text className="font-bold text-foreground mb-3">{isEditing ? "Edit Coverage" : "New Coverage"}</Text>

      <FormField label="Covering Staff *">
        <TextInput value={form.coveringStaffName} onChangeText={(v) => setForm({ ...form, coveringStaffName: v })} placeholder="Staff member covering" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
      </FormField>

      <FormField label="Covering For *">
        <TextInput value={form.coveringFor} onChangeText={(v) => setForm({ ...form, coveringFor: v })} placeholder="Who they're covering + duty" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
      </FormField>

      <FormField label="Location">
        <TextInput value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} placeholder="Room, hallway, etc." placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
      </FormField>

      <FormField label="Reason">
        <SegmentedControl
          options={[
            { label: "Subbing", value: "subbing" },
            { label: "IEP", value: "iep" },
            { label: "Absent", value: "absent" },
            { label: "Class Cov.", value: "class_coverage" },
            { label: "Other", value: "other" },
          ]}
          value={form.coverageReason}
          onChange={(v) => setForm({ ...form, coverageReason: v as CoverageReason })}
          wrap
        />
      </FormField>

      <FormField label="Time Slot">
        <SegmentedControl
          options={[
            { label: "Morning", value: "morning_duty" },
            { label: "Lunch", value: "lunch_duty" },
            { label: "Afternoon", value: "afternoon_duty" },
            { label: "All Day", value: "all_day" },
            { label: "Custom", value: "custom" },
          ]}
          value={form.timeSlot}
          onChange={(v) => setForm({ ...form, timeSlot: v as TimeSlot })}
          wrap
        />
      </FormField>

      {form.timeSlot === "custom" && (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <FormField label="Start">
              <TextInput value={form.customTimeStart} onChangeText={(v) => setForm({ ...form, customTimeStart: v })} placeholder="10:40 AM" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="End">
              <TextInput value={form.customTimeEnd} onChangeText={(v) => setForm({ ...form, customTimeEnd: v })} placeholder="11:05 AM" placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" />
            </FormField>
          </View>
        </View>
      )}

      <FormField label="Notes">
        <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Optional notes..." placeholderTextColor={colors.muted} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground" multiline numberOfLines={2} />
      </FormField>

      <View className="flex-row gap-2 mt-2">
        <Pressable onPress={onCancel} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <View className="border border-border rounded-xl py-3 items-center">
            <Text className="text-foreground font-semibold">Cancel</Text>
          </View>
        </Pressable>
        <Pressable onPress={onSave} disabled={isLoading} style={({ pressed }) => [{ flex: 1, opacity: pressed || isLoading ? 0.7 : 1 }]}>
          <View className="bg-primary rounded-xl py-3 items-center">
            {isLoading ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-semibold">{isEditing ? "Update" : "Save"}</Text>}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function AdminCoverageCard({ assignment, onEdit, onDelete }: { assignment: CoverageAssignment; onEdit: () => void; onDelete: () => void }) {
  return (
    <View className="bg-surface rounded-xl p-3.5 mb-2 border border-border">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="font-bold text-foreground">{assignment.coveringStaffName}</Text>
          <Text className="text-muted text-sm">Covering: {assignment.coveringFor}</Text>
          {assignment.location && <Text className="text-muted text-xs">{assignment.location}</Text>}
        </View>
        <View className="items-end gap-1">
          <TimeSlotBadge slot={assignment.timeSlot} />
          <CoverageReasonBadge reason={assignment.coverageReason} />
        </View>
      </View>
      <View className="flex-row gap-2 mt-2">
        <Pressable onPress={onEdit} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <View className="border border-primary rounded-lg py-1.5 items-center flex-row justify-center gap-1">
            <IconSymbol name="pencil" size={14} color="#490E67" />
            <Text className="text-primary text-xs font-semibold">Edit</Text>
          </View>
        </Pressable>
        <Pressable onPress={onDelete} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <View className="border border-error rounded-lg py-1.5 items-center flex-row justify-center gap-1">
            <IconSymbol name="trash" size={14} color="#EF4444" />
            <Text className="text-error text-xs font-semibold">Delete</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Notify Tab ───────────────────────────────────────────────────────────────
function NotifyTab({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "specific">("all");
  const [sent, setSent] = useState<{ success: number; fail: number; total: number } | null>(null);

  const sendMutation = trpc.notifications.send.useMutation({
    onSuccess: (result) => {
      setSent({ success: result.successCount, fail: result.failureCount, total: result.totalTargets });
      setTitle(""); setBody("");
    },
  });

  const { data: history } = trpc.notifications.history.useQuery();

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    sendMutation.mutate({ title: title.trim(), body: body.trim(), recipientType });
  }

  return (
    <ScrollView className="flex-1">
      <View className="px-4 py-4">
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <Text className="font-bold text-foreground mb-3">Send Push Notification</Text>

          <FormField label="Recipients">
            <SegmentedControl
              options={[{ label: "All Staff", value: "all" }, { label: "Specific", value: "specific" }]}
              value={recipientType}
              onChange={(v) => setRecipientType(v as "all" | "specific")}
            />
          </FormField>

          {recipientType === "specific" && (
            <View className="bg-warning/10 rounded-lg p-3 mb-3">
              <Text className="text-xs text-foreground">Specific recipient selection coming soon. Currently sends to all staff.</Text>
            </View>
          )}

          <FormField label="Title *">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Duty Change Alert"
              placeholderTextColor={colors.muted}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              maxLength={100}
            />
          </FormField>

          <FormField label="Message *">
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="e.g. Your lunch duty has been moved to 11:45 AM"
              placeholderTextColor={colors.muted}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </FormField>

          {sent && (
            <View className="bg-success/10 rounded-lg p-3 mb-3">
              <Text className="text-success font-semibold text-sm">
                Sent! {sent.success}/{sent.total} delivered
                {sent.fail > 0 ? `, ${sent.fail} failed` : ""}
              </Text>
            </View>
          )}

          <Pressable onPress={handleSend} disabled={sendMutation.isPending || !title.trim() || !body.trim()} style={({ pressed }) => [{ opacity: pressed || sendMutation.isPending ? 0.7 : 1 }]}>
            <View className="bg-primary rounded-xl py-3 flex-row items-center justify-center gap-2">
              {sendMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <IconSymbol name="paperplane.fill" size={16} color="white" />
                  <Text className="text-white font-semibold">Send Notification</Text>
                </>
              )}
            </View>
          </Pressable>
        </View>

        {/* Notification History */}
        {history && history.length > 0 && (
          <View>
            <Text className="font-bold text-foreground mb-2">Recent Notifications</Text>
            {history.slice(0, 10).map((log) => (
              <View key={log.id} className="bg-surface rounded-xl p-3 mb-2 border border-border">
                <Text className="font-semibold text-foreground text-sm">{log.title}</Text>
                <Text className="text-muted text-xs mt-0.5" numberOfLines={2}>{log.body}</Text>
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-muted text-xs">
                    {new Date(log.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text className="text-success text-xs">{log.successCount} sent</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View className="h-8" />
      </View>
    </ScrollView>
  );
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────
function StaffTab({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { data: staff, isLoading } = trpc.staff.list.useQuery();

  return (
    <View className="flex-1">
      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(i) => i.key}
        renderItem={() => (
          <View className="px-4 py-4">
            <Text className="font-bold text-foreground mb-3">
              Registered Staff ({staff?.length ?? 0})
            </Text>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : !staff || staff.length === 0 ? (
              <View className="bg-surface rounded-xl p-4 items-center border border-border">
                <Text className="text-muted text-sm">No staff members registered yet</Text>
              </View>
            ) : (
              staff.map((member) => (
                <View key={member.id} className="bg-surface rounded-xl p-3.5 mb-2 border border-border flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-primary font-bold text-base">
                      {(member.name ?? member.email ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{member.name ?? "Unknown"}</Text>
                    <Text className="text-muted text-xs">{member.email ?? ""}</Text>
                  </View>
                  <View className={`rounded-full px-2 py-0.5 ${member.role === "admin" ? "bg-primary/10" : "bg-muted/20"}`}>
                    <Text className={`text-xs font-semibold ${member.role === "admin" ? "text-primary" : "text-muted"}`}>
                      {member.role === "admin" ? "Admin" : "Staff"}
                    </Text>
                  </View>
                </View>
              ))
            )}
            <View className="h-8" />
          </View>
        )}
      />
    </View>
  );
}

// ─── Shared Form Components ───────────────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl({
  options, value, onChange, wrap = false,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <View className={`${wrap ? "flex-row flex-wrap gap-1" : "flex-row"} bg-background border border-border rounded-lg p-1 gap-0.5`}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flex: wrap ? undefined : 1 }]}
        >
          <View className={`rounded-md py-1.5 px-2 items-center ${value === opt.value ? "bg-primary" : ""}`}>
            <Text className={`text-xs font-semibold ${value === opt.value ? "text-white" : "text-muted"}`}>
              {opt.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
