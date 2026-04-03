import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { getApiBaseUrl } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";

type AuthView = "login" | "register" | "pending";

const isWeb = Platform.OS === "web";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#490E67" }}>
        <ActivityIndicator size="large" color="#FFCD00" />
        <Text style={{ color: "#FFCD00", marginTop: 16, fontSize: 14, fontWeight: "600" }}>
          Loading RocketPower...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <>{children}</>;
}

function LandingPage() {
  const [view, setView] = useState<AuthView>("login");

  return (
    <View style={{ flex: 1, backgroundColor: isWeb ? "#f8f5fb" : "#490E67" }}>
      {isWeb ? <WebLanding view={view} setView={setView} /> : <MobileLanding view={view} setView={setView} />}
    </View>
  );
}

// ─── Web Landing ──────────────────────────────────────────────────────────────
function WebLanding({ view, setView }: { view: AuthView; setView: (v: AuthView) => void }) {
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {/* Left branding panel */}
      <View
        style={{
          width: "45%",
          backgroundColor: "#490E67",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          // @ts-ignore
          backgroundImage: "linear-gradient(160deg, #490E67 0%, #2d0840 100%)",
        }}
      >
        {/* Stars decoration */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                borderRadius: 2,
                backgroundColor: "rgba(255,205,0,0.4)",
                top: `${(i * 17 + 5) % 100}%`,
                left: `${(i * 23 + 10) % 100}%`,
              }}
            />
          ))}
        </View>

        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 24 }}
        />
        <Text
          style={{
            fontSize: 36,
            fontWeight: "800",
            color: "#FFCD00",
            marginBottom: 8,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          RocketPower
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            marginBottom: 32,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Rogers Lane Elementary
        </Text>
        <View
          style={{
            backgroundColor: "rgba(255,205,0,0.15)",
            borderRadius: 16,
            padding: 20,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 22, textAlign: "center" }}>
            🚀 Daily substitute coverage board{"\n"}
            📋 Coverage assignments at a glance{"\n"}
            🔔 Instant duty change notifications{"\n"}
            👩‍🏫 Built for Rogers Lane staff
          </Text>
        </View>
        <Text
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 11,
            marginTop: 40,
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          "Where Learning Is Out of This World!"
        </Text>
      </View>

      {/* Right auth panel */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          backgroundColor: "#fff",
        }}
      >
        <View style={{ width: "100%", maxWidth: 400 }}>
          {view === "pending" ? (
            <WebPendingCard onBack={() => setView("login")} />
          ) : view === "register" ? (
            <WebRegisterCard onBack={() => setView("login")} onPending={() => setView("pending")} />
          ) : (
            <WebLoginCard onRegister={() => setView("register")} onPending={() => setView("pending")} />
          )}
        </View>
      </View>
    </View>
  );
}

function WebLoginCard({ onRegister, onPending }: { onRegister: () => void; onPending: () => void }) {
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
        if (data.error === "pending") { onPending(); return; }
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
    <View>
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#490E67", marginBottom: 4 }}>Welcome back</Text>
      <Text style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>Sign in to your RocketPower account</Text>

      {error ? (
        <View style={{ backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fecaca" }}>
          <Text style={{ color: "#dc2626", fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 12, fontWeight: "700", color: "#490E67", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        placeholderTextColor="#bbb"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1.5,
          borderColor: "#e8e0f0",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: "#1a1a2e",
          marginBottom: 16,
          backgroundColor: "#faf8fc",
          // @ts-ignore
          outlineColor: "#490E67",
        }}
        returnKeyType="next"
      />

      <Text style={{ fontSize: 12, fontWeight: "700", color: "#490E67", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</Text>
      <View style={{ position: "relative", marginBottom: 24 }}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#bbb"
          secureTextEntry={!showPassword}
          style={{
            borderWidth: 1.5,
            borderColor: "#e8e0f0",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            paddingRight: 48,
            fontSize: 15,
            color: "#1a1a2e",
            backgroundColor: "#faf8fc",
            // @ts-ignore
            outlineColor: "#490E67",
          }}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <Pressable
          onPress={() => setShowPassword((v) => !v)}
          style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
        >
          <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={18} color="#999" />
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogin}
        disabled={isLoading}
        style={({ pressed }) => [{
          backgroundColor: "#490E67",
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          marginBottom: 20,
          opacity: pressed || isLoading ? 0.75 : 1,
          // @ts-ignore
          boxShadow: "0 4px 14px rgba(73,14,103,0.3)",
        }]}
      >
        {isLoading
          ? <ActivityIndicator color="#FFCD00" size="small" />
          : <Text style={{ color: "#FFCD00", fontWeight: "800", fontSize: 16 }}>Sign In</Text>}
      </Pressable>

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
        <Text style={{ color: "#888", fontSize: 14 }}>Don't have an account?</Text>
        <Pressable onPress={onRegister} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Text style={{ color: "#490E67", fontWeight: "700", fontSize: 14 }}>Request Access</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WebRegisterCard({ onBack, onPending }: { onBack: () => void; onPending: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match."); return;
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
      if (!res.ok) { setError(data.error ?? "Registration failed."); return; }
      onPending();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1.5,
    borderColor: "#e8e0f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a2e",
    marginBottom: 14,
    backgroundColor: "#faf8fc",
    // @ts-ignore
    outlineColor: "#490E67",
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 4 }]}>
        <IconSymbol name="chevron.left" size={16} color="#490E67" />
        <Text style={{ color: "#490E67", fontSize: 14, fontWeight: "600" }}>Back to Sign In</Text>
      </Pressable>

      <Text style={{ fontSize: 28, fontWeight: "800", color: "#490E67", marginBottom: 4 }}>Request Access</Text>
      <Text style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
        An admin will approve your account before you can sign in.
      </Text>

      {error ? (
        <View style={{ backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fecaca" }}>
          <Text style={{ color: "#dc2626", fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 12, fontWeight: "700", color: "#490E67", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Jane Smith" placeholderTextColor="#bbb" autoCapitalize="words" style={inputStyle} returnKeyType="next" />

      <Text style={{ fontSize: 12, fontWeight: "700", color: "#490E67", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={inputStyle} returnKeyType="next" />

      <Text style={{ fontSize: 12, fontWeight: "700", color: "#490E67", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</Text>
      <View style={{ position: "relative" }}>
        <TextInput value={password} onChangeText={setPassword} placeholder="Min. 6 characters" placeholderTextColor="#bbb" secureTextEntry={!showPassword} style={{ ...inputStyle, paddingRight: 48 }} returnKeyType="next" />
        <Pressable onPress={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: 0, bottom: 14, justifyContent: "center" }}>
          <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={18} color="#999" />
        </Pressable>
      </View>

      <Text style={{ fontSize: 12, fontWeight: "700", color: "#490E67", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Confirm Password</Text>
      <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor="#bbb" secureTextEntry={!showPassword} style={inputStyle} returnKeyType="done" onSubmitEditing={handleRegister} />

      <Pressable
        onPress={handleRegister}
        disabled={isLoading}
        style={({ pressed }) => [{
          backgroundColor: "#490E67",
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 8,
          opacity: pressed || isLoading ? 0.75 : 1,
          // @ts-ignore
          boxShadow: "0 4px 14px rgba(73,14,103,0.3)",
        }]}
      >
        {isLoading
          ? <ActivityIndicator color="#FFCD00" size="small" />
          : <Text style={{ color: "#FFCD00", fontWeight: "800", fontSize: 16 }}>Submit Request</Text>}
      </Pressable>
    </ScrollView>
  );
}

function WebPendingCard({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 64, marginBottom: 20 }}>⏳</Text>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#490E67", marginBottom: 8, textAlign: "center" }}>
        Request Submitted!
      </Text>
      <Text style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 24, maxWidth: 320 }}>
        Your account request has been sent to your school administrator. You'll be able to sign in once they approve your account.
      </Text>
      <View style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 16, width: "100%", marginBottom: 24, borderWidth: 1, borderColor: "#fde68a" }}>
        <Text style={{ color: "#92400e", fontSize: 14, textAlign: "center", fontWeight: "600" }}>
          ⏰ Awaiting admin approval
        </Text>
      </View>
      <Pressable onPress={onBack} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, borderWidth: 2, borderColor: "#490E67", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 }]}>
        <Text style={{ color: "#490E67", fontWeight: "700", fontSize: 15 }}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
}

// ─── Mobile Landing ───────────────────────────────────────────────────────────
function MobileLanding({ view, setView }: { view: AuthView; setView: (v: AuthView) => void }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Purple hero */}
        <View style={{ backgroundColor: "#490E67", paddingTop: 80, paddingBottom: 40, alignItems: "center", paddingHorizontal: 24 }}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16 }}
          />
          <Text style={{ fontSize: 30, fontWeight: "800", color: "#FFCD00", marginBottom: 4 }}>RocketPower</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Rogers Lane Elementary
          </Text>
        </View>

        {/* Auth card */}
        <View style={{ flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, padding: 24 }}>
          {view === "pending" ? (
            <MobilePendingCard onBack={() => setView("login")} />
          ) : view === "register" ? (
            <MobileRegisterCard onBack={() => setView("login")} onPending={() => setView("pending")} />
          ) : (
            <MobileLoginCard onRegister={() => setView("register")} onPending={() => setView("pending")} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MobileLoginCard({ onRegister, onPending }: { onRegister: () => void; onPending: () => void }) {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError("Please enter your email and password."); return; }
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
        if (data.error === "pending") { onPending(); return; }
        setError(data.message ?? data.error ?? "Invalid email or password.");
        return;
      }
      if (data.token) {
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
    <View>
      <Text style={{ fontSize: 22, fontWeight: "800", color: "#490E67", marginBottom: 4 }}>Sign In</Text>
      <Text style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Access your coverage board and duties</Text>

      {error ? (
        <View style={{ backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#fecaca" }}>
          <Text style={{ color: "#dc2626", fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 11, fontWeight: "700", color: "#490E67", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</Text>
      <TextInput
        value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={colors.muted}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
        style={{ borderWidth: 1.5, borderColor: "#e8e0f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1a1a2e", marginBottom: 14, backgroundColor: "#faf8fc" }}
        returnKeyType="next"
      />

      <Text style={{ fontSize: 11, fontWeight: "700", color: "#490E67", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</Text>
      <View style={{ position: "relative", marginBottom: 20 }}>
        <TextInput
          value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.muted}
          secureTextEntry={!showPassword}
          style={{ borderWidth: 1.5, borderColor: "#e8e0f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, paddingRight: 48, fontSize: 15, color: "#1a1a2e", backgroundColor: "#faf8fc" }}
          returnKeyType="done" onSubmitEditing={handleLogin}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}>
          <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={18} color="#999" />
        </Pressable>
      </View>

      <Pressable onPress={handleLogin} disabled={isLoading} style={({ pressed }) => [{ backgroundColor: "#490E67", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 16, opacity: pressed || isLoading ? 0.75 : 1 }]}>
        {isLoading ? <ActivityIndicator color="#FFCD00" size="small" /> : <Text style={{ color: "#FFCD00", fontWeight: "800", fontSize: 16 }}>Sign In</Text>}
      </Pressable>

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
        <Text style={{ color: "#888", fontSize: 13 }}>Don't have an account?</Text>
        <Pressable onPress={onRegister} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Text style={{ color: "#490E67", fontWeight: "700", fontSize: 13 }}>Request Access</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MobileRegisterCard({ onBack, onPending }: { onBack: () => void; onPending: () => void }) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
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
      if (!res.ok) { setError(data.error ?? "Registration failed."); return; }
      onPending();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1.5, borderColor: "#e8e0f0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#1a1a2e", marginBottom: 14, backgroundColor: "#faf8fc",
  };

  return (
    <View>
      <Pressable onPress={onBack} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 4 }]}>
        <IconSymbol name="chevron.left" size={16} color="#490E67" />
        <Text style={{ color: "#490E67", fontSize: 13, fontWeight: "600" }}>Back to Sign In</Text>
      </Pressable>

      <Text style={{ fontSize: 22, fontWeight: "800", color: "#490E67", marginBottom: 4 }}>Request Access</Text>
      <Text style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>An admin will approve your account before you can sign in.</Text>

      {error ? (
        <View style={{ backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#fecaca" }}>
          <Text style={{ color: "#dc2626", fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 11, fontWeight: "700", color: "#490E67", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Jane Smith" placeholderTextColor={colors.muted} autoCapitalize="words" style={inputStyle} returnKeyType="next" />

      <Text style={{ fontSize: 11, fontWeight: "700", color: "#490E67", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={inputStyle} returnKeyType="next" />

      <Text style={{ fontSize: 11, fontWeight: "700", color: "#490E67", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</Text>
      <View style={{ position: "relative" }}>
        <TextInput value={password} onChangeText={setPassword} placeholder="Min. 6 characters" placeholderTextColor={colors.muted} secureTextEntry={!showPassword} style={{ ...inputStyle, paddingRight: 48 }} returnKeyType="next" />
        <Pressable onPress={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 14, top: 0, bottom: 14, justifyContent: "center" }}>
          <IconSymbol name={showPassword ? "eye.slash" : "eye"} size={18} color="#999" />
        </Pressable>
      </View>

      <Text style={{ fontSize: 11, fontWeight: "700", color: "#490E67", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Confirm Password</Text>
      <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor={colors.muted} secureTextEntry={!showPassword} style={inputStyle} returnKeyType="done" onSubmitEditing={handleRegister} />

      <Pressable onPress={handleRegister} disabled={isLoading} style={({ pressed }) => [{ backgroundColor: "#490E67", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4, opacity: pressed || isLoading ? 0.75 : 1 }]}>
        {isLoading ? <ActivityIndicator color="#FFCD00" size="small" /> : <Text style={{ color: "#FFCD00", fontWeight: "800", fontSize: 16 }}>Submit Request</Text>}
      </Pressable>
    </View>
  );
}

function MobilePendingCard({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 20 }}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>⏳</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#490E67", marginBottom: 8, textAlign: "center" }}>Request Submitted!</Text>
      <Text style={{ fontSize: 13, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 20 }}>
        Your account request has been sent to your school administrator. You'll be able to sign in once they approve your account.
      </Text>
      <View style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, width: "100%", marginBottom: 20, borderWidth: 1, borderColor: "#fde68a" }}>
        <Text style={{ color: "#92400e", fontSize: 13, textAlign: "center", fontWeight: "600" }}>⏰ Awaiting admin approval</Text>
      </View>
      <Pressable onPress={onBack} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, borderWidth: 2, borderColor: "#490E67", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 }]}>
        <Text style={{ color: "#490E67", fontWeight: "700", fontSize: 14 }}>Back to Sign In</Text>
      </Pressable>
    </View>
  );
}
