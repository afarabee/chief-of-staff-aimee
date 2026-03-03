import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AssetAttachment {
  id: string;
  assetId: string;
  fileUrl: string;
  displayName: string;
  createdAt: string | null;
}

function mapRow(row: any): AssetAttachment {
  return {
    id: row.id,
    assetId: row.asset_id,
    fileUrl: row.file_url,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

export function useAssetAttachments(assetId: string | undefined) {
  return useQuery({
    queryKey: ['asset-attachments', assetId],
    enabled: !!assetId,
    queryFn: async (): Promise<AssetAttachment[]> => {
      const { data, error } = await supabase
        .from('asset_attachments')
        .select('*')
        .eq('asset_id', assetId!)
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateAssetAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachment: { asset_id: string; file_url: string; display_name: string }) => {
      const { data, error } = await supabase.from('asset_attachments').insert(attachment).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['asset-attachments', vars.asset_id] });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAssetAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, display_name }: { id: string; asset_id: string; display_name: string }) => {
      const { error } = await supabase.from('asset_attachments').update({ display_name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['asset-attachments', vars.asset_id] });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAssetAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, file_url }: { id: string; asset_id: string; file_url: string }) => {
      // Delete from storage
      try {
        const url = new URL(file_url);
        const pathMatch = url.pathname.match(/\/attachments\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('attachments').remove([`attachments/${pathMatch[1]}`]);
        }
      } catch {}
      // Delete row
      const { error } = await supabase.from('asset_attachments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['asset-attachments', vars.asset_id] });
      toast({ title: 'Attachment removed' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
