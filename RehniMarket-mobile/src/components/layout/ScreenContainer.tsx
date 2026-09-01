import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";
import { useResponsive } from "@/hooks/useResponsive";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  maxWidth?: number;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({
  children,
  scroll = false,
  edges = ["top"],
  maxWidth,
  padded = true,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  refreshing,
  onRefresh,
}: Props) {
  const { isLandscape, contentMaxWidth } = useResponsive();

  const cap = maxWidth ?? contentMaxWidth;
  const paddingHorizontal = padded ? spacing.lg : 0;
  const safeEdges: Edge[] = isLandscape
    ? Array.from(new Set<Edge>([...edges, "left", "right"]))
    : edges;

  const inner = (
    <View
      style={[
        styles.inner,
        scroll ? styles.innerScroll : styles.innerFill,
        { maxWidth: cap, paddingHorizontal },
        style,
      ]}
    >
      {children}
    </View>
  );

  const refreshControl =
    scroll && onRefresh ? (
      <RefreshControl
        refreshing={refreshing ?? false}
        onRefresh={onRefresh}
        tintColor={colors.primary}
      />
    ) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            refreshControl={refreshControl}
          >
            {inner}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  inner: {
    width: "100%",
    alignSelf: "center",
  },
  innerFill: {
    flex: 1,
  },
  innerScroll: {
    flexGrow: 1,
  },
});
