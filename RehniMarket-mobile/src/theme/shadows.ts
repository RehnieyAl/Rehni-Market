import { Platform } from "react-native";
import type { ViewStyle } from "react-native";

export const shadows: Record<"card" | "pop", ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  pop: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: {},
  })!,
};
