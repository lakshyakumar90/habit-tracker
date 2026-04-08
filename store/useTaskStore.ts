import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "@/types";
import { generateId } from "@/utils/helpers";

interface TaskState {
  tasks: Task[];
  addTask: (title: string, date: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTasksForDate: (date: string) => Task[];
  getActiveTasks: () => Task[];
  getCompletedTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (title, date) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: generateId(),
              title,
              date,
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      getTasksForDate: (date) => get().tasks.filter((t) => t.date === date),
      getActiveTasks: () => get().tasks.filter((t) => !t.completed),
      getCompletedTasks: () => get().tasks.filter((t) => t.completed),
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);