
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Send, MessageCircle, ChevronLeft, Gavel, ArrowLeft, Check, AlertCircle, ChevronDown, Clock } from 'lucide-react';
import { ProposalStatus, OfferType, type ChatMessage } from '../../types';
import { isProducerDashboardUser } from '../../services/producerSession';
import { Spinner } from '../../components/Spinner';
import { ListSkeleton } from '../../components/Loaders';
import { Modal } from '../../components/Modal';
import { ServiceAppointmentPicker } from '../../components/ServiceAppointmentPicker';
import { useCurrency } from '../../contexts/CurrencyContext';

export const ChatPage: React.FC = () => {
   const { chatId } = useParams<{ chatId: string }>();
   const navigate = useNavigate();
   const { user, chats, messages, typingByChatId, realtimeConnected, sendMessage, retryMessage, emitTyping, respondToProposal, clients, producers, getOfferById, fetchChats, fetchMessages, refreshOffers, refreshProducers, refreshClients, orders, cart } = useStore();
   const { t } = useTranslation();
   const { formatXaf, currencyLabel, toXaf, fromXaf } = useCurrency();

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

   const [proposalSending, setProposalSending] = useState(false);
   const [counterSending, setCounterSending] = useState(false);
   const [proposalActionBusy, setProposalActionBusy] = useState<string | null>(null);
   // Appointment picker shown when accepting a SERVICE proposal so the booking
   // date reflects the real appointment rather than the moment of acceptance.
   const [apptMsg, setApptMsg] = useState<ChatMessage | null>(null);
   const [apptSlotIso, setApptSlotIso] = useState<string | null>(null);

   const messagesEndRef = useRef<HTMLDivElement>(null);
   const messagesContainerRef = useRef<HTMLDivElement>(null);
   const messageInputRef = useRef<HTMLTextAreaElement>(null);
   const proposalModalWasOpenRef = useRef(false);
   const messagesInFlightRef = useRef<Set<string>>(new Set());
   const isPollingChatsRef = useRef(false);
   const chatPollTickRef = useRef(0);
   // Track which message ids we've already rendered, so newly-arrived bubbles
   // can be tagged for a one-time fade-in animation without re-animating older
   // messages on every render.
   const seenMessageIdsRef = useRef<Set<string>>(new Set());
   const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
   // Sticky-to-bottom behaviour: only auto-scroll when the user is already
   // near the bottom; otherwise show a pill telling them new messages arrived.
   const [isNearBottom, setIsNearBottom] = useState(true);
   const [newIncomingCount, setNewIncomingCount] = useState(0);
   // Typing-indicator transmit state. We throttle `typing=true` so we don't
   // emit on every keystroke, and debounce `typing=false` to fire after a
   // short idle window. Refs (not state) so updates don't re-render.
   const lastTypingEmitRef = useRef<number>(0);
   const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const isTypingActiveRef = useRef<boolean>(false);

   const TEXTAREA_MAX_PX = 160;

   const adjustMessageInputHeight = useCallback(() => {
      const el = messageInputRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
   }, []);

   // Resolve the typing recipient ids (= participants of the active chat minus
   // the current user) up front. We keep them in a ref so notifyTyping /
   // stopTypingNow can read the latest value without re-binding when `chats`
   // updates — that was previously causing the cleanup effect to fire on
   // every poll and silently send spurious "stopped typing" events.
   const typingRecipientsRef = useRef<string[]>([]);
   useEffect(() => {
      if (!chatId || !user?.id) {
         typingRecipientsRef.current = [];
         return;
      }
      const chat = chats.find((c) => c.id === chatId);
      const others = (chat?.participantIds || []).filter((id) => id && id !== user.id);
      typingRecipientsRef.current = others;
   }, [chatId, chats, user?.id]);

   /**
    * Notify the other party that we are typing. Emits a `chat:typing` event
    * at most once every 2.5s while the user is actively typing, and a final
    * `isTyping: false` event 2s after the user stops. Cheap to call on every
    * keystroke — internal throttle/debounce do the right thing.
    */
   const notifyTyping = useCallback(() => {
      if (!chatId) return;
      const recipients = typingRecipientsRef.current;
      if (recipients.length === 0) return;
      const now = Date.now();
      if (!isTypingActiveRef.current || now - lastTypingEmitRef.current > 2500) {
         emitTyping(chatId, true, recipients);
         lastTypingEmitRef.current = now;
         isTypingActiveRef.current = true;
      }
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = setTimeout(() => {
         isTypingActiveRef.current = false;
         emitTyping(chatId, false, typingRecipientsRef.current);
      }, 2000);
   }, [chatId, emitTyping]);

   /**
    * Stop the typing indicator immediately. Called when the user sends, when
    * the chat changes, and when the component unmounts. Reads recipients via
    * the ref so it's stable across `chats` updates.
    */
   const stopTypingNow = useCallback(() => {
      if (typingStopTimerRef.current) {
         clearTimeout(typingStopTimerRef.current);
         typingStopTimerRef.current = null;
      }
      if (!isTypingActiveRef.current || !chatId) return;
      isTypingActiveRef.current = false;
      emitTyping(chatId, false, typingRecipientsRef.current);
   }, [chatId, emitTyping]);

   // Tell the other side we stopped typing ONLY when the chat actually changes
   // (or the page unmounts) — not on every `chats` poll update. We achieve
   // this by depending solely on `chatId`, since notifyTyping/stopTypingNow
   // are stable now that emitTyping no longer depends on `chats`.
   useEffect(() => {
      return () => {
         if (typingStopTimerRef.current) {
            clearTimeout(typingStopTimerRef.current);
            typingStopTimerRef.current = null;
         }
         if (isTypingActiveRef.current && chatId) {
            emitTyping(chatId, false, typingRecipientsRef.current);
            isTypingActiveRef.current = false;
         }
      };
   }, [chatId, emitTyping]);

   // Get active chat early to determine message length
   const activeChat = chatId ? chats.find(c => c.id === chatId) : null;
   const activeMessages = activeChat ? messages.filter(m => m.chatId === chatId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
   // Other-party typing indicator for the active chat. `expiresAt` is enforced
   // by a 1s interval in storeContext, so we just need a freshness check here.
   const otherTyping = (() => {
      if (!chatId) return null;
      const entry = typingByChatId?.[chatId];
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) return null;
      if (user && entry.userId === user.id) return null;
      return entry.userId;
   })();
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
   const canInitiateFirstProposal = isProducerDashboardUser(user) || hasExistingProposalInCurrentRound;

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

   const mySide = isProducerDashboardUser(user) ? 'PRODUCER' : 'CLIENT';
   const mySideProposalCount = mySide === 'PRODUCER' ? proposalCountersThisMonth.producer : proposalCountersThisMonth.client;
   const canSendMoreCounters = mySideProposalCount < 3;

   const formatThreadDayLabel = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (msgDay.getTime() === today.getTime()) return t('chat.today');
      if (msgDay.getTime() === yesterday.getTime()) return t('chat.yesterday');
      return d.toLocaleDateString();
   };

   const formatSidebarDateLabel = (iso: string) => {
      const d = new Date(iso);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (msgDay.getTime() === today.getTime()) return t('chat.today');
      if (msgDay.getTime() === yesterday.getTime()) return t('chat.yesterday');
      return d.toLocaleDateString();
   };

   const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior });
   }, []);

   const handleMessagesScroll = useCallback(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = distanceFromBottom < 120;
      setIsNearBottom(nearBottom);
      if (nearBottom && newIncomingCount > 0) setNewIncomingCount(0);
   }, [newIncomingCount]);

   // Reset scroll bookkeeping when switching chats so we don't carry over the
   // previous conversation's "new messages" pill.
   useEffect(() => {
      seenMessageIdsRef.current = new Set();
      setAnimatingIds(new Set());
      setNewIncomingCount(0);
      setIsNearBottom(true);
      requestAnimationFrame(() => scrollToBottom('auto'));
   }, [chatId, scrollToBottom]);

   // React to changes in the message list:
   // - If the user is at the bottom (reading the live thread), auto-scroll.
   // - Otherwise track how many new incoming bubbles arrived so we can show
   //   the "↓ N new messages" pill.
   // - Always tag genuinely-new ids for the one-time fade-in animation.
   useEffect(() => {
      if (activeMessages.length === 0) {
         seenMessageIdsRef.current = new Set();
         return;
      }
      const prevSeen = seenMessageIdsRef.current;
      const newlyArrived: ChatMessage[] = [];
      for (const m of activeMessages) {
         if (!prevSeen.has(m.id)) newlyArrived.push(m);
      }
      // Update the seen set to the current list (covers both arrivals and removals).
      seenMessageIdsRef.current = new Set(activeMessages.map((m) => m.id));

      if (newlyArrived.length === 0) return;

      // Animate every new bubble exactly once; drop the tag after the animation
      // completes so subsequent re-renders don't re-trigger it.
      setAnimatingIds((prev) => {
         const next = new Set(prev);
         for (const m of newlyArrived) next.add(m.id);
         return next;
      });
      const ids = newlyArrived.map((m) => m.id);
      const animationTimer = setTimeout(() => {
         setAnimatingIds((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.delete(id);
            return next;
         });
      }, 450);

      const incomingFromOthers = newlyArrived.filter((m) => m.senderId !== user?.id && !m.systemMessage).length;
      if (isNearBottom) {
         requestAnimationFrame(() => scrollToBottom('smooth'));
      } else if (incomingFromOthers > 0) {
         setNewIncomingCount((n) => n + incomingFromOthers);
      }

      return () => clearTimeout(animationTimer);
   }, [activeMessages, isNearBottom, scrollToBottom, user?.id]);

   useEffect(() => {
      adjustMessageInputHeight();
   }, [inputText, chatId, adjustMessageInputHeight]);

   // Fetch chats on mount; catalog slices load in the background so the thread opens fast.
   const hasCachedChats = chats.some((c) => c.participantIds?.includes(user?.id ?? ''));
   const [chatListLoading, setChatListLoading] = useState(!hasCachedChats);
   useEffect(() => {
      if (!user) return;
      let cancelled = false;
      if (!hasCachedChats) setChatListLoading(true);
      void fetchChats().finally(() => {
         if (!cancelled) setChatListLoading(false);
      });
      void refreshOffers();
      void refreshProducers();
      void refreshClients();
      return () => { cancelled = true; };
   }, [user?.id]);

   const hasCachedMessagesForChat = Boolean(
      chatId && messages.some((m) => m.chatId === chatId),
   );
   const [messagesLoading, setMessagesLoading] = useState(
      Boolean(chatId) && !hasCachedMessagesForChat,
   );

   useEffect(() => {
      if (!chatId) {
         setMessagesLoading(false);
         return;
      }
      if (messages.some((m) => m.chatId === chatId)) {
         setMessagesLoading(false);
      }
   }, [chatId, messages]);

   // Fetch messages when a specific chat is selected, and keep a SAFETY-NET
   // poll running as a backup to the real-time WebSocket push.
   //
   // PRODUCTION-LEVEL CHANGE: Previously this polled the `messages` endpoint
   // every 3s (and `sessions` every 6s) — which translated into an essentially
   // continuous stream of `GET /chat/sessions/.../messages` requests (each
   // taking ~2.5–3s server-side) for every user with the chat tab open.
   //
   // Now:
   //   - New messages arrive instantly over the `/notifications` socket as
   //     `chat:message` / `chat:session-update` events (see storeContext.tsx).
   //   - The poll is a long-interval visibility-gated FALLBACK only:
   //       • 30 s while WS is connected & tab visible (recovers any dropped
   //         events without hammering the API)
   //       • 10 s while WS is disconnected (degrade gracefully)
   //       •  paused entirely while the tab is hidden
   //   - In-flight de-dup is preserved so requests never queue.
   useEffect(() => {
      if (!user || !chatId) {
         setMessagesLoading(false);
         return;
      }

      let interval: ReturnType<typeof setInterval> | null = null;
      let cancelled = false;

      const isVisible = () =>
         typeof document === 'undefined' || document.visibilityState === 'visible';

      const loadMessages = (showLoader: boolean) => {
         if (messagesInFlightRef.current.has(chatId)) return;
         messagesInFlightRef.current.add(chatId);
         if (showLoader) setMessagesLoading(true);
         Promise.resolve(fetchMessages(chatId)).finally(() => {
            messagesInFlightRef.current.delete(chatId);
            if (!cancelled) setMessagesLoading(false);
         });
      };

      // Initial fetch — show loader only when this thread is not cached yet.
      const hasCached = messages.some((m) => m.chatId === chatId);
      loadMessages(!hasCached);

      const tick = () => {
         if (!isVisible()) return;
         loadMessages(false);
         // Refresh the sidebar/session list on every other tick to keep last-
         // message previews in sync if a WS update was missed.
         chatPollTickRef.current += 1;
         if (chatPollTickRef.current % 2 === 0 && !isPollingChatsRef.current) {
            isPollingChatsRef.current = true;
            Promise.resolve(fetchChats()).finally(() => {
               isPollingChatsRef.current = false;
            });
         }
      };

      const pollMs = realtimeConnected ? 30_000 : 10_000;
      interval = setInterval(tick, pollMs);

      // Catch-up fetch whenever the tab is brought back to the foreground so
      // the user doesn't see stale messages after a long hide.
      const onVisibility = () => { if (isVisible()) tick(); };
      document.addEventListener('visibilitychange', onVisibility);

      return () => {
         cancelled = true;
         if (interval) clearInterval(interval);
         document.removeEventListener('visibilitychange', onVisibility);
      };
   }, [chatId, user?.id, realtimeConnected]);

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
         return t('chat.unknownProducer');
      }
      return t('chat.user');
   };

   const getOfferContextLabel = (offerId?: string) => {
      if (!offerId) return '';
      const offer = getOfferById(offerId);
      if (!offer) return t('chat.offer');
      const typeLabel = String(offer.type || '').toUpperCase() === 'SERVICE' ? t('chat.service') : t('chat.product');
      return `${typeLabel}: ${offer.title}`;
   };

   const handleSendMessage = (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = inputText.trim();
      if (!trimmed || !chatId) return;
      // Tell the other side we stopped typing immediately — they'll see the
      // bubble pop in instead of the "is typing…" indicator.
      stopTypingNow();
      // Clear the composer immediately so the user can keep typing while the
      // POST is in flight — the optimistic bubble is the source of truth for
      // "did it go". `sendMessage` resolves later and updates that bubble's
      // status (SENT / FAILED) without blocking input.
      setInputText('');
      requestAnimationFrame(() => {
         adjustMessageInputHeight();
         messageInputRef.current?.focus();
      });
      // Pin the user to the bottom so they actually see their own bubble.
      setIsNearBottom(true);
      setNewIncomingCount(0);
      // We deliberately don't await — the bubble already renders.
      void sendMessage(chatId, trimmed);
   };

   const handleRetryMessage = useCallback(async (clientId?: string) => {
      if (!clientId) return;
      await retryMessage(clientId);
   }, [retryMessage]);

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

      const priceDisplay = parseFloat(String(proposalPriceStr).replace(',', '.').trim());
      const qty = parseFloat(String(proposalQtyStr).replace(',', '.').trim());
      let hasFieldError = false;
      const serviceProposal = String(offer.type ?? '').toUpperCase() === OfferType.SERVICE;
      if (!Number.isFinite(priceDisplay) || priceDisplay <= 0) {
         setProposalPriceError(serviceProposal ? 'Enter a valid service rate (greater than 0).' : 'Enter a valid price per unit (greater than 0).');
         hasFieldError = true;
      }
      if (!Number.isFinite(qty) || qty <= 0) {
         setProposalQtyError(serviceProposal ? 'Enter a valid number of sessions (greater than 0).' : 'Enter a valid quantity (greater than 0).');
         hasFieldError = true;
      }
      if (hasFieldError) return;

      const price = toXaf(priceDisplay);
      if (price < minPricePerUnit) {
         setProposalPriceError(`Price must be at least ${formatXaf(minPricePerUnit)}.`);
         return;
      }
      if (maxPricePerUnit != null && price > maxPricePerUnit) {
         setProposalPriceError(`Price cannot exceed ${formatXaf(maxPricePerUnit)}.`);
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
      setCounterPrice(fromXaf(Number(currentPrice) || 0));
      setCounterQty(Number(currentQty) || 0);
      setShowCounterModal(true);
   };

   const getProposalOffer = (msg: ChatMessage) => {
      const offerId = msg.proposal?.offerId || activeChat?.offerId;
      if (!offerId) return undefined;
      const direct = getOfferById(offerId);
      if (direct) return direct;
      if (activeChat?.offerId) return getOfferById(activeChat.offerId);
      return undefined;
   };

   const isServiceProposal = (msg: ChatMessage) => {
      const offer = getProposalOffer(msg);
      return String(offer?.type ?? '').toUpperCase() === OfferType.SERVICE;
   };

   /** Accept directly for products; for services, collect the appointment date first. */
   const handleAcceptProposal = (msg: ChatMessage) => {
      if (isServiceProposal(msg)) {
         setApptMsg(msg);
         setApptSlotIso(null);
         return;
      }
      setProposalActionBusy(`${msg.id}:accept`);
      void respondToProposal(msg.chatId, msg.id, 'ACCEPT').finally(() => setProposalActionBusy(null));
   };

   const confirmServiceAppointment = () => {
      if (!apptMsg || !apptSlotIso) return;
      const iso = apptSlotIso;
      const m = apptMsg;
      setProposalActionBusy(`${m.id}:accept`);
      void respondToProposal(m.chatId, m.id, 'ACCEPT', undefined, undefined, iso).finally(() => {
         setProposalActionBusy(null);
         setApptMsg(null);
      });
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

      const priceXaf = toXaf(counterPrice);
      if (priceXaf < minPricePerUnit) {
         setCounterPriceError(`Price must be at least ${formatXaf(minPricePerUnit)}.`);
         return;
      }
      if (maxPricePerUnit != null && priceXaf > maxPricePerUnit) {
         setCounterPriceError(`Price cannot exceed ${formatXaf(maxPricePerUnit)}.`);
         return;
      }

      setCounterSending(true);
      try {
         const ok = await respondToProposal(chatId, counterTargetMsgId, 'COUNTER', priceXaf, counterQty);
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
   const isServiceListing = String(listingOffer?.type ?? '').toUpperCase() === OfferType.SERVICE;
   const listingUnitLabel = listingOffer ? t(`unit.${listingOffer.unit}`) : '';
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
         return toXaf(p) * q;
      })();

   return (
      <div className="agm-chat-shell flex bg-gray-100 overflow-hidden">
         {/* Sidebar List */}
         <div className={`${chatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
               <h2 className="text-lg font-bold text-gray-800">{t('nav.messages')}</h2>
               <button onClick={() => navigate(-1)} className="md:hidden p-2 text-gray-500">
                  <ArrowLeft className="h-5 w-5" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto">
               {chatListLoading && chats.filter(c => c.participantIds?.includes(user.id)).length === 0 ? (
                  <div className="p-3"><ListSkeleton rows={6} /></div>
               ) : chats.filter(c => c.participantIds?.includes(user.id)).length === 0 ? (
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
                        <div className="min-w-0 max-w-[min(100%,14rem)] sm:max-w-xs md:max-w-sm">
                           <h3
                              className="font-bold text-gray-900 truncate"
                              title={getOtherParticipantName(activeChat)}
                           >
                              {getOtherParticipantName(activeChat)}
                           </h3>
                           {activeChat.offerId && (
                              <span className="text-xs text-gray-500 truncate block" title={getOfferContextLabel(activeChat.offerId)}>
                                 {getOfferContextLabel(activeChat.offerId)}
                              </span>
                           )}
                        </div>
                     </div>
                     <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary-600 hidden md:block">
                        Close
                     </button>
                  </div>

                  {/* Messages */}
                  <div
                     ref={messagesContainerRef}
                     onScroll={handleMessagesScroll}
                     className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 relative"
                  >
                     {activeChat.offerId ? (
                        <div className="flex justify-center">
                           <div className="bg-gray-200 text-gray-700 text-[11px] px-3 py-1 rounded-full">
                              New negotiation context: {getOfferContextLabel(activeChat.offerId)}
                           </div>
                        </div>
                     ) : null}
                     {messagesLoading ? (
                        <div
                           className="flex flex-col items-center justify-center py-12 gap-4"
                           role="status"
                           aria-live="polite"
                           aria-busy="true"
                        >
                           <Spinner className="h-8 w-8 text-primary-600" label={t('chat.loadingMessages')} />
                           <p className="text-sm text-gray-500">{t('chat.loadingMessages')}</p>
                           <div className="w-full max-w-sm space-y-3 mt-2" aria-hidden="true">
                              <div className="flex justify-start">
                                 <div className="h-10 w-48 agm-shimmer rounded-2xl rounded-bl-none" />
                              </div>
                              <div className="flex justify-end">
                                 <div className="h-10 w-36 agm-shimmer rounded-2xl rounded-br-none" />
                              </div>
                              <div className="flex justify-start">
                                 <div className="h-14 w-56 agm-shimmer rounded-2xl rounded-bl-none" />
                              </div>
                           </div>
                        </div>
                     ) : null}
                     {!messagesLoading && activeMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
                           <MessageCircle className="h-10 w-10 mb-3 opacity-30" />
                           <p>{t('chat.typeMessage')}</p>
                        </div>
                     ) : null}
                     {!messagesLoading && activeMessages.map((msg, idx) => {
                        const isMe = msg.senderId === user.id;
                        const isSystem = msg.systemMessage;
                        const prev = idx > 0 ? activeMessages[idx - 1] : null;
                        const showDaySeparator =
                           !prev ||
                           new Date(prev.createdAt).toDateString() !==
                              new Date(msg.createdAt).toDateString();
                        const isAnimating = animatingIds.has(msg.id);
                        const isFailed = isMe && msg.status === 'FAILED';
                        const isSending = isMe && msg.status === 'SENDING';
                        const bubbleAnim = isAnimating ? 'agm-chat-bubble-in' : '';
                        const bubbleBaseSide = isMe
                           ? `bg-primary-600 text-white rounded-br-none ${isFailed ? 'opacity-75 ring-2 ring-red-300' : ''} ${isSending ? 'opacity-90' : ''}`
                           : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none';

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
                                 <div className={`flex justify-center my-4 ${bubbleAnim}`}>
                                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                       {msg.text}
                                    </div>
                                 </div>
                              ) : (
                                 <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${bubbleAnim}`}>
                              <div className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 shadow-sm transition-opacity ${bubbleBaseSide}`}>
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
                                             <span>{isServiceProposal(msg) ? t('chat.serviceRate') : t('chat.pricePerUnit')}:</span>
                                             <span className="font-mono font-bold">{formatXaf(msg.proposal.pricePerUnit)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                             <span>{isServiceProposal(msg) ? t('chat.serviceSessions') : t('form.quantity')}:</span>
                                             <span className="font-mono font-bold">{msg.proposal.quantity}</span>
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-white/20 mt-1">
                                             <span>{isServiceProposal(msg) ? t('chat.estimatedTotal') : t('chat.total')}:</span>
                                             <span className="font-mono font-bold">{formatXaf(msg.proposal.pricePerUnit * msg.proposal.quantity)}</span>
                                          </div>
                                       </div>

                                       {/* Action Buttons (Only for receiver and if pending) */}
                                       {!isMe && msg.proposal.status === ProposalStatus.PENDING && (
                                          <div className="mt-3 flex gap-2 flex-wrap">
                                             <button
                                                type="button"
                                                disabled={!!proposalActionBusy}
                                                onClick={() => handleAcceptProposal(msg)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold transition-colors min-w-[60px] disabled:opacity-60 inline-flex items-center justify-center gap-1"
                                             >
                                                {proposalActionBusy === `${msg.id}:accept` ? <Spinner className="h-3.5 w-3.5" /> : null}
                                                {isServiceProposal(msg) ? t('chat.acceptBooking') : t('chat.accept')}
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
                                 <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                    <span>
                                       {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe ? (
                                       isFailed ? (
                                          <button
                                             type="button"
                                             onClick={() => void handleRetryMessage(msg.clientId)}
                                             className="inline-flex items-center gap-0.5 text-red-200 hover:text-white"
                                             title={t('chat.failedToSend')}
                                             aria-label={t('chat.retry')}
                                          >
                                             <AlertCircle className="h-3 w-3" />
                                             <span className="underline underline-offset-2">{t('chat.retry')}</span>
                                          </button>
                                       ) : isSending ? (
                                          <Clock className="h-3 w-3 opacity-80" aria-label="Sending" />
                                       ) : (
                                          <Check className="h-3 w-3 opacity-90" aria-label="Sent" />
                                       )
                                    ) : null}
                                 </div>
                              </div>
                           </div>
                              )}
                           </React.Fragment>
                        );
                     })}
                     {otherTyping ? (
                        <div className="flex justify-start agm-chat-bubble-in" aria-live="polite">
                           <div className="bg-white text-gray-500 border border-gray-200 rounded-lg rounded-bl-none px-3 py-2 shadow-sm inline-flex items-center gap-2">
                              <span className="text-xs">{getOtherParticipantName(activeChat)} {t('chat.isTyping')}</span>
                              <span className="agm-typing-dots" aria-hidden="true">
                                 <span className="agm-typing-dot" />
                                 <span className="agm-typing-dot" />
                                 <span className="agm-typing-dot" />
                              </span>
                           </div>
                        </div>
                     ) : null}
                     <div ref={messagesEndRef} />
                     {newIncomingCount > 0 && !isNearBottom ? (
                        <button
                           type="button"
                           onClick={() => {
                              setNewIncomingCount(0);
                              setIsNearBottom(true);
                              scrollToBottom('smooth');
                           }}
                           className="sticky bottom-4 mx-auto block bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg inline-flex items-center gap-1.5"
                        >
                           <ChevronDown className="h-3.5 w-3.5" />
                           {newIncomingCount === 1 ? '1 new message' : `${newIncomingCount} new messages`}
                        </button>
                     ) : null}
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
                              const openOffer = getOfferById(activeChat?.offerId || '');
                              if (String(openOffer?.type ?? '').toUpperCase() === OfferType.SERVICE) {
                                 setProposalQtyStr('1');
                              }
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
                           onChange={(e) => {
                              const value = e.target.value;
                              setInputText(value);
                              if (value.length > 0) notifyTyping();
                              else stopTypingNow();
                           }}
                           onBlur={() => stopTypingNow()}
                           onInput={adjustMessageInputHeight}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSendMessage();
                              }
                           }}
                           placeholder={t('chat.typeMessage')}
                           aria-label={t('chat.typeMessage')}
                           className="flex-1 min-h-[42px] max-h-40 resize-none overflow-y-auto border border-gray-300 rounded-2xl px-4 py-2.5 text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 break-words [overflow-wrap:anywhere]"
                        />
                        <button
                           type="submit"
                           disabled={!inputText.trim()}
                           aria-label={t('chat.sendMessage')}
                           className="mb-1 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 inline-flex items-center justify-center"
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
         <Modal
            open={showProposalModal}
            onClose={() => {
               setShowProposalModal(false);
               setProposalModalError('');
               setProposalPriceError('');
               setProposalQtyError('');
            }}
            maxWidth="sm"
            zIndex={50}
            backdropClassName="bg-black/50"
            panelClassName="p-5 sm:p-6"
         >
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                     {isServiceListing ? t('chat.makeServiceProposal') : t('chat.makeProposal')}
                  </h3>
                  {isServiceListing && listingOffer ? (
                     <div className="text-xs text-gray-500 mb-3 space-y-1">
                        <p>
                           {t('chat.serviceListedRate')
                              .replace('{price}', formatXaf(Number(listingOffer.price || 0)))
                              .replace('{unit}', listingUnitLabel)}
                        </p>
                        {maxPricePerUnit != null && (
                           <p>
                              {minPricePerUnit > 0
                                 ? t('chat.serviceRateRange')
                                    .replace('{min}', formatXaf(minPricePerUnit))
                                    .replace('{max}', formatXaf(maxPricePerUnit))
                                    .replace('{unit}', listingUnitLabel)
                                 : t('chat.serviceRateUpTo')
                                    .replace('{max}', formatXaf(maxPricePerUnit))
                                    .replace('{unit}', listingUnitLabel)}
                           </p>
                        )}
                        <p className="text-purple-700">
                           {t('chat.serviceProposalHint').replace('{hours}', String(listingOffer.serviceDuration || 1))}
                        </p>
                     </div>
                  ) : maxPricePerUnit != null ? (
                     <p className="text-xs text-gray-500 mb-3">
                        {minPricePerUnit > 0
                           ? t('chat.productRateRange')
                              .replace('{min}', formatXaf(minPricePerUnit))
                              .replace('{max}', formatXaf(maxPricePerUnit))
                           : t('chat.productRateUpTo').replace('{max}', formatXaf(maxPricePerUnit))}
                     </p>
                  ) : null}
                  {proposalModalError ? (
                     <p className="text-sm text-red-600 mb-3" role="alert">
                        {proposalModalError}
                     </p>
                  ) : null}

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {isServiceListing
                              ? `${t('chat.serviceRate')} (${listingUnitLabel}) (${currencyLabel()})`
                              : `${t('chat.pricePerUnit')} (${currencyLabel()})`}
                        </label>
                        <input
                           type="text"
                           inputMode="decimal"
                           autoComplete="off"
                           placeholder={
                              isServiceListing && listingOffer
                                 ? String(Number(listingOffer.price || 0).toLocaleString())
                                 : maxPricePerUnit != null
                                    ? `${minPricePerUnit.toLocaleString()} - ${maxPricePerUnit.toLocaleString()}`
                                    : 'e.g. 2500'
                           }
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {isServiceListing ? t('chat.serviceSessions') : t('form.quantity')}
                        </label>
                        <input
                           type="text"
                           inputMode="decimal"
                           autoComplete="off"
                           placeholder={isServiceListing ? '1' : 'e.g. 10'}
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
                              <span>{isServiceListing ? t('chat.estimatedTotal') : t('chat.total')}:</span>
                              <span>{formatXaf(Math.round(proposalTotalPreview))}</span>
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
         </Modal>

         {/* Service appointment picker — collected when accepting a SERVICE proposal */}
         <Modal
            open={apptMsg !== null}
            onClose={() => { if (!proposalActionBusy) setApptMsg(null); }}
            maxWidth="sm"
            zIndex={50}
            backdropClassName="bg-black/50"
            panelClassName="p-5 sm:p-6"
         >
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('chat.appointmentTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('chat.appointmentHint')}</p>
            {apptMsg && (() => {
               const offer = getProposalOffer(apptMsg);
               if (!offer?.producerId) {
                  return <p className="text-sm text-red-600">Unable to load service details. Refresh and try again.</p>;
               }
               return (
                  <ServiceAppointmentPicker
                     producerId={offer.producerId}
                     durationHours={offer.serviceDuration || 1}
                     selectedSlotIso={apptSlotIso}
                     onSelectSlot={setApptSlotIso}
                     offerId={offer.id}
                     clientId={user?.clientId}
                     orders={orders}
                     cart={cart}
                  />
               );
            })()}
            <div className="flex justify-end gap-3 pt-5">
               <button type="button" onClick={() => setApptMsg(null)} disabled={!!proposalActionBusy} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">{t('form.cancel')}</button>
               <button
                  type="button"
                  disabled={!apptSlotIso || !!proposalActionBusy}
                  onClick={confirmServiceAppointment}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1"
               >
                  {proposalActionBusy ? <Spinner className="h-3.5 w-3.5" /> : null}
                  {t('chat.acceptBooking')}
               </button>
            </div>
         </Modal>

         {/* Counter-Offer Modal */}
         <Modal
            open={showCounterModal}
            onClose={() => {
               setShowCounterModal(false);
               setCounterTargetMsgId(null);
               setCounterPriceError('');
               setCounterQtyError('');
            }}
            maxWidth="sm"
            zIndex={50}
            backdropClassName="bg-black/50"
            panelClassName="p-5 sm:p-6"
         >
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('chat.counter')}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                     {isServiceListing
                        ? 'Propose your own service rate and number of sessions.'
                        : 'Propose your own price and quantity. The other party will receive it as a new proposal.'}
                     {maxPricePerUnit != null && (
                        <> {isServiceListing
                           ? (minPricePerUnit > 0
                              ? t('chat.serviceRateRange')
                                 .replace('{min}', formatXaf(minPricePerUnit))
                                 .replace('{max}', formatXaf(maxPricePerUnit))
                                 .replace('{unit}', listingUnitLabel)
                              : t('chat.serviceRateUpTo')
                                 .replace('{max}', formatXaf(maxPricePerUnit))
                                 .replace('{unit}', listingUnitLabel))
                           : (minPricePerUnit > 0
                              ? t('chat.productRateRange')
                                 .replace('{min}', formatXaf(minPricePerUnit))
                                 .replace('{max}', formatXaf(maxPricePerUnit))
                              : t('chat.productRateUpTo').replace('{max}', formatXaf(maxPricePerUnit)))}
                        </>
                     )}
                  </p>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {isServiceListing
                              ? `${t('chat.serviceRate')} (${listingUnitLabel}) (${currencyLabel()})`
                              : `${t('chat.pricePerUnit')} (${currencyLabel()})`}
                        </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           {isServiceListing ? t('chat.serviceSessions') : t('form.quantity')}
                        </label>
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
                           <span>{isServiceListing ? t('chat.estimatedTotal') : 'New Total'}:</span>
                           <span>{formatXaf(toXaf(Number(counterPrice)) * Number(counterQty))}</span>
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
         </Modal>
      </div>
   );
};
