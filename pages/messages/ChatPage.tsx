
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Send, MessageCircle, ChevronLeft, Gavel, ArrowLeft } from 'lucide-react';
import { ProposalStatus } from '../../types';

export const ChatPage: React.FC = () => {
   const { chatId } = useParams<{ chatId: string }>();
   const navigate = useNavigate();
   const { user, chats, messages, sendMessage, respondToProposal, clients, producers, getOfferById, fetchChats, fetchMessages } = useStore();
   const { t } = useTranslation();

   const [inputText, setInputText] = useState('');
   const [showProposalModal, setShowProposalModal] = useState(false);
   const [showCounterModal, setShowCounterModal] = useState(false);
   const [counterTargetMsgId, setCounterTargetMsgId] = useState<string | null>(null);

   // Proposal Form State
   const [proposalPrice, setProposalPrice] = useState<number>(0);
   const [proposalQty, setProposalQty] = useState<number>(0);
   const [counterPrice, setCounterPrice] = useState<number>(0);
   const [counterQty, setCounterQty] = useState<number>(0);

   const messagesEndRef = useRef<HTMLDivElement>(null);
   const messageInputRef = useRef<HTMLTextAreaElement>(null);

   const TEXTAREA_MAX_PX = 160;

   const adjustMessageInputHeight = useCallback(() => {
      const el = messageInputRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
   }, []);

   // Get active chat early to determine message length
   const activeChat = chatId ? chats.find(c => c.id === chatId) : null;
   const activeMessages = activeChat ? messages.filter(m => m.chatId === chatId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   };

   // Only auto-scroll when a NEW message arrives or chat changes
   useEffect(() => {
      scrollToBottom();
   }, [activeMessages.length, chatId]);

   useEffect(() => {
      adjustMessageInputHeight();
   }, [inputText, chatId, adjustMessageInputHeight]);

   // Fetch all chats for the user when the component loads
   useEffect(() => {
      if (user) {
         fetchChats();
      }
   }, [user?.id]); // Only re-fetch if the logged-in user changes

   // Fetch messages when a specific chat is selected, and poll for new ones
   useEffect(() => {
      let interval: NodeJS.Timeout;

      if (user && chatId) {
         // Initial fetch
         fetchMessages(chatId);

         // Poll exactly every 3 seconds
         interval = setInterval(() => {
            fetchMessages(chatId);
            fetchChats(); // Keep the left sidebar unread counts updated too
         }, 3000);
      }

      return () => {
         if (interval) clearInterval(interval);
      };
   }, [chatId, user?.id]);

   // Variables hoisted above for scroll calculation

   const getOtherParticipantName = (participantIds: string[]) => {
      const otherId = participantIds.find(id => id !== user?.id);
      if (!otherId) return 'Unknown';
      const client = clients.find(c => c.id === otherId || c.userId === otherId);
      if (client) {
         if (client.name) return client.name;
         if (client.firstName) return `${client.firstName} ${client.lastName || ''}`.trim();
         return 'Unknown Client';
      }
      const producer = producers.find(p => p.id === otherId || p.userId === otherId);
      if (producer) {
         if (producer.name) return producer.name;
         if (producer.firstName) return `${producer.firstName} ${producer.lastName || ''}`.trim();
         return 'Unknown Producer';
      }
      return 'User';
   };

   const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !chatId) return;
      const sent = await sendMessage(chatId, inputText);
      if (sent) {
         setInputText('');
         requestAnimationFrame(() => {
            adjustMessageInputHeight();
         });
      }
   };

   const handleSendProposal = () => {
      if (!activeChat || !activeChat.offerId) return;
      
      // Check if offer exists and is negotiable
      const offer = getOfferById(activeChat.offerId);
      if (!offer) {
         alert("Offer not found");
         return;
      }
      if (!offer.isNegotiable) {
         alert("This offer is not open for negotiation");
         return;
      }
      
      // Validate price and quantity
      if (proposalPrice <= 0 || proposalQty <= 0) {
         alert("Price per unit and quantity must be greater than 0");
         return;
      }
      
      sendMessage(activeChat.id, "Formal Proposal Sent", {
         offerId: activeChat.offerId,
         pricePerUnit: Number(proposalPrice),
         quantity: Number(proposalQty),
         status: ProposalStatus.PENDING
      });
      setShowProposalModal(false);
   };

   const handleOpenCounter = (msgId: string, currentPrice: number | string, currentQty: number | string) => {
      setCounterTargetMsgId(msgId);
      setCounterPrice(Number(currentPrice) || 0);
      setCounterQty(Number(currentQty) || 0);
      setShowCounterModal(true);
   };

   const handleSendCounter = () => {
      if (!counterTargetMsgId || !chatId) return;
      
      // Validate counter offer values
      if (counterPrice <= 0 || counterQty <= 0) { 
         alert('Price per unit and quantity must be greater than 0'); 
         return; 
      }
      
      respondToProposal(chatId, counterTargetMsgId, 'COUNTER', counterPrice, counterQty);
      setShowCounterModal(false);
      setCounterTargetMsgId(null);
   };

   // Initialize proposal form with offer defaults if available
   useEffect(() => {
      if (activeChat?.offerId && showProposalModal) {
         const offer = getOfferById(activeChat.offerId);
         if (offer) {
            setProposalPrice(offer.price);
            setProposalQty(1);
         }
      }
   }, [activeChat, showProposalModal]);

   if (!user) return <div className="p-8 text-center">Login required.</div>;

   return (
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden">
         {/* Sidebar List */}
         <div className={`${chatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
               <h2 className="text-lg font-bold text-gray-800">{t('nav.messages')}</h2>
               <button onClick={() => navigate(-1)} className="md:hidden p-2 text-gray-500">
                  <ArrowLeft className="h-5 w-5" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto">
               {chats.filter(c => c.participantIds?.includes(user.id)).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">{t('chat.noChats')}</div>
               ) : (
                  chats.filter(c => c.participantIds?.includes(user.id)).map(chat => {
                     const otherName = chat.participantIds ? getOtherParticipantName(chat.participantIds) : 'Unknown';
                     const threadUnread = Math.max(0, Number(chat.unreadCounts?.[user.id]) || 0);
                     return (
                        <div
                           key={chat.id}
                           onClick={() => navigate(`/messages/${chat.id}`)}
                           className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${chatId === chat.id ? 'bg-blue-50' : ''}`}
                        >
                           <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate min-w-0">{otherName}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                 {threadUnread > 0 && (
                                    <span className="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white" title={String(threadUnread)}>
                                       {threadUnread > 99 ? '99+' : threadUnread}
                                    </span>
                                 )}
                                 <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(chat.lastMessageAt).toLocaleDateString()}</span>
                              </div>
                           </div>
                           <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                     );
                  })
               )}
            </div>
         </div>

         {/* Chat Area */}
         <div className={`${!chatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>
            {activeChat ? (
               <>
                  {/* Header */}
                  <div className="p-3 md:p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10">
                     <div className="flex items-center">
                        <button onClick={() => navigate('/messages')} className="md:hidden mr-3 text-gray-500">
                           <ChevronLeft className="h-6 w-6" />
                        </button>
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                           {activeChat.participantIds ? getOtherParticipantName(activeChat.participantIds).charAt(0) : '?'}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900">{activeChat.participantIds ? getOtherParticipantName(activeChat.participantIds) : 'Unknown'}</h3>
                           {activeChat.offerId && <span className="text-xs text-gray-500">Negotiating Offer</span>}
                        </div>
                     </div>
                     <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary-600 hidden md:block">
                        Close
                     </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                     {activeMessages.map(msg => {
                        const isMe = msg.senderId === user.id;
                        const isSystem = msg.systemMessage;

                        if (isSystem) {
                           return (
                              <div key={msg.id} className="flex justify-center my-4">
                                 <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {msg.text}
                                 </div>
                              </div>
                           );
                        }

                        return (
                           <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                 }`}>
                                 {msg.proposal ? (
                                    // Proposal Card
                                    <div className={`border rounded-md p-3 ${isMe ? 'border-primary-400 bg-primary-700' : 'border-gray-200 bg-gray-50'}`}>
                                       <div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
                                          <span className="font-bold uppercase text-xs flex items-center">
                                             <Gavel className="h-3 w-3 mr-1" /> {t('chat.proposal')}
                                          </span>
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${msg.proposal.status === ProposalStatus.PENDING ? 'bg-yellow-500 text-white' :
                                             msg.proposal.status === ProposalStatus.ACCEPTED ? 'bg-green-500 text-white' :
                                                'bg-red-500 text-white'
                                             }`}>
                                             {t(`chat.status.${msg.proposal.status}`)}
                                          </span>
                                       </div>
                                       <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                             <span>{t('chat.pricePerUnit')}:</span>
                                             <span className="font-mono font-bold">{msg.proposal.pricePerUnit} XAF</span>
                                          </div>
                                          <div className="flex justify-between">
                                             <span>{t('form.quantity')}:</span>
                                             <span className="font-mono font-bold">{msg.proposal.quantity}</span>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-white/20 mt-1">
                                             <span>{t('chat.total')}:</span>
                                             <span className="font-mono font-bold">{(msg.proposal.pricePerUnit * msg.proposal.quantity).toLocaleString()} XAF</span>
                                          </div>
                                       </div>

                                       {/* Action Buttons (Only for receiver and if pending) */}
                                       {!isMe && msg.proposal.status === ProposalStatus.PENDING && (
                                          <div className="mt-3 flex gap-2 flex-wrap">
                                             <button
                                                onClick={() => respondToProposal(msg.chatId, msg.id, 'ACCEPT')}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold transition-colors min-w-[60px]"
                                             >
                                                {t('chat.accept')}
                                             </button>
                                             <button
                                                onClick={() => handleOpenCounter(msg.id, msg.proposal!.pricePerUnit, msg.proposal!.quantity)}
                                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 rounded font-bold transition-colors min-w-[60px]"
                                             >
                                                Counter
                                             </button>
                                             <button
                                                onClick={() => respondToProposal(msg.chatId, msg.id, 'REJECT')}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded font-bold transition-colors"
                                             >
                                                {t('chat.reject')}
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                 )}
                                 <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                           </div>
                        );
                     })}
                     <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area — auto-growing textarea for long messages */}
                  <div className="p-3 md:p-4 bg-white border-t border-gray-200 shrink-0">
                     <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <button
                           type="button"
                           onClick={() => setShowProposalModal(true)}
                           disabled={!activeChat?.offerId || !(getOfferById(activeChat?.offerId || '')?.isNegotiable ?? false)}
                           className="mb-1 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                           title={!activeChat?.offerId ? 'Select an offer first' : (getOfferById(activeChat?.offerId || '')?.isNegotiable ? 'Make Proposal' : 'This offer is not open for negotiation')}
                        >
                           <Gavel className="h-6 w-6 text-primary-600" />
                        </button>
                        <textarea
                           ref={messageInputRef}
                           rows={1}
                           value={inputText}
                           onChange={(e) => setInputText(e.target.value)}
                           onInput={adjustMessageInputHeight}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 void handleSendMessage();
                              }
                           }}
                           placeholder={t('chat.typeMessage')}
                           aria-label={t('chat.typeMessage')}
                           className="flex-1 min-h-[42px] max-h-40 resize-none overflow-y-auto border border-gray-300 rounded-2xl px-4 py-2.5 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 break-words [overflow-wrap:anywhere]"
                        />
                        <button
                           type="submit"
                           disabled={!inputText.trim()}
                           className="mb-1 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                           <Send className="h-5 w-5" />
                        </button>
                     </form>
                     <p className="mt-1.5 text-[11px] text-gray-400 hidden sm:block">
                        {t('chat.composeHint')}
                     </p>
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
                  <p>{t('chat.select')}</p>
                  <button onClick={() => navigate(-1)} className="mt-4 md:hidden text-primary-600">Go Back</button>
               </div>
            )}
         </div>

         {/* Proposal Modal */}
         {showProposalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('chat.makeProposal')}</h3>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chat.pricePerUnit')} (XAF)</label>
                        <input
                           type="number" min="0.01" step="0.01"
                           value={proposalPrice || ''}
                           onChange={(e) => setProposalPrice(Number(e.target.value) || 0)}
                           className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.quantity')}</label>
                        <input
                           type="number" min="0.01" step="0.01"
                           value={proposalQty || ''}
                           onChange={(e) => setProposalQty(Number(e.target.value) || 0)}
                           className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                        />
                     </div>
                     <div className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex justify-between font-bold text-gray-900">
                           <span>Total:</span>
                           <span>{(Number(proposalPrice) * Number(proposalQty)).toLocaleString()} XAF</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                     <button
                        onClick={() => setShowProposalModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
                     >
                        {t('form.cancel')}
                     </button>
                     <button
                        onClick={handleSendProposal}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700"
                     >
                        {t('chat.proposed')}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Counter-Offer Modal */}
         {showCounterModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Send a Counter-Offer</h3>
                  <p className="text-sm text-gray-500 mb-4">Propose your own price and quantity. The other party will receive it as a new proposal.</p>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chat.pricePerUnit')} (XAF)</label>
                        <input
                           type="number" min="0.01" step="0.01"
                           value={counterPrice || ''}
                           onChange={(e) => setCounterPrice(Number(e.target.value) || 0)}
                           className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.quantity')}</label>
                        <input
                           type="number" min="0.01" step="0.01"
                           value={counterQty || ''}
                           onChange={(e) => setCounterQty(Number(e.target.value) || 0)}
                           className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                        />
                     </div>
                     <div className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex justify-between font-bold text-gray-900">
                           <span>New Total:</span>
                           <span>{(Number(counterPrice) * Number(counterQty)).toLocaleString()} XAF</span>
                        </div>
                     </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                     <button
                        onClick={() => { setShowCounterModal(false); setCounterTargetMsgId(null); }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
                     >
                        {t('form.cancel')}
                     </button>
                     <button
                        onClick={handleSendCounter}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-bold hover:bg-yellow-600"
                     >
                        Send Counter-Offer
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
