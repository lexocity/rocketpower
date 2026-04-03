// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mappings for RocketPower
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "person.fill": "person",
  "shield.fill": "admin-panel-settings",
  "gear": "settings",
  // Actions
  "paperplane.fill": "send",
  "plus": "add",
  "pencil": "edit",
  "trash": "delete",
  "bell.fill": "notifications",
  "bell": "notifications-none",
  "checkmark": "check",
  "xmark": "close",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  // Coverage specific
  "calendar": "calendar-today",
  "person.2.fill": "group",
  "clock": "access-time",
  "doc.text": "description",
  "exclamationmark.triangle": "warning",
  "checkmark.circle.fill": "check-circle",
  "info.circle": "info",
  "magnifyingglass": "search",
  "arrow.clockwise": "refresh",
  "ellipsis": "more-horiz",
  "square.and.arrow.up": "share",
  // People
  "person.3.fill": "groups",
  "person.badge.plus": "person-add",
  // Misc
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "star.fill": "star",
  "building.2": "business",
  "list.bullet": "list",
  "eye": "visibility",
  "eye.slash": "visibility-off",
  "list.bullet.clipboard.fill": "assignment",
  "xmark.circle.fill": "cancel",
  "table.fill": "table-chart",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
