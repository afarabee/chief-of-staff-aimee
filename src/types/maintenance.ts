export interface MaintenanceTask {
  id: string;
  name: string;
  assetId: string | null;
  assetName?: string;
  providerId: string | null;
  providerName?: string;
  dateCompleted: string | null;
  nextDueDate: string | null;
  cost: number | null;
  notes: string | null;
  attachmentUrl: string | null;
  recurrenceRule: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: '7d', label: 'Every 7 days' },
  { value: '14d', label: 'Every 14 days' },
  { value: '30d', label: 'Every 30 days' },
  { value: '3m', label: 'Every 3 months' },
  { value: '6m', label: 'Every 6 months' },
  { value: '1y', label: 'Every year' },
] as const;

export function recurrenceLabel(rule: string | null): string | null {
  if (!rule) return null;
  const found = RECURRENCE_OPTIONS.find((o) => o.value === rule);
  return found ? found.label : rule;
}
