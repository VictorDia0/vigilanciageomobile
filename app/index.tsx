import { useState } from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { AnimatedSplash } from "@/src/components/AnimatedSplash";

export default function Index() {
    const { authenticated, hydrated, onboardingSeen } = useAuthStore();
    const [splashDone, setSplashDone] = useState(false);

    if (!hydrated || !splashDone) {
        return <AnimatedSplash onFinish={() => setSplashDone(true)} />;
    }

    if (authenticated) {
        return <Redirect href="/(app)" />;
    }

    if (!onboardingSeen) {
        return <Redirect href="/onboarding" />;
    }

    return <Redirect href="/(auth)" />;
}
