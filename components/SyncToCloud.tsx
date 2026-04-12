import {
  cancelPendingCloudSyncEnable,
  disableCloudSync,
  enableCloudSync,
} from "@/services/syncRepository";
import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuth, useOAuth, useUser } from "@clerk/clerk-expo";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const POST_SIGN_IN_DELAY = 1200;

// ─── Sub-Components (memoized) ────────────────────────────────────────────────

const ErrorBox = React.memo(
  ({
    error,
    cloudSyncStatus,
    onDismiss,
  }: {
    error: string;
    cloudSyncStatus: string;
    onDismiss: () => void;
  }) => (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  ),
);

const AuthModal = React.memo(
  ({
    visible,
    onClose,
    onSignIn,
  }: {
    visible: boolean;
    onClose: () => void;
    onSignIn: () => void;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sign In to Sync</Text>
          <Text style={styles.modalSubtitle}>
            Back up your habits to the cloud. Your app still works fully
            offline.
          </Text>
          <TouchableOpacity style={styles.googleButton} onPress={onSignIn}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  ),
);

// ─── Main Component ───────────────────────────────────────────────────────────

function SyncToCloudInner() {
  const { isSignedIn, isLoaded, getToken, signOut } = useAuth();
  const { user } = useUser();
  const googleOAuth = useOAuth({ strategy: "oauth_google" });

  const cloudSyncEnabled = useSettingsStore((s) => s.cloudSyncEnabled);
  const cloudSyncStatus = useSettingsStore((s) => s.cloudSyncStatus);

  const [syncing, setSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const justSignedIn = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─── Sync Logic ─────────────────────────────────────────────────────────────

  const performSync = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setSyncing(true);
    setSyncError(null);

    try {
      const token = await getToken({ template: "convex" });
      if (!token) {
        throw new Error(
          "No Convex JWT token. Check Clerk JWT template named 'convex'.",
        );
      }

      await enableCloudSync();

      if (isMounted.current) {
        Alert.alert("Sync Complete", "Cloud sync is enabled for this account.");
      }
    } catch (error: any) {
      if (isMounted.current) {
        const message = error?.message ?? "Could not enable cloud sync";
        setSyncError(message);
        console.error("[SyncToCloud] sync failed", error);
      }
    } finally {
      if (isMounted.current) {
        setSyncing(false);
      }
    }
  }, [getToken, isLoaded, isSignedIn]);

  // Auto-sync after fresh sign-in
  useEffect(() => {
    if (!isSignedIn || !justSignedIn.current) return;
    justSignedIn.current = false;

    const timer = setTimeout(() => {
      void performSync();
    }, POST_SIGN_IN_DELAY);

    return () => clearTimeout(timer);
  }, [isSignedIn, performSync]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSignIn = useCallback(async () => {
    try {
      setSyncError(null);
      const { createdSessionId, setActive } =
        await googleOAuth.startOAuthFlow();

      if (!createdSessionId || !setActive) {
        Alert.alert("Sign In", "Could not complete sign in.");
        return;
      }

      await setActive({ session: createdSessionId });
      justSignedIn.current = true;
      setShowAuthModal(false);
    } catch (error: any) {
      const message =
        error?.errors?.[0]?.message || error?.message || "Unknown error";
      if (isMounted.current) {
        setSyncError(message);
        Alert.alert("Sign In Failed", message);
      }
    }
  }, [googleOAuth]);

  const handleSyncPress = useCallback(async () => {
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    await performSync();
  }, [isSignedIn, performSync]);

  const handleTurnOffSync = useCallback(async () => {
    try {
      await disableCloudSync();
      await signOut();
      if (isMounted.current) {
        setSyncError(null);
      }
    } catch (error: any) {
      if (isMounted.current) {
        const message = error?.message ?? "Could not disable cloud sync";
        setSyncError(message);
        Alert.alert("Cloud Sync", message);
      }
    }
  }, [signOut]);

  const handleSignOutPress = useCallback(() => {
    Alert.alert(
      "Turn Off Cloud Sync",
      "Local data stays on device. Cloud sync will be disabled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Turn Off",
          style: "destructive",
          onPress: () => void handleTurnOffSync(),
        },
      ],
    );
  }, [handleTurnOffSync]);

  const handleDismissError = useCallback(() => {
    setSyncError(null);
    if (cloudSyncStatus === "migrating") {
      void cancelPendingCloudSyncEnable();
    }
  }, [cloudSyncStatus]);

  const handleCloseModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  // ─── Derived values ─────────────────────────────────────────────────────────

  const busy = syncing || cloudSyncStatus === "migrating";

  const label = cloudSyncEnabled
    ? "Sync Enabled"
    : isSignedIn
      ? "Sync Now"
      : "Sync to Cloud";

  const email = user?.emailAddresses[0]?.emailAddress;

  const buttonStyle = useMemo(
    () => [
      styles.syncButton,
      cloudSyncEnabled ? styles.syncButtonActive : styles.syncButtonInactive,
    ],
    [cloudSyncEnabled],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handleSyncPress}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.syncButtonContent}>
            <Text style={styles.syncButtonText}>{label}</Text>
            {isSignedIn && email ? (
              <Text style={styles.syncSubtext}>{email}</Text>
            ) : null}
          </View>
        )}
      </TouchableOpacity>

      {isSignedIn ? (
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOutPress}
        >
          <Text style={styles.signOutText}>Sign out of cloud sync</Text>
        </TouchableOpacity>
      ) : null}

      {syncError ? (
        <ErrorBox
          error={syncError}
          cloudSyncStatus={cloudSyncStatus}
          onDismiss={handleDismissError}
        />
      ) : null}

      <AuthModal
        visible={showAuthModal}
        onClose={handleCloseModal}
        onSignIn={handleSignIn}
      />
    </View>
  );
}

export const SyncToCloud = React.memo(SyncToCloudInner);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  syncButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
  },
  syncButtonActive: {
    backgroundColor: "#22C55E",
  },
  syncButtonInactive: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  syncButtonContent: {
    alignItems: "center",
  },
  syncButtonText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
  },
  syncSubtext: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },
  signOutButton: {
    padding: 8,
    alignItems: "center",
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: "#7F1D1D",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    lineHeight: 18,
  },
  dismissText: {
    color: "#F87171",
    fontWeight: "600",
    marginTop: 8,
    textAlign: "right",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F8FAFC",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  googleButton: {
    backgroundColor: "#22C55E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 14,
  },
});