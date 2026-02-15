import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  Key,
  Hash,
  LogOut,
  User,
  Clock,
  CheckCheck,
  Check,
  Loader2,
  Settings
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";
import { useTelegram } from "@/hooks/useTelegram";
import { formatPhoneNumber } from "@/lib/phoneUtils";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  isOnline: boolean;
  type: 'private' | 'group' | 'channel';
}

interface Message {
  id: string;
  text: string;
  time: string;
  isOutgoing: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

const Telegram = () => {
  const { showSuccess, showWarning, showError } = useModal();
  const telegram = useTelegram();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [sessionId, setSessionId] = useState<string>('');

  // Auth form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [code, setCode] = useState('');

  // Chat states
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showChatList, setShowChatList] = useState(true); // Mobile uchun
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Notification permission so'rash
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chats when authenticated with real-time updates
  useEffect(() => {
    if (telegram.isAuthenticated) {
      loadChats();
      
      // Real-time polling - har 5 sekundda chatlarni yangilash (silent)
      const interval = setInterval(() => {
        silentRefreshChats();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [telegram.isAuthenticated]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && telegram.isAuthenticated) {
      loadMessages(selectedChat.id);
      
      // Real-time polling - har 3 sekundda yangi xabarlarni tekshirish (silent)
      const interval = setInterval(() => {
        silentRefreshMessages(selectedChat.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedChat, telegram.isAuthenticated]);

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const data = await telegram.getChats();
      setChats(data);
    } catch (err) {
      showError('Chatlarni yuklashda xatolik');
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const data = await telegram.getMessages(chatId);
      setMessages(data);
    } catch (err) {
      showError('Xabarlarni yuklashda xatolik');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Silent refresh - yangilanish sezilmasin
  const silentRefreshChats = async () => {
    try {
      const data = await telegram.getChats();
      
      // Yangi xabarlar borligini tekshirish
      if (chats.length > 0) {
        data.forEach(newChat => {
          const oldChat = chats.find(c => c.id === newChat.id);
          if (oldChat && newChat.unreadCount > oldChat.unreadCount) {
            // Yangi xabar keldi - notification ko'rsatish
            showNotification(newChat.name, newChat.lastMessage);
          }
        });
      }
      
      setChats(data);
    } catch (err) {
      // Silent error - xatolikni ko'rsatmaymiz
      console.error('Silent refresh error:', err);
    }
  };

  const silentRefreshMessages = async (chatId: string) => {
    try {
      const data = await telegram.getMessages(chatId);
      
      // Yangi xabarlar borligini tekshirish
      if (messages.length > 0 && data.length > messages.length) {
        const newMessages = data.slice(messages.length);
        newMessages.forEach(msg => {
          if (!msg.isOutgoing && selectedChat) {
            // Kiruvchi yangi xabar - notification ko'rsatish
            showNotification(selectedChat.name, msg.text);
          }
        });
      }
      
      setMessages(data);
    } catch (err) {
      // Silent error
      console.error('Silent refresh error:', err);
    }
  };

  // Notification ko'rsatish
  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Agar sahifa focus'da bo'lmasa, notification ko'rsatish
      if (document.hidden) {
        const notification = new Notification(title, {
          body: body,
          icon: '/telegram-icon.png', // Telegram icon qo'shishingiz mumkin
          badge: '/telegram-badge.png',
          tag: 'telegram-message',
          requireInteraction: false,
          silent: false
        });

        // Notification'ga bosilganda sahifani ochish
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // 5 sekunddan keyin avtomatik yopish
        setTimeout(() => notification.close(), 5000);
      }
    }
  };

  const handleAuth = async () => {
    try {
      if (authStep === 'phone') {
        const result = await telegram.sendCode({ phoneNumber, apiId, apiHash });
        setSessionId(result.sessionId);
        setAuthStep('code');
        showSuccess(result.message);
      } else if (authStep === 'code') {
        await telegram.verifyCode(sessionId, code);
        showSuccess("Tizimga muvaffaqiyatli kirildi!");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;
    
    try {
      const result = await telegram.sendMessage(selectedChat.id, messageText);
      setMessages([...messages, result.message]);
      setMessageText('');
    } catch (err) {
      showError('Xabarni yuborishda xatolik');
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setShowChatList(false); // Mobileda chatni ochganda ro'yxatni yashirish
  };

  const handleBackToChats = () => {
    setShowChatList(true);
    setSelectedChat(null);
  };

  const handleLogout = async () => {
    await telegram.logout();
    setAuthStep('phone');
    setPhoneNumber('');
    setApiId('');
    setApiHash('');
    setCode('');
    setSessionId('');
    setChats([]);
    setMessages([]);
    setSelectedChat(null);
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
  };

  if (!telegram.isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Telegram hisobiga kirish
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Telegram API orqali hisobingizga ulanish
              </p>
            </div>

            {authStep === 'phone' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiId" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API ID
                  </Label>
                  <Input
                    id="apiId"
                    type="text"
                    placeholder="12345678"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    my.telegram.org dan oling
                  </p>
                </div>

                <div>
                  <Label htmlFor="apiHash" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    API Hash
                  </Label>
                  <Input
                    id="apiHash"
                    type="text"
                    placeholder="abcdef1234567890"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefon raqam
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleAuth}
                  className="w-full"
                  disabled={!phoneNumber || !apiId || !apiHash || telegram.loading}
                >
                  {telegram.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    'Kod yuborish'
                  )}
                </Button>
              </div>
            )}

            {authStep === 'code' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {phoneNumber} raqamiga kod yuborildi
                  </p>
                </div>

                <div>
                  <Label htmlFor="code">Tasdiqlash kodi</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="12345"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 text-center text-2xl tracking-widest"
                    maxLength={5}
                  />
                </div>

                <Button
                  onClick={handleAuth}
                  className="w-full"
                  disabled={code.length < 5 || telegram.loading}
                >
                  {telegram.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Tekshirilmoqda...
                    </>
                  ) : (
                    'Tasdiqlash'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setAuthStep('phone')}
                  className="w-full"
                >
                  Orqaga
                </Button>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-300">
                <strong>Eslatma:</strong> API ID va API Hash olish uchun{' '}
                <a
                  href="https://my.telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-700 dark:hover:text-blue-200"
                >
                  my.telegram.org
                </a>
                {' '}saytiga kiring va "API development tools" bo'limidan oling.
              </p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0e1621]">
        {/* Telegram Container - Mobile Width */}
        <div className="w-full max-w-[500px] h-full flex flex-col bg-[#0e1621] shadow-2xl">
          {/* Telegram Mobile Header - Faqat chatlar ro'yxatida ko'rinadi */}
          {showChatList && (
            <div className="bg-[#212d3b] px-4 py-3 flex items-center justify-between border-b border-[#2b5278]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5288c1] flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold text-lg">Telegram</h1>
                  <p className="text-[#7e8e9f] text-xs">Ulangan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Notification Permission Button */}
                {notificationPermission !== 'granted' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if ('Notification' in window) {
                        Notification.requestPermission().then(permission => {
                          setNotificationPermission(permission);
                          if (permission === 'granted') {
                            showSuccess('Bildirishnomalar yoqildi!');
                          }
                        });
                      }
                    }}
                    className="h-9 w-9 p-0 hover:bg-[#2b5278] text-[#7e8e9f] hover:text-white"
                    title="Bildirishnomalarni yoqish"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0 hover:bg-[#2b5278] text-[#7e8e9f] hover:text-white"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="h-9 w-9 p-0 hover:bg-[#2b5278] text-[#7e8e9f] hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Chat List - Telegram Mobile Style */}
            <div className={cn(
              "w-full bg-[#0e1621] flex flex-col absolute inset-0 transition-transform duration-300",
              !showChatList && "-translate-x-full"
            )}>
              {/* Search Bar */}
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7e8e9f]" />
                  <Input
                    type="search"
                    placeholder="Qidirish"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 bg-[#212d3b] border-none text-white placeholder:text-[#7e8e9f] focus-visible:ring-[#2b5278]"
                  />
                </div>
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto">
                {loadingChats ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-[#5288c1]" />
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-[#7e8e9f]">Chatlar topilmadi</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={cn(
                        "w-full p-3 flex items-start gap-3 hover:bg-[#212d3b] transition-colors border-b border-[#151e27]",
                        selectedChat?.id === chat.id && "bg-[#212d3b]"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5288c1] to-[#3d6fa3] flex items-center justify-center text-white font-semibold">
                          {chat.name.charAt(0)}
                        </div>
                        {chat.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4dcd5e] rounded-full border-2 border-[#0e1621]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white truncate text-sm">
                            {chat.name}
                          </h3>
                          <span className="text-xs text-[#7e8e9f] flex-shrink-0 ml-2">
                            {chat.lastMessageTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[#7e8e9f] truncate">
                            {chat.lastMessage}
                          </p>
                          {chat.unreadCount > 0 && (
                            <div className="bg-[#4dcd5e] text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center ml-2 font-medium">
                              {chat.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window - Telegram Mobile Style */}
            <div className={cn(
              "flex-1 flex flex-col bg-[#0e1621] absolute inset-0 transition-transform duration-300",
              showChatList && "translate-x-full"
            )}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-[#212d3b] px-3 py-2.5 flex items-center gap-3 border-b border-[#2b5278]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToChats}
                      className="h-9 w-9 p-0 hover:bg-[#2b5278] text-white"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5288c1] to-[#3d6fa3] flex items-center justify-center text-white font-semibold text-sm">
                        {selectedChat.name.charAt(0)}
                      </div>
                      {selectedChat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4dcd5e] rounded-full border-2 border-[#212d3b]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-medium text-white truncate text-sm">
                        {selectedChat.name}
                      </h2>
                      <p className="text-xs text-[#7e8e9f] truncate">
                        {selectedChat.isOnline ? 'onlayn' : 'oxirgi faollik: 2 soat oldin'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-[#2b5278] text-[#7e8e9f] hover:text-white"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Messages - Telegram Style */}
                  <div 
                    className="flex-1 overflow-y-auto p-3 space-y-2"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundColor: '#0e1621'
                    }}
                  >
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-[#5288c1]" />
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.isOutgoing ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-xl px-3 py-2 shadow-sm",
                                message.isOutgoing
                                  ? "bg-[#2b5278] text-white rounded-br-sm"
                                  : "bg-[#212d3b] text-white rounded-bl-sm"
                              )}
                            >
                              <p className="text-sm break-words leading-relaxed">{message.text}</p>
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <span className="text-[10px] text-[#7e8e9f]">
                                  {message.time}
                                </span>
                                {message.isOutgoing && (
                                  <span className="text-[#7e8e9f]">
                                    {getMessageStatusIcon(message.status)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input - Telegram Style */}
                  <div className="bg-[#0e1621] p-2 border-t border-[#151e27]">
                    <div className="flex items-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 flex-shrink-0 hover:bg-[#212d3b] text-[#7e8e9f] hover:text-white"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Button>
                      <Input
                        type="text"
                        placeholder="Xabar..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="flex-1 h-9 bg-[#212d3b] border-none text-white placeholder:text-[#7e8e9f] focus-visible:ring-[#2b5278] rounded-full px-4"
                      />
                      {messageText.trim() ? (
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          className="h-9 w-9 p-0 flex-shrink-0 bg-[#5288c1] hover:bg-[#3d6fa3] rounded-full"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 flex-shrink-0 hover:bg-[#212d3b] text-[#7e8e9f] hover:text-white"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-[#2b5278] mx-auto mb-3" />
                    <p className="text-[#7e8e9f]">
                      Suhbatni tanlang
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Telegram;
