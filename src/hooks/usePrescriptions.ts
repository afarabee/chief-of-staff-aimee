import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Prescription } from '@/types/prescriptions';

function mapRow(row: any): Prescription {
  return {
    id: row.id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    frequency: row.frequency,
    prescriber: row.prescriber,
    pharmacy: row.pharmacy,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions'],
    queryFn: async (): Promise<Prescription[]> => {
      const { data, error } = await (supabase as any)
        .from('prescriptions')
        .select('*')
        .order('is_active', { ascending: false })
        .order('medication_name');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rx: {
      medication_name: string;
      dosage?: string | null;
      frequency?: string | null;
      prescriber?: string | null;
      pharmacy?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      notes?: string | null;
      is_active?: boolean;
    }) => {
      const { data, error } = await (supabase as any).from('prescriptions').insert(rx).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({ title: 'Prescription added' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      medication_name?: string;
      dosage?: string | null;
      frequency?: string | null;
      prescriber?: string | null;
      pharmacy?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      notes?: string | null;
      is_active?: boolean;
    }) => {
      const { error } = await (supabase as any).from('prescriptions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({ title: 'Prescription updated' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeletePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('prescriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      toast({ title: 'Prescription deleted' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
