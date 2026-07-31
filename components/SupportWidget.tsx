import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { apiFetch } from '../hooks/useAppData';

type Thread = {
  id: string;
  subject?: string | null;
  status: string;
  updatedAt: string;
  messages?: Array<{ body: string; createdAt: string }>;
  _count?: { messages: number };
};

type Message = {
  id: string;
  body: string;
  senderType: string;
  createdAt: string;
  senderUser?: { firstName?: string; lastName?: string } | null;
  senderAdmin?: { firstName?: string; lastName?: string } | null;
};

export function SupportWidget({ t }: { t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadStatus, setThreadStatus] = useState('open');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [composing, setComposing] = useState(false);

  const loadThreads = async () => {
    try {
      const data = await apiFetch('/support/threads');
      setThreads(data.threads || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    }
  };

  const loadThread = async (id: string) => {
    try {
      const data = await apiFetch(`/support/threads/${id}`);
      setMessages(data.thread?.messages || []);
      setThreadStatus(data.thread?.status || 'open');
      setActiveId(id);
      setComposing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load thread');
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadThreads();
    const timer = setInterval(() => {
      void loadThreads();
      if (activeId) void loadThread(activeId);
    }, 20000);
    return () => clearInterval(timer);
  }, [open, activeId]);

  const startThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError('');
    try {
      const data = await apiFetch('/support/threads', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim() || undefined, body: body.trim() }),
      });
      setBody('');
      setSubject('');
      setComposing(false);
      await loadThreads();
      if (data.thread?.id) await loadThread(data.thread.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to send');
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !body.trim()) return;
    setError('');
    try {
      await apiFetch(`/support/threads/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      });
      setBody('');
      await loadThread(activeId);
    } catch (err: any) {
      setError(err?.message || 'Failed to send');
    }
  };

  const label = (key: string, fallback: string) => {
    const v = t(key);
    return !v || v === key ? fallback : v;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        aria-label={label('support', 'Support')}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {label('support', 'Support')}
            </div>
            {!composing && (
              <button
                type="button"
                className="text-xs font-medium text-blue-600"
                onClick={() => {
                  setActiveId(null);
                  setComposing(true);
                  setMessages([]);
                }}
              >
                {label('newMessage', 'New')}
              </button>
            )}
          </div>

          {error && <div className="bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div>}

          {!activeId && !composing && (
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {label('noSupportThreads', 'No conversations yet.')}
                  <button
                    type="button"
                    className="mt-2 block w-full text-blue-600"
                    onClick={() => setComposing(true)}
                  >
                    {label('startSupport', 'Start a conversation')}
                  </button>
                </div>
              ) : (
                threads.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => void loadThread(th.id)}
                    className="block w-full border-b border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                  >
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {th.subject || label('supportRequest', 'Support request')}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {th.status} · {new Date(th.updatedAt).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {(activeId || composing) && (
            <>
              {activeId && (
                <button
                  type="button"
                  className="border-b border-gray-100 px-3 py-1.5 text-left text-xs text-blue-600 dark:border-gray-700"
                  onClick={() => {
                    setActiveId(null);
                    setComposing(false);
                    void loadThreads();
                  }}
                >
                  ← {label('back', 'Back')}
                </button>
              )}
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-2.5 py-1.5 text-sm ${
                      m.senderType === 'tenant_user'
                        ? 'ml-6 bg-blue-50 text-gray-900 dark:bg-blue-900/30 dark:text-white'
                        : 'mr-6 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                    }`}
                  >
                    <div className="mb-0.5 text-[10px] text-gray-500">
                      {m.senderType === 'platform_admin'
                        ? `${m.senderAdmin?.firstName || 'Support'} ${m.senderAdmin?.lastName || ''}`.trim()
                        : 'You'}{' '}
                      · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              {(composing || threadStatus !== 'closed') && (
                <form
                  onSubmit={composing ? startThread : sendReply}
                  className="border-t border-gray-200 p-2 dark:border-gray-700"
                >
                  {composing && (
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={label('subject', 'Subject')}
                      className="mb-1.5 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  )}
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={2}
                    required
                    placeholder={label('typeMessage', 'Type a message…')}
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="mt-1.5 w-full rounded bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {label('send', 'Send')}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
