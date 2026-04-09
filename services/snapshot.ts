import { AppSettings, SyncSnapshot } from "@/types";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTaskStore } from "@/store/useTaskStore";
import { getNowIso } from "@/utils/timestamps";

const syncedSettingKeys: (keyof AppSettings)[] = [
  "theme",
  "remindersEnabled",
  "celebrationsEnabled",
  "soundEnabled",
  "confettiEnabled",
  "tickSoundEnabled",
  "tickSound",
  "celebrationSound",
  "celebrationVolume",
];

export const buildLocalSnapshot = (): SyncSnapshot => {
  const habitState = useHabitStore.getState();
  const taskState = useTaskStore.getState();
  const settingsState = useSettingsStore.getState();

  return {
    habits: habitState.habits,
    logs: habitState.exportLogs(),
    taskLists: taskState.taskLists,
    tasks: taskState.tasks,
    settings: syncedSettingKeys.reduce<Partial<AppSettings>>((acc, key) => {
      (acc as any)[key] = settingsState[key];
      return acc;
    }, {}),
    syncedAt: getNowIso(),
  };
};

export const applySnapshotToStores = (snapshot: SyncSnapshot) => {
  useHabitStore.getState().applySnapshot(snapshot);
  useTaskStore.getState().applySnapshot(snapshot);
  useSettingsStore.getState().applyCloudSettings(snapshot.settings);
};
