import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateFileName = (file: File) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).slice(2, 10);
    const ext = file.name.split('.').pop() || 'jpg';
    return `${timestamp}-${randomString}.${ext}`;
  };

  const uploadFile = async (file: File) => {
    if (!isAcceptedFile(file)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image, PDF, Word, or Excel file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = generateFileName(file);
      const filePath = `attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({
        title: 'File uploaded',
        description: 'Your file has been attached.',
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    e.target.value = '';
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (isAcceptedFile(item as unknown as File) || item.type.startsWith('image/') || item.type === 'application/pdf') {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isAcceptedFile(file)) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      const url = new URL(value);
      const pathMatch = url.pathname.match(/\/attachments\/(.+)$/);
      if (pathMatch) {
        const filePath = `attachments/${pathMatch[1]}`;
        await supabase.storage.from('attachments').remove([filePath]);
      }
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
    }

    onChange(null);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const form = container.closest('form');
      if (form && form.contains(activeElement)) {
        handlePaste(e);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [handlePaste]);

  if (value) {
    const isDoc = isDocumentUrl(value);
    return (
      <div className={cn('relative group', className)} ref={containerRef}>
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
          {isDoc ? (
            <div className="flex items-center gap-2 px-3 py-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">
                {decodeURIComponent(value.split('/').pop() || 'file.pdf')}
              </span>
            </div>
          ) : (
            <img
              src={value}
              alt="Attachment"
              className="w-full h-32 object-cover"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        isUploading && 'pointer-events-none opacity-60',
        className
      )}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        className="hidden"
      />
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
              Images, PDFs & Office docs — click, drag, or paste
            </p>
          </>
        )}
      </div>
    </div>
  );
}
