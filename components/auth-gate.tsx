import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useAuth } from "@/hooks/use-auth";
import { getApiBaseUrl } from "@/constants/oauth";

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

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <LandingPage />;
}

function LandingPage() {
  const [view, setView] = useState<AuthView>("login");

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0A12" }}>
      <SpaceBackground />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 800, alignItems: "center" }}>
          {/* Rocket Icon - Forced Transparency */}
          <View 
            className="animate-rocket-shake mb-4" 
            style={{ 
              backgroundColor: 'transparent',
            }}
          >
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ 
                width: 120, 
                height: 120, 
              }}
              contentFit="contain"
            />
          </View>

          {/* Brannboll Font Title - Forced Single Line & No Truncation */}
          <View style={{ alignItems: "center", marginBottom: 24, width: '100%' }}>
            <Text
              style={{
                fontSize: 96,
                color: "#FFCD00",
                textAlign: "center",
                // @ts-ignore
                fontFamily: isWeb ? "'Brannboll', 'Pacifico', cursive" : undefined,
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 4,
                lineHeight: 110,
                width: '100%',
                // @ts-ignore
                whiteSpace: 'nowrap',
                // @ts-ignore
                overflow: 'visible',
                // @ts-ignore
                textOverflow: 'clip',
              }}
            >
              Rocket Power5
            </Text>
          </View>
          
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 20,
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
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.6)",
                textAlign: "center",
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              Substitute Coverage & Staff Duties
            </Text>
          </View>

          <View style={{ width: '100%', maxWidth: 400 }}>
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
    </View>
  );
}

function SpaceBackground() {
  if (!isWeb) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", backgroundColor: "#050308" }}>
      {/* Deep Space Gradient */}
      <View 
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          // @ts-ignore
          backgroundImage: "linear-gradient(180deg, #050308 0%, #1a0a2e 50%, #050308 100%)",
        }}
      />

      {/* Nebula Glows */}
      <View 
        className="animate-nebula-glow"
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          // @ts-ignore
          backgroundImage: "radial-gradient(circle at 30% 30%, rgba(73, 14, 103, 0.4) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(45, 8, 64, 0.4) 0%, transparent 60%)",
        }}
      />
      
      {/* Twinkling Star-Shaped Elements */}
      {[...Array(60)].map((_, i) => {
        const size = (i % 6 === 0) ? 6 : (i % 3 === 0) ? 4 : 2;
        const isStar = i % 5 === 0;
        return (
          <View
            key={i}
            className="animate-twinkle"
            style={{
              position: "absolute",
              width: size,
              height: size,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              // @ts-ignore
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.7,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isStar ? (
              <View style={{ position: 'relative', width: size, height: size }}>
                <View style={{ position: 'absolute', width: size, height: 1, backgroundColor: '#FFCD00', top: size/2 }} />
                <View style={{ position: 'absolute', width: 1, height: size, backgroundColor: '#FFCD00', left: size/2 }} />
                <View style={{ position: 'absolute', width: size*0.7, height: size*0.7, backgroundColor: '#FFCD00', borderRadius: size, opacity: 0.5, top: size*0.15, left: size*0.15 }} />
              </View>
            ) : (
              <View style={{ width: size, height: size, borderRadius: size, backgroundColor: '#FFFFFF' }} />
            )}
          </View>
        );
      })}
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
    marginBottom: 16,
    width: "100%",
    // @ts-ignore
    outlineStyle: "none",
  };

  return (
    <View style={{ width: "100%" }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <Text style={{ color: "#FFCD00", fontSize: 14, fontWeight: "600" }}>← Back to Login</Text>
      </Pressable>

      <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginBottom: 8 }}>Request Access</Text>
      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginBottom: 24 }}>
        Fill out the form below to request an account. An administrator will review your request.
      </Text>

      {error ? (
        <View style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.4)" }}>
          <Text style={{ color: "#F87171", fontSize: 14, textAlign: "center" }}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Full Name"
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        style={inputStyle}
      />

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="School Email"
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
      />

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
          <Text style={{ color: "#490E67", fontWeight: "900", fontSize: 18, letterSpacing: 1 }}>SUBMIT REQUEST</Text>
        )}
      </Pressable>
    </View>
  );
}

function PendingCard({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ width: "100%", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255, 205, 0, 0.1)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 32 }}>⏳</Text>
      </View>
      <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginBottom: 12, textAlign: "center" }}>Request Pending</Text>
      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, textAlign: "center", lineHeight: 24, marginBottom: 32 }}>
        Your account request has been submitted. An administrator will review it shortly. You'll be able to log in once approved.
      </Text>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => ({
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 25,
          paddingVertical: 14,
          paddingHorizontal: 32,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Back to Login</Text>
      </Pressable>
    </View>
  );
}
