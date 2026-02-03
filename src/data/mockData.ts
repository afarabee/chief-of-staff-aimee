import { Task, Idea } from '@/types';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review Q1 budget proposal',
    description: 'Go through the finance teams budget proposal and provide feedback',
    dueDate: today,
    status: 'to-do',
    priority: 'high',
    categoryId: null,
    createdAt: twoDaysAgo,
    completedAt: null,
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Prepare board meeting slides',
    description: 'Create presentation for next weeks board meeting',
    dueDate: today,
    status: 'in-progress',
    priority: 'urgent',
    categoryId: null,
    createdAt: twoDaysAgo,
    completedAt: null,
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Send investor update email',
    description: 'Draft and send monthly investor newsletter',
    dueDate: yesterday,
    status: 'to-do',
    priority: 'high',
    categoryId: null,
    createdAt: twoDaysAgo,
    completedAt: null,
    imageUrl: null,
  },
  {
    id: '4',
    title: 'Review hiring pipeline',
    description: 'Check status of open positions and interview schedules',
    dueDate: twoDaysAgo,
    status: 'blocked',
    priority: 'medium',
    categoryId: null,
    createdAt: twoDaysAgo,
    completedAt: null,
    imageUrl: null,
  },
  {
    id: '5',
    title: 'Weekly team sync',
    description: 'Prepare agenda for weekly leadership sync',
    dueDate: tomorrow,
    status: 'backlog',
    priority: 'medium',
    categoryId: null,
    createdAt: today,
    completedAt: null,
    imageUrl: null,
  },
  {
    id: '6',
    title: 'Update OKRs dashboard',
    description: 'Refresh Q1 OKR progress metrics',
    dueDate: nextWeek,
    status: 'to-do',
    priority: 'low',
    categoryId: null,
    createdAt: today,
    completedAt: null,
    imageUrl: null,
  },
];

export const mockIdeas: Idea[] = [
  {
    id: '1',
    title: 'AI-powered meeting summaries',
    description: 'Implement automatic meeting transcription and summary generation for all leadership meetings',
    status: 'in-progress',
    categoryId: null,
    createdAt: twoDaysAgo,
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Employee wellness program',
    description: 'Launch a comprehensive wellness initiative including mental health days and fitness stipends',
    status: 'in-progress',
    categoryId: null,
    createdAt: yesterday,
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Cross-team collaboration tool',
    description: 'Evaluate and implement a new tool for better async collaboration between departments',
    status: 'new',
    categoryId: null,
    createdAt: today,
    imageUrl: null,
  },
  {
    id: '4',
    title: 'Quarterly hackathon',
    description: 'Organize internal hackathons to foster innovation and team bonding',
    status: 'parked',
    categoryId: null,
    createdAt: twoDaysAgo,
    imageUrl: null,
  },
  {
    id: '5',
    title: 'Customer advisory board',
    description: 'Create a formal customer advisory board for product feedback',
    status: 'new',
    categoryId: null,
    createdAt: today,
    imageUrl: null,
  },
];
