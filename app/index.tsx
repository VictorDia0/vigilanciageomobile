import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { authenticated, hydrated } = useAuthStore();

    if (!hydrated) {
        return (
            <View style={{ flex: 1, backgroundColor: "#090909", alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color="#00D4FF" />
            </View>
        );
    }

    return authenticated
        ? <Redirect href="/(app)" />
        : <Redirect href="/(auth)" />;
}