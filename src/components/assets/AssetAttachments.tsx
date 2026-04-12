import { useState } from 'react';
import { Upload, X, Loader2, FileText, ImageIcon, Pencil, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  useAssetAttachments,
  useCreateAssetAttachment,
  useUpdateAssetAttachment,
  useDeleteAssetAttachment,
} from '@/hooks/useAssetAttachments';

const MAX_ATTACHMENTS = 3;

const ACCEPTED_TYPES = [
  'image/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function isAcceptedFile(file: File) {
  return ACCEPTED_TYPES.some((t) => file.type.startsWith(t));
}

const DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

function isDocumentUrl(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return DOC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

function defaultDisplayName(file: File) {
  return file.name.replace(/\.[^/.]+$/, '');
}

interface AssetAttachmentsProps {
  assetId: string;
  className?: string;
}

export function AssetAttachments({ assetId, className }: AssetAttachmentsProps) {
  const { data: attachments = [], isLoading } = useAssetAttachments(assetId);
  const createAttachment = useCreateAssetAttachment();
  const updateAttachment = useUpdateAssetAttachment();
  const deleteAttachment = useDeleteAssetAttachment();

  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  const uploadFile = async (file: File) => {
    if (!isAcceptedFile(file)) {
      toast({ title: 'Invalid file type', description: 'Please upload an image, PDF, Word, or Excel file.', variant: 'destructive' });
      return;
    }
    if (!canAddMore) {
      toast({ title: 'Limit reached', description: `Maximum ${MAX_ATTACHMENTS} attachments per asset.`, variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).slice(2, 10);
      const ext = file.name.split('.').pop() || 'bin';
      const fileName = `${timestamp}-${randomString}.${ext}`;
      const filePath = `attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);

      await createAttachment.mutateAsync({
        asset_id: assetId,
        file_url: publicUrl,
        display_name: defaultDisplayName(file),
      });

      toast({ title: 'File uploaded' });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && isAcceptedFile(file)) uploadFile(file);
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      updateAttachment.mutate({ id, asset_id: assetId, display_name: editingName.trim() });
    }
    setEditingId(null);
  };

  const handleRemove = (id: string, fileUrl: string) => {
    deleteAttachment.mutate({ id, asset_id: assetId, file_url: fileUrl });
  };

  if (isLoading) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {attachments.map((att) => {
        const isDoc = isDocumentUrl(att.fileUrl);
        const isEditing = editingId === att.id;

        return (
          <div key={att.id} className="relative group rounded-lg border border-border overflow-hidden bg-muted/30">
            <div className="flex items-center gap-2 px-3 py-2">
              {isDoc ? (
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              ) : (
                <img src={att.fileUrl} alt={att.displayName} className="h-10 w-10 rounded object-cover shrink-0" />
              )}

              {isEditing ? (
                <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-7 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && saveRename(att.id)}
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveRename(att.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-foreground truncate flex-1 min-w-0">{att.displayName}</span>
              )}

              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRename(att.id, att.displayName)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleRemove(att.id, att.fileUrl)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {canAddMore && (
        <label
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer block',
            'border-muted-foreground/25 hover:border-muted-foreground/50',
            isUploading && 'pointer-events-none opacity-60'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} className="hidden" />
          <div className="flex flex-col items-center justify-center py-3 px-4 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mb-1" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Add file ({attachments.length}/{MAX_ATTACHMENTS}) — click or drag
                </p>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}

/** Read-only display for the asset detail view */
export function AssetAttachmentsReadonly({ assetId }: { assetId: string }) {
  const { data: attachments = [], isLoading } = useAssetAttachments(assetId);

  if (isLoading || attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Attachments</p>
      {attachments.map((att) => {
        const isDoc = isDocumentUrl(att.fileUrl);
        return (
          <a
            key={att.id}
            href={att.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border p-2 hover:bg-muted/50 transition-colors"
          >
            {isDoc ? (
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <img src={att.fileUrl} alt={att.displayName} className="h-10 w-10 rounded object-cover shrink-0" />
            )}
            <span className="text-sm text-foreground truncate">{att.displayName}</span>
          </a>
        );
      })}
    </div>
  );
}
