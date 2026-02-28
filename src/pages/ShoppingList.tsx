import { useState, useMemo } from 'react';
import { ShoppingCart, X, Trash2, ListChecks, Plus } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useShoppingList,
  useAddShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from '@/hooks/useShoppingList';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ShoppingItem } from '@/types';

export default function ShoppingList() {
  usePageTitle('Shopping List');
  const { data: items = [], isLoading } = useShoppingList();
  const addItem = useAddShoppingItem();
  const toggleItem = useToggleShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();
  const { toast } = useToast();

  const [newItemName, setNewItemName] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('Shopping Run');
  const [creatingTask, setCreatingTask] = useState(false);

  const unchecked = useMemo(() => items.filter((i) => !i.checked), [items]);
  const checked = useMemo(() => items.filter((i) => i.checked), [items]);

  const handleAdd = () => {
    const name = newItemName.trim();
    if (!name) return;
    addItem.mutate(name);
    setNewItemName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const openTaskDialog = () => {
    setTaskTitle('Shopping Run');
    setTaskDialogOpen(true);
  };

  const handleCreateTask = async () => {
    const selectedItems = items.filter((i) => selected.has(i.id));
    if (selectedItems.length === 0) return;

    setCreatingTask(true);
    const description = selectedItems.map((i) => `- ${i.name}`).join('\n');

    const { error } = await (supabase as any).from('cos_tasks').insert({
      title: taskTitle.trim() || 'Shopping Run',
      description,
      status: 'to-do',
      priority: 'medium',
      category_id: null,
    });

    setCreatingTask(false);

    if (error) {
      toast({ title: 'Failed to create task', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Task created', description: `"${taskTitle}" with ${selectedItems.length} items` });
    setTaskDialogOpen(false);
    exitSelectMode();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Shopping List</h1>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <Button variant="ghost" size="sm" onClick={exitSelectMode}>
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectMode(true)}
              disabled={unchecked.length === 0}
            >
              <ListChecks className="h-4 w-4 mr-1.5" />
              Select
            </Button>
          )}
          {checked.length > 0 && !selectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearChecked.mutate()}
              disabled={clearChecked.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear Checked
            </Button>
          )}
        </div>
      </div>

      {/* Add item input */}
      {!selectMode && (
        <div className="flex gap-2">
          <Input
            placeholder="Add an item..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={addItem.isPending}
          />
          <Button onClick={handleAdd} disabled={!newItemName.trim() || addItem.isPending} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Your shopping list is empty.</p>
          <p className="text-sm text-muted-foreground">Type an item above and press Enter to add it.</p>
        </div>
      )}

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <ul className="space-y-1">
          {unchecked.map((item) => (
            <ShoppingRow
              key={item.id}
              item={item}
              selectMode={selectMode}
              isSelected={selected.has(item.id)}
              onToggleCheck={() => toggleItem.mutate({ id: item.id, checked: true })}
              onToggleSelect={() => toggleSelect(item.id)}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </ul>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <>
          {unchecked.length > 0 && <hr className="border-border" />}
          <ul className="space-y-1">
            {checked.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                selectMode={false}
                isSelected={false}
                onToggleCheck={() => toggleItem.mutate({ id: item.id, checked: false })}
                onToggleSelect={() => {}}
                onDelete={() => deleteItem.mutate(item.id)}
              />
            ))}
          </ul>
        </>
      )}

      {/* Floating action bar in select mode */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button onClick={openTaskDialog} className="shadow-lg">
            Create Task from {selected.size} item{selected.size !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Create Task dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-1">
              {items
                .filter((i) => selected.has(i.id))
                .map((i) => (
                  <p key={i.id}>- {i.name}</p>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={creatingTask}>
              {creatingTask ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShoppingRow({
  item,
  selectMode,
  isSelected,
  onToggleCheck,
  onToggleSelect,
  onDelete,
}: {
  item: ShoppingItem;
  selectMode: boolean;
  isSelected: boolean;
  onToggleCheck: () => void;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 group',
        selectMode && 'cursor-pointer',
        isSelected && 'bg-accent',
        item.checked && 'opacity-50'
      )}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      {selectMode ? (
        <Checkbox checked={isSelected} className="pointer-events-none" />
      ) : (
        <Checkbox
          checked={item.checked}
          onCheckedChange={() => onToggleCheck()}
        />
      )}
      <span
        className={cn(
          'flex-1 text-sm',
          item.checked && 'line-through text-muted-foreground'
        )}
      >
        {item.name}
      </span>
      {!selectMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
