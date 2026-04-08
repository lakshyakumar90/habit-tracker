import { Alert } from "react-native";
import { authClient, signInWithGoogle } from "./auth";
import { convex } from "./convex";
import { syncFunctions } from "./convexFunctions";
import { applySnapshotToStores, buildLocalSnapshot } from "./snapshot";
import { useSettingsStore } from "@/store/useSettingsStore";

const setError = (message: string) => {
  useSettingsStore.getState().setCloudSyncStatus("error", message);
};

let enableInFlight: Promise<void> | null = null;

const finishEnableCloudSync = async () => {
  if (enableInFlight) {
    return enableInFlight;
  }

  enableInFlight = (async () => {
    const settings = useSettingsStore.getState();
    const activeSession = await authClient.getSession();
    if (!activeSession.data?.session) {
      throw new Error("Google sign-in did not complete.");
    }

    settings.setAuthUserSummary({
      name: activeSession.data?.user?.name,
      email: activeSession.data?.user?.email,
      image: activeSession.data?.user?.image ?? null,
    });

    await convex.mutation(syncFunctions.upsertViewerProfile, {});
    const cloudPreSnapshot = await convex.query(syncFunctions.getSnapshot, {});
    const localSnapshot = buildLocalSnapshot();

    const hasCloudData = cloudPreSnapshot.habits.length > 0 || cloudPreSnapshot.logs.length > 0;
    const hasLocalData = localSnapshot.habits.length > 0 || localSnapshot.logs.length > 0;

    if (hasCloudData && hasLocalData) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Cloud Profile Found",
          "There is already data saved under this account. Continuing will load that profile and your current local data may be lost or overridden. Do you want to continue?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Yes, Load Profile", style: "destructive", onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirmed) {
        // user aborted
        settings.setCloudSyncStatus("idle");
        // Sign out so they can try another account or stay local
        await authClient.signOut();
        settings.setAuthUserSummary(null);
        return;
      }
    }

    const finalCloudSnapshot = await convex.mutation(syncFunctions.enableSync, {
      snapshot: localSnapshot,
    });
    applySnapshotToStores(finalCloudSnapshot);
    useSettingsStore.getState().markSyncCompleted();
  })();

  try {
    await enableInFlight;
  } finally {
    enableInFlight = null;
  }
};

export const enableCloudSync = async () => {
  const settings = useSettingsStore.getState();
  settings.setCloudSyncStatus("migrating");
  settings.setHasSeenSyncPrompt(true);

  try {
    const session = await authClient.getSession();
    if (!session.data?.session) {
      await signInWithGoogle();
      return;
    }
    await finishEnableCloudSync();
  } catch (error) {
    console.error("Enable cloud sync failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to enable cloud sync.",
    );
    throw error;
  }
};

export const resumePendingCloudSyncEnable = async () => {
  const settings = useSettingsStore.getState();
  if (settings.cloudSyncEnabled || settings.cloudSyncStatus !== "migrating") {
    return;
  }

  const session = await authClient.getSession();
  if (!session.data?.session) {
    return;
  }

  try {
    await finishEnableCloudSync();
  } catch (error) {
    console.error("Resume cloud sync failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to resume cloud sync.",
    );
  }
};

export const disableCloudSync = async () => {
  const settings = useSettingsStore.getState();
  settings.setCloudSyncStatus("migrating");

  try {
    const snapshot = await convex.query(syncFunctions.disableSync, {});
    applySnapshotToStores(snapshot);
    useSettingsStore.getState().setCloudSyncEnabled(false);
  } catch (error) {
    console.error("Disable cloud sync failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to disable cloud sync.",
    );
    throw error;
  }
};
