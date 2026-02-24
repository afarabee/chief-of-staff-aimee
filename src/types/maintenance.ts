export interface MaintenanceEvent {
  enrichmentId: string;
  suggestionIndex: number;
  name: string;
  assetId: string;
  assetName: string;
  frequency: { interval: number; unit: string } | null;
  recommendedDueDate: string | null;
  nextDueDate: string | null;
  calendarLink: string | null;
  calendarEventId: string | null;
  lastCompleted: string | null;
  status: 'overdue' | 'upcoming' | 'scheduled' | 'completed';
  bundledItems?: string[];
  providerName?: string;
}

export interface MaintenanceCompletion {
  id: string;
  name: string;
  assetId: string | null;
  dateCompleted: string | null;
}
