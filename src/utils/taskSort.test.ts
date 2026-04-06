import { describe, it, expect } from 'vitest';
import { sortTasksByDateAndPriority, PRIORITY_WEIGHT } from './taskSort';

describe('sortTasksByDateAndPriority', () => {
  const makeTask = (priority: string, dueDate?: Date | null) => ({ priority, dueDate: dueDate ?? null });

  it('sorts by due date ascending, nulls last', () => {
    const tasks = [
      makeTask('medium', null),
      makeTask('medium', new Date('2026-01-15')),
      makeTask('medium', new Date('2026-01-10')),
    ];
    const sorted = sortTasksByDateAndPriority(tasks);
    expect(sorted[0].dueDate?.toISOString()).toContain('2026-01-10');
    expect(sorted[1].dueDate?.toISOString()).toContain('2026-01-15');
    expect(sorted[2].dueDate).toBeNull();
  });

  it('sorts by priority when due dates are equal', () => {
    const date = new Date('2026-02-01');
    const tasks = [
      makeTask('low', date),
      makeTask('urgent', date),
      makeTask('high', date),
      makeTask('medium', date),
    ];
    const sorted = sortTasksByDateAndPriority(tasks);
    expect(sorted.map((t) => t.priority)).toEqual(['urgent', 'high', 'medium', 'low']);
  });

  it('sorts by priority when no due dates exist', () => {
    const tasks = [
      makeTask('low', null),
      makeTask('urgent', null),
      makeTask('medium', null),
    ];
    const sorted = sortTasksByDateAndPriority(tasks);
    expect(sorted.map((t) => t.priority)).toEqual(['urgent', 'medium', 'low']);
  });

  it('handles mixed dates and priorities', () => {
    const tasks = [
      makeTask('low', new Date('2026-01-20')),
      makeTask('urgent', null),
      makeTask('high', new Date('2026-01-10')),
      makeTask('medium', new Date('2026-01-10')),
    ];
    const sorted = sortTasksByDateAndPriority(tasks);
    // First: Jan 10 high, then Jan 10 medium (same date, priority tiebreak)
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    // Then Jan 20
    expect(sorted[2].priority).toBe('low');
    // Null date last
    expect(sorted[3].dueDate).toBeNull();
  });

  it('returns a new array without mutating the original', () => {
    const tasks = [makeTask('low'), makeTask('urgent')];
    const sorted = sortTasksByDateAndPriority(tasks);
    expect(sorted).not.toBe(tasks);
    expect(tasks[0].priority).toBe('low'); // original unchanged
  });

  it('handles empty array', () => {
    expect(sortTasksByDateAndPriority([])).toEqual([]);
  });
});

describe('PRIORITY_WEIGHT', () => {
  it('has correct weight ordering', () => {
    expect(PRIORITY_WEIGHT.urgent).toBeLessThan(PRIORITY_WEIGHT.high);
    expect(PRIORITY_WEIGHT.high).toBeLessThan(PRIORITY_WEIGHT.medium);
    expect(PRIORITY_WEIGHT.medium).toBeLessThan(PRIORITY_WEIGHT.low);
  });
});
