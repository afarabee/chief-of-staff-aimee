import { useState } from 'react';
import { Idea, IdeaStatus } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const { addIdea, updateIdea } = useApp();
  const [title, setTitle] = useState(idea?.title || '');
  const [description, setDescription] = useState(idea?.description || '');
  const [status, setStatus] = useState<IdeaStatus>(idea?.status || 'new');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    if (idea) {
      updateIdea(idea.id, {
        title,
        description,
        status,
      });
    } else {
      addIdea({
        title,
        description,
        status,
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
          rows={4}
        />
      </div>

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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          {idea ? 'Update' : 'Create'} Idea
        </Button>
      </div>
    </form>
  );
}
