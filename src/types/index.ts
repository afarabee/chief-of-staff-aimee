export type TaskStatus = 'backlog' | 'to-do' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type IdeaStatus = 'new' | 'in-progress' | 'parked' | 'done';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId: string | null;
  categoryName?: string;
  createdAt: Date;
  completedAt: Date | null;
  imageUrl: string | null;
  aiSuggestions?: string | null;
  parentTaskId?: string | null;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  categoryId: string | null;
  categoryName?: string;
  createdAt: Date;
  imageUrl: string | null;
  aiSuggestions?: string | null;
}
