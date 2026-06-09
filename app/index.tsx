import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { token, hydrated } = useAuthStore();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#090909", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return token
    ? <Redirect href="/(app)" />
    : <Redirect href="/(auth)" />;
}