import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { getApiBaseUrl } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";

type AuthView = "login" | "register" | "pending";

const isWeb = Platform.OS === "web";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0A12" }}>
        <ActivityIndicator size="large" color="#FFCD00" />
        <Text style={{ color: "#FFCD00", marginTop: 16, fontSize: 14, fontWeight: "600" }}>
          Launching RocketPower...
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
    <View style={{ flex: 1, backgroundColor: "#0D0A12" }}>
      <SpaceBackground />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 400, alignItems: "center" }}>
          {/* Rocket Icon with Shake Animation - No Box */}
          <View className="animate-rocket-shake mb-4">
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          </View>

          {/* Script Style Title */}
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 72,
                color: "#FFCD00",
                textAlign: "center",
                // @ts-ignore
                fontFamily: isWeb ? "'Pacifico', cursive" : undefined,
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 4,
              }}
            >
              Rockets
            </Text>
            <View style={{ 
              backgroundColor: "#FFCD00", 
              height: 4, 
              width: 200, 
              marginTop: -15, 
              borderRadius: 2,
              transform: [{ rotate: "-2deg" }]
            }} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "900",
                color: "#0D0A12",
                backgroundColor: "#FFCD00",
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginTop: 4,
                borderRadius: 4,
                // @ts-ignore
                fontFamily: isWeb ? "'Bebas Neue', sans-serif" : undefined,
              }}
            >
              EST. 2017
            </Text>
          </View>
          
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 18,
                color: "#FFFFFF",
                textAlign: "center",
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              Rogers Lane Elementary
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.6)",
                textAlign: "center",
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              Substitute Coverage & Staff Duties
            </Text>
          </View>

          {view === "pending" ? (
            <PendingCard onBack={() => setView("login")} />
          ) : view === "register" ? (
            <RegisterCard onBack={() => setView("login")} onPending={() => setView("pending")} />
          ) : (
            <LoginCard onRegister={() => setView("register")} onPending={() => setView("pending")} />
          )}
        </View>
      </View>
    </View>
  );
}

function SpaceBackground() {
  if (!isWeb) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {/* Nebula Glow */}
      <View 
        className="animate-nebula-glow"
        style={{
          position: "absolute",
          width: "150%",
          height: "150%",
          top: "-25%",
          left: "-25%",
          // @ts-ignore
          backgroundImage: "radial-gradient(circle at center, rgba(73, 14, 103, 0.3) 0%, transparent 70%)",
        }}
      />
      
      {/* Twinkling Stars */}
      {[...Array(50)].map((_, i) => (
        <View
          key={i}
          className="animate-twinkle"
          style={{
            position: "absolute",
            width: (i % 4 === 0) ? 4 : 2,
            height: (i % 4 === 0) ? 4 : 2,
            borderRadius: 2,
            backgroundColor: (i % 5 === 0) ? "#FFCD00" : "#FFFFFF",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            // @ts-ignore
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.2 + Math.random() * 0.8,
          }}
        />
      ))}
    </View>
  );
}

function LoginCard({ onRegister, onPending }: { onRegister: () => void; onPending: () => void }) {
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
      await refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 16,
    width: "100%",
    // @ts-ignore
    outlineStyle: "none",
  };

  return (
    <View style={{ width: "100%" }}>
      {error ? (
        <View style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.4)" }}>
          <Text style={{ color: "#F87171", fontSize: 14, textAlign: "center" }}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        keyboardType="email-address"
        autoCapitalize="none"
        style={inputStyle}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        secureTextEntry
        style={inputStyle}
        onSubmitEditing={handleLogin}
      />

      <Pressable
        onPress={handleLogin}
        disabled={isLoading}
        style={({ pressed }) => ({
          backgroundColor: "#FFCD00",
          borderRadius: 25,
          paddingVertical: 16,
          alignItems: "center",
          marginTop: 8,
          opacity: pressed || isLoading ? 0.8 : 1,
          // @ts-ignore
          boxShadow: "0 0 20px rgba(255, 205, 0, 0.4)",
        })}
      >
        {isLoading ? (
          <ActivityIndicator color="#490E67" size="small" />
        ) : (
          <Text style={{ color: "#490E67", fontWeight: "900", fontSize: 18, letterSpacing: 1 }}>LOG IN</Text>
        )}
      </Pressable>

      <Pressable onPress={onRegister} style={{ marginTop: 24, alignItems: "center" }}>
        <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
          Don't have an account? <Text style={{ color: "#FFCD00", fontWeight: "700" }}>Request Access</Text>
        </Text>
      </Pressable>
    </View>
  );
}

function RegisterCard({ onBack, onPending }: { onBack: () => void; onPending: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
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
        setError(data.error ?? "Registration failed.");
        return;
      }
      onPending();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 12,
    width: "100%",
    // @ts-ignore
    outlineStyle: "none",
  };

  return (
    <View style={{ width: "100%" }}>
      <Pressable onPress={onBack} style={{ marginBottom: 20, flexDirection: "row", alignItems: "center" }}>
        <IconSymbol name="chevron.left" size={16} color="#FFCD00" />
        <Text style={{ color: "#FFCD00", marginLeft: 4, fontWeight: "600" }}>Back</Text>
      </Pressable>

      {error ? (
        <View style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.4)" }}>
          <Text style={{ color: "#F87171", fontSize: 14, textAlign: "center" }}>{error}</Text>
        </View>
      ) : null}

      <TextInput value={name} onChangeText={setName} placeholder="Full Name" placeholderTextColor="rgba(255, 255, 255, 0.4)" style={inputStyle} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="rgba(255, 255, 255, 0.4)" keyboardType="email-address" style={inputStyle} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="rgba(255, 255, 255, 0.4)" secureTextEntry style={inputStyle} />

      <Pressable
        onPress={handleRegister}
        disabled={isLoading}
        style={({ pressed }) => ({
          backgroundColor: "#FFCD00",
          borderRadius: 25,
          paddingVertical: 16,
          alignItems: "center",
          marginTop: 8,
          opacity: pressed || isLoading ? 0.8 : 1,
        })}
      >
        {isLoading ? (
          <ActivityIndicator color="#490E67" size="small" />
        ) : (
          <Text style={{ color: "#490E67", fontWeight: "900", fontSize: 18 }}>SUBMIT REQUEST</Text>
        )}
      </Pressable>
    </View>
  );
}

function PendingCard({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      <Text style={{ fontSize: 64, marginBottom: 24 }}>⏳</Text>
      <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFCD00", marginBottom: 12, textAlign: "center" }}>REQUEST SENT!</Text>
      <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.7)", textAlign: "center", lineHeight: 24, marginBottom: 32 }}>
        Your account request is awaiting admin approval. You'll be able to sign in once approved.
      </Text>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => ({
          borderWidth: 2,
          borderColor: "#FFCD00",
          borderRadius: 25,
          paddingVertical: 14,
          paddingHorizontal: 40,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: "#FFCD00", fontWeight: "800", fontSize: 16 }}>BACK TO LOGIN</Text>
      </Pressable>
    </View>
  );
}
