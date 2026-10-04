export type TaskSubtask = { id: string; title: string; completed: boolean };
export type Task = { id: string; title: string; notes: string; dueDate: string; reminderAt: string | null; notificationId: string | null; priority: 'none' | 'low' | 'medium' | 'high'; completed: boolean; createdAt: string; listName: string; subtasks: TaskSubtask[] };
export type TaskDraft = { id?:string; title:string; notes:string; dueDate:string; reminderAt:string|null; priority:Task['priority']; listName:string; subtasks?:TaskSubtask[] };
