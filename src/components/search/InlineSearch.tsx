import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Lightbulb } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';

export function InlineSearch() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { tasks, ideas } = useApp();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

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

  const matchedTasks = query.length > 0
    ? tasks.filter(t =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
      )
    : [];

  const matchedIdeas = query.length > 0
    ? ideas.filter(i =>
        i.title.toLowerCase().includes(lowerQuery) ||
        i.description?.toLowerCase().includes(lowerQuery)
      )
    : [];

  const hasResults = matchedTasks.length > 0 || matchedIdeas.length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="relative max-w-xs flex-1">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => query.length > 0 && setShowResults(true)}
        placeholder="Search tasks and ideas…"
        className="border-none bg-muted/50 focus-visible:ring-1"
      />
      {showResults && query.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border bg-popover p-1 shadow-md">
          {!hasResults && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results found.</p>
          )}
          {matchedTasks.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Tasks</p>
              {matchedTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelect('/tasks')}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">{task.title}</span>
                    {task.description && (
                      <span className="truncate text-xs text-muted-foreground">{task.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {matchedIdeas.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Ideas</p>
              {matchedIdeas.slice(0, 5).map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => handleSelect('/ideas')}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Lightbulb className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">{idea.title}</span>
                    {idea.description && (
                      <span className="truncate text-xs text-muted-foreground">{idea.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
