import React, { createContext, useContext, ReactNode } from 'react';
import { Task, Idea, TaskStatus, IdeaStatus } from '@/types';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useIdeas, useCreateIdea, useUpdateIdea, useDeleteIdea } from '@/hooks/useIdeas';

interface AppContextType {
  tasks: Task[];
  ideas: Idea[];
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  convertIdeaToTask: (ideaId: string) => void;
  convertTaskToIdea: (taskId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Tasks hooks
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Ideas hooks
  const { data: ideas = [], isLoading: ideasLoading } = useIdeas();
  const createIdeaMutation = useCreateIdea();
  const updateIdeaMutation = useUpdateIdea();
  const deleteIdeaMutation = useDeleteIdea();

  const isLoading = tasksLoading || ideasLoading;

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
    createTaskMutation.mutate(task);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ id, updates });
  };

  const deleteTask = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const isCompleting = task.status !== 'done';
      updateTaskMutation.mutate({
        id,
        updates: {
          status: isCompleting ? 'done' : 'to-do',
        },
      });
    }
  };

  const addIdea = (idea: Omit<Idea, 'id' | 'createdAt'>) => {
    createIdeaMutation.mutate(idea);
  };

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    updateIdeaMutation.mutate({ id, updates });
  };

  const deleteIdea = (id: string) => {
    deleteIdeaMutation.mutate(id);
  };

  const convertIdeaToTask = (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    const statusMap: Record<IdeaStatus, TaskStatus> = {
      'new': 'to-do',
      'in-progress': 'in-progress',
      'parked': 'backlog',
      'done': 'done',
    };

    createTaskMutation.mutate({
      title: idea.title,
      description: idea.description,
      categoryId: idea.categoryId,
      status: statusMap[idea.status],
      priority: 'medium',
      dueDate: null,
    });

    deleteIdeaMutation.mutate(ideaId);
  };

  const convertTaskToIdea = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const statusMap: Record<TaskStatus, IdeaStatus> = {
      'backlog': 'parked',
      'to-do': 'new',
      'in-progress': 'in-progress',
      'blocked': 'parked',
      'done': 'done',
    };

    createIdeaMutation.mutate({
      title: task.title,
      description: task.description,
      categoryId: task.categoryId,
      status: statusMap[task.status],
    });

    deleteTaskMutation.mutate(taskId);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        ideas,
        isLoading,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addIdea,
        updateIdea,
        deleteIdea,
        convertIdeaToTask,
        convertTaskToIdea,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
