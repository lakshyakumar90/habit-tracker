import {
    refreshCloudSnapshot,
    resumePendingCloudSyncEnable,
} from "@/services/syncRepository";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { AppState } from "react-native";

export default function SyncBootstrap() {
  const cloudSyncEnabled = useSettingsStore((state) => state.cloudSyncEnabled);
  const cloudSyncStatus = useSettingsStore((state) => state.cloudSyncStatus);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const sessionId = user?.id;

  useEffect(() => {
    if (user) {
      useSettingsStore.getState().setAuthUserSummary({
        name: user.fullName ?? user.username ?? undefined,
        email: user.primaryEmailAddress?.emailAddress,
        image: user.imageUrl ?? null,
      });
      return;
    }

    if (!isSignedIn || !cloudSyncEnabled) {
      useSettingsStore.getState().setAuthUserSummary(undefined);
    }
  }, [cloudSyncEnabled, isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      if (cloudSyncStatus === "migrating") {
        useSettingsStore.getState().setCloudSyncStatus("local");
      }
      return;
    }

    if (!sessionId) return;

    const timer = setTimeout(() => {
      void resumePendingCloudSyncEnable();
    }, 1200);

    return () => clearTimeout(timer);
  }, [cloudSyncStatus, isLoaded, isSignedIn, sessionId]);

  useEffect(() => {
    if (!cloudSyncEnabled || !isLoaded || !isSignedIn) return;
    void refreshCloudSnapshot();
  }, [cloudSyncEnabled, isLoaded, isSignedIn, sessionId]);

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
