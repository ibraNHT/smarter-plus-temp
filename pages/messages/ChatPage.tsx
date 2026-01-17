
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Send, MessageCircle, ChevronLeft, Gavel, ArrowLeft } from 'lucide-react';
import { ProposalStatus } from '../../types';

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user, chats, messages, sendMessage, respondToProposal, clients, producers, getOfferById } = useStore();
  const { t } = useTranslation();

  const [inputText, setInputText] = useState('');
  const [showProposalModal, setShowProposalModal] = useState(false);
  
  // Proposal Form State
  const [proposalPrice, setProposalPrice] = useState<number>(0);
  const [proposalQty, setProposalQty] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatId]);

  if (!user) return <div className="p-8 text-center">Login required.</div>;

  // Get active chat
  const activeChat = chatId ? chats.find(c => c.id === chatId) : null;
  const activeMessages = activeChat ? messages.filter(m => m.chatId === chatId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

  const getOtherParticipantName = (participantIds: string[]) => {
    const otherId = participantIds.find(id => id !== user.id);
    if (!otherId) return 'Unknown';
    const client = clients.find(c => c.id === otherId);
    if (client) return client.name;
    const producer = producers.find(p => p.id === otherId);
    if (producer) return producer.name;
    return 'User';
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && chatId) {
      sendMessage(chatId, inputText);
      setInputText('');
    }
  };

  const handleSendProposal = () => {
      if (!activeChat || !activeChat.offerId) return;
      if (proposalPrice <= 0 || proposalQty <= 0) {
          alert("Invalid Price or Quantity");
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
          {chats.filter(c => c.participants.includes(user.id)).length === 0 ? (
             <div className="p-8 text-center text-gray-500 text-sm">{t('chat.noChats')}</div>
          ) : (
             chats.filter(c => c.participants.includes(user.id)).map(chat => {
                const otherName = getOtherParticipantName(chat.participants);
                return (
                  <div 
                    key={chat.id} 
                    onClick={() => navigate(`/messages/${chat.id}`)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${chatId === chat.id ? 'bg-blue-50' : ''}`}
                  >
                     <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{otherName}</span>
                        <span className="text-xs text-gray-400">{new Date(chat.lastMessageAt).toLocaleDateString()}</span>
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
                        {getOtherParticipantName(activeChat.participants).charAt(0)}
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900">{getOtherParticipantName(activeChat.participants)}</h3>
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
                           <div className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 shadow-sm ${
                              isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                           }`}>
                              {msg.proposal ? (
                                 // Proposal Card
                                 <div className={`border rounded-md p-3 ${isMe ? 'border-primary-400 bg-primary-700' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
                                       <span className="font-bold uppercase text-xs flex items-center">
                                          <Gavel className="h-3 w-3 mr-1" /> {t('chat.proposal')}
                                       </span>
                                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                          msg.proposal.status === ProposalStatus.PENDING ? 'bg-yellow-500 text-white' :
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
                                       <div className="mt-3 flex gap-2">
                                          <button 
                                             onClick={() => respondToProposal(msg.chatId, msg.id, 'ACCEPT')}
                                             className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold transition-colors"
                                          >
                                             {t('chat.accept')}
                                          </button>
                                          <button 
                                             onClick={() => respondToProposal(msg.chatId, msg.id, 'REJECT')}
                                             className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded font-bold transition-colors"
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
                                 {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                           </div>
                        </div>
                     );
                  })}
                  <div ref={messagesEndRef} />
               </div>

               {/* Input Area */}
               <div className="p-3 md:p-4 bg-white border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                     <button 
                        type="button"
                        onClick={() => setShowProposalModal(true)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title={t('chat.makeProposal')}
                     >
                        <Gavel className="h-6 w-6 text-primary-600" />
                     </button>
                     <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t('chat.typeMessage')}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                     />
                     <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Send className="h-5 w-5" />
                     </button>
                  </form>
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
                        type="number" min="1"
                        value={proposalPrice}
                        onChange={(e) => setProposalPrice(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.quantity')}</label>
                     <input 
                        type="number" min="1"
                        value={proposalQty}
                        onChange={(e) => setProposalQty(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                     />
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                     <div className="flex justify-between font-bold text-gray-900">
                        <span>Total:</span>
                        <span>{(proposalPrice * proposalQty).toLocaleString()} XAF</span>
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
    </div>
  );
};
