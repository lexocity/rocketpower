/**
 * Bulk Entry Screen — Web Only
 * Spreadsheet-style grid for entering multiple absences and coverage assignments at once.
 * Hidden on mobile (admin uses the Admin tab form instead).
 */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = "all_day" | "morning" | "afternoon" | "custom";
type SubStatus = "assigned" | "no_sub" | "new_sub" | "split";
type AbsenceType = "sick" | "personal" | "educational" | "other" | "unknown";
type CoverageReason = "subbing" | "iep" | "absent" | "class_coverage" | "other";
type TimeSlot = "morning_duty" | "lunch_duty" | "afternoon_duty" | "custom" | "all_day";

interface AbsenceRow {
  _id: string; // local key only
  staffName: string;
  timeRange: TimeRange;
  customTimeStart: string;
  customTimeEnd: string;
  subName: string;
  subStatus: SubStatus;
  isOAM: boolean;
  absenceType: AbsenceType;
  employeeNumber: string;
  subNumber: string;
  notes: string;
}

interface CoverageRow {
  _id: string;
  coveringStaffName: string;
  coveringFor: string;
  location: string;
  coverageReason: CoverageReason;
  timeSlot: TimeSlot;
  customTimeStart: string;
  customTimeEnd: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 0;
function uid() { return `r${++_uid}`; }

function formatDate(d: Date) { return d.toISOString().split("T")[0]; }
function formatDateHeader(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const emptyAbsence = (): AbsenceRow => ({
  _id: uid(), staffName: "", timeRange: "all_day", customTimeStart: "", customTimeEnd: "",
  subName: "", subStatus: "assigned", isOAM: false, absenceType: "unknown",
  employeeNumber: "", subNumber: "", notes: "",
});

const emptyCoverage = (): CoverageRow => ({
  _id: uid(), coveringStaffName: "", coveringFor: "", location: "",
  coverageReason: "subbing", timeSlot: "morning_duty",
  customTimeStart: "", customTimeEnd: "", notes: "",
});

// ─── Dropdown component (web select) ─────────────────────────────────────────

function Dropdown<T extends string>({
  value, onChange, options, width = 140,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; width?: number }) {
  if (Platform.OS !== "web") return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{
        width, height: 32, fontSize: 12, borderRadius: 6,
        border: "1px solid #E5E7EB", padding: "0 6px",
        background: "white", color: "#11181C", cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Cell({ children, width, flex }: { children: React.ReactNode; width?: number; flex?: number }) {
  return (
    <View style={{ width, flex, paddingHorizontal: 4, justifyContent: "center" }}>
      {children}
    </View>
  );
}

function HeaderCell({ label, width, flex }: { label: string; width?: number; flex?: number }) {
  return (
    <Cell width={width} flex={flex}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#687076", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </Cell>
  );
}

function GridInput({
  value, onChange, placeholder, width, flex,
}: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number; flex?: number }) {
  return (
    <Cell width={width} flex={flex}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#9BA1A6"
        style={{
          height: 32, fontSize: 12, borderRadius: 6,
          borderWidth: 1, borderColor: "#E5E7EB",
          paddingHorizontal: 8, color: "#11181C", backgroundColor: "white",
        }}
      />
    </Cell>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BulkEntryScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [activeTab, setActiveTab] = useState<"absences" | "coverage">("absences");
  const [absenceRows, setAbsenceRows] = useState<AbsenceRow[]>([emptyAbsence()]);
  const [coverageRows, setCoverageRows] = useState<CoverageRow[]>([emptyCoverage()]);
  const [savedMsg, setSavedMsg] = useState("");

  // Load existing data for the selected date
  const { data, isLoading } = trpc.coverage.getByDate.useQuery({ date: selectedDate });

  // Fetch staff duty names for auto-fill
  const { data: dutyStaffNames = [] } = trpc.duties.staffNames.useQuery();
  const { data: allDuties = [] } = trpc.duties.list.useQuery({});

  useEffect(() => {
    if (!data) return;
    if (data.absences.length > 0) {
      setAbsenceRows(data.absences.map((a) => ({
        _id: uid(),
        staffName: a.staffName,
        timeRange: a.timeRange as TimeRange,
        customTimeStart: a.customTimeStart ?? "",
        customTimeEnd: a.customTimeEnd ?? "",
        subName: a.subName ?? "",
        subStatus: a.subStatus as SubStatus,
        isOAM: a.isOAM,
        absenceType: a.absenceType as AbsenceType,
        employeeNumber: a.employeeNumber ?? "",
        subNumber: a.subNumber ?? "",
        notes: a.notes ?? "",
      })));
    } else {
      setAbsenceRows([emptyAbsence()]);
    }
    if (data.coverage.length > 0) {
      setCoverageRows(data.coverage.map((c) => ({
        _id: uid(),
        coveringStaffName: c.coveringStaffName,
        coveringFor: c.coveringFor,
        location: c.location ?? "",
        coverageReason: c.coverageReason as CoverageReason,
        timeSlot: c.timeSlot as TimeSlot,
        customTimeStart: c.customTimeStart ?? "",
        customTimeEnd: c.customTimeEnd ?? "",
        notes: c.notes ?? "",
      })));
    } else {
      setCoverageRows([emptyCoverage()]);
    }
  }, [data]);

  const bulkSaveAbsences = trpc.absences.bulkSave.useMutation({
    onSuccess: () => {
      utils.coverage.getByDate.invalidate({ date: selectedDate });
      showSaved("Absences saved!");
    },
  });

  const bulkSaveCoverage = trpc.assignments.bulkSave.useMutation({
    onSuccess: () => {
      utils.coverage.getByDate.invalidate({ date: selectedDate });
      showSaved("Coverage saved!");
    },
  });

  function showSaved(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(""), 2500);
  }

  function shiftDate(days: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    setSelectedDate(formatDate(new Date(y, m - 1, d + days)));
  }

  // Auto-fill coverage duties when coveringFor staff name changes
  function autofillCoverageFromRoster(rowId: string, staffName: string) {
    const duties = allDuties.filter((d) =>
      d.staffName.toLowerCase() === staffName.toLowerCase()
    );
    if (duties.length === 0) return;
    const first = duties[0];
    setCoverageRows((rows) =>
      rows.map((r) =>
        r._id === rowId
          ? {
              ...r,
              coveringFor: staffName,
              location: first.location ?? first.dutyLabel ?? r.location,
              timeSlot: mapDutyTypeToSlot(first.dutyType),
              customTimeStart: first.timeStart ?? r.customTimeStart,
              customTimeEnd: first.timeEnd ?? r.customTimeEnd,
            }
          : r
      )
    );
  }

  function mapDutyTypeToSlot(dt: string): TimeSlot {
    if (dt === "morning_duty" || dt === "carpool") return "morning_duty";
    if (dt === "lunch_duty") return "lunch_duty";
    if (dt === "afternoon_duty") return "afternoon_duty";
    return "custom";
  }

  function handleSaveAbsences() {
    const validRows = absenceRows.filter((r) => r.staffName.trim() !== "");
    bulkSaveAbsences.mutate({
      date: selectedDate,
      rows: validRows.map((r) => ({
        coverageDate: selectedDate,
        staffName: r.staffName.trim(),
        timeRange: r.timeRange,
        customTimeStart: r.customTimeStart || null,
        customTimeEnd: r.customTimeEnd || null,
        subName: r.subName || null,
        subStatus: r.subStatus,
        isOAM: r.isOAM,
        absenceType: r.absenceType,
        employeeNumber: r.employeeNumber || null,
        subNumber: r.subNumber || null,
        notes: r.notes || null,
      })),
    });
  }

  function handleSaveCoverage() {
    const validRows = coverageRows.filter((r) => r.coveringStaffName.trim() !== "" && r.coveringFor.trim() !== "");
    bulkSaveCoverage.mutate({
      date: selectedDate,
      rows: validRows.map((r) => ({
        coverageDate: selectedDate,
        coveringStaffName: r.coveringStaffName.trim(),
        coveringFor: r.coveringFor.trim(),
        location: r.location || null,
        coverageReason: r.coverageReason,
        timeSlot: r.timeSlot,
        customTimeStart: r.customTimeStart || null,
        customTimeEnd: r.customTimeEnd || null,
        notes: r.notes || null,
      })),
    });
  }

  const isSaving = bulkSaveAbsences.isPending || bulkSaveCoverage.isPending;

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "white", letterSpacing: -0.5 }}>Bulk Entry</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>Spreadsheet-style daily data entry</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -12, overflow: "hidden" }}>
        {/* Date Navigator */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
          <Pressable onPress={() => shiftDate(-1)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontWeight: "700", fontSize: 15, color: colors.foreground }}>{formatDateHeader(selectedDate)}</Text>
            {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />}
          </View>
          <Pressable onPress={() => shiftDate(1)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <IconSymbol name="chevron.right" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
          {(["absences", "coverage"] as const).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <View style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: activeTab === tab ? colors.primary : "#F5F5F5",
              }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === tab ? "white" : colors.muted }}>
                  {tab === "absences" ? "Out of Building" : "Coverage Assignments"}
                </Text>
              </View>
            </Pressable>
          ))}
          {savedMsg ? (
            <View style={{ marginLeft: "auto", backgroundColor: "#22C55E20", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center" }}>
              <Text style={{ color: "#16A34A", fontSize: 12, fontWeight: "700" }}>✓ {savedMsg}</Text>
            </View>
          ) : null}
        </View>

        {/* Grid */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {activeTab === "absences" ? (
            <AbsencesGrid
              rows={absenceRows}
              onChange={setAbsenceRows}
              colors={colors}
            />
          ) : (
            <CoverageGrid
              rows={coverageRows}
              onChange={setCoverageRows}
              dutyStaffNames={dutyStaffNames}
              onCoveringForBlur={autofillCoverageFromRoster}
              colors={colors}
            />
          )}

          {/* Action Row */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            <Pressable
              onPress={() => activeTab === "absences"
                ? setAbsenceRows((r) => [...r, emptyAbsence()])
                : setCoverageRows((r) => [...r, emptyCoverage()])
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
            >
              <View style={{ borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed", borderRadius: 10, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                <IconSymbol name="plus" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Add Row</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={activeTab === "absences" ? handleSaveAbsences : handleSaveCoverage}
              disabled={isSaving}
              style={({ pressed }) => [{ opacity: pressed || isSaving ? 0.7 : 1, flex: 2 }]}
            >
              <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                {isSaving
                  ? <ActivityIndicator color="white" size="small" />
                  : <>
                      <IconSymbol name="checkmark" size={16} color="white" />
                      <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Save All Rows</Text>
                    </>
                }
              </View>
            </Pressable>
          </View>
          <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 8 }}>
            Saving replaces all {activeTab === "absences" ? "absences" : "coverage assignments"} for this date.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ─── Absences Grid ────────────────────────────────────────────────────────────

function AbsencesGrid({ rows, onChange, colors }: {
  rows: AbsenceRow[];
  onChange: React.Dispatch<React.SetStateAction<AbsenceRow[]>>;
  colors: ReturnType<typeof useColors>;
}) {
  function update(id: string, field: keyof AbsenceRow, value: any) {
    onChange((rows) => rows.map((r) => r._id === id ? { ...r, [field]: value } : r));
  }
  function removeRow(id: string) {
    onChange((rows) => rows.filter((r) => r._id !== id));
  }

  const ROW_H = 40;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        {/* Header */}
        <View style={{ flexDirection: "row", height: 36, alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 8, marginBottom: 4, paddingHorizontal: 4 }}>
          <HeaderCell label="Staff Name" flex={1} />
          <HeaderCell label="When" width={150} />
          <HeaderCell label="Sub Name" width={130} />
          <HeaderCell label="Sub Status" width={130} />
          <HeaderCell label="Type" width={130} />
          <HeaderCell label="Emp #" width={90} />
          <HeaderCell label="Sub #" width={90} />
          <HeaderCell label="OAM" width={50} />
          <HeaderCell label="Notes" width={160} />
          <View style={{ width: 32 }} />
        </View>

        {/* Rows */}
        {rows.map((row, idx) => (
          <View key={row._id} style={{
            flexDirection: "row", height: ROW_H, alignItems: "center",
            backgroundColor: idx % 2 === 0 ? "white" : "#FAFAFA",
            borderRadius: 6, marginBottom: 2, paddingHorizontal: 4,
            borderWidth: 1, borderColor: "#F0F0F0",
          }}>
            <GridInput value={row.staffName} onChange={(v) => update(row._id, "staffName", v)} placeholder="Last name" flex={1} />
            <Cell width={150}>
              <Dropdown<TimeRange>
                value={row.timeRange}
                onChange={(v) => update(row._id, "timeRange", v)}
                options={[
                  { value: "all_day", label: "All Day" },
                  { value: "morning", label: "8:30 AM – 12:30 PM" },
                  { value: "afternoon", label: "12:30 PM – 4:30 PM" },
                  { value: "custom", label: "Custom..." },
                ]}
                width={142}
              />
            </Cell>
            <GridInput value={row.subName} onChange={(v) => update(row._id, "subName", v)} placeholder="Sub name" width={130} />
            <Cell width={130}>
              <Dropdown<SubStatus>
                value={row.subStatus}
                onChange={(v) => update(row._id, "subStatus", v)}
                options={[
                  { value: "assigned", label: "Assigned" },
                  { value: "no_sub", label: "No Sub" },
                  { value: "new_sub", label: "New Sub?" },
                  { value: "split", label: "Split" },
                ]}
                width={122}
              />
            </Cell>
            <Cell width={130}>
              <Dropdown<AbsenceType>
                value={row.absenceType}
                onChange={(v) => update(row._id, "absenceType", v)}
                options={[
                  { value: "unknown", label: "—" },
                  { value: "sick", label: "Sick" },
                  { value: "personal", label: "Personal" },
                  { value: "educational", label: "Educational" },
                  { value: "other", label: "Other" },
                ]}
                width={122}
              />
            </Cell>
            <GridInput value={row.employeeNumber} onChange={(v) => update(row._id, "employeeNumber", v)} placeholder="000000" width={90} />
            <GridInput value={row.subNumber} onChange={(v) => update(row._id, "subNumber", v)} placeholder="000000" width={90} />
            <Cell width={50}>
              {Platform.OS === "web" && (
                <input
                  type="checkbox"
                  checked={row.isOAM}
                  onChange={(e) => update(row._id, "isOAM", e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#490E67" }}
                />
              )}
            </Cell>
            <GridInput value={row.notes} onChange={(v) => update(row._id, "notes", v)} placeholder="Notes..." width={160} />
            <Pressable onPress={() => removeRow(row._id)} style={({ pressed }) => [{ width: 32, alignItems: "center", opacity: pressed ? 0.5 : 1 }]}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Coverage Grid ────────────────────────────────────────────────────────────

function CoverageGrid({ rows, onChange, dutyStaffNames, onCoveringForBlur, colors }: {
  rows: CoverageRow[];
  onChange: React.Dispatch<React.SetStateAction<CoverageRow[]>>;
  dutyStaffNames: string[];
  onCoveringForBlur: (rowId: string, name: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  function update(id: string, field: keyof CoverageRow, value: any) {
    onChange((rows) => rows.map((r) => r._id === id ? { ...r, [field]: value } : r));
  }
  function removeRow(id: string) {
    onChange((rows) => rows.filter((r) => r._id !== id));
  }

  const ROW_H = 40;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        {/* Header */}
        <View style={{ flexDirection: "row", height: 36, alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 8, marginBottom: 4, paddingHorizontal: 4 }}>
          <HeaderCell label="Covering Staff" flex={1} />
          <HeaderCell label="Covering For" flex={1} />
          <HeaderCell label="Location / Duty" width={180} />
          <HeaderCell label="Reason" width={140} />
          <HeaderCell label="Time Slot" width={150} />
          <HeaderCell label="Notes" width={160} />
          <View style={{ width: 32 }} />
        </View>

        {/* Rows */}
        {rows.map((row, idx) => (
          <View key={row._id} style={{
            flexDirection: "row", height: ROW_H, alignItems: "center",
            backgroundColor: idx % 2 === 0 ? "white" : "#FAFAFA",
            borderRadius: 6, marginBottom: 2, paddingHorizontal: 4,
            borderWidth: 1, borderColor: "#F0F0F0",
          }}>
            <GridInput value={row.coveringStaffName} onChange={(v) => update(row._id, "coveringStaffName", v)} placeholder="Who is covering" flex={1} />
            <Cell flex={1}>
              {/* Covering For: blur triggers duty auto-fill */}
              {Platform.OS === "web" ? (
                <input
                  value={row.coveringFor}
                  onChange={(e) => update(row._id, "coveringFor", e.target.value)}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name) onCoveringForBlur(row._id, name);
                  }}
                  placeholder="Who they cover"
                  list={`staff-list-${row._id}`}
                  style={{
                    height: 32, fontSize: 12, borderRadius: 6,
                    border: "1px solid #E5E7EB", padding: "0 8px",
                    color: "#11181C", backgroundColor: "white", width: "100%",
                    outline: "none",
                  }}
                />
              ) : (
                <TextInput
                  value={row.coveringFor}
                  onChangeText={(v) => update(row._id, "coveringFor", v)}
                  onBlur={() => { if (row.coveringFor.trim()) onCoveringForBlur(row._id, row.coveringFor.trim()); }}
                  placeholder="Who they cover"
                  placeholderTextColor="#9BA1A6"
                  style={{ height: 32, fontSize: 12, borderRadius: 6, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 8, color: "#11181C", backgroundColor: "white" }}
                />
              )}
              {/* Datalist for autocomplete */}
              {Platform.OS === "web" && (
                <datalist id={`staff-list-${row._id}`}>
                  {dutyStaffNames.map((n) => <option key={n} value={n} />)}
                </datalist>
              )}
            </Cell>
            <GridInput value={row.location} onChange={(v) => update(row._id, "location", v)} placeholder="Location / duty name" width={180} />
            <Cell width={140}>
              <Dropdown<CoverageReason>
                value={row.coverageReason}
                onChange={(v) => update(row._id, "coverageReason", v)}
                options={[
                  { value: "subbing", label: "Subbing" },
                  { value: "iep", label: "IEP" },
                  { value: "absent", label: "Absent" },
                  { value: "class_coverage", label: "Class Cov." },
                  { value: "other", label: "Other" },
                ]}
                width={132}
              />
            </Cell>
            <Cell width={150}>
              <Dropdown<TimeSlot>
                value={row.timeSlot}
                onChange={(v) => update(row._id, "timeSlot", v)}
                options={[
                  { value: "morning_duty", label: "Morning Duty" },
                  { value: "lunch_duty", label: "Lunch Duty" },
                  { value: "afternoon_duty", label: "Afternoon Duty" },
                  { value: "all_day", label: "All Day" },
                  { value: "custom", label: "Custom Time" },
                ]}
                width={142}
              />
            </Cell>
            <GridInput value={row.notes} onChange={(v) => update(row._id, "notes", v)} placeholder="Notes..." width={160} />
            <Pressable onPress={() => removeRow(row._id)} style={({ pressed }) => [{ width: 32, alignItems: "center", opacity: pressed ? 0.5 : 1 }]}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
