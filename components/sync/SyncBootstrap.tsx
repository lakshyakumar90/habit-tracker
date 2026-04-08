import { useEffect } from "react";
import { useQuery } from "convex/react";
import { authClient } from "@/services/auth";
import { syncFunctions } from "@/services/convexFunctions";
import { applySnapshotToStores } from "@/services/snapshot";
import { resumePendingCloudSyncEnable } from "@/services/syncRepository";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function SyncBootstrap() {
  const cloudSyncEnabled = useSettingsStore((state) => state.cloudSyncEnabled);
  const session = authClient.useSession();
  const sessionId = session.data?.session?.id;
  const snapshot = useQuery(
    syncFunctions.getSnapshot,
    cloudSyncEnabled ? {} : "skip",
  );

  useEffect(() => {
    if (session.data?.user) {
      useSettingsStore.getState().setAuthUserSummary({
        name: session.data.user.name,
        email: session.data.user.email,
        image: session.data.user.image ?? null,
      });
    }
  }, [session.data?.user]);

  useEffect(() => {
    if (!sessionId) return;
    void resumePendingCloudSyncEnable();
  }, [sessionId]);

  useEffect(() => {
    if (!cloudSyncEnabled || !snapshot) return;
    applySnapshotToStores(snapshot);
    useSettingsStore.getState().markSyncCompleted();
  }, [cloudSyncEnabled, snapshot]);

  return null;
}
