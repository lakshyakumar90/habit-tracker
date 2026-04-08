import { SyncSnapshot, Task, TaskList } from "@/types";
import { generateId } from "@/utils/helpers";
import { getNowIso } from "@/utils/timestamps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  syncDeletedTask,
  syncDeletedTaskList,
  syncUpsertTask,
  syncUpsertTaskList,
} from "@/services/cloudSync";
import { useSettingsStore } from "./useSettingsStore";

interface TaskState {
  taskLists: TaskList[];
  tasks: Task[];
  selectedListId: string;
  addTaskList: (name: string) => void;
  setSelectedList: (listId: string) => void;
  addTask: (title: string, date: string, listId?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTasksForDate: (date: string, listId?: string) => Task[];
  getActiveTasks: (listId?: string) => Task[];
  getCompletedTasks: (listId?: string) => Task[];
  applySnapshot: (snapshot: Pick<SyncSnapshot, "taskLists" | "tasks">) => void;
}

const syncIfEnabled = async (operation: () => Promise<void>) => {
  const { cloudSyncEnabled } = useSettingsStore.getState();
  if (!cloudSyncEnabled) return;
  try {
    await operation();
  } catch (error) {
    console.error("Cloud task sync failed", error);
    useSettingsStore
      .getState()
      .setCloudSyncStatus("error", "Task data failed to sync.");
  }
};

const DEFAULT_TASK_LIST_ID = "default-my-tasks";

const defaultTaskList: TaskList = {
  id: DEFAULT_TASK_LIST_ID,
  name: "My Tasks",
  createdAt: getNowIso(),
  updatedAt: getNowIso(),
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      taskLists: [defaultTaskList],
      tasks: [],
      selectedListId: DEFAULT_TASK_LIST_ID,

      addTaskList: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const listId = generateId();
        const now = getNowIso();
        const list: TaskList = {
          id: listId,
          name: trimmed,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          taskLists: [...state.taskLists, list],
          selectedListId: listId,
        }));
        void syncIfEnabled(() => syncUpsertTaskList(list));
      },

      setSelectedList: (listId) => {
        set((state) => {
          if (!state.taskLists.some((list) => list.id === listId)) {
            return state;
          }
          return { selectedListId: listId };
        });
      },

      addTask: (title, date, listId) => {
        const now = getNowIso();
        let task: Task | undefined;
        set((state) => ({
          tasks: (() => {
            task = {
              id: generateId(),
              title,
              date,
              completed: false,
              listId: listId || state.selectedListId,
              createdAt: now,
              updatedAt: now,
            };
            return [...state.tasks, task];
          })(),
        }));
        if (task) {
          void syncIfEnabled(() => syncUpsertTask(task!));
        }
      },

      toggleTask: (id) => {
        const updatedAt = getNowIso();
        let updatedTask: Task | undefined;
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            updatedTask = {
              ...t,
              completed: !t.completed,
              updatedAt,
            };
            return updatedTask;
          }),
        }));
        if (updatedTask) {
          void syncIfEnabled(() => syncUpsertTask(updatedTask!));
        }
      },

      deleteTask: (id) => {
        const deletedAt = getNowIso();
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
        void syncIfEnabled(() => syncDeletedTask(id, deletedAt));
      },

      getTasksForDate: (date, listId) => {
        const activeListId = listId || get().selectedListId;
        return get().tasks.filter(
          (t) => t.date === date && t.listId === activeListId,
        );
      },
      getActiveTasks: (listId) => {
        const activeListId = listId || get().selectedListId;
        return get().tasks.filter(
          (t) => !t.completed && t.listId === activeListId,
        );
      },
      getCompletedTasks: (listId) => {
        const activeListId = listId || get().selectedListId;
        return get().tasks.filter(
          (t) => t.completed && t.listId === activeListId,
        );
      },
      applySnapshot: (snapshot) => {
        const taskLists =
          snapshot.taskLists.filter((list) => !list.deletedAt).length > 0
            ? snapshot.taskLists.filter((list) => !list.deletedAt)
            : [defaultTaskList];
        const selectedListId = taskLists.some(
          (list) => list.id === get().selectedListId,
        )
          ? get().selectedListId
          : taskLists[0]?.id ?? DEFAULT_TASK_LIST_ID;
        set({
          taskLists,
          tasks: snapshot.tasks.filter((task) => !task.deletedAt),
          selectedListId,
        });
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: any, version) => {
        if (!persistedState) {
          return {
            taskLists: [defaultTaskList],
            tasks: [],
            selectedListId: DEFAULT_TASK_LIST_ID,
          };
        }

        if (version < 2) {
          const legacyTasks = Array.isArray(persistedState.tasks)
            ? persistedState.tasks
            : [];

          return {
            ...persistedState,
            taskLists: [defaultTaskList],
            selectedListId: DEFAULT_TASK_LIST_ID,
            tasks: legacyTasks.map((task: Task) => ({
              ...task,
              listId: DEFAULT_TASK_LIST_ID,
            })),
          };
        }

        return persistedState;
      },
      partialize: (state) => ({
        taskLists: state.taskLists,
        tasks: state.tasks,
        selectedListId: state.selectedListId,
      }),
    },
  ),
);
