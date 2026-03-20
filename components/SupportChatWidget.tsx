
import React, { useState, useRef, useEffect } from 'react';
import { useStoreOptional } from '../services/storeContext';
import { X, Send, Headphones, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const SupportChatWidget: React.FC = () => {
  const store = useStoreOptional();
  const [inputText, setInputText] = useState('');
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const isSupportChatOpen = store?.isSupportChatOpen ?? false;
  const toggleSupportChat = store?.toggleSupportChat ?? (() => {});
  const supportMessages = store?.supportMessages ?? [];
  const sendSupportMessage = store?.sendSupportMessage ?? (async () => {});
  
  // Guest form state
  const user = store?.user ?? null;
  const showGuestForm = store?.showGuestForm ?? false;
  const guestEmailInput = store?.guestEmailInput ?? '';
  const setGuestEmailInput = store?.setGuestEmailInput ?? (() => {});
  const guestNameInput = store?.guestNameInput ?? '';
  const setGuestNameInput = store?.setGuestNameInput ?? (() => {});
  const submitGuestForm = store?.submitGuestForm ?? (() => {});
  const [formEmailError, setFormEmailError] = useState('');

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [supportMessages, isSupportChatOpen]);

  // Global Mouse Events for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !widgetRef.current) return;

      // Calculate new position
      const newLeft = e.clientX - dragOffsetRef.current.x;
      const newTop = e.clientY - dragOffsetRef.current.y;
      
      // Apply directly to DOM for smooth performance
      widgetRef.current.style.left = `${newLeft}px`;
      widgetRef.current.style.top = `${newTop}px`;
      widgetRef.current.style.bottom = 'auto';
      widgetRef.current.style.right = 'auto';
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && widgetRef.current) {
        isDraggingRef.current = false;
        document.body.style.userSelect = ''; // Re-enable text selection
        
        // Commit the final position to state so it survives React re-renders
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
    if (e.button !== 0) return; // Only left click
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    isDraggingRef.current = true;
    document.body.style.userSelect = 'none'; // Prevent text selection
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
        sendSupportMessage(inputText);
        setInputText('');
    }
  };

  const handleSubmitGuestForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormEmailError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmailInput.trim()) {
      setFormEmailError('Email is required');
      return;
    }
    if (!emailRegex.test(guestEmailInput.trim())) {
      setFormEmailError('Please enter a valid email address');
      return;
    }

    // Submit form
    submitGuestForm(guestEmailInput.trim(), guestNameInput.trim() || 'Guest');
  };

  const widgetStyle: React.CSSProperties = {
      height: '500px',
      ...(position ? { top: position.top, left: position.left } : { bottom: '24px', right: '24px' })
  };

  if (!store) return null;

  return (
    <>
      {/* Floating Button (Visible when chat is closed) */}
      {!isSupportChatOpen && (
        <button
          onClick={toggleSupportChat}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Open Support Chat"
        >
          <Headphones className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      <div
        ref={widgetRef}
        className={`fixed z-50 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-opacity duration-200 ${isSupportChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={widgetStyle}
      >
        {/* Header (Draggable Handle) */}
        <div 
           className="bg-blue-600 p-4 flex justify-between items-center cursor-move select-none"
           onMouseDown={handleMouseDown}
        >
           <div className="flex items-center text-white">
              <div className="p-1 bg-white/20 rounded-full mr-2">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                 <h3 className="font-bold text-sm">AgriBot Support</h3>
                 <span className="text-xs text-blue-200 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    Online
                 </span>
              </div>
           </div>
           <div className="flex items-center">
               <button 
                 onClick={toggleSupportChat} 
                 className="text-blue-100 hover:text-white p-1 rounded hover:bg-blue-500 transition-colors"
                 onMouseDown={(e) => e.stopPropagation()} // Prevent drag on close button
               >
                  <X className="h-5 w-5" />
               </button>
           </div>
        </div>

        {/* Messages Body */}
        <div 
          ref={chatBodyRef}
          className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4"
        >
           {supportMessages.map(msg => {
              const isUser = msg.sender === 'USER';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                   {!isUser && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-2 flex-shrink-0 ${msg.sender === 'AI' ? 'bg-blue-500' : 'bg-purple-600'}`}>
                         {msg.sender === 'AI' ? <Bot className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                      </div>
                   )}
                   <div className={`max-w-[80%] rounded-lg p-3 text-sm shadow-sm ${
                      isUser 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                   }`}>
                      {isUser ? (
                        <p>{msg.text}</p>
                      ) : (
                        <div className="markdown-content space-y-2">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-2" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="ml-1" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                              em: ({node, ...props}) => <em className="italic" {...props} />,
                              code: ({ node: _node, inline, className, children, ...props }: React.HTMLAttributes<HTMLElement> & { node?: unknown; inline?: boolean }) =>
                                inline ? (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono text-xs" {...props}>{children}</code>
                                ) : (
                                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2"><code className={className} {...props}>{children}</code></pre>
                                ),
                              a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                              h1: ({node, ...props}) => <h1 className="font-bold text-base mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="font-bold text-sm mb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="font-semibold text-sm mb-1" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-2 italic text-gray-600 mb-2" {...props} />,
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p className={`text-[10px] mt-2 text-right ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                         {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                   </div>
                   {isUser && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 ml-2 flex-shrink-0">
                         <User className="h-4 w-4" />
                      </div>
                   )}
                </div>
              );
           })}
        </div>

        {/* Input Area or Guest Form */}
        {showGuestForm && !user ? (
          <form onSubmit={handleSubmitGuestForm} className="p-4 bg-white border-t border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Your name"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Start Chat
            </button>
          </form>
        ) : (
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              placeholder="Type a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </>
  );
};
