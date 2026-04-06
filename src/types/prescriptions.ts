export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  prescriber: string | null;
  pharmacy: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
