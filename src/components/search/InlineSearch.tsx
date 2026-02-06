import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Lightbulb } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';

interface ResultItem {
  id: string;
  type: 'task' | 'idea';
  title: string;
  description?: string;
  path: string;
}

export function InlineSearch() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { tasks, ideas } = useApp();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowerQuery = query.toLowerCase();

  const results = useMemo<ResultItem[]>(() => {
    if (query.length === 0) return [];

    const matchedTasks: ResultItem[] = tasks
      .filter(t =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(t => ({ id: t.id, type: 'task', title: t.title, description: t.description, path: '/tasks' }));

    const matchedIdeas: ResultItem[] = ideas
      .filter(i =>
        i.title.toLowerCase().includes(lowerQuery) ||
        i.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(i => ({ id: i.id, type: 'idea', title: i.title, description: i.description, path: '/ideas' }));

    return [...matchedTasks, ...matchedIdeas];
  }, [query, tasks, ideas, lowerQuery]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].path);
        }
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Group results for display
  const taskResults = results.filter(r => r.type === 'task');
  const ideaResults = results.filter(r => r.type === 'idea');

  const getGlobalIndex = (type: 'task' | 'idea', localIndex: number) => {
    if (type === 'task') return localIndex;
    return taskResults.length + localIndex;
  };

  return (
    <div ref={containerRef} className="relative max-w-xs flex-1">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => query.length > 0 && setShowResults(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search tasks and ideas…"
        className="border-none bg-muted/50 focus-visible:ring-1"
      />
      {showResults && query.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border bg-popover p-1 shadow-md">
          {results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
          )}
          {taskResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Tasks</p>
              {taskResults.map((task, i) => {
                const globalIdx = getGlobalIndex('task', i);
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(task.path)}
                    className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm ${
                      selectedIndex === globalIdx
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium">{task.title}</span>
                      {task.description && (
                        <span className="truncate text-xs text-muted-foreground">{task.description}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {ideaResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Ideas</p>
              {ideaResults.map((idea, i) => {
                const globalIdx = getGlobalIndex('idea', i);
                return (
                  <button
                    key={idea.id}
                    onClick={() => handleSelect(idea.path)}
                    className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm ${
                      selectedIndex === globalIdx
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Lightbulb className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium">{idea.title}</span>
                      {idea.description && (
                        <span className="truncate text-xs text-muted-foreground">{idea.description}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
