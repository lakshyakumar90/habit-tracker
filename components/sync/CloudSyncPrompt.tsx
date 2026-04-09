import { getAppTheme } from "@/constants/appThemes";
import { settingsRepository } from "@/services/settingsRepository";
import {
    cancelPendingCloudSyncEnable,
    enableCloudSync,
} from "@/services/syncRepository";
import { useSettingsStore } from "@/store/useSettingsStore";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function CloudSyncPrompt() {
  const [dismissed, setDismissed] = React.useState(false);
  const {
    _hasHydrated,
    hasSeenSyncPrompt,
    cloudSyncEnabled,
    cloudSyncStatus,
    lastSyncError,
    theme,
  } = useSettingsStore();
  const appTheme = getAppTheme(theme);

  const visible =
    _hasHydrated &&
    !hasSeenSyncPrompt &&
    !cloudSyncEnabled &&
    cloudSyncStatus !== "migrating";

  const handleDismiss = async () => {
    if (cloudSyncStatus === "migrating") {
      await cancelPendingCloudSyncEnable();
    }

    setDismissed(true);
    settingsRepository.setHasSeenSyncPrompt(true);
  };

  React.useEffect(() => {
    if (hasSeenSyncPrompt || cloudSyncEnabled) {
      setDismissed(false);
    }
  }, [hasSeenSyncPrompt, cloudSyncEnabled]);

  const handleEnable = async () => {
    try {
      await enableCloudSync();
    } catch {
      // Store already tracks the error state.
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={(visible || cloudSyncStatus === "migrating") && !dismissed}
      onRequestClose={() => {
        void handleDismiss();
      }}
    >
      <Pressable
        className="flex-1 bg-black/70 items-center justify-center px-6"
        onPress={() => {
          void handleDismiss();
        }}
      >
        <TouchableWithoutFeedback>
          <View
            className="w-full rounded-3xl border p-6"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
          >
            <Text className="text-white text-2xl font-bold mb-2">
              Keep your data safe
            </Text>
            <Text className="text-textMuted text-base mb-5">
              Cloud sync is optional. Enable it only if you want realtime
              backup, Google sign-in, and sync across devices.
            </Text>

            <View className="gap-2 mb-6">
              <Text className="text-textSecondary">Sync across devices</Text>
              <Text className="text-textSecondary">
                Realtime backup with Convex
              </Text>
              <Text className="text-textSecondary">
                Google sign-in only when you opt in
              </Text>
            </View>

            {cloudSyncStatus === "migrating" ? (
              <View className="items-center py-4">
                <ActivityIndicator color={appTheme.primary} />
                <Text className="text-textMuted mt-3">
                  Connecting your account and migrating local data...
                </Text>
              </View>
            ) : (
              <>
                {!!lastSyncError && (
                  <Text className="text-red-400 text-sm mb-4">
                    {lastSyncError}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleEnable}
                  className="rounded-2xl py-4 items-center mb-3"
                  style={{ backgroundColor: appTheme.primary }}
                  activeOpacity={0.8}
                >
                  <Text className="text-black font-bold text-base">
                    Enable Cloud Sync
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    void handleDismiss();
                  }}
                  className="border border-cardBorder rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold">Skip for now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}
