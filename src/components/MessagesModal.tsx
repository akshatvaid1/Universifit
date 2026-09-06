import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCheck,
  Check,
  Search,
  BookOpen,
  Calendar,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Button, Badge } from './ui';
import {
  fetchConversationsApi,
  fetchThreadApi,
  sendMessageApi,
  markThreadReadApi,
  type ConversationItem,
  type MessageItem,
} from '../services/api';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPartnerId?: string | null;
  initialContextTitle?: string | null;
  currentUserId?: string;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  initialPartnerId,
  initialContextTitle,
  currentUserId = 'mock_buyer_id',
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await fetchConversationsApi();
      if (res.success && res.data) {
        let loaded = res.data;
        if (initialPartnerId && !loaded.some((c) => c.partnerId === initialPartnerId)) {
          loaded = [
            {
              id: `conv_${initialPartnerId}`,
              partnerId: initialPartnerId,
              partner: {
                id: initialPartnerId,
                fullName: 'Verified Coach',
                avatarUrl:
                  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80',
                role: 'CREATOR',
              },
              contextType: 'ENROLLMENT',
              contextTitle: initialContextTitle || 'Enrolled Coaching Program',
              lastMessage: {
                id: 'init-msg',
                senderId: initialPartnerId,
                text: 'Conversation active. Send your questions to your coach!',
                createdAt: new Date().toISOString(),
                isRead: true,
              },
              unreadCount: 0,
            },
            ...loaded,
          ];
        }
        setConversations(loaded);
      }
    } catch (err) {
      console.debug('Error loading conversations', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load thread
  const loadThread = async (partnerId: string) => {
    try {
      const res = await fetchThreadApi(partnerId);
      if (res.success && res.data) {
        setMessages(res.data.messages);
        markThreadReadApi(partnerId);
      }
    } catch (err) {
      console.debug('Error loading thread', err);
    } finally {
      setIsLoadingThread(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoadingConversations(true);
      loadConversations();

      if (initialPartnerId) {
        setSelectedPartnerId(initialPartnerId);
        setIsLoadingThread(true);
        loadThread(initialPartnerId);
      }
    }
  }, [isOpen, initialPartnerId]);

  // Handle selecting a conversation
  const handleSelectConversation = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setIsLoadingThread(true);
    loadThread(partnerId);

    // Optimistically zero unread count
    setConversations((prev) =>
      prev.map((c) => (c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Auto polling thread every 4 seconds
  useEffect(() => {
    if (!isOpen || !selectedPartnerId) return;

    const interval = setInterval(() => {
      fetchThreadApi(selectedPartnerId).then((res) => {
        if (res.success && res.data) {
          setMessages(res.data.messages);
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, selectedPartnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartnerId || isSending) return;

    const currentText = inputText.trim();
    setInputText('');
    setIsSending(true);
    setErrorMessage(null);

    const activeConv = conversations.find((c) => c.partnerId === selectedPartnerId);

    // Optimistic message
    const tempMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      receiverId: selectedPartnerId,
      enrollmentId: activeConv?.contextId,
      text: currentText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await sendMessageApi({
        receiverId: selectedPartnerId,
        text: currentText,
        enrollmentId: activeConv?.contextId,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to send message.');
      } else {
        // Refresh conversation list to update last message
        loadConversations();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending message.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const selectedConversation = conversations.find((c) => c.partnerId === selectedPartnerId);

  const filteredConversations = conversations.filter(
    (c) =>
      c.partner.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contextTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-5xl h-[90vh] max-h-[780px] bg-[#16171A] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#121315]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center border border-[#B8703F]/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-bold text-white tracking-tight">
                  Direct Messages
                </h3>
                <Badge variant="verified" size="sm">
                  ENROLLED & BOOKED ONLY
                </Badge>
              </div>
              <p className="text-xs text-[#F7F4EF]/50">
                1-on-1 communications between verified coaches and enrolled members
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Body: Dual Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-white/[0.08] flex flex-col bg-[#141518] ${
              selectedPartnerId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Bar */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search coach or program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1B1E] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B8703F]"
                />
              </div>
            </div>

            {/* Conversation List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {isLoadingConversations ? (
                <div className="p-6 space-y-4 animate-pulse">
                  <div className="h-16 bg-white/5 rounded-2xl" />
                  <div className="h-16 bg-white/5 rounded-2xl" />
                  <div className="h-16 bg-white/5 rounded-2xl" />
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isSelected = conv.partnerId === selectedPartnerId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.partnerId)}
                      className={`w-full p-4 text-left transition-all flex items-start gap-3.5 cursor-pointer hover:bg-white/[0.03] ${
                        isSelected ? 'bg-white/[0.06] border-l-2 border-l-[#B8703F]' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={conv.partner.avatarUrl}
                          alt={`${conv.partner.fullName} avatar`}
                          className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10"
                        />
                        {conv.partner.role === 'CREATOR' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#B8703F] text-white flex items-center justify-center text-[9px] shadow-sm">
                            <ShieldCheck className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-display font-bold text-sm text-[#F7F4EF] truncate">
                            {conv.partner.fullName}
                          </span>
                          <span className="text-[10px] font-mono text-[#F7F4EF]/40 shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Program badge */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#B8703F] bg-[#B8703F]/10 px-2 py-0.5 rounded-md truncate">
                            {conv.contextType === 'BOOKING' ? (
                              <Calendar className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <BookOpen className="w-2.5 h-2.5 shrink-0" />
                            )}
                            <span className="truncate">{conv.contextTitle}</span>
                          </span>
                        </div>

                        {/* Last message text preview */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-[#F7F4EF]/60 truncate">
                            {conv.lastMessage.text}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#B8703F] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-neutral-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-display font-bold text-white">
                    No active conversations
                  </h4>
                  <p className="text-xs text-[#F7F4EF]/50 leading-relaxed max-w-xs mx-auto">
                    Direct messaging unlocks automatically when you enroll in a course or schedule a 1-on-1 coaching session.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Thread View */}
          <div
            className={`flex-1 flex flex-col bg-[#16171A] ${
              !selectedPartnerId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedPartnerId && selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#121315]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedPartnerId(null)}
                      className="md:hidden w-8 h-8 rounded-full bg-white/5 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <img
                        src={selectedConversation.partner.avatarUrl}
                        alt={`${selectedConversation.partner.fullName} avatar`}
                        className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10"
                      />
                      {selectedConversation.partner.role === 'CREATOR' && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#B8703F] text-white flex items-center justify-center text-[8px]">
                          <ShieldCheck className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-white">
                          {selectedConversation.partner.fullName}
                        </h4>
                        <Badge variant="verified" size="sm">
                          {selectedConversation.partner.role === 'CREATOR' ? 'COACH' : 'STUDENT'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#F7F4EF]/50">
                        <span className="text-[#B8703F] font-medium truncate">
                          {selectedConversation.contextTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#6E8B6F] bg-[#6E8B6F]/10 px-2.5 py-1 rounded-full border border-[#6E8B6F]/20">
                    <span className="w-2 h-2 rounded-full bg-[#6E8B6F] animate-pulse" />
                    <span className="font-mono text-[10px] font-bold">LIVE SYNC</span>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-300 text-center">
                    {errorMessage}
                  </div>
                )}

                {/* Message Scroll Area */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                  {/* Context notice header */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1 max-w-md mx-auto my-2">
                    <div className="flex items-center justify-center gap-1.5 text-[#B8703F] text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authenticated Coaching Thread</span>
                    </div>
                    <p className="text-[11px] text-[#F7F4EF]/50 leading-relaxed">
                      Tied to your enrollment in <strong>{selectedConversation.contextTitle}</strong>. Messages are encrypted and stored with your coaching history.
                    </p>
                  </div>

                  {isLoadingThread ? (
                    <div className="space-y-3 animate-pulse p-4">
                      <div className="h-12 bg-white/5 rounded-2xl w-2/3" />
                      <div className="h-12 bg-white/5 rounded-2xl w-1/2 ml-auto" />
                      <div className="h-12 bg-white/5 rounded-2xl w-3/4" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isOwnMessage = msg.senderId === currentUserId || msg.senderId === 'mock_buyer_id';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isOwnMessage ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                              isOwnMessage
                                ? 'bg-[#B8703F] text-white rounded-br-none'
                                : 'bg-[#222429] border border-white/10 text-[#F7F4EF] rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-neutral-500 font-mono">
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOwnMessage && (
                              <span>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-[#6E8B6F]" />
                                ) : (
                                  <Check className="w-3 h-3 text-neutral-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs italic">
                      No messages exchanged yet. Say hello to get started!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-white/[0.08] bg-[#121315] flex items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder={`Message ${selectedConversation.partner.fullName}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-[#1A1B1E] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#B8703F]"
                  />

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    isLoading={isSending}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 text-neutral-400 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-8 h-8 text-[#B8703F]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-display font-bold text-white">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/50 max-w-sm leading-relaxed">
                    Choose an active coach or student thread on the left to review messages, exchange questions, and get feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
