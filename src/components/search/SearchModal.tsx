import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Lightbulb } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type SearchScope = 'tasks' | 'ideas' | 'both';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [scope, setScope] = useState<SearchScope>('both');
  const { tasks, ideas } = useApp();
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const filteredTasks = scope === 'ideas' ? [] : tasks;
  const filteredIdeas = scope === 'tasks' ? [] : ideas;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center justify-center border-b px-3 py-2">
        <ToggleGroup
          type="single"
          value={scope}
          onValueChange={(v) => v && setScope(v as SearchScope)}
          size="sm"
        >
          <ToggleGroupItem value="tasks">Tasks</ToggleGroupItem>
          <ToggleGroupItem value="ideas">Ideas</ToggleGroupItem>
          <ToggleGroupItem value="both">Both</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <CommandInput placeholder="Search by title or description…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {filteredTasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {filteredTasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.title}-${task.description}`}
                onSelect={() => handleSelect(`/tasks?edit=${task.id}`)}
              >
                <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium">{task.title}</span>
                  {task.description && (
                    <span className="truncate text-xs text-muted-foreground">
                      {task.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {filteredIdeas.length > 0 && (
          <CommandGroup heading="Ideas">
            {filteredIdeas.map((idea) => (
              <CommandItem
                key={idea.id}
                value={`idea-${idea.title}-${idea.description}`}
                onSelect={() => handleSelect(`/ideas?edit=${idea.id}`)}
              >
                <Lightbulb className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium">{idea.title}</span>
                  {idea.description && (
                    <span className="truncate text-xs text-muted-foreground">
                      {idea.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
