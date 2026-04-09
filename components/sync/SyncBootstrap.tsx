import { authClient } from "@/services/auth";
import {
  refreshCloudSnapshot,
  resumePendingCloudSyncEnable,
} from "@/services/syncRepository";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect } from "react";
import { AppState } from "react-native";

export default function SyncBootstrap() {
  const cloudSyncEnabled = useSettingsStore((state) => state.cloudSyncEnabled);
  const session = authClient.useSession();
  const sessionId = session.data?.session?.id;

  useEffect(() => {
    if (session.data?.user) {
      useSettingsStore.getState().setAuthUserSummary({
        name: session.data.user.name,
        email: session.data.user.email,
        image: session.data.user.image ?? null,
      });
      return;
    }

    if (!cloudSyncEnabled) {
      useSettingsStore.getState().setAuthUserSummary(undefined);
    }
  }, [cloudSyncEnabled, session.data?.user]);

  useEffect(() => {
    if (!sessionId) return;
    void resumePendingCloudSyncEnable();
  }, [sessionId]);

  useEffect(() => {
    if (!cloudSyncEnabled) return;
    void refreshCloudSnapshot();
  }, [cloudSyncEnabled, sessionId]);

  useEffect(() => {
    if (!cloudSyncEnabled) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshCloudSnapshot();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [cloudSyncEnabled]);

  return null;
}
