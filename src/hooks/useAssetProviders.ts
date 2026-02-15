import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LinkedProvider {
  id: string;
  name: string;
}

interface LinkedAsset {
  id: string;
  name: string;
}

export function useAssetProviders(assetId: string | undefined) {
  return useQuery({
    queryKey: ['asset-providers', assetId],
    enabled: !!assetId,
    queryFn: async (): Promise<LinkedProvider[]> => {
      const { data, error } = await supabase
        .from('asset_providers' as any)
        .select('provider_id, service_providers(id, name)')
        .eq('asset_id', assetId!);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.service_providers.id,
        name: row.service_providers.name,
      }));
    },
  });
}

export function useProviderAssets(providerId: string | undefined) {
  return useQuery({
    queryKey: ['provider-assets', providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<LinkedAsset[]> => {
      const { data, error } = await supabase
        .from('asset_providers' as any)
        .select('asset_id, assets(id, name)')
        .eq('provider_id', providerId!);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.assets.id,
        name: row.assets.name,
      }));
    },
  });
}

export function useLinkAssetProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, providerId }: { assetId: string; providerId: string }) => {
      const { error } = await supabase
        .from('asset_providers' as any)
        .insert({ asset_id: assetId, provider_id: providerId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-providers'] });
      qc.invalidateQueries({ queryKey: ['provider-assets'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Error linking', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUnlinkAssetProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, providerId }: { assetId: string; providerId: string }) => {
      const { error } = await supabase
        .from('asset_providers' as any)
        .delete()
        .eq('asset_id', assetId)
        .eq('provider_id', providerId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-providers'] });
      qc.invalidateQueries({ queryKey: ['provider-assets'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Error unlinking', description: e.message, variant: 'destructive' });
    },
  });
}
