import { useSettingsStore } from "@/store/useSettingsStore";
import * as Network from "expo-network";
import { Alert } from "react-native";
import { convex, hasConfiguredConvexUrl } from "./convex";
import { syncFunctions } from "./convexFunctions";
import { applySnapshotToStores, buildLocalSnapshot } from "./snapshot";

const setError = (message: string) => {
  useSettingsStore.getState().setCloudSyncStatus("error", message);
};

const hasNetworkConnection = async () => {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
};

const canAccessCloudSync = async () => {
  if (!hasConfiguredConvexUrl) {
    setError("Cloud sync is not configured for this build.");
    return false;
  }

  if (!(await hasNetworkConnection())) {
    setError("No internet connection. We'll keep everything local for now.");
    return false;
  }

  return true;
};

let enableInFlight: Promise<void> | null = null;
let enableRunCounter = 0;
let activeEnableRunId: number | null = null;
const cancelledEnableRuns = new Set<number>();

const isRunCancelled = (runId: number) => cancelledEnableRuns.has(runId);

const finishEnableCloudSync = async (runId: number) => {
  if (enableInFlight) {
    return enableInFlight;
  }

  enableInFlight = (async () => {
    activeEnableRunId = runId;
    const settings = useSettingsStore.getState();
    if (isRunCancelled(runId)) {
      settings.setCloudSyncStatus("local");
      return;
    }

    await convex.mutation(syncFunctions.upsertViewerProfile, {});
    if (isRunCancelled(runId)) {
      settings.setCloudSyncStatus("local");
      return;
    }

    const cloudPreSnapshot = await convex.query(syncFunctions.getSnapshot, {});
    if (isRunCancelled(runId)) {
      settings.setCloudSyncStatus("local");
      return;
    }

    const localSnapshot = buildLocalSnapshot();

    const hasCloudData =
      cloudPreSnapshot.habits.length > 0 || cloudPreSnapshot.logs.length > 0;
    const hasLocalData =
      localSnapshot.habits.length > 0 || localSnapshot.logs.length > 0;

    if (hasCloudData && hasLocalData) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Cloud Profile Found",
          "There is already data saved under this account. Continuing will load that profile and your current local data may be lost or overridden. Do you want to continue?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Yes, Load Profile",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ],
        );
      });

      if (!confirmed) {
        // user aborted
        settings.setCloudSyncStatus("local");
        settings.setAuthUserSummary(undefined);
        return;
      }
    }

    const finalCloudSnapshot = await convex.mutation(syncFunctions.enableSync, {
      snapshot: localSnapshot,
    });
    if (isRunCancelled(runId)) {
      settings.setCloudSyncStatus("local");
      return;
    }

    applySnapshotToStores(finalCloudSnapshot);
    useSettingsStore.getState().markSyncCompleted();
  })();

  try {
    await enableInFlight;
  } finally {
    enableInFlight = null;
    if (activeEnableRunId === runId) {
      activeEnableRunId = null;
    }
    cancelledEnableRuns.delete(runId);
  }
};

export const enableCloudSync = async () => {
  const runId = ++enableRunCounter;
  cancelledEnableRuns.delete(runId);

  const settings = useSettingsStore.getState();
  settings.setCloudSyncStatus("migrating");
  settings.setHasSeenSyncPrompt(true);

  try {
    if (!(await canAccessCloudSync())) {
      settings.setCloudSyncStatus("local");
      return;
    }
    await finishEnableCloudSync(runId);
  } catch (error) {
    console.error("Enable cloud sync failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to enable cloud sync.",
    );
    throw error;
  }
};

export const resumePendingCloudSyncEnable = async () => {
  const runId = ++enableRunCounter;
  cancelledEnableRuns.delete(runId);

  const settings = useSettingsStore.getState();
  if (settings.cloudSyncEnabled || settings.cloudSyncStatus !== "migrating") {
    return;
  }

  try {
    if (!(await canAccessCloudSync())) {
      settings.setCloudSyncStatus("local");
      return;
    }
    await finishEnableCloudSync(runId);
  } catch (error) {
    console.error("Resume cloud sync failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to resume cloud sync.",
    );
  }
};

export const cancelPendingCloudSyncEnable = async () => {
  const settings = useSettingsStore.getState();

  if (activeEnableRunId !== null) {
    cancelledEnableRuns.add(activeEnableRunId);
  }

  settings.setCloudSyncStatus("local");
  settings.setAuthUserSummary(undefined);
};

export const disableCloudSync = async () => {
  const settings = useSettingsStore.getState();
  settings.setCloudSyncStatus("migrating");

  try {
    const snapshot = await convex.query(syncFunctions.disableSync, {});
    applySnapshotToStores(snapshot);
    useSettingsStore.getState().setCloudSyncEnabled(false);
    useSettingsStore.getState().setAuthUserSummary(undefined);
  } catch (error) {
    console.error("Disable cloud sync failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to disable cloud sync.",
    );
    throw error;
  }
};

let refreshInFlight: Promise<boolean> | null = null;

export const refreshCloudSnapshot = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const settings = useSettingsStore.getState();
    if (!settings.cloudSyncEnabled) return false;
    if (!(await canAccessCloudSync())) return false;

    const snapshot = await convex.mutation(syncFunctions.enableSync, {
      snapshot: buildLocalSnapshot(),
    });
    applySnapshotToStores(snapshot);
    useSettingsStore.getState().markSyncCompleted();
    return true;
  })();

  try {
    return await refreshInFlight;
  } catch (error) {
    console.error("Refresh cloud snapshot failed", error);
    setError(
      error instanceof Error ? error.message : "Unable to refresh cloud data.",
    );
    return false;
  } finally {
    refreshInFlight = null;
  }
};
