import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, fontSize, fontWeight, spacing } from "@/theme";

// Header compacto de Home (ver references/ux-user.png): menú + logo/
// wordmark a la izquierda, notificaciones + carrito a la derecha.
//
// - El ícono de menú no abre nada todavía: la web no tiene un drawer
//   equivalente (su navbar es una lista de links, no un menú lateral) y
//   esta fase es solo Home, no navegación adicional - queda decorativo
//   hasta que haga falta.
// - El de notificaciones tampoco: no existe ningún endpoint/feature de
//   notificaciones en el backend ni en la web (se verificó, no hay
//   notificationService en ningún lado) - se muestra por fidelidad visual
//   con la referencia, sin inventar un badge con datos falsos.
// - El carrito SÍ navega (al tab real) pero todavía sin badge de
//   cantidad: no hay CartProvider hasta la fase de Carrito, y no se va a
//   mostrar un número inventado mientras tanto.
export function HomeHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable hitSlop={8}>
        <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.brand}>
        <Image
          source={require("../../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.wordmark}>RehniMarket</Text>
      </View>

      <View style={styles.actions}>
        <Pressable hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </Pressable>

        <Pressable hitSlop={8} onPress={() => router.push("/(user)/(tabs)/cart")}>
          <Ionicons name="cart-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  logo: {
    width: 28,
    height: 28,
  },
  wordmark: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
