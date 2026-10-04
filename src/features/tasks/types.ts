export type Task = { id: string; title: string; notes: string; dueDate: string; reminderAt: string | null; notificationId: string | null; priority: 'low' | 'medium' | 'high'; completed: boolean; createdAt: string };
export type TaskDraft = { id?:string; title:string; notes:string; dueDate:string; reminderAt:string|null; priority:Task['priority'] };
