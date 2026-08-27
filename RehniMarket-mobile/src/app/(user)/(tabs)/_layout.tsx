import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontSize, fontWeight } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

// Navbar inferior de las 5 secciones principales (ver references/
// ux-user.png > Inicio/Categorías/Favoritos/Carrito/Perfil). `Tabs` de
// expo-router ya resuelve Safe Area por su cuenta (envuelve
// @react-navigation/bottom-tabs) - no se arma nada con posición absoluta.
// Las rutas secundarias (detalle de producto, checkout, direcciones,
// etc. - Fases futuras) van a vivir como hermanas de este grupo dentro
// de (user)/, nunca dentro de (tabs)/, así que nunca van a aparecer acá.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

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

// Mismo criterio que el resto de la app: variante rellena cuando el tab
// está activo, outline cuando no (ver references/ux-user.png - el ícono
// activo se ve sólido/coloreado, los inactivos en gris outline).
function iconFor(name: "home" | "grid" | "heart" | "cart" | "person", focused: boolean): IconName {
  if (name === "home") return focused ? "home" : "home-outline";
  if (name === "grid") return focused ? "grid" : "grid-outline";
  if (name === "heart") return focused ? "heart" : "heart-outline";
  if (name === "cart") return focused ? "cart" : "cart-outline";
  return focused ? "person" : "person-outline";
}
