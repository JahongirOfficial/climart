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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useModal } from "@/contexts/ModalContext";

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
  const { showSuccess, showWarning } = useModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [loading, setLoading] = useState(false);

  // Auth form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  // Chat states
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');

  // Mock data
  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Alisher Karimov',
      lastMessage: 'Mahsulot qachon keladi?',
      lastMessageTime: '14:30',
      unreadCount: 2,
      isOnline: true,
      type: 'private'
    },
    {
      id: '2',
      name: 'Dilshod Toshmatov',
      lastMessage: 'Raxmat, buyurtma qabul qilindi',
      lastMessageTime: '12:15',
      unreadCount: 0,
      isOnline: false,
      type: 'private'
    },
    {
      id: '3',
      name: 'Savdo guruhi',
      lastMessage: 'Yangi narxlar e\'lon qilindi',
      lastMessageTime: 'Kecha',
      unreadCount: 5,
      isOnline: true,
      type: 'group'
    }
  ]);

  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: 'Assalomu alaykum! Mahsulot haqida ma\'lumot bera olasizmi?',
      time: '14:25',
      isOutgoing: false,
      status: 'read'
    },
    {
      id: '2',
      text: 'Vaalaykum assalom! Albatta, qaysi mahsulot haqida?',
      time: '14:26',
      isOutgoing: true,
      status: 'read'
    },
    {
      id: '3',
      text: 'Mahsulot qachon keladi?',
      time: '14:30',
      isOutgoing: false,
      status: 'delivered'
    }
  ]);

  const handleAuth = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (authStep === 'phone') {
        setAuthStep('code');
        showSuccess("Demo versiya: Tasdiqlash kodi sifatida ixtiyoriy 5 xonali son kiriting (masalan: 12345)");
      } else if (authStep === 'code') {
        if (code === '12345' || code.length === 5) {
          setIsAuthenticated(true);
          showSuccess("Tizimga muvaffaqiyatli kirildi (Demo)");
        } else {
          showWarning("Kod noto'g'ri (Demo uchun 12345 ishlating)");
        }
      }
      setLoading(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // Send message logic here
    setMessageText('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthStep('phone');
    setPhoneNumber('');
    setApiId('');
    setApiHash('');
    setCode('');
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

  if (!isAuthenticated) {
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
                    placeholder="+998901234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleAuth}
                  className="w-full"
                  disabled={!phoneNumber || !apiId || !apiHash || loading}
                >
                  {loading ? (
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
                  disabled={code.length < 5 || loading}
                >
                  {loading ? (
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
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Telegram</h1>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                Ulangan
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List */}
          <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="search"
                  placeholder="Qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Chats */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b dark:border-gray-700",
                    selectedChat?.id === chat.id && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {chat.name.charAt(0)}
                    </div>
                    {chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {chat.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs ml-2">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {selectedChat.name.charAt(0)}
                      </div>
                      {selectedChat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {selectedChat.name}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedChat.isOnline ? 'Onlayn' : 'Oxirgi faollik: 2 soat oldin'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          message.isOutgoing
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        )}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={cn(
                            "text-xs",
                            message.isOutgoing ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                          )}>
                            {message.time}
                          </span>
                          {message.isOutgoing && getMessageStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                  <div className="flex items-end gap-2">
                    <Input
                      type="text"
                      placeholder="Xabar yozing..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Suhbatni tanlang
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Telegram;
