import { useState, useEffect, useRef, FormEvent } from 'react';
import { messagesAPI, trainerAthleteAPI } from '../services/api';
import type { Conversation, MessageWithUsers, User } from '../types';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { HiPaperAirplane, HiChat, HiUser, HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    try {
      const [convos, users] = await Promise.all([
        messagesAPI.getConversations(),
        trainerAthleteAPI.getMyAthletes().catch(() => [])
      ]);
      setConversations(convos);

      // For trainers, available users are athletes; for athletes, get their trainer
      if (user?.role === 'trainer') {
        setAvailableUsers(users);
      } else {
        // Athletes: get assignments to find their trainers
        try {
          const assignments = await trainerAthleteAPI.getAssignments();
          const trainerIds = assignments
            .filter(a => a.is_active && a.athlete_id === user?.id)
            .map(a => a.trainer_id);
          // Filter conversations to get trainer info
          const trainers = convos
            .filter(c => trainerIds.includes(c.user_id))
            .map(c => ({
              id: c.user_id,
              email: c.user_email,
              full_name: c.user_name,
              is_active: true,
              role: 'trainer' as const,
              is_locked: false,
              created_at: '',
              updated_at: ''
            }));
          setAvailableUsers(trainers);
        } catch {
          // Ignore errors for athletes without trainers
        }
      }
    } catch (err) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const msgs = await messagesAPI.getMessagesWithUser(userId);
      setMessages(msgs);
      // Update conversation unread count
      setConversations(prev => prev.map(c =>
        c.user_id === userId ? { ...c, unread_count: 0 } : c
      ));
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedUserId(conv.user_id);
    setSelectedUserName(conv.user_name || conv.user_email);
  };

  const handleSelectNewChat = (u: User) => {
    setSelectedUserId(u.id);
    setSelectedUserName(u.full_name || u.email);
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.user_id === u.id);
    if (!existingConv) {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    setSending(true);
    try {
      const msg = await messagesAPI.sendMessage({
        recipient_id: selectedUserId,
        content: newMessage.trim()
      });

      // Add message to list
      setMessages(prev => [...prev, {
        ...msg,
        sender_name: user?.full_name || null,
        sender_email: user?.email || '',
        recipient_name: selectedUserName || null,
        recipient_email: ''
      }]);

      // Update conversations
      const now = new Date().toISOString();
      setConversations(prev => {
        const existing = prev.find(c => c.user_id === selectedUserId);
        if (existing) {
          return prev.map(c => c.user_id === selectedUserId ? {
            ...c,
            last_message: newMessage.trim().slice(0, 100),
            last_message_time: now
          } : c);
        }
        return [{
          user_id: selectedUserId,
          user_name: selectedUserName || null,
          user_email: '',
          last_message: newMessage.trim().slice(0, 100),
          last_message_time: now,
          unread_count: 0
        }, ...prev];
      });

      setNewMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <Loading text="Loading messages..." />
      </Layout>
    );
  }

  // Users available for new chats (not in existing conversations)
  const newChatUsers = availableUsers.filter(
    u => !conversations.some(c => c.user_id === u.id)
  );

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'trainer'
              ? 'Communicate with your athletes'
              : 'Communicate with your trainer'}
          </p>
        </div>
        <Button variant="secondary" onClick={loadData}>
          <HiRefresh className="w-5 h-5 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h3>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.length === 0 && newChatUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HiChat className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">
                  {user?.role === 'trainer'
                    ? 'Start messaging your athletes'
                    : 'You need to be assigned to a trainer first'}
                </p>
              </div>
            ) : (
              <>
                {conversations.map((conv) => (
                  <button
                    key={conv.user_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedUserId === conv.user_id
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <HiUser className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {conv.user_name || conv.user_email}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-[150px]">
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {formatTime(conv.last_message_time)}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full mt-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* New chat options */}
                {newChatUsers.length > 0 && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                        Start new conversation
                      </p>
                    </div>
                    {newChatUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectNewChat(u)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedUserId === u.id
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <HiUser className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{u.full_name || u.email}</p>
                            <p className="text-sm text-gray-400">Start a conversation</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Messages Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Header */}
              <div className="border-b pb-3 mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <HiUser className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    {selectedUserName}
                  </h3>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender_id === user?.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user?.id ? 'text-primary-200' : 'text-gray-400'
                        }`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newMessage.trim() || sending}
                  isLoading={sending}
                >
                  <HiPaperAirplane className="w-5 h-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <HiChat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm mt-1">Choose someone from the list to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
