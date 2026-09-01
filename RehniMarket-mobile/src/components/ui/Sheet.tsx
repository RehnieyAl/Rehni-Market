import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useResponsive } from "@/hooks/useResponsive";
import { colors, fontSize, fontWeight, radii, shadows, spacing } from "@/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ visible, onClose, title, children, footer }: Props) {
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isTablet ? "fade" : "slide"}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={[styles.overlay, isTablet ? styles.overlayCentered : styles.overlayBottom]}
          onPress={onClose}
        >
          <Pressable
            style={[
              styles.panel,
              isTablet ? styles.panelTablet : styles.panelPhone,
              !isTablet && { paddingBottom: insets.bottom + spacing.lg },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>

              <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {footer && <View style={styles.footer}>{footer}</View>}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  overlayBottom: {
    justifyContent: "flex-end",
  },
  overlayCentered: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  panel: {
    backgroundColor: colors.background,
    maxHeight: "88%",
    ...shadows.pop,
  },
  panelPhone: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  panelTablet: {
    width: "100%",
    maxWidth: 480,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
