import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, Idea, TaskStatus, TaskPriority, IdeaStatus } from '@/types';
import { mockTasks, mockIdeas } from '@/data/mockData';

interface AppContextType {
  tasks: Task[];
  ideas: Idea[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
      completedAt: null,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const isCompleting = task.status !== 'done';
          return {
            ...task,
            status: isCompleting ? 'done' : 'to-do',
            completedAt: isCompleting ? new Date() : null,
          };
        }
        return task;
      })
    );
  };

  const addIdea = (idea: Omit<Idea, 'id' | 'createdAt'>) => {
    const newIdea: Idea = {
      ...idea,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setIdeas((prev) => [...prev, newIdea]);
  };

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === id ? { ...idea, ...updates } : idea))
    );
  };

  const deleteIdea = (id: string) => {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        ideas,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addIdea,
        updateIdea,
        deleteIdea,
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
