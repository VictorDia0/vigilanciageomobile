import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home as Home, Map, AlertCircle, User } from "lucide-react-native";

const COLORS = {
  bg: "#090909",
  surface: "#111111",
  border: "#1a1a1a",
  emerald: "#10b981",
  muted: "#3a3a3a",
};

function TabIcon({
  Icon,
  focused,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon
        size={20}
        color={focused ? COLORS.emerald : COLORS.muted}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="areas"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Map} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ocorrencias"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={AlertCircle} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: "#10b98115",
  },
});