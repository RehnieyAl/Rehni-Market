import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";

interface Props {
  companyName: string;
  companyLogo: string | null;
  isVerified: boolean;
}

export function SellerCard({ companyName, companyLogo, isVerified }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        {companyLogo ? (
          <Image source={{ uri: companyLogo }} style={styles.logo} contentFit="cover" />
        ) : (
          <Ionicons name="storefront-outline" size={20} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>Vendido por</Text>

        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {companyName}
          </Text>

          {isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          )}
        </View>

        {isVerified && (
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.success} />
            <Text style={styles.verifiedText}>Empresa verificada</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    flexShrink: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  verifiedRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    color: colors.success,
  },
});
