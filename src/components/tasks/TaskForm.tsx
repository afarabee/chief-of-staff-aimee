import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Lightbulb, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useEnrichAndSave } from '@/hooks/useEnrichAndSave';
import { Task, TaskStatus, TaskPriority } from '@/types';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'to-do', label: 'To-Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusBadgeColors: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  'to-do': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'in-progress': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  blocked: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { addTask, updateTask, deleteTask, convertTaskToIdea } = useApp();
  const isMobile = useIsMobile();
  const { data: categories = [] } = useCategories();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate || undefined);
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'to-do');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [categoryId, setCategoryId] = useState<string | null>(task?.categoryId || null);
  const [imageUrl, setImageUrl] = useState<string | null>(task?.imageUrl || null);
  const { enrich, isEnriching } = useEnrichAndSave();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (task) {
      updateTask(task.id, {
        title, description,
        dueDate: dueDate || null,
        status, priority, categoryId, imageUrl,
      });
    } else {
      addTask({
        title, description,
        dueDate: dueDate || null,
        status, priority, categoryId, imageUrl,
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
            placeholder="Enter task title..."
            autoFocus={!isMobile}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label>Attachment</Label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Due Date</Label>
              {dueDate && (
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => setDueDate(undefined)}>
                  Clear
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions={false}>
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
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

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={isEnriching || !title.trim()}
          onClick={() => {
            const itemData = { title, description, status, priority, due_date: dueDate?.toISOString().split('T')[0] || null };
            enrich({
              itemType: 'task',
              itemTitle: title,
              itemData,
              itemId: task?.id,
              onSaveNew: async () => {
                const { data, error } = await (await import('@/integrations/supabase/client')).supabase
                  .from('cos_tasks')
                  .insert({ title, description, status, priority, due_date: dueDate?.toISOString().split('T')[0] || null, category_id: categoryId })
                  .select('id')
                  .single();
                if (error) throw error;
                return data.id;
              },
              onSaveExisting: async () => {
                if (task) updateTask(task.id, { title, description, dueDate: dueDate || null, status, priority, categoryId, imageUrl });
              },
              onClose,
            });
          }}
        >
          {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isEnriching ? 'Enriching...' : 'Enrich with AI'}
        </Button>

        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            {task && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Convert to Idea
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Convert to Idea?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will convert "{task.title}" from a task to an idea. The task will be removed and a new idea will be created with the same details.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          convertTaskToIdea(task.id);
                          onClose();
                        }}
                      >
                        Convert
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{task.title}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteTask(task.id);
                          onClose();
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </div>
      </form>
  );
}
