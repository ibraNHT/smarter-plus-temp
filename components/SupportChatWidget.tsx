
import React, { useState, useRef, useEffect } from 'react';
import { useStoreOptional } from '../services/storeContext';
import { X, Send, Headphones, Bot, User, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Animated three-dot typing indicator (shared styles in index.css). */
const TypingDots: React.FC = () => (
  <span className="agm-typing-dots" aria-hidden="true">
    <span className="agm-typing-dot" />
    <span className="agm-typing-dot" />
    <span className="agm-typing-dot" />
  </span>
);

export const SupportChatWidget: React.FC = () => {
  const store = useStoreOptional();
  const [inputText, setInputText] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSupportChatOpen = store?.isSupportChatOpen ?? false;
  const toggleSupportChat = store?.toggleSupportChat ?? (() => {});
  const supportMessages = store?.supportMessages ?? [];
  const supportAiTyping = store?.supportAiTyping ?? false;
  const supportChatSending = store?.supportChatSending ?? false;
  const sendSupportMessage = store?.sendSupportMessage ?? (async () => {});
  const retrySupportMessage = store?.retrySupportMessage ?? (async () => {});
  const compareCount = store?.compareList?.length ?? 0;

  const user = store?.user ?? null;
  const showGuestForm = store?.showGuestForm ?? false;
  const guestEmailInput = store?.guestEmailInput ?? '';
  const setGuestEmailInput = store?.setGuestEmailInput ?? (() => {});
  const guestNameInput = store?.guestNameInput ?? '';
  const setGuestNameInput = store?.setGuestNameInput ?? (() => {});
  const submitGuestForm = store?.submitGuestForm ?? (() => {});
  const [formEmailError, setFormEmailError] = useState('');

  /** Block double-send only while posting; AI wait uses typing indicator instead. */
  const composerDisabled = supportChatSending || supportAiTyping;
  const canSend = inputText.trim().length > 0 && !composerDisabled;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (isSupportChatOpen) {
      scrollToBottom('auto');
    }
  }, [supportMessages, isSupportChatOpen, supportAiTyping]);

  useEffect(() => {
    if (isSupportChatOpen && !showGuestForm && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isSupportChatOpen, showGuestForm]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !widgetRef.current) return;
      const newLeft = e.clientX - dragOffsetRef.current.x;
      const newTop = e.clientY - dragOffsetRef.current.y;
      widgetRef.current.style.left = `${newLeft}px`;
      widgetRef.current.style.top = `${newTop}px`;
      widgetRef.current.style.bottom = 'auto';
      widgetRef.current.style.right = 'auto';
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && widgetRef.current) {
        isDraggingRef.current = false;
        document.body.style.userSelect = '';
        const rect = widgetRef.current.getBoundingClientRect();
        setPosition({ top: rect.top, left: rect.left });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !widgetRef.current) return;
    const rect = widgetRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDraggingRef.current = true;
    document.body.style.userSelect = 'none';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || composerDisabled) return;
    setInputText('');
    await sendSupportMessage(text);
  };

  const handleSubmitGuestForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormEmailError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmailInput.trim()) {
      setFormEmailError('Email is required');
      return;
    }
    if (!emailRegex.test(guestEmailInput.trim())) {
      setFormEmailError('Please enter a valid email address');
      return;
    }
    submitGuestForm(guestEmailInput.trim(), guestNameInput.trim() || 'Guest');
  };

  const isNarrowViewport =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;

  const dockBottom =
    compareCount > 0
      ? 'calc(max(1rem, env(safe-area-inset-bottom)) + 5rem)'
      : 'max(1rem, env(safe-area-inset-bottom))';

  const widgetStyle: React.CSSProperties = {
    maxHeight: 'min(560px, calc(100dvh - 5rem))',
    ...(position && !isNarrowViewport
      ? { top: position.top, left: position.left }
      : { bottom: dockBottom, right: 'max(0.75rem, env(safe-area-inset-right))' }),
  };

  const headerStatus = supportAiTyping
    ? { label: '.......', dot: 'bg-amber-300 animate-pulse' }
    : supportChatSending
      ? { label: 'Sending…', dot: 'bg-blue-300 animate-pulse' }
      : { label: 'Online', dot: 'bg-green-400 animate-pulse' };

  if (!store) return null;

  return (
    <>
      {!isSupportChatOpen && (
        <button
          onClick={toggleSupportChat}
          className="fixed z-50 bg-blue-600 text-white p-3.5 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center ring-2 ring-blue-400/30"
          style={{ bottom: dockBottom, right: 'max(0.75rem, env(safe-area-inset-right))' }}
          aria-label="Open Support Chat"
        >
          <Headphones className="h-6 w-6" />
        </button>
      )}

      <div
        ref={widgetRef}
        className={`fixed z-50 w-[min(22rem,calc(100vw-1rem))] sm:w-80 md:w-96 h-[70dvh] sm:h-[500px] max-h-[calc(100dvh-5rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-opacity duration-200 ${isSupportChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={widgetStyle}
        role="dialog"
        aria-label="AgriBot Support Chat"
        aria-hidden={!isSupportChatOpen}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 flex justify-between items-center sm:cursor-move select-none shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center text-white min-w-0">
            <div
              className={`p-1.5 rounded-full mr-2 shrink-0 transition-colors ${supportAiTyping ? 'bg-white/30' : 'bg-white/20'}`}
            >
              {supportAiTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">AgriBot Support</h3>
              <span className="text-xs text-blue-100 flex items-center gap-1" aria-live="polite">
                <span className={`w-2 h-2 rounded-full shrink-0 ${headerStatus.dot}`} />
                <span className="truncate">{headerStatus.label}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSupportChat}
            className="text-blue-100 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-colors shrink-0"
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close support chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatBodyRef}
          className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100/80 p-3 sm:p-4 overflow-y-auto overflow-x-hidden space-y-3 scroll-smooth"
        >
          {supportMessages.map((msg) => {
            const isUser = msg.sender === 'USER';
            const isSending = isUser && msg.status === 'SENDING';
            const isFailed = isUser && msg.status === 'FAILED';
            const isSent = isUser && (!msg.status || msg.status === 'SENT');

            return (
              <div
                key={msg.id}
                className={`flex agm-chat-bubble-in ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-2 flex-shrink-0 shadow-sm ${
                      msg.sender === 'AI' ? 'bg-blue-500' : 'bg-purple-600'
                    }`}
                  >
                    {msg.sender === 'AI' ? <Bot className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-sm shadow-sm transition-opacity ${
                    isUser
                      ? `bg-blue-600 text-white rounded-br-md ${isSending ? 'opacity-85' : ''} ${isFailed ? 'ring-2 ring-red-300/80' : ''}`
                      : 'bg-white text-gray-800 border border-gray-200/90 rounded-bl-md'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  ) : (
                    <div className="markdown-content space-y-2 prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ ...props }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                          ),
                          ol: ({ ...props }) => (
                            <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                          ),
                          li: ({ ...props }) => <li className="ml-1" {...props} />,
                          strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
                          em: ({ ...props }) => <em className="italic" {...props} />,
                          code: ({
                            inline,
                            className,
                            children,
                            ...props
                          }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
                            inline ? (
                              <code
                                className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono text-xs"
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2 text-xs">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ),
                          a: ({ ...props }) => (
                            <a
                              className="text-blue-600 hover:underline font-medium"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          h1: ({ ...props }) => <h1 className="font-bold text-base mb-2" {...props} />,
                          h2: ({ ...props }) => <h2 className="font-bold text-sm mb-2" {...props} />,
                          h3: ({ ...props }) => <h3 className="font-semibold text-sm mb-1" {...props} />,
                          blockquote: ({ ...props }) => (
                            <blockquote
                              className="border-l-4 border-gray-300 pl-2 italic text-gray-600 mb-2"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                      isUser ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isUser ? (
                      isFailed ? (
                        <button
                          type="button"
                          onClick={() => void retrySupportMessage(msg.id)}
                          className="inline-flex items-center gap-0.5 text-red-200 hover:text-white transition-colors"
                          title="Failed to send — tap to retry"
                          aria-label="Retry sending message"
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span className="underline underline-offset-2">retry</span>
                        </button>
                      ) : isSending ? (
                        <Clock className="h-3 w-3 opacity-80 animate-pulse" aria-label="Sending" />
                      ) : isSent ? (
                        <Check className="h-3 w-3 opacity-90" aria-label="Sent" />
                      ) : null
                    ) : null}
                  </div>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 ml-2 flex-shrink-0 border border-gray-300/50">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* AI typing indicator */}
          {supportAiTyping && (
            <div className="flex justify-start agm-chat-bubble-in" aria-live="polite" aria-label="Typing">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 flex-shrink-0 shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-gray-200/90 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm inline-flex items-center gap-2.5">
                {/* <span className="text-xs text-gray-600 font-medium">AgriBot is typing</span> */}
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* Composer / guest form */}
        {showGuestForm && !user ? (
          <form
            onSubmit={handleSubmitGuestForm}
            className="p-4 bg-white border-t border-gray-200 space-y-3 shrink-0"
          >
            <p className="text-xs text-gray-500">Enter your email to start chatting with AgriBot.</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder="your@email.com"
                value={guestEmailInput}
                onChange={(e) => {
                  setGuestEmailInput(e.target.value);
                  setFormEmailError('');
                }}
                required
              />
              {formEmailError && <p className="text-xs text-red-500 mt-1">{formEmailError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name (optional)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Your name"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              Start Chat
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-200 flex gap-2 items-end shrink-0"
          >
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                placeholder={
                  supportAiTyping
                    ? 'AgriBot is replying…'
                    : supportChatSending
                      ? 'Sending…'
                      : 'Ask about orders, payments, listings…'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={composerDisabled}
                aria-busy={composerDisabled}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={!canSend}
              className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 min-w-[2.75rem] flex items-center justify-center shadow-sm"
              aria-label={supportChatSending ? 'Sending message' : 'Send message'}
            >
              {supportChatSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
};
