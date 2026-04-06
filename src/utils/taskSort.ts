export const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasksByDateAndPriority<T extends { dueDate?: Date | null; priority: string }>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    // Primary sort: due date (ascending, nulls last)
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    // Secondary sort: priority (urgent first)
    const aPri = PRIORITY_WEIGHT[a.priority] ?? 2;
    const bPri = PRIORITY_WEIGHT[b.priority] ?? 2;
    return aPri - bPri;
  });
}
