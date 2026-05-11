
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Send, MessageCircle, ChevronLeft, Gavel, ArrowLeft } from 'lucide-react';
import { ProposalStatus } from '../../types';
import { Spinner } from '../../components/Spinner';

export const ChatPage: React.FC = () => {
   const { chatId } = useParams<{ chatId: string }>();
   const navigate = useNavigate();
   const { user, chats, messages, sendMessage, respondToProposal, clients, producers, getOfferById, fetchChats, fetchMessages } = useStore();
   const { t } = useTranslation();

   const [inputText, setInputText] = useState('');
   const [showProposalModal, setShowProposalModal] = useState(false);
   const [showCounterModal, setShowCounterModal] = useState(false);
   const [counterTargetMsgId, setCounterTargetMsgId] = useState<string | null>(null);

   // Proposal form: string inputs only (no API pre-fill — avoids store fn re-renders overwriting fields)
   const [proposalPriceStr, setProposalPriceStr] = useState('');
   const [proposalQtyStr, setProposalQtyStr] = useState('');
   const [counterPrice, setCounterPrice] = useState<number>(0);
   const [counterQty, setCounterQty] = useState<number>(0);

   const [proposalModalError, setProposalModalError] = useState('');
   const [proposalPriceError, setProposalPriceError] = useState('');
   const [proposalQtyError, setProposalQtyError] = useState('');
   const [counterPriceError, setCounterPriceError] = useState('');
   const [counterQtyError, setCounterQtyError] = useState('');

   const [messageSending, setMessageSending] = useState(false);
   const [proposalSending, setProposalSending] = useState(false);
   const [counterSending, setCounterSending] = useState(false);
   const [proposalActionBusy, setProposalActionBusy] = useState<string | null>(null);

   const messagesEndRef = useRef<HTMLDivElement>(null);
   const messageInputRef = useRef<HTMLTextAreaElement>(null);
   const proposalModalWasOpenRef = useRef(false);
   const isPollingMessagesRef = useRef(false);
   const isPollingChatsRef = useRef(false);
   const chatPollTickRef = useRef(0);

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
   const activeOfferId = activeChat?.offerId || null;
   const hasExistingProposalInCurrentRound = (() => {
      if (!activeOfferId) return false;
      const offerMessages = activeMessages
         .filter((m) => m.proposal?.offerId === activeOfferId)
         .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (offerMessages.length === 0) return false;
      const latestResolvedTimestamp = offerMessages.reduce<number | null>((latest, m) => {
         const status = m.proposal?.status;
         if (
            status !== ProposalStatus.ACCEPTED &&
            status !== ProposalStatus.REJECTED &&
            status !== ProposalStatus.SUPERSEDED
         ) return latest;
         const ts = new Date(m.createdAt).getTime();
         return latest == null ? ts : Math.max(latest, ts);
      }, null);
      return offerMessages.some((m) => {
         const ts = new Date(m.createdAt).getTime();
         return latestResolvedTimestamp == null || ts > latestResolvedTimestamp;
      });
   })();
   const canInitiateFirstProposal = user?.role === 'PRODUCER' || hasExistingProposalInCurrentRound;

   const getUserSide = useCallback((senderId: string): 'CLIENT' | 'PRODUCER' | 'UNKNOWN' => {
      const isClient = clients.some((c) => c.id === senderId || c.userId === senderId);
      if (isClient) return 'CLIENT';
      const isProducer = producers.some((p) => p.id === senderId || p.userId === senderId);
      if (isProducer) return 'PRODUCER';
      return 'UNKNOWN';
   }, [clients, producers]);

   const proposalCountersThisMonth = (() => {
      if (!activeOfferId) return { client: 0, producer: 0 };
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const monthlyOfferMessages = activeMessages
         .filter((m) => {
            const created = new Date(m.createdAt);
            const isInMonth = created >= monthStart && created < monthEnd;
            return isInMonth && m.proposal?.offerId === activeOfferId;
         })
         .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Same rule as backend: once any proposal is accepted/rejected, a new round starts.
      const latestResolvedTimestamp = monthlyOfferMessages.reduce<number | null>((latest, m) => {
         const status = m.proposal?.status;
         if (
            status !== ProposalStatus.ACCEPTED &&
            status !== ProposalStatus.REJECTED &&
            status !== ProposalStatus.SUPERSEDED
         ) return latest;
         const ts = new Date(m.createdAt).getTime();
         return latest == null ? ts : Math.max(latest, ts);
      }, null);

      let client = 0;
      let producer = 0;
      for (const m of monthlyOfferMessages) {
         const ts = new Date(m.createdAt).getTime();
         const isInCurrentRound = latestResolvedTimestamp == null || ts > latestResolvedTimestamp;
         if (!isInCurrentRound) continue;
         const side = getUserSide(m.senderId);
         if (side === 'CLIENT') client += 1;
         if (side === 'PRODUCER') producer += 1;
      }
      return { client, producer };
   })();

   const mySide = user?.role === 'PRODUCER' ? 'PRODUCER' : 'CLIENT';
   const mySideProposalCount = mySide === 'PRODUCER' ? proposalCountersThisMonth.producer : proposalCountersThisMonth.client;
   const canSendMoreCounters = mySideProposalCount < 3;

   const formatThreadDayLabel = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (msgDay.getTime() === today.getTime()) return 'Today';
      if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday';
      return d.toLocaleDateString();
   };

   const formatSidebarDateLabel = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (msgDay.getTime() === today.getTime()) return 'Today';
      if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday';
      return d.toLocaleDateString();
   };

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
         if (!isPollingMessagesRef.current) {
            isPollingMessagesRef.current = true;
            Promise.resolve(fetchMessages(chatId)).finally(() => {
               isPollingMessagesRef.current = false;
            });
         }

         // Poll exactly every 3 seconds
         interval = setInterval(() => {
            chatPollTickRef.current += 1;
            if (!isPollingMessagesRef.current) {
               isPollingMessagesRef.current = true;
               Promise.resolve(fetchMessages(chatId)).finally(() => {
                  isPollingMessagesRef.current = false;
               });
            }
            // Poll sessions less frequently (every 6s) and never overlap.
            if (chatPollTickRef.current % 2 === 0 && !isPollingChatsRef.current) {
               isPollingChatsRef.current = true;
               Promise.resolve(fetchChats()).finally(() => {
                  isPollingChatsRef.current = false;
               });
            }
         }, 3000);
      }

      return () => {
         if (interval) clearInterval(interval);
      };
   }, [chatId, user?.id]);

   useEffect(() => {
      proposalModalWasOpenRef.current = false;
   }, [chatId]);

   // Variables hoisted above for scroll calculation

   const getOtherParticipantName = (chat: typeof chats[number]) => {
      const participantIds = chat.participantIds || [];
      const otherId = participantIds.find(id => id !== user?.id);
      if (!otherId) return 'Unknown';
      const fromParticipantsData = chat.participantsData?.find((p) => p.id === otherId)?.displayName;
      if (fromParticipantsData && fromParticipantsData.trim()) return fromParticipantsData.trim();
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

   const getOfferContextLabel = (offerId?: string) => {
      if (!offerId) return '';
      const offer = getOfferById(offerId);
      if (!offer) return 'Offer';
      const typeLabel = String(offer.type || '').toUpperCase() === 'SERVICE' ? 'Service' : 'Product';
      return `${typeLabel}: ${offer.title}`;
   };

   const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !chatId || messageSending) return;
      setMessageSending(true);
      try {
         const sent = await sendMessage(chatId, inputText);
         if (sent) {
            setInputText('');
            requestAnimationFrame(() => {
               adjustMessageInputHeight();
            });
         }
      } finally {
         setMessageSending(false);
      }
   };

   const handleSendProposal = async () => {
      if (!activeChat || !activeChat.offerId) return;
      if (!canInitiateFirstProposal) {
         setProposalModalError('Only producer can open a new proposal round in this chat.');
         return;
      }
      if (!canSendMoreCounters) {
         setProposalModalError('Monthly counter-offer limit reached for your side (2) on this product in this chat.');
         return;
      }

      setProposalModalError('');
      setProposalPriceError('');
      setProposalQtyError('');

      const offer = getOfferById(activeChat.offerId);
      if (!offer) {
         setProposalModalError('Offer not found.');
         return;
      }
      if (!offer.isNegotiable) {
         setProposalModalError('This offer is not open for negotiation.');
         return;
      }

      const price = parseFloat(String(proposalPriceStr).replace(',', '.').trim());
      const qty = parseFloat(String(proposalQtyStr).replace(',', '.').trim());
      let hasFieldError = false;
      if (!Number.isFinite(price) || price <= 0) {
         setProposalPriceError('Enter a valid price per unit (greater than 0).');
         hasFieldError = true;
      }
      if (!Number.isFinite(qty) || qty <= 0) {
         setProposalQtyError('Enter a valid quantity (greater than 0).');
         hasFieldError = true;
      }
      if (hasFieldError) return;

      if (price < minPricePerUnit) {
         setProposalPriceError(`Price must be at least ${minPricePerUnit.toLocaleString()} XAF.`);
         return;
      }
      if (maxPricePerUnit != null && price > maxPricePerUnit) {
         setProposalPriceError(`Price cannot exceed ${maxPricePerUnit.toLocaleString()} XAF.`);
         return;
      }

      setProposalSending(true);
      try {
         const ok = await sendMessage(activeChat.id, 'Formal Proposal Sent', {
            offerId: activeChat.offerId,
            pricePerUnit: price,
            quantity: qty,
            status: ProposalStatus.PENDING,
         });
         if (ok) {
            setProposalModalError('');
            setProposalPriceError('');
            setProposalQtyError('');
            setShowProposalModal(false);
         }
      } finally {
         setProposalSending(false);
      }
   };

   const handleOpenCounter = (msgId: string, currentPrice: number | string, currentQty: number | string) => {
      setCounterPriceError('');
      setCounterQtyError('');
      setCounterTargetMsgId(msgId);
      setCounterPrice(Number(currentPrice) || 0);
      setCounterQty(Number(currentQty) || 0);
      setShowCounterModal(true);
   };

   const handleSendCounter = async () => {
      if (!counterTargetMsgId || !chatId || counterSending) return;
      if (!canSendMoreCounters) {
         setCounterPriceError('Monthly counter-offer limit reached (2).');
         return;
      }

      setCounterPriceError('');
      setCounterQtyError('');

      let hasFieldError = false;
      if (counterPrice <= 0) {
         setCounterPriceError('Enter a valid price per unit (greater than 0).');
         hasFieldError = true;
      }
      if (counterQty <= 0) {
         setCounterQtyError('Enter a valid quantity (greater than 0).');
         hasFieldError = true;
      }
      if (hasFieldError) return;

      if (counterPrice < minPricePerUnit) {
         setCounterPriceError(`Price must be at least ${minPricePerUnit.toLocaleString()} XAF.`);
         return;
      }
      if (maxPricePerUnit != null && counterPrice > maxPricePerUnit) {
         setCounterPriceError(`Price cannot exceed ${maxPricePerUnit.toLocaleString()} XAF.`);
         return;
      }

      setCounterSending(true);
      try {
         const ok = await respondToProposal(chatId, counterTargetMsgId, 'COUNTER', counterPrice, counterQty);
         if (ok) {
            setCounterPriceError('');
            setCounterQtyError('');
            setShowCounterModal(false);
            setCounterTargetMsgId(null);
         }
      } finally {
         setCounterSending(false);
      }
   };

   if (!user) return <div className="p-8 text-center">Login required.</div>;

   const listingOffer = activeChat?.offerId ? getOfferById(activeChat.offerId) ?? null : null;
   const maxPricePerUnit =
      listingOffer != null
         ? (() => {
            const offerAny = listingOffer as any;
            const listPrice = Number(listingOffer.price);
            const configuredMax = Number(
               offerAny.maxNegotiationPrice ?? offerAny.maxProposalPrice ?? offerAny.maxPrice ?? listPrice,
            );
            return Number.isFinite(configuredMax) && configuredMax > 0
               ? configuredMax
               : (Number.isFinite(listPrice) ? listPrice : null);
         })()
         : null;
   const minPricePerUnit =
      listingOffer != null
         ? (() => {
            const offerAny = listingOffer as any;
            const configuredMin = Number(
               offerAny.minNegotiationPrice ?? offerAny.minProposalPrice ?? offerAny.minPrice ?? 0,
            );
            return Number.isFinite(configuredMin) && configuredMin > 0 ? configuredMin : 0;
         })()
         : 0;

   const proposalTotalPreview =
      (() => {
         const p = parseFloat(String(proposalPriceStr).replace(',', '.').trim());
         const q = parseFloat(String(proposalQtyStr).replace(',', '.').trim());
         if (!Number.isFinite(p) || !Number.isFinite(q)) return null;
         return p * q;
      })();

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
                     const otherName = getOtherParticipantName(chat);
                     const threadUnread = Math.max(0, Number(chat.unreadCounts?.[user.id]) || 0);
                     const offerContext = getOfferContextLabel(chat.offerId);
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
                                 <span className="text-xs text-gray-400 whitespace-nowrap">{formatSidebarDateLabel(chat.lastMessageAt)}</span>
                              </div>
                           </div>
                           {offerContext ? (
                              <p className="text-[11px] text-primary-700 font-semibold truncate">{offerContext}</p>
                           ) : null}
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
                           {getOtherParticipantName(activeChat).charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900">{getOtherParticipantName(activeChat)}</h3>
                           {activeChat.offerId && <span className="text-xs text-gray-500">{getOfferContextLabel(activeChat.offerId)}</span>}
                        </div>
                     </div>
                     <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary-600 hidden md:block">
                        Close
                     </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                     {activeChat.offerId ? (
                        <div className="flex justify-center">
                           <div className="bg-gray-200 text-gray-700 text-[11px] px-3 py-1 rounded-full">
                              New negotiation context: {getOfferContextLabel(activeChat.offerId)}
                           </div>
                        </div>
                     ) : null}
                     {activeMessages.map((msg, idx) => {
                        const isMe = msg.senderId === user.id;
                        const isSystem = msg.systemMessage;
                        const prev = idx > 0 ? activeMessages[idx - 1] : null;
                        const showDaySeparator =
                           !prev ||
                           new Date(prev.createdAt).toDateString() !==
                              new Date(msg.createdAt).toDateString();

                        return (
                           <React.Fragment key={msg.id}>
                              {showDaySeparator ? (
                                 <div className="flex justify-center my-2">
                                    <div className="bg-gray-300/70 text-gray-700 text-[11px] px-3 py-1 rounded-full">
                                       {formatThreadDayLabel(msg.createdAt)}
                                    </div>
                                 </div>
                              ) : null}
                              {isSystem ? (
                                 <div className="flex justify-center my-4">
                                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                       {msg.text}
                                    </div>
                                 </div>
                              ) : (
                                 <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                                             msg.proposal.status === ProposalStatus.SUPERSEDED ? 'bg-gray-400 text-white' :
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
                                                type="button"
                                                disabled={!!proposalActionBusy}
                                                onClick={() => {
                                                   setProposalActionBusy(`${msg.id}:accept`);
                                                   void respondToProposal(msg.chatId, msg.id, 'ACCEPT').finally(() => setProposalActionBusy(null));
                                                }}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold transition-colors min-w-[60px] disabled:opacity-60 inline-flex items-center justify-center gap-1"
                                             >
                                                {proposalActionBusy === `${msg.id}:accept` ? <Spinner className="h-3.5 w-3.5" /> : null}
                                                {t('chat.accept')}
                                             </button>
                                             <button
                                                type="button"
                                                disabled={!!proposalActionBusy || counterSending || !canSendMoreCounters}
                                                onClick={() => handleOpenCounter(msg.id, msg.proposal!.pricePerUnit, msg.proposal!.quantity)}
                                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 rounded font-bold transition-colors min-w-[60px] disabled:opacity-60"
                                             >
                                                Counter
                                             </button>
                                             <button
                                                type="button"
                                                disabled={!!proposalActionBusy}
                                                onClick={() => {
                                                   setProposalActionBusy(`${msg.id}:reject`);
                                                   void respondToProposal(msg.chatId, msg.id, 'REJECT').finally(() => setProposalActionBusy(null));
                                                }}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded font-bold transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1"
                                             >
                                                {proposalActionBusy === `${msg.id}:reject` ? <Spinner className="h-3.5 w-3.5" /> : null}
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
                              )}
                           </React.Fragment>
                        );
                     })}
                     <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area — auto-growing textarea for long messages */}
                  <div className="p-3 md:p-4 bg-white border-t border-gray-200 shrink-0">
                     <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <button
                           type="button"
                           onClick={() => {
                              if (!canInitiateFirstProposal) return;
                              setProposalPriceStr('');
                              setProposalQtyStr('');
                              setProposalModalError('');
                              setProposalPriceError('');
                              setProposalQtyError('');
                              setShowProposalModal(true);
                           }}
                           disabled={!activeChat?.offerId || !(getOfferById(activeChat?.offerId || '')?.isNegotiable ?? false) || !canSendMoreCounters || !canInitiateFirstProposal}
                           className="mb-1 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                           title={!activeChat?.offerId ? 'Select an offer first' : (!canInitiateFirstProposal ? 'Only producer can open a new proposal round' : (!canSendMoreCounters ? 'Counter-offer limit reached (3 per round)' : (getOfferById(activeChat?.offerId || '')?.isNegotiable ? 'Make Proposal' : 'This offer is not open for negotiation')))}
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
                           disabled={!inputText.trim() || messageSending}
                           className="mb-1 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 inline-flex items-center justify-center"
                        >
                           {messageSending ? <Spinner className="h-5 w-5" label="Sending message" /> : <Send className="h-5 w-5" />}
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
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('chat.makeProposal')}</h3>
                  {maxPricePerUnit != null && (
                     <p className="text-xs text-gray-500 mb-3">
                        Allowed range: {minPricePerUnit.toLocaleString()} - {maxPricePerUnit.toLocaleString()} XAF per unit.
                     </p>
                  )}
                  {proposalModalError ? (
                     <p className="text-sm text-red-600 mb-3" role="alert">
                        {proposalModalError}
                     </p>
                  ) : null}

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chat.pricePerUnit')} (XAF)</label>
                        <input
                           type="text"
                           inputMode="decimal"
                           autoComplete="off"
                           placeholder={maxPricePerUnit != null ? `${minPricePerUnit.toLocaleString()} - ${maxPricePerUnit.toLocaleString()}` : 'e.g. 2500'}
                           value={proposalPriceStr}
                           onChange={(e) => {
                              setProposalPriceStr(e.target.value.replace(/[^\d.,]/g, ''));
                              setProposalPriceError('');
                              setProposalModalError('');
                           }}
                           aria-invalid={!!proposalPriceError}
                           className={`w-full border rounded-md p-2 bg-white text-gray-900 ${proposalPriceError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                        {proposalPriceError ? (
                           <p className="text-xs text-red-600 mt-1" role="alert">{proposalPriceError}</p>
                        ) : null}
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.quantity')}</label>
                        <input
                           type="text"
                           inputMode="decimal"
                           autoComplete="off"
                           placeholder="e.g. 10"
                           value={proposalQtyStr}
                           onChange={(e) => {
                              setProposalQtyStr(e.target.value.replace(/[^\d.,]/g, ''));
                              setProposalQtyError('');
                              setProposalModalError('');
                           }}
                           aria-invalid={!!proposalQtyError}
                           className={`w-full border rounded-md p-2 bg-white text-gray-900 ${proposalQtyError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                        {proposalQtyError ? (
                           <p className="text-xs text-red-600 mt-1" role="alert">{proposalQtyError}</p>
                        ) : null}
                     </div>
                     {proposalTotalPreview != null && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                           <div className="flex justify-between font-bold text-gray-900">
                              <span>Total:</span>
                              <span>{Math.round(proposalTotalPreview).toLocaleString()} XAF</span>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                     <button
                        onClick={() => {
                           setShowProposalModal(false);
                           setProposalModalError('');
                           setProposalPriceError('');
                           setProposalQtyError('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
                     >
                        {t('form.cancel')}
                     </button>
                     <button
                        type="button"
                        disabled={proposalSending}
                        onClick={() => void handleSendProposal()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                     >
                        {proposalSending && <Spinner className="h-4 w-4" label="Sending proposal" />}
                        {proposalSending ? 'Sending…' : t('chat.proposed')}
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
                  <p className="text-sm text-gray-500 mb-4">
                     Propose your own price and quantity. The other party will receive it as a new proposal.
                     {maxPricePerUnit != null && (
                        <> Allowed price range is {minPricePerUnit.toLocaleString()} to {maxPricePerUnit.toLocaleString()} XAF.</>
                     )}
                  </p>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chat.pricePerUnit')} (XAF)</label>
                        <input
                           type="number"
                           min={minPricePerUnit > 0 ? minPricePerUnit : 0.01}
                           step="0.01"
                           {...(maxPricePerUnit != null ? { max: maxPricePerUnit } : {})}
                           value={counterPrice || ''}
                           onChange={(e) => {
                              setCounterPrice(Number(e.target.value) || 0);
                              setCounterPriceError('');
                           }}
                           aria-invalid={!!counterPriceError}
                           className={`w-full border rounded-md p-2 bg-white text-gray-900 ${counterPriceError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                        {counterPriceError ? (
                           <p className="text-xs text-red-600 mt-1" role="alert">{counterPriceError}</p>
                        ) : null}
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.quantity')}</label>
                        <input
                           type="number" min="0.01" step="0.01"
                           value={counterQty || ''}
                           onChange={(e) => {
                              setCounterQty(Number(e.target.value) || 0);
                              setCounterQtyError('');
                           }}
                           aria-invalid={!!counterQtyError}
                           className={`w-full border rounded-md p-2 bg-white text-gray-900 ${counterQtyError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        />
                        {counterQtyError ? (
                           <p className="text-xs text-red-600 mt-1" role="alert">{counterQtyError}</p>
                        ) : null}
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
                        onClick={() => {
                           setShowCounterModal(false);
                           setCounterTargetMsgId(null);
                           setCounterPriceError('');
                           setCounterQtyError('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
                     >
                        {t('form.cancel')}
                     </button>
                     <button
                        type="button"
                        disabled={counterSending}
                        onClick={() => void handleSendCounter()}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-bold hover:bg-yellow-600 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                     >
                        {counterSending && <Spinner className="h-4 w-4" label="Sending counter-offer" />}
                        {counterSending ? 'Sending…' : 'Send Counter-Offer'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
