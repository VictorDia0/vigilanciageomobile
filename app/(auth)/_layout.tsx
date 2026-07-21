import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";

export default function AuthLayout() {
  const { authenticated, hydrated } = useAuthStore();

  if (hydrated && authenticated) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}