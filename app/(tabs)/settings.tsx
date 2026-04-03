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

export default function SettingsScreen() {
  const colors = useColors();
  const { user, isAuthenticated, logout, loading } = useAuth();
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
        Alert.alert("Permission Required", "Please enable notifications in your device settings to receive duty alerts.");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      await updatePushTokenMutation.mutateAsync({ token });
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

  // Listen for incoming notifications
  useEffect(() => {
    if (Platform.OS !== "web") {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log("[Notification received]", notification);
      });
      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
      };
    }
  }, []);

  async function handleLogout() {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out of RocketPower?")) return;
    } else {
      await new Promise<void>((resolve) => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
          { text: "Cancel", style: "cancel", onPress: () => resolve() },
          { text: "Sign Out", style: "destructive", onPress: () => { logout(); resolve(); } },
        ]);
        return;
      });
      return;
    }
    logout();
  }

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-white tracking-tight">Settings</Text>
        <Text className="text-white/70 text-sm mt-0.5">RocketPower · Rogers Lane ES</Text>
      </View>

      {/* Content */}
      <View className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-hidden">
        <ScrollView className="flex-1">
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
                <LoginCard />
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

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">
      {label}
    </Text>
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

function LoginCard() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const baseUrl = Platform.OS === "web" ? "" : "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Invalid email or password.");
        return;
      }
      const data = await res.json();
      // Store token for native
      if (Platform.OS !== "web" && data.token) {
        const { setSessionToken, setUserInfo } = await import("@/lib/_core/auth");
        await setSessionToken(data.token);
        if (data.user) {
          await setUserInfo({ ...data.user, lastSignedIn: new Date(data.user.lastSignedIn) });
        }
      }
      await refresh();
    } catch (err) {
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
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          className="bg-background border border-border rounded-lg px-3 py-2.5 text-foreground"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
      </View>

      <Pressable
        onPress={handleLogin}
        disabled={isLoading}
        style={({ pressed }) => [{ opacity: pressed || isLoading ? 0.7 : 1 }]}
      >
        <View className="bg-primary rounded-xl py-3 items-center">
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
