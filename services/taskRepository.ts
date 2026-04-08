import { useTaskStore } from "@/store/useTaskStore";

export const taskRepository = {
  addTaskList: (name: string) => useTaskStore.getState().addTaskList(name),
  addTask: (title: string, date: string, listId?: string) =>
    useTaskStore.getState().addTask(title, date, listId),
  toggleTask: (taskId: string) => useTaskStore.getState().toggleTask(taskId),
  deleteTask: (taskId: string) => useTaskStore.getState().deleteTask(taskId),
};
