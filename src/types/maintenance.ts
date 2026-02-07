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
  { value: 'custom', label: 'Custom…' },
] as const;

export const RECURRENCE_UNITS = [
  { value: 'd', label: 'days' },
  { value: 'm', label: 'months' },
  { value: 'y', label: 'years' },
] as const;

export function isPresetRecurrence(rule: string | null): boolean {
  if (!rule) return true;
  return RECURRENCE_OPTIONS.some((o) => o.value === rule && o.value !== 'custom');
}

export function recurrenceLabel(rule: string | null): string | null {
  if (!rule) return null;
  const found = RECURRENCE_OPTIONS.find((o) => o.value === rule && o.value !== 'custom');
  if (found) return found.label;
  // Parse custom rule like "10d", "2m", "5y"
  const match = rule.match(/^(\d+)([dmy])$/);
  if (match) {
    const n = match[1];
    const unit = match[2] === 'd' ? 'days' : match[2] === 'm' ? 'months' : 'years';
    return `Every ${n} ${unit}`;
  }
  return rule;
}
