
import React, { useState, useRef, useEffect } from 'react';
import { useStoreOptional } from '../services/storeContext';
import { useTranslation } from '../services/i18nContext';
import { X, Send, Headphones, Bot, User, Check, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
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
  const { t } = useTranslation();
  const store = useStoreOptional();
  const [inputText, setInputText] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable launcher (closed FAB): persisted so it can be moved off the
  // chat composer's "Send" button. Uses pointer events (mouse + touch).
  const FAB_POS_KEY = 'agm_support_fab_pos';
  const fabRef = useRef<HTMLButtonElement>(null);
  const [fabPosition, setFabPosition] = useState<{ top: number; left: number } | null>(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(FAB_POS_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.top === 'number' && typeof p?.left === 'number') return p;
      }
    } catch { /* ignore */ }
    return null;
  });
  const fabDraggingRef = useRef(false);
  const fabMovedRef = useRef(false);
  const fabOffsetRef = useRef({ x: 0, y: 0 });
  const fabPointerStartRef = useRef({ x: 0, y: 0 });
  const FAB_DRAG_THRESHOLD_PX = 8;

  const clampToViewport = (top: number, left: number, el: HTMLElement | null) => {
    const w = el?.offsetWidth ?? 56;
    const h = el?.offsetHeight ?? 56;
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 1024) - w - 8;
    const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 768) - h - 8;
    return {
      top: Math.max(8, Math.min(top, Math.max(8, maxTop))),
      left: Math.max(8, Math.min(left, Math.max(8, maxLeft))),
    };
  };

  const persistFabPosition = () => {
    if (!fabRef.current || !fabMovedRef.current) return;
    const rect = fabRef.current.getBoundingClientRect();
    const clamped = clampToViewport(rect.top, rect.left, fabRef.current);
    setFabPosition(clamped);
    try {
      localStorage.setItem(FAB_POS_KEY, JSON.stringify(clamped));
    } catch {
      /* ignore */
    }
  };

  const finishFabPointerDrag = (el: HTMLButtonElement, pointerId: number) => {
    if (!fabDraggingRef.current) return;
    fabDraggingRef.current = false;
    document.body.style.userSelect = '';
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    persistFabPosition();
  };

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = fabRef.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    fabOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    fabPointerStartRef.current = { x: e.clientX, y: e.clientY };
    fabDraggingRef.current = true;
    fabMovedRef.current = false;
    document.body.style.userSelect = 'none';
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!fabDraggingRef.current || !fabRef.current) return;
    const dx = e.clientX - fabPointerStartRef.current.x;
    const dy = e.clientY - fabPointerStartRef.current.y;
    if (!fabMovedRef.current && Math.hypot(dx, dy) < FAB_DRAG_THRESHOLD_PX) return;
    fabMovedRef.current = true;
    const left = e.clientX - fabOffsetRef.current.x;
    const top = e.clientY - fabOffsetRef.current.y;
    fabRef.current.style.left = `${left}px`;
    fabRef.current.style.top = `${top}px`;
    fabRef.current.style.right = 'auto';
    fabRef.current.style.bottom = 'auto';
  };

  const handleFabPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    finishFabPointerDrag(e.currentTarget, e.pointerId);
  };

  const handleFabPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    finishFabPointerDrag(e.currentTarget, e.pointerId);
  };

  const handleFabClick = () => {
    // Suppress the click that follows a drag so moving the button doesn't open chat.
    if (fabMovedRef.current) {
      fabMovedRef.current = false;
      return;
    }
    toggleSupportChat();
  };

  // Keep a saved FAB position on-screen after viewport resizes / rotation.
  useEffect(() => {
    const onResize = () => {
      setFabPosition((prev) => {
        if (!prev) return prev;
        const clamped = clampToViewport(prev.top, prev.left, fabRef.current);
        if (clamped.top === prev.top && clamped.left === prev.left) return prev;
        try { localStorage.setItem(FAB_POS_KEY, JSON.stringify(clamped)); } catch { /* ignore */ }
        return clamped;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isSupportChatOpen = store?.isSupportChatOpen ?? false;
  const toggleSupportChat = store?.toggleSupportChat ?? (() => {});
  const supportMessages = store?.supportMessages ?? [];
  const supportAiTyping = store?.supportAiTyping ?? false;
  const supportChatSending = store?.supportChatSending ?? false;
  const sendSupportMessage = store?.sendSupportMessage ?? (async () => {});
  const retrySupportMessage = store?.retrySupportMessage ?? (async () => {});
  const compareCount = store?.compareList?.length ?? 0;

  const user = store?.user ?? null;
  const isHandedOver = store?.isHandedOver ?? false;
  const returningToAi = store?.returningToAi ?? false;
  const returnToAiMode = store?.returnToAiMode ?? (async () => {});
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

  const widgetDragStartRef = useRef({ x: 0, y: 0 });
  const widgetMovedRef = useRef(false);
  const WIDGET_DRAG_THRESHOLD_PX = 8;

  const finishWidgetPointerDrag = (el: HTMLElement, pointerId: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    document.body.style.userSelect = '';
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    if (widgetRef.current && widgetMovedRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const clamped = clampToViewport(rect.top, rect.left, widgetRef.current);
      setPosition(clamped);
      widgetRef.current.style.left = `${clamped.left}px`;
      widgetRef.current.style.top = `${clamped.top}px`;
      widgetRef.current.style.bottom = 'auto';
      widgetRef.current.style.right = 'auto';
    }
  };

  const handleWidgetHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!widgetRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = widgetRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    widgetDragStartRef.current = { x: e.clientX, y: e.clientY };
    widgetMovedRef.current = false;
    isDraggingRef.current = true;
    document.body.style.userSelect = 'none';
  };

  const handleWidgetHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !widgetRef.current) return;
    const dx = e.clientX - widgetDragStartRef.current.x;
    const dy = e.clientY - widgetDragStartRef.current.y;
    if (!widgetMovedRef.current && Math.hypot(dx, dy) < WIDGET_DRAG_THRESHOLD_PX) return;
    widgetMovedRef.current = true;
    const newLeft = e.clientX - dragOffsetRef.current.x;
    const newTop = e.clientY - dragOffsetRef.current.y;
    widgetRef.current.style.left = `${newLeft}px`;
    widgetRef.current.style.top = `${newTop}px`;
    widgetRef.current.style.bottom = 'auto';
    widgetRef.current.style.right = 'auto';
  };

  const handleWidgetHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishWidgetPointerDrag(e.currentTarget, e.pointerId);
  };

  const handleWidgetHeaderPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    finishWidgetPointerDrag(e.currentTarget, e.pointerId);
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
      setFormEmailError(t('support.guestEmailRequired'));
      return;
    }
    if (!emailRegex.test(guestEmailInput.trim())) {
      setFormEmailError(t('support.guestEmailInvalid'));
      return;
    }
    submitGuestForm(guestEmailInput.trim(), guestNameInput.trim() || t('support.guestFallbackName'));
  };

  const dockBottom =
    compareCount > 0
      ? 'calc(max(1rem, env(safe-area-inset-bottom)) + 5rem)'
      : 'max(1rem, env(safe-area-inset-bottom))';

  const widgetStyle: React.CSSProperties = {
    maxHeight: 'min(560px, calc(100dvh - 5rem))',
    ...(position
      ? { top: position.top, left: position.left }
      : { bottom: dockBottom, right: 'max(0.75rem, env(safe-area-inset-right))' }),
  };

  const headerStatus = supportAiTyping
    ? { label: t('support.chatStatusTyping'), dot: 'bg-amber-300 animate-pulse' }
    : supportChatSending
      ? { label: t('support.chatStatusSending'), dot: 'bg-blue-300 animate-pulse' }
      : isHandedOver
        ? { label: t('support.chatStatusWaiting'), dot: 'bg-yellow-400 animate-pulse' }
        : { label: t('support.chatStatusOnline'), dot: 'bg-green-400 animate-pulse' };

  if (!store) return null;

  return (
    <>
      {!isSupportChatOpen && (
        <button
          ref={fabRef}
          type="button"
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          onPointerCancel={handleFabPointerCancel}
          onClick={handleFabClick}
          className="fixed z-50 bg-blue-600 text-white p-3.5 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors hover:scale-110 flex items-center justify-center ring-2 ring-blue-400/30 cursor-grab active:cursor-grabbing touch-none select-none"
          style={
            fabPosition
              ? { top: fabPosition.top, left: fabPosition.left }
              : { bottom: dockBottom, right: 'max(0.75rem, env(safe-area-inset-right))' }
          }
          aria-label={t('support.openChatAria')}
          title={t('support.dragHint')}
        >
          <Headphones className="h-6 w-6 pointer-events-none" />
        </button>
      )}

      <div
        ref={widgetRef}
        className={`fixed z-50 w-[min(22rem,calc(100vw-1rem))] sm:w-80 md:w-96 h-[70dvh] sm:h-[500px] max-h-[calc(100dvh-5rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-opacity duration-200 ${isSupportChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={widgetStyle}
        role="dialog"
        aria-label={t('support.chatDialogAria')}
        aria-hidden={!isSupportChatOpen}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 flex justify-between items-center cursor-move select-none shrink-0 touch-none"
          onPointerDown={handleWidgetHeaderPointerDown}
          onPointerMove={handleWidgetHeaderPointerMove}
          onPointerUp={handleWidgetHeaderPointerUp}
          onPointerCancel={handleWidgetHeaderPointerCancel}
        >
          <div className="flex items-center text-white min-w-0">
            <div
              className={`p-1.5 rounded-full mr-2 shrink-0 transition-colors ${supportAiTyping ? 'bg-white/30' : isHandedOver ? 'bg-purple-400/30' : 'bg-white/20'}`}
            >
              {supportAiTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : isHandedOver ? (
                <Headphones className="h-5 w-5" aria-hidden />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">
                {isHandedOver ? t('support.humanAgent') : t('support.botName')}
              </h3>
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
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={t('support.closeChatAria')}
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
                          title={t('support.retrySendTitle')}
                          aria-label={t('support.retrySendAria')}
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span className="underline underline-offset-2">{t('chat.retry')}</span>
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

          {/* Agent-mode banner with Back to AgriBot option */}
          {isHandedOver && (
            <div className="sticky bottom-0 mx-1 mb-1 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800 shadow-sm agm-chat-bubble-in">
              <div className="flex items-start gap-2">
                <Headphones className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug">{t('support.waitingHumanTitle')}</p>
                  <p className="text-yellow-700 mt-0.5 leading-snug">
                    {t('support.waitingHumanDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={() => void returnToAiMode()}
                    disabled={returningToAi}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-white border border-yellow-300 px-2.5 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {returningToAi ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-3 w-3" aria-hidden />
                    )}
                    {returningToAi ? t('support.switching') : t('support.backToBot')}
                  </button>
                </div>
              </div>
            </div>
          )}

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
            <p className="text-xs text-gray-500">{t('support.guestIntro')}</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('support.guestEmailLabel')}</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder={t('support.guestEmailPlaceholder')}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('support.guestNameLabel')}</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder={t('support.guestNamePlaceholder')}
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              {t('support.startChat')}
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
                    ? t('support.chatReplying')
                    : supportChatSending
                      ? t('support.chatStatusSending')
                      : t('support.chatComposerPlaceholder')
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
              aria-label={supportChatSending ? t('support.sendingMessageAria') : t('chat.sendMessage')}
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
