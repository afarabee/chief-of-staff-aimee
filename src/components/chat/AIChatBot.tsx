import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { MessageCircle, X, SendHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  assets: any[];
  cos_tasks: any[];
  cos_ideas: any[];
  maintenance_tasks: any[];
  providers: any[];
  categories: any[];
  cos_categories: any[];
}

function truncate(str: string | null | undefined, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

async function fetchChatContext(): Promise<ChatContext> {
  const [assetsRes, tasksRes, ideasRes, maintenanceRes, providersRes, categoriesRes, cosCategoriesRes] = await Promise.all([
    supabase.from('assets').select('*, categories(name)').order('name'),
    supabase.from('cos_tasks').select('*, cos_categories(name)').order('created_at', { ascending: false }),
    supabase.from('cos_ideas').select('*').order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, assets(name), service_providers(name)').order('next_due_date', { ascending: true }),
    supabase.from('service_providers').select('*, categories(name)').order('name'),
    supabase.from('categories').select('id, name, icon').order('name'),
    supabase.from('cos_categories').select('id, name').order('name'),
  ]);

  const assets = (assetsRes.data ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    categoryName: a.categories?.name,
    description: truncate(a.description, 100),
    purchaseDate: a.purchase_date,
  }));

  const allTasks = tasksRes.data ?? [];
  const activeTasks = allTasks.filter((t: any) => t.status !== 'Done');
  const doneTasks = allTasks.filter((t: any) => t.status === 'Done').slice(0, 10);
  const cos_tasks = [...activeTasks, ...doneTasks].map((t: any) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    categoryName: t.cos_categories?.name,
    description: truncate(t.description, 100),
  }));

  const allIdeas = ideasRes.data ?? [];
  const activeIdeas = allIdeas.filter((i: any) => i.status !== 'Done');
  const doneIdeas = allIdeas.filter((i: any) => i.status === 'Done').slice(0, 10);
  const cos_ideas = [...activeIdeas, ...doneIdeas].map((i: any) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    description: truncate(i.description, 100),
  }));

  const allMaint = maintenanceRes.data ?? [];
  const activeMaint = allMaint.filter((t: any) => t.status !== 'completed');
  const completedMaint = allMaint.filter((t: any) => t.status === 'completed').slice(0, 10);
  const maintenance_tasks = [...activeMaint, ...completedMaint].map((t: any) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    nextDueDate: t.next_due_date,
    recurrenceRule: t.recurrence_rule,
    assetName: t.assets?.name,
    providerName: t.service_providers?.name,
  }));

  const providers = (providersRes.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    categoryName: p.categories?.name,
    phone: p.phone,
    email: p.email,
  }));

  const categories = (categoriesRes.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
  }));

  const cos_categories = (cosCategoriesRes.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }));

  return { assets, cos_tasks, cos_ideas, maintenance_tasks, providers, categories, cos_categories };
}

function renderMarkdown(text: string) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded p-2 my-1 overflow-x-auto text-xs"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted rounded px-1 text-xs">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>');
  return html;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm your Chief of Staff assistant. I can answer questions about your assets, tasks, ideas, maintenance schedules, and providers — and I can also create or update records for you. Just ask!",
};

export function AIChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const contextRef = useRef<ChatContext | null>(null);
  const contextFetchedRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && !contextFetchedRef.current) {
      contextFetchedRef.current = true;
      fetchChatContext().then((ctx) => {
        contextRef.current = ctx;
      }).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (open && !loading) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [messages, loading, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyMsgs = [...messages.filter(m => m !== WELCOME_MESSAGE), userMsg].slice(-10);

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: text,
          context: contextRef.current || {},
          history: historyMsgs.slice(0, -1),
        },
      });

      if (error) throw error;

      const reply = data?.reply || data?.error || 'Sorry, something went wrong.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      // If the AI mutated data, refresh context and invalidate queries
      if (data?.mutated) {
        contextRef.current = await fetchChatContext();
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['ideas'] });
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        queryClient.invalidateQueries({ queryKey: ['providers'] });
        queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    contextFetchedRef.current = false;
    contextRef.current = null;
  };

  const panelClasses = isMobile
    ? 'fixed inset-0 z-50 flex flex-col'
    : 'fixed bottom-24 right-6 z-50 w-[380px] h-[500px] flex flex-col';

  return (
    <>
      {open && (
        <Card className={panelClasses}>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b space-y-0">
            <span className="font-semibold text-sm">AI Assistant</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm flex gap-1 items-center">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t gap-2">
             <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about tasks, assets, maintenance..."
              className="min-h-[40px] max-h-[80px] resize-none text-sm"
              rows={1}
              disabled={loading}
            />
            <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
