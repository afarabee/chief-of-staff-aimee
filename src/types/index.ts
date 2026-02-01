export type TaskStatus = 'backlog' | 'to-do' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type IdeaStatus = 'new' | 'in-progress' | 'parked' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  createdAt: Date;
}
