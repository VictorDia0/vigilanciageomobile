import { Tabs, Redirect } from "expo-router";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  type StyleProp,
  type ViewStyle
} from "react-native";


import { type BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useAuthStore } from "@/src/store/authStore";
import { shouldRedirectToLogin } from "@/src/utils/authGuard";
import { useInactivityLogout } from "@/src/hooks/useInactivityLogout";
import { useNetworkSync } from "@/src/hooks/useNetworkSync";
import { OfflineBanner } from "@/src/components/ui";

function HapticTab({ onPress, children, style }: BottomTabBarButtonProps) {
  return (
    <Pressable
      style={style as StyleProp<ViewStyle>}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
    >
      {children}
    </Pressable>
  );
}


// ─── Design tokens centralizados ────────────────────────────────────────────
const C = {
  active: "#0A5CFF",
  activeBg: "rgba(10, 92, 255, 0.09)",
  inactive: "#ACACAC",
  surface: "#FFFFFF",
  dot: "#00C47A",
} as const;

const SPRING = { damping: 16, stiffness: 180 } as const;
const TIMING_MS = 180;

// ─── Tipagem explícita — sem string map frágil ───────────────────────────────
type TabConfig = {
  outline: keyof typeof Ionicons.glyphMap;
  filled: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TABS = {
  index: { outline: "home-outline", filled: "home", label: "Home" },
  areas: { outline: "map-outline", filled: "map", label: "Áreas" },
  visitas: { outline: "compass-outline", filled: "compass", label: "Visitas" },
  ocorrencias: { outline: "alert-circle-outline", filled: "alert-circle", label: "Ocorrências" },
  relatorios: { outline: "document-text-outline", filled: "document-text", label: "Relatórios" },
  perfil: { outline: "person-outline", filled: "person", label: "Perfil" },
} satisfies Record<string, TabConfig>;

// ─── TabIcon ─────────────────────────────────────────────────────────────────
function TabIcon({
  config,
  focused,
}: {
  config: TabConfig;
  focused: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, progress]);

  // Pill de fundo animado — agora realmente renderizado
  const pillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value, { duration: TIMING_MS }),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.75, 1]) }],
  }));

  // Escala do ícone
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.12]) }],
  }));

  return (
    <Animated.View
      style={styles.tabItem}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={config.label}
    >
      {/* Pill de fundo */}
      <Animated.View style={[styles.pill, pillStyle]} />

      {/* Ícone */}
      <Animated.View style={iconStyle}>
        <Ionicons
          name={focused ? config.filled : config.outline}
          size={22}
          color={focused ? C.active : C.inactive}
        />
      </Animated.View>

      {focused && (
        <Animated.View style={[styles.dot, { opacity: progress.value }]} />
      )}
    </Animated.View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { authenticated, hydrated } = useAuthStore();
  useInactivityLogout();
  const { online, pendentes } = useNetworkSync();

  if (shouldRedirectToLogin(hydrated, authenticated)) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner online={online} pendentes={pendentes} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: styles.tabBar,
          tabBarButton: HapticTab,
        }}
      >
        {/* Tabs principais — apontam pro index de cada pasta */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon config={TABS.index} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="areas"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon config={TABS.areas} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="relatorios"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon config={TABS.relatorios} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="visitas"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon config={TABS.visitas} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="ocorrencias"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon config={TABS.ocorrencias} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon config={TABS.perfil} focused={focused} />
            ),
          }}
        />

      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.select({ ios: 24, default: 16 }),
    marginHorizontal: 28,
    height: 56,
    backgroundColor: C.surface,
    borderRadius: 28,
    borderTopWidth: 0,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 10,
    paddingTop: 5,
    paddingBottom: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    position: "relative",
  },
  pill: {
    position: "absolute",
    width: 44,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.activeBg,
  },
  dot: {
    position: "absolute",
    bottom: 8,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.dot,
  },
});