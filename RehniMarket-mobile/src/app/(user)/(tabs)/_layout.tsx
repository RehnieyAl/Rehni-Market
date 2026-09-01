import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/features/cart/hooks/useCart";
import { colors, fontSize, fontWeight } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
        },
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconFor("home", focused)} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: "Categorías",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconFor("grid", focused)} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconFor("heart", focused)} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrito",
          tabBarBadge: totalItems > 0 ? (totalItems > 99 ? "99+" : totalItems) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.textOnPrimary },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconFor("cart", focused)} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconFor("person", focused)} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function iconFor(name: "home" | "grid" | "heart" | "cart" | "person", focused: boolean): IconName {
  if (name === "home") return focused ? "home" : "home-outline";
  if (name === "grid") return focused ? "grid" : "grid-outline";
  if (name === "heart") return focused ? "heart" : "heart-outline";
  if (name === "cart") return focused ? "cart" : "cart-outline";
  return focused ? "person" : "person-outline";
}
