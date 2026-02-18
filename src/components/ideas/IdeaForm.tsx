import { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { EnrichWithAI } from '@/components/ai/EnrichWithAI';
import { Idea, IdeaStatus } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface IdeaFormProps {
  idea?: Idea;
  onClose: () => void;
}

const statusOptions: { value: IdeaStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'parked', label: 'Parked' },
  { value: 'done', label: 'Done' },
];

export function IdeaForm({ idea, onClose }: IdeaFormProps) {
  const { addIdea, updateIdea, convertIdeaToTask } = useApp();
  const { data: categories = [] } = useCategories();
  const [title, setTitle] = useState(idea?.title || '');
  const [description, setDescription] = useState(idea?.description || '');
  const [status, setStatus] = useState<IdeaStatus>(idea?.status || 'new');
  const [categoryId, setCategoryId] = useState<string | null>(idea?.categoryId || null);
  const [imageUrl, setImageUrl] = useState<string | null>(idea?.imageUrl || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    if (idea) {
      updateIdea(idea.id, {
        title,
        description,
        status,
        categoryId,
        imageUrl,
      });
    } else {
      addIdea({
        title,
        description,
        status,
        categoryId,
        imageUrl,
      });
    }
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter idea title..."
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your idea..."
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <Label>Attachment</Label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as IdeaStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={categoryId || 'none'} 
            onValueChange={(v) => setCategoryId(v === 'none' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {[...categories]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {idea && (
        <EnrichWithAI
          itemType="idea"
          item={{ id: idea.id, title, description, status }}
          existingSuggestions={idea.aiSuggestions || null}
          itemTitle={title}
          categoryId={categoryId}
        />
      )}

      <div className="flex justify-between pt-4">
        {idea && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Convert to Task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Convert to Task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will convert "{idea.title}" from an idea to a task. The idea will be removed and a new task will be created with the same details.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    convertIdeaToTask(idea.id);
                    onClose();
                  }}
                >
                  Convert
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            {idea ? 'Update' : 'Create'} Idea
          </Button>
        </div>
      </div>
    </form>
  );
}
