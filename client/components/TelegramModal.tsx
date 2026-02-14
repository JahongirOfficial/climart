import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Search,
  Clock,
  CheckCheck,
  Check,
  Loader2,
  X,
  Minus,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";
import { useTelegram } from "@/hooks/useTelegram";

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
  image?: string;
  imageId?: string;
}

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal = ({ isOpen, onClose }: TelegramModalProps) => {
  const { showSuccess, showError } = useModal();
  const telegram = useTelegram();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [sessionId, setSessionId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [code, setCode] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [, setLoadingChats] = useState(false);
  const [, setLoadingMessages] = useState(false);
  const [, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 420, height: 680 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Notification permission
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

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chats
  useEffect(() => {
    if (telegram.isAuthenticated && isOpen) {
      loadChats();
      const interval = setInterval(() => silentRefreshChats(), 5000);
      return () => clearInterval(interval);
    }
  }, [telegram.isAuthenticated, isOpen]);

  // Load messages
  useEffect(() => {
    if (selectedChat && telegram.isAuthenticated && isOpen) {
      loadMessages(selectedChat.id);
      const interval = setInterval(() => silentRefreshMessages(selectedChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, telegram.isAuthenticated, isOpen]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Resizing handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      
      if (isResizing && !isMaximized) {
        const deltaY = e.clientY - resizeStart.y;
        const newHeight = Math.max(400, Math.min(900, resizeStart.height + deltaY));
        setSize({
          width: size.width,
          height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, isMaximized, size.width]);

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

  const silentRefreshChats = async () => {
    try {
      const data = await telegram.getChats();
      if (chats.length > 0) {
        data.forEach((newChat: Chat) => {
          const oldChat = chats.find(c => c.id === newChat.id);
          if (oldChat && newChat.unreadCount > oldChat.unreadCount) {
            showNotification(newChat.name, newChat.lastMessage);
          }
        });
      }
      setChats(data);
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  const silentRefreshMessages = async (chatId: string) => {
    try {
      const data = await telegram.getMessages(chatId);
      if (messages.length > 0 && data.length > messages.length) {
        const newMessages = data.slice(messages.length);
        newMessages.forEach((msg: Message) => {
          if (!msg.isOutgoing && selectedChat) {
            showNotification(selectedChat.name, msg.text);
          }
        });
      }
      setMessages(data);
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const notification = new Notification(title, {
        body: body,
        tag: 'telegram-message',
        requireInteraction: false,
        silent: false
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      setTimeout(() => notification.close(), 5000);
    }
  };

  const handleAuth = async () => {
    try {
      if (authStep === 'phone') {
        const result = await telegram.sendCode({ phoneNumber, apiId, apiHash });
        setSessionId(result.sessionId);
        setAuthStep('code');
        // Don't show success modal, just move to code step
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
    setShowChatList(false);
  };

  // Mark as read when chat is selected
  useEffect(() => {
    if (selectedChat && selectedChat.unreadCount > 0) {
      telegram.markAsRead(selectedChat.id).catch(err => {
        console.error('Failed to mark as read:', err);
      });
    }
  }, [selectedChat?.id]);

  const handleBackToChats = () => {
    setShowChatList(true);
    setSelectedChat(null);
  };



  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-[#8B98A5]" />;
      case 'sent':
        return <Check className="h-3 w-3 text-[#8B98A5]" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-[#8B98A5]" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-[#0AC630]" />;
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999]"
        style={{ left: `${position.x}px`, top: 'auto', bottom: '1rem' }}
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-[#007AFF] hover:bg-[#0051D5] text-white shadow-2xl rounded-full px-4 py-2 flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Telegram
          {chats.reduce((sum, chat) => sum + chat.unreadCount, 0) > 0 && (
            <Badge className="ml-1 bg-red-500 text-white h-5 min-w-[20px] px-1.5 rounded-full">
              {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{ 
        left: 0, 
        top: 0, 
        width: 0, 
        height: 0,
        overflow: 'visible'
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "absolute shadow-2xl overflow-hidden pointer-events-auto",
          "rounded-[12px] border border-[#2C2C2E]",
          isMaximized ? "bg-[#0E1621]" : "bg-[#0E1621]"
        )}
        style={isMaximized ? {
          left: '1rem',
          top: '1rem',
          right: '1rem',
          bottom: '1rem',
          width: 'calc(100vw - 2rem)',
          height: 'calc(100vh - 2rem)',
        } : {
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iPhone Style Header */}
        <div
          ref={headerRef}
          className="bg-[#17212B] px-3 py-2 flex items-center justify-between border-b border-[#0D0D0D] relative"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#2AABEE] flex items-center justify-center">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Telegram</span>
          </div>
          
          {/* Draggable Handle - Center */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2",
              "w-20 h-1.5 bg-[#3A3A3C] rounded-full cursor-grab active:cursor-grabbing",
              "hover:bg-[#4A4A4C] transition-colors z-10",
              isDragging && "cursor-grabbing bg-[#2AABEE]"
            )}
          />
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-7 w-7 p-0 hover:bg-[#2C2C2E] text-[#FFFFFF] hover:text-white rounded-full transition-colors"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-7 w-7 p-0 hover:bg-[#2C2C2E] text-[#FFFFFF] hover:text-white rounded-full transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-[#FF3B30] text-[#FFFFFF] hover:text-white rounded-full transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-44px)] overflow-hidden bg-[#0E1621]">
          {!telegram.isAuthenticated ? (
            <div className="h-full flex items-center justify-center p-3">
              <Card className="w-full p-4 bg-white border-gray-200 shadow-lg">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-[#007AFF] rounded-full mb-2">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mb-0.5">
                    Telegram
                  </h2>
                  <p className="text-[10px] text-gray-600">
                    Hisobingizga ulanish
                  </p>
                </div>

                {authStep === 'phone' && (
                  <div className="space-y-2.5">
                    <div>
                      <Label htmlFor="apiId" className="text-gray-700 text-[10px] font-medium mb-1 block">API ID</Label>
                      <Input
                        id="apiId"
                        type="text"
                        placeholder="12345678"
                        value={apiId}
                        onChange={(e) => setApiId(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-8 text-xs focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiHash" className="text-gray-700 text-[10px] font-medium mb-1 block">API Hash</Label>
                      <Input
                        id="apiHash"
                        type="text"
                        placeholder="abcdef1234567890"
                        value={apiHash}
                        onChange={(e) => setApiHash(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-8 text-xs focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-700 text-[10px] font-medium mb-1 block">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+998901234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-8 text-xs focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                      />
                    </div>
                    <Button
                      onClick={handleAuth}
                      className="w-full bg-[#007AFF] hover:bg-[#0051D5] h-8 text-xs font-medium text-white"
                      disabled={!phoneNumber || !apiId || !apiHash || telegram.loading}
                    >
                      {telegram.loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                      Kod yuborish
                    </Button>
                  </div>
                )}

                {authStep === 'code' && (
                  <div className="space-y-2.5">
                    <div className="text-center mb-1.5">
                      <p className="text-[10px] text-gray-600">
                        {phoneNumber} raqamiga kod yuborildi
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="code" className="text-gray-700 text-[10px] font-medium mb-1 block">Kod</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="12345"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="text-center text-base tracking-widest bg-white border-gray-300 text-gray-900 h-9 focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                        maxLength={5}
                      />
                    </div>
                    <Button
                      onClick={handleAuth}
                      className="w-full bg-[#007AFF] hover:bg-[#0051D5] h-8 text-xs font-medium text-white"
                      disabled={code.length < 5 || telegram.loading}
                    >
                      {telegram.loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                      Tasdiqlash
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setAuthStep('phone')}
                      className="w-full text-[#007AFF] hover:text-[#0051D5] hover:bg-gray-100 h-8 text-xs"
                    >
                      Orqaga
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="h-full flex">
              {/* Chat List */}
              <div className={cn(
                "w-full bg-[#0E1621] flex flex-col absolute inset-0 transition-transform duration-300",
                !showChatList && "-translate-x-full"
              )}>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#707579]" />
                    <Input
                      type="search"
                      placeholder="Qidirish"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 bg-[#1C1C1E] border-none text-white placeholder:text-[#707579] text-sm rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className="w-full px-3 py-2.5 flex items-start gap-3 hover:bg-[#1C1C1E] transition-colors border-b border-[#0D0D0D]"
                    >
                      <div className="relative flex-shrink-0">
                        {chat.avatar ? (
                          <img
                            src={`${chat.avatar}?token=${telegram.authToken}`}
                            alt={chat.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#229ED9] flex items-center justify-center text-white font-semibold text-sm"
                          style={{ display: chat.avatar ? 'none' : 'flex' }}
                        >
                          {chat.name.charAt(0).toUpperCase()}
                        </div>
                        {chat.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#0AC630] rounded-full border-2 border-[#000000]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white truncate text-sm">{chat.name}</h3>
                          <span className="text-[11px] text-[#707579]">{chat.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {chat.lastMessage.includes('✅') && (
                              <span className="text-[#0AC630] text-xs flex-shrink-0">✅</span>
                            )}
                            <p className="text-[13px] text-[#707579] truncate">{chat.lastMessage}</p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <div className="bg-[#0AC630] text-white text-[11px] rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium flex-shrink-0">
                              {chat.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className={cn(
                "flex-1 flex flex-col bg-[#000000] absolute inset-0 transition-transform duration-300",
                showChatList && "translate-x-full"
              )}>
                {selectedChat ? (
                  <>
                    <div className="bg-[#17212B] px-3 py-2 flex items-center gap-3 border-b border-[#0D0D0D]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToChats}
                        className="h-7 w-7 p-0 hover:bg-[#1C1C1E] text-[#8B98A5]"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      {selectedChat.avatar ? (
                        <img
                          src={`${selectedChat.avatar}?token=${telegram.authToken}`}
                          alt={selectedChat.name}
                          className="w-9 h-9 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#229ED9] flex items-center justify-center text-white font-semibold text-sm"
                        style={{ display: selectedChat.avatar ? 'none' : 'flex' }}
                      >
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-medium text-white truncate text-sm">{selectedChat.name}</h2>
                        <p className="text-[11px] text-[#707579]">{selectedChat.isOnline ? 'onlayn' : 'oxirgi faollik: bugun'}</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ backgroundColor: '#0E1621' }}>
                      {messages.map((message) => (
                        <div key={message.id} className={cn("flex flex-col", message.isOutgoing ? "items-end" : "items-start")}>
                          <div className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2 shadow-sm",
                            message.isOutgoing 
                              ? "bg-[#2B5278] text-white rounded-br-none" 
                              : "bg-[#182533] text-white rounded-bl-none"
                          )}>
                            {message.image && (
                              <img 
                                src={`${message.image}?token=${telegram.authToken}`}
                                alt="Message" 
                                className="rounded-lg mb-2 max-w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(`${message.image}?token=${telegram.authToken}`, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            {message.text && (
                              <p className="text-[13px] break-words leading-relaxed whitespace-pre-wrap">{message.text}</p>
                            )}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] text-[#8B98A5]">{message.time}</span>
                              {message.isOutgoing && getMessageStatusIcon(message.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="bg-[#17212B] p-2 border-t border-[#0D0D0D]">
                      <div className="flex items-end gap-2">
                        <Input
                          type="text"
                          placeholder="Xabar..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          className="flex-1 h-9 bg-[#182533] border-[#2B5278] text-white placeholder:text-[#707579] rounded-full px-4 text-sm"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          className="h-9 w-9 p-0 bg-[#2AABEE] hover:bg-[#229ED9] rounded-full flex-shrink-0 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-[#3A3A3C] mx-auto mb-2" />
                      <p className="text-[#8E8E93] text-xs">Suhbatni tanlang</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Resize Handle - Bottom */}
        {!isMaximized && (
          <div
            onMouseDown={handleResizeMouseDown}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-[#2AABEE]/20 transition-colors",
              isResizing && "bg-[#2AABEE]/30"
            )}
          >
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#2C2C2E] rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
