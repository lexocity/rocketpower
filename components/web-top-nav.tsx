/**
 * WebTopNav — beautiful full-width top navigation bar for web only.
 * Deep purple gradient header with gold accents, rocket logo top-left.
 */
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Today", href: "/" },
  { label: "My Duties", href: "/my-duties" },
  { label: "Admin", href: "/admin", adminOnly: true },
  { label: "Notify", href: "/notify", adminOnly: true },
  { label: "Roster", href: "/roster", adminOnly: true },
  { label: "Settings", href: "/settings" },
];

export function WebTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = trpc.auth.me.useQuery();
  const isAdmin = (me as { role?: string } | null | undefined)?.role === "admin";
  const userName = (me as { name?: string } | null | undefined)?.name;

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(href);
  }

  return (
    <View
      style={{
        // Deep purple gradient via layered views
        backgroundColor: "#3a0b50",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 28,
        height: 64,
        borderBottomWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        // Web box-shadow
        // @ts-ignore
        boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
        zIndex: 100,
        gap: 0,
      }}
    >
      {/* Subtle gradient overlay strip */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "#FFCD00",
          opacity: 0.9,
        }}
      />

      {/* ── Logo + Branding ── */}
      <Pressable
        onPress={() => router.push("/")}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, flexDirection: "row", alignItems: "center", gap: 12, marginRight: 36 }]}
      >
        {/* Logo with glowing ring */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: "rgba(255,205,0,0.15)",
            borderWidth: 1.5,
            borderColor: "rgba(255,205,0,0.4)",
            alignItems: "center",
            justifyContent: "center",
            // @ts-ignore
            boxShadow: "0 0 12px rgba(255,205,0,0.25)",
          }}
        >
            <Image
              source={require("@/assets/images/icon.png")}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                // @ts-ignore
                mixBlendMode: isWeb ? 'screen' : undefined,
                // @ts-ignore
                filter: isWeb ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))' : undefined,
              }}
              contentFit="contain"
            />
        </View>

        {/* App name + school name */}
        <View style={{ gap: 1 }}>
          <Text
            style={{
              color: "#FFCD00",
              fontWeight: "800",
              fontSize: 20,
              letterSpacing: 0.3,
              lineHeight: 24,
            }}
          >
            RocketPower
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              lineHeight: 13,
            }}
          >
            Rogers Lane Elementary
          </Text>
        </View>
      </Pressable>

      {/* Divider */}
      <View style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.12)", marginRight: 28 }} />

      {/* ── Nav Links ── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2, flex: 1 }}>
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            >
              <View
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: active ? "rgba(255,205,0,0.18)" : "transparent",
                  position: "relative",
                }}
              >
                {/* Active indicator dot */}
                {active && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      left: "50%",
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#FFCD00",
                      transform: [{ translateX: -2 }],
                    }}
                  />
                )}
                <Text
                  style={{
                    color: active ? "#FFCD00" : "rgba(255,255,255,0.7)",
                    fontWeight: active ? "700" : "500",
                    fontSize: 14,
                    letterSpacing: 0.2,
                  }}
                >
                  {item.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── User Badge (right side) ── */}
      {userName ? (
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 24,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            {/* Avatar circle */}
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#FFCD00",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#490E67", fontWeight: "800", fontSize: 12 }}>
                {userName[0].toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" }}>
              {userName.split(" ")[0]}
            </Text>
            {isAdmin && (
              <View
                style={{
                  backgroundColor: "rgba(255,205,0,0.2)",
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: "#FFCD00", fontSize: 10, fontWeight: "700" }}>ADMIN</Text>
              </View>
            )}
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
        >
          <View
            style={{
              backgroundColor: "#FFCD00",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#490E67", fontWeight: "700", fontSize: 13 }}>Sign In</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
