import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type AuthView = "login" | "register" | "pending";

export default function SettingsScreen() {
  const colors = useColors();
  const { user, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  const updatePushTokenMutation = trpc.staff.updatePushToken.useMutation();

  // Register push notifications
  async function registerForPushNotifications() {
    if (Platform.OS === "web") {
      Alert.alert("Push Notifications", "Push notifications are only available on the mobile app.");
      return;
    }
    setRegisteringPush(true);
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert("Permission Required", "Please enable notifications in your device settings.");
        return;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync();
      await updatePushTokenMutation.mutateAsync({ token: tokenData.data });
      setPushEnabled(true);
      Alert.alert("Notifications Enabled", "You'll now receive alerts when your duties change.");
    } catch (err) {
      console.error("[Push] Registration failed:", err);
      Alert.alert("Error", "Failed to enable push notifications. Please try again.");
    } finally {
      setRegisteringPush(false);
    }
  }

  async function disablePushNotifications() {
    try {
      await updatePushTokenMutation.mutateAsync({ token: null });
      setPushEnabled(false);
    } catch (err) {
      console.error("[Push] Disable failed:", err);
    }
  }

  useEffect(() => {
    if (Platform.OS !== "web") {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log("[Notification received]", notification);
      });
      return () => { notificationListener.current?.remove(); };
    }
  }, []);

  async function handleLogout() {
    const doLogout = () => { logout(); utils.auth.me.invalidate(); };
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of RocketPower?")) doLogout();
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]);
    }
  }

  const meData = trpc.auth.me.useQuery();
  const dbRole = (meData.data as { role?: string } | null | undefined)?.role;
  const isAdmin = dbRole === "admin";

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white tracking-tight">Settings</Text>
        <Text className="text-white/70 text-sm mt-0.5">RocketPower · Rogers Lane ES</Text>
      </View>

      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="px-4 py-4 max-w-2xl self-center w-full">

            {/* Account Section */}
            {isAuthenticated ? (
              <View className="mb-6">
                <SectionLabel label="Account" />
                <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <View className="p-4 flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                      <Text className="text-primary font-bold text-xl">
                        {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-foreground text-base">{user?.name ?? "Unknown"}</Text>
                      <Text className="text-muted text-sm">{user?.email ?? ""}</Text>
                      <View className={`self-start mt-1 px-2 py-0.5 rounded-full ${isAdmin ? "bg-secondary/20" : "bg-primary/10"}`}>
                        <Text className={`text-xs font-semibold ${isAdmin ? "text-primary" : "text-primary"}`}>
                          {isAdmin ? "Admin" : "Staff"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="h-px bg-border" />
                  <Pressable onPress={handleLogout} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                    <View className="p-4 flex-row items-center gap-3">
                      <IconSymbol name="arrow.right" size={20} color={colors.error} />
                      <Text className="text-error font-semibold">Sign Out</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <SectionLabel label="Account" />
                <AuthCard />
              </View>
            )}

            {/* Notifications Section */}
            {isAuthenticated && Platform.OS !== "web" && (
              <View className="mb-6">
                <SectionLabel label="Notifications" />
                <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <View className="p-4 flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="font-semibold text-foreground">Duty Change Alerts</Text>
                      <Text className="text-muted text-xs mt-0.5">
                        Get notified when your coverage assignments change
                      </Text>
                    </View>
                    <Pressable
                      onPress={pushEnabled ? disablePushNotifications : registerForPushNotifications}
                      disabled={registeringPush}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      {registeringPush ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <View className={`w-14 h-7 rounded-full ${pushEnabled ? "bg-primary" : "bg-border"} justify-center px-0.5`}>
                          <View className={`w-6 h-6 rounded-full bg-white shadow-sm ${pushEnabled ? "self-end" : "self-start"}`} />
                        </View>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Admin: Pending Approvals */}
            {isAdmin && <PendingApprovalsSection />}

            {/* Admin: Staff Roster */}
            {isAdmin && <StaffRosterSection />}

            {/* App Info */}
            <View className="mb-6">
              <SectionLabel label="About" />
              <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                <InfoRow label="App" value="RocketPower" />
                <View className="h-px bg-border" />
                <InfoRow label="School" value="Rogers Lane Elementary" />
                <View className="h-px bg-border" />
                <InfoRow label="Version" value="1.0.0" />
              </View>
            </View>

            <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ─── Pending Approvals (Admin) ────────────────────────────────────────────────
function PendingApprovalsSection() {
  const utils = trpc.useUtils();
  const { data: pending = [], isLoading } = trpc.staff.pending.useQuery();
  const approveMutation = trpc.staff.approve.useMutation({
    onSuccess: () => utils.staff.pending.invalidate(),
  });

  if (isLoading) return null;

  return (
    <View className="mb-6">
      <SectionLabel label={`Pending Approvals${pending.length > 0 ? ` (${pending.length})` : ""}`} />
      {pending.length === 0 ? (
        <View className="bg-surface rounded-2xl border border-border p-4 items-center">
          <Text className="text-muted text-sm">No pending account requests</Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          {pending.map((staff, idx) => (
            <View key={staff.id}>
              {idx > 0 && <View className="h-px bg-border" />}
              <View className="p-4">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-foreground">{staff.name ?? "Unknown"}</Text>
                    <Text className="text-muted text-xs">{staff.email}</Text>
                    <Text className="text-muted text-xs mt-0.5">
                      Requested {new Date(staff.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                  </View>
                  <View className="bg-warning/10 rounded-full px-2 py-0.5">
                    <Text className="text-warning text-xs font-semibold">Pending</Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => approveMutation.mutate({ userId: staff.id, status: "approved" })}
                    disabled={approveMutation.isPending}
                    style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View className="bg-success/10 border border-success/30 rounded-xl py-2 items-center">
                      <Text className="text-success font-semibold text-sm">Approve</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => approveMutation.mutate({ userId: staff.id, status: "rejected" })}
                    disabled={approveMutation.isPending}
                    style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View className="bg-error/10 border border-error/30 rounded-xl py-2 items-center">
                      <Text className="text-error font-semibold text-sm">Reject</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Staff Roster (Admin) ─────────────────────────────────────────────────────
function StaffRosterSection() {
  const utils = trpc.useUtils();
  const { data: staff = [], isLoading } = trpc.staff.list.useQuery();
  const setRoleMutation = trpc.staff.setRole.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });
  const approveMutation = trpc.staff.approve.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });

  const approvedStaff = staff.filter((s) => s.accountStatus === "approved");

  return (
    <View className="mb-6">
      <SectionLabel label={`Staff Roster (${approvedStaff.length})`} />
      {isLoading ? (
        <View className="bg-surface rounded-2xl border border-border p-4 items-center">
          <ActivityIndicator />
        </View>
      ) : approvedStaff.length === 0 ? (
        <View className="bg-surface rounded-2xl border border-border p-4 items-center">
          <Text className="text-muted text-sm">No approved staff accounts yet</Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          {approvedStaff.map((member, idx) => (
            <View key={member.id}>
              {idx > 0 && <View className="h-px bg-border" />}
              <View className="p-4 flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-primary font-bold">
                    {(member.name ?? member.email ?? "?")[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground text-sm">{member.name ?? member.email}</Text>
                  {member.name && <Text className="text-muted text-xs">{member.email}</Text>}
                </View>
                <View className="flex-row gap-1.5 items-center">
                  {member.expoPushToken && (
                    <View className="bg-success/10 rounded-full w-5 h-5 items-center justify-center">
                      <IconSymbol name="bell.fill" size={10} color="#22C55E" />
                    </View>
                  )}
                  <Pressable
                    onPress={() => setRoleMutation.mutate({
                      userId: member.id,
                      role: member.role === "admin" ? "user" : "admin",
                    })}
                    disabled={setRoleMutation.isPending}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View className={`px-2 py-0.5 rounded-full ${member.role === "admin" ? "bg-secondary/20" : "bg-border"}`}>
                      <Text className={`text-xs font-semibold ${member.role === "admin" ? "text-primary" : "text-muted"}`}>
                        {member.role === "admin" ? "Admin" : "Staff"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Auth Card (Login / Register / Pending) ───────────────────────────────────
function AuthCard() {
  const [view, setView] = useState<AuthView>("login");

  if (view === "pending") {
    return <PendingCard onBackToLogin={() => setView("login")} />;
  }
  if (view === "register") {
    return <RegisterCard onBackToLogin={() => setView("login")} onPending={() => setView("pending")} />;
  }
  return <LoginCard onRegister={() => setView("register")} onPending={() => setView("pending")} />;
}

// ─── Login Card ───────────────────────────────────────────────────────────────
function LoginCard({ onRegister, onPending }: { onRegister: () => void; onPending: () => void }) {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "pending") {
          onPending();
          return;
        }
        setError(data.message ?? data.error ?? "Invalid email or password.");
        return;
      }
      if (Platform.OS !== "web" && data.token) {
        const { setSessionToken, setUserInfo } = await import("@/lib/_core/auth");
        await setSessionToken(data.token);
        if (data.user) await setUserInfo({ ...data.user, lastSignedIn: new Date(data.user.lastSignedIn) });
      }
      await refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <View className="items-center mb-4">
        <Text className="text-3xl mb-2">🚀</Text>
        <Text className="text-lg font-bold text-foreground">Welcome to RocketPower</Text>
        <Text className="text-muted text-sm text-center mt-1">Sign in to view your duties and receive notifications</Text>
      </View>

      {error ? (
        <View className="bg-error/10 rounded-lg p-3 mb-3">
          <Text className="text-error text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="mb-3">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
          returnKeyType="next"
        />
      </View>

      <View className="mb-4">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Password</Text>
        <View className="relative">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground pr-12"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" }}
          >
            <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={handleLogin}
        disabled={isLoading}
        style={({ pressed }) => [{ opacity: pressed || isLoading ? 0.7 : 1 }]}
      >
        <View className="bg-primary rounded-xl py-3 items-center mb-3">
          {isLoading ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold text-base">Sign In</Text>}
        </View>
      </Pressable>

      <View className="flex-row justify-center items-center gap-1">
        <Text className="text-muted text-sm">Don't have an account?</Text>
        <Pressable onPress={onRegister} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Text className="text-primary font-semibold text-sm">Request Access</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Register Card ────────────────────────────────────────────────────────────
function RegisterCard({ onBackToLogin, onPending }: { onBackToLogin: () => void; onPending: () => void }) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }
      onPending();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <Pressable onPress={onBackToLogin} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginBottom: 12 }]}>
        <View className="flex-row items-center gap-1">
          <IconSymbol name="chevron.left" size={16} color={colors.primary} />
          <Text className="text-primary text-sm font-medium">Back to Sign In</Text>
        </View>
      </Pressable>

      <View className="items-center mb-4">
        <Text className="text-3xl mb-2">🚀</Text>
        <Text className="text-lg font-bold text-foreground">Request Access</Text>
        <Text className="text-muted text-sm text-center mt-1">
          Create your account — an admin will approve your request before you can sign in
        </Text>
      </View>

      {error ? (
        <View className="bg-error/10 rounded-lg p-3 mb-3">
          <Text className="text-error text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="mb-3">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Jane Smith"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
          returnKeyType="next"
        />
      </View>

      <View className="mb-3">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
          returnKeyType="next"
        />
      </View>

      <View className="mb-3">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Password</Text>
        <View className="relative">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground pr-12"
            returnKeyType="next"
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" }}
          >
            <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Confirm Password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          placeholderTextColor={colors.muted}
          secureTextEntry={!showPassword}
          className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />
      </View>

      <Pressable
        onPress={handleRegister}
        disabled={isLoading}
        style={({ pressed }) => [{ opacity: pressed || isLoading ? 0.7 : 1 }]}
      >
        <View className="bg-primary rounded-xl py-3 items-center">
          {isLoading ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold text-base">Submit Request</Text>}
        </View>
      </Pressable>
    </View>
  );
}

// ─── Pending Approval Card ────────────────────────────────────────────────────
function PendingCard({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <View className="bg-surface rounded-2xl p-6 border border-border items-center">
      <Text className="text-5xl mb-4">⏳</Text>
      <Text className="text-lg font-bold text-foreground mb-2 text-center">Request Submitted!</Text>
      <Text className="text-muted text-sm text-center mb-4 leading-5">
        Your account request has been sent to your school administrator. You'll be able to sign in once they approve your account.
      </Text>
      <View className="bg-warning/10 rounded-xl p-3 w-full mb-4">
        <Text className="text-warning text-sm text-center font-medium">
          Awaiting admin approval
        </Text>
      </View>
      <Pressable onPress={onBackToLogin} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, width: "100%" }]}>
        <View className="border border-primary rounded-xl py-3 items-center">
          <Text className="text-primary font-semibold">Back to Sign In</Text>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">{label}</Text>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="px-4 py-3 flex-row items-center justify-between">
      <Text className="text-foreground font-medium">{label}</Text>
      <Text className="text-muted text-sm">{value}</Text>
    </View>
  );
}
