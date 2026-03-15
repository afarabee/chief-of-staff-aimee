import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ParsedAssetData {
  name: string;
  description?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
  category_hint?: string | null;
}

export function useParseAssetDocument() {
  return useMutation({
    mutationFn: async (fileUrl: string): Promise<ParsedAssetData> => {
      const { data, error } = await supabase.functions.invoke('parse-asset-document', {
        body: { file_url: fileUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.parsed) throw new Error('No data extracted');

      return data.parsed as ParsedAssetData;
    },
    onError: (error) => {
      toast({
        title: 'Failed to parse document',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
