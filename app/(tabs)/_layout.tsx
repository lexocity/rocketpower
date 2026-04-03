import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WebTopNav } from "@/components/web-top-nav";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const isWeb = Platform.OS === "web";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: me } = trpc.auth.me.useQuery();
  const isAdmin = (me as { role?: string } | null | undefined)?.role === "admin";

  const bottomPadding = isWeb ? 0 : Math.max(insets.bottom, 8);
  const tabBarHeight = isWeb ? 0 : 56 + bottomPadding;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Web-only top navigation bar */}
      {isWeb && <WebTopNav />}

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.muted,
          headerShown: false,
          tabBarButton: HapticTab,
          // On web: completely hide the bottom tab bar
          tabBarStyle: isWeb
            ? { display: "none" }
            : {
                paddingTop: 8,
                paddingBottom: bottomPadding,
                height: tabBarHeight,
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                borderTopWidth: 0.5,
              },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        {/* ── Shared tabs (all users) ── */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="my-duties"
          options={{
            title: "My Duties",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
          }}
        />

        {/* ── Admin-only tabs ── */}
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="shield.fill" color={color} />,
            tabBarItemStyle: isAdmin ? undefined : { display: "none" },
            href: isAdmin ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="notify"
          options={{
            title: "Notify",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="bell.fill" color={color} />,
            tabBarItemStyle: isAdmin ? undefined : { display: "none" },
            href: isAdmin ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="roster"
          options={{
            title: "Roster",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet.clipboard.fill" color={color} />,
            tabBarItemStyle: isAdmin ? undefined : { display: "none" },
            href: isAdmin ? undefined : null,
          }}
        />

        {/* ── Settings (all users, always last) ── */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="gear" color={color} />,
          }}
        />

        {/* ── Hidden screens (no tab shown) ── */}
        <Tabs.Screen
          name="lunch-duty"
          options={{
            href: null,
            tabBarItemStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="bulk-entry"
          options={{
            href: null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      </Tabs>
    </View>
  );
}
