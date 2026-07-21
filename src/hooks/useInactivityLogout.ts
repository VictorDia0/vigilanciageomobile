import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/src/store/authStore";
import { checkAndLogoutIfExpired } from "@/src/utils/inactivity";

const STORAGE_KEY = "vigiageo-backgrounded-at";

const deps = {
  getStoredTimestamp: () => AsyncStorage.getItem(STORAGE_KEY),
  clearStoredTimestamp: () => AsyncStorage.removeItem(STORAGE_KEY),
  logout: () => useAuthStore.getState().logout(),
};

/**
 * Desloga automaticamente se o app ficou em background por >= 15min —
 * inclusive se o processo foi encerrado nesse meio tempo (o timestamp é
 * persistido em AsyncStorage, não só em memória, e o check roda de novo
 * no mount, cobrindo o cold start).
 */
export function useInactivityLogout(): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkAndLogoutIfExpired(deps);

    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (appState.current === "active" && next.match(/inactive|background/)) {
          AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
        }

        if (appState.current.match(/inactive|background/) && next === "active") {
          checkAndLogoutIfExpired(deps);
        }

        appState.current = next;
      }
    );

    return () => subscription.remove();
  }, []);
}
