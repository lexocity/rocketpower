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

type RecipientMode = "all" | "specific";

export default function NotifyScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { data: staffList = [] } = trpc.staff.list.useQuery();
  const { data: history = [] } = trpc.notifications.history.useQuery();

  const sendMutation = trpc.notifications.send.useMutation({
    onSuccess: (result) => {
      utils.notifications.history.invalidate();
      const msg = result.totalTargets === 0
        ? "No users have push notifications enabled yet."
        : `Sent to ${result.successCount} of ${result.totalTargets} recipients.`;
      if (Platform.OS === "web") {
        window.alert(`Notification sent!\n${msg}`);
      } else {
        Alert.alert("Notification Sent!", msg);
      }
      setTitle("");
      setBody("");
      setSelectedIds([]);
      setRecipientMode("all");
    },
    onError: (err) => {
      const msg = err.message || "Failed to send notification.";
      if (Platform.OS === "web") {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert("Error", msg);
      }
    },
  });

  function toggleRecipient(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSend() {
    if (!title.trim()) {
      const msg = "Please enter a notification title.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Missing Title", msg);
      return;
    }
    if (!body.trim()) {
      const msg = "Please enter a notification message.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Missing Message", msg);
      return;
    }
    if (recipientMode === "specific" && selectedIds.length === 0) {
      const msg = "Please select at least one recipient.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("No Recipients", msg);
      return;
    }

    sendMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      recipientType: recipientMode,
      recipientIds: recipientMode === "specific" ? selectedIds : undefined,
    });
  }

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white tracking-tight">Send Notification</Text>
        <Text className="text-white/70 text-sm mt-0.5">Alert staff about duty changes</Text>
      </View>

      {/* Content */}
      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="px-4 py-4 max-w-2xl self-center w-full">

            {/* Compose Card */}
            <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Compose Message</Text>

              <View className="mb-3">
                <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Duty Change Alert"
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                  returnKeyType="next"
                  maxLength={100}
                />
                <Text className="text-xs text-muted mt-1 text-right">{title.length}/100</Text>
              </View>

              <View className="mb-1">
                <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Message *</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="e.g., Your morning duty assignment has changed. Please check the coverage board."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={4}
                  className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                  maxLength={500}
                />
                <Text className="text-xs text-muted mt-1 text-right">{body.length}/500</Text>
              </View>
            </View>

            {/* Recipients Card */}
            <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Recipients</Text>

              <View className="flex-row gap-2 mb-3">
                <RecipientModeButton
                  label="All Staff"
                  icon="person.3.fill"
                  active={recipientMode === "all"}
                  onPress={() => { setRecipientMode("all"); setSelectedIds([]); }}
                />
                <RecipientModeButton
                  label="Specific Staff"
                  icon="person.fill"
                  active={recipientMode === "specific"}
                  onPress={() => setRecipientMode("specific")}
                />
              </View>

              {recipientMode === "specific" && (
                <View>
                  <Text className="text-xs text-muted mb-2">
                    Select staff members to notify ({selectedIds.length} selected)
                  </Text>
                  {staffList.length === 0 ? (
                    <Text className="text-muted text-sm text-center py-4">No staff accounts yet</Text>
                  ) : (
                    staffList.map((staff) => (
                      <Pressable
                        key={staff.id}
                        onPress={() => toggleRecipient(staff.id)}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View className={`flex-row items-center gap-3 p-3 rounded-xl mb-1.5 border ${
                          selectedIds.includes(staff.id)
                            ? "bg-primary/10 border-primary/30"
                            : "bg-background border-border"
                        }`}>
                          <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                            selectedIds.includes(staff.id) ? "bg-primary border-primary" : "border-border"
                          }`}>
                            {selectedIds.includes(staff.id) && (
                              <IconSymbol name="checkmark" size={12} color="white" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="font-semibold text-foreground text-sm">{staff.name ?? staff.email}</Text>
                            {staff.name && <Text className="text-muted text-xs">{staff.email}</Text>}
                          </View>
                          {staff.expoPushToken ? (
                            <View className="bg-success/10 rounded-full px-2 py-0.5">
                              <Text className="text-success text-xs font-medium">Notifications On</Text>
                            </View>
                          ) : (
                            <View className="bg-muted/10 rounded-full px-2 py-0.5">
                              <Text className="text-muted text-xs">No Token</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Send Button */}
            <Pressable
              onPress={handleSend}
              disabled={sendMutation.isPending}
              style={({ pressed }) => [{ opacity: pressed || sendMutation.isPending ? 0.7 : 1 }]}
            >
              <View className="bg-secondary rounded-2xl py-4 items-center flex-row justify-center gap-2">
                {sendMutation.isPending ? (
                  <ActivityIndicator color="#490E67" size="small" />
                ) : (
                  <>
                    <IconSymbol name="paperplane.fill" size={20} color="#490E67" />
                    <Text className="text-primary font-bold text-base">
                      Send Notification
                      {recipientMode === "specific" && selectedIds.length > 0
                        ? ` to ${selectedIds.length} Staff`
                        : recipientMode === "all" ? " to All Staff" : ""}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>

            {/* Notification History */}
            <View className="mt-6">
              <Pressable
                onPress={() => setShowHistory((v) => !v)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest">
                    Recent Notifications
                  </Text>
                  <IconSymbol
                    name={showHistory ? "chevron.down" : "chevron.right"}
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>

              {showHistory && (
                history.length === 0 ? (
                  <View className="bg-surface rounded-xl p-4 items-center border border-border">
                    <Text className="text-muted text-sm">No notifications sent yet</Text>
                  </View>
                ) : (
                  history.map((item) => (
                    <View key={item.id} className="bg-surface rounded-xl p-3 mb-2 border border-border">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text className="font-semibold text-foreground text-sm flex-1 mr-2">{item.title}</Text>
                        <Text className="text-muted text-xs">
                          {new Date(item.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                      </View>
                      <Text className="text-muted text-xs mb-1.5" numberOfLines={2}>{item.body}</Text>
                      <View className="flex-row gap-3">
                        <Text className="text-success text-xs">✓ {item.successCount} sent</Text>
                        {item.failureCount > 0 && (
                          <Text className="text-error text-xs">✗ {item.failureCount} failed</Text>
                        )}
                        <Text className="text-muted text-xs">
                          {item.recipientType === "all" ? "All staff" : "Specific staff"}
                        </Text>
                      </View>
                    </View>
                  ))
                )
              )}
            </View>

            <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

function RecipientModeButton({
  label, icon, active, onPress,
}: {
  label: string;
  icon: "person.3.fill" | "person.fill";
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
    >
      <View className={`flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl border ${
        active ? "bg-primary border-primary" : "bg-background border-border"
      }`}>
        <IconSymbol name={icon} size={16} color={active ? "white" : colors.muted} />
        <Text className={`text-sm font-semibold ${active ? "text-white" : "text-muted"}`}>{label}</Text>
      </View>
    </Pressable>
  );
}
