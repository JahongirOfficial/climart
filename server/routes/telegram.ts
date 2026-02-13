import { Router, Request, Response } from 'express';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import input from 'input';

const router = Router();

// Telegram session storage (in production, use database)
const sessions = new Map<string, any>();
const clients = new Map<string, TelegramClient>();
const authTokenToSession = new Map<string, string>(); // Map auth tokens to session IDs

// Send verification code
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, apiId, apiHash } = req.body;

    if (!phoneNumber || !apiId || !apiHash) {
      return res.status(400).json({ 
        message: 'Telefon raqam, API ID va API Hash kiritilishi shart' 
      });
    }

    const sessionId = `session_${Date.now()}`;
    const stringSession = new StringSession('');
    
    const client = new TelegramClient(
      stringSession,
      parseInt(apiId),
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

    // Send code
    const result = await client.sendCode(
      {
        apiId: parseInt(apiId),
        apiHash: apiHash,
      },
      phoneNumber
    );

    sessions.set(sessionId, {
      phoneNumber,
      apiId,
      apiHash,
      phoneCodeHash: result.phoneCodeHash,
      createdAt: new Date()
    });

    clients.set(sessionId, client);

    res.json({
      success: true,
      sessionId,
      message: `${phoneNumber} raqamiga tasdiqlash kodi yuborildi`
    });
  } catch (error: any) {
    console.error('Send code error:', error);
    res.status(500).json({ 
      message: error.message || 'Kod yuborishda xatolik yuz berdi',
      error: error.toString()
    });
  }
});

// Verify code and authenticate
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { sessionId, code, password } = req.body;

    if (!sessionId || !code) {
      return res.status(400).json({ 
        message: 'Session ID va kod kiritilishi shart' 
      });
    }

    const session = sessions.get(sessionId);
    const client = clients.get(sessionId);
    
    if (!session || !client) {
      return res.status(404).json({ 
        message: 'Sessiya topilmadi yoki muddati tugagan' 
      });
    }

    try {
      // Sign in with code
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: session.phoneNumber,
          phoneCodeHash: session.phoneCodeHash,
          phoneCode: code,
        })
      );

      // Get user info
      const me = await client.getMe();
      
      // Save session string
      const sessionString = client.session.save() as unknown as string;
      const authToken = `token_${Date.now()}`;
      
      session.authenticated = true;
      session.authToken = authToken;
      session.sessionString = sessionString;
      session.userId = me.id.toString();
      
      // Map auth token to session ID for future lookups
      authTokenToSession.set(authToken, sessionId);

      res.json({
        success: true,
        authToken,
        sessionString, // Send session string to client for persistence
        user: {
          id: me.id.toString(),
          firstName: me.firstName || '',
          lastName: me.lastName || '',
          username: me.username || '',
          phone: me.phone || session.phoneNumber
        }
      });
    } catch (error: any) {
      // Check if 2FA is required
      if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        return res.status(403).json({
          message: '2FA parol talab qilinadi',
          requiresPassword: true
        });
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Verify code error:', error);
    res.status(400).json({ 
      message: error.message || 'Kodni tasdiqlashda xatolik',
      error: error.toString()
    });
  }
});

// Helper function to format time for display
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Hozir';
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days === 1) return 'Kecha';
  if (days < 7) return `${days} kun oldin`;
  
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
};

// Helper to get client from auth token
const getClientFromToken = (authToken: string): TelegramClient | null => {
  const sessionId = authTokenToSession.get(authToken);
  if (sessionId) {
    return clients.get(sessionId) || null;
  }
  return null;
};

// Get chats list
router.get('/chats', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    const client = getClientFromToken(authToken);
    
    if (!client) {
      return res.status(401).json({ message: 'Sessiya topilmadi' });
    }

    // Get dialogs (chats)
    const dialogs = await client.getDialogs({ limit: 50 });
    
    const chats = dialogs.map((dialog: any) => {
      const entity = dialog.entity;
      const message = dialog.message;
      
      let name = '';
      let type: 'private' | 'group' | 'channel' = 'private';
      let avatarUrl = null;
      
      if (entity.className === 'User') {
        name = [entity.firstName, entity.lastName].filter(Boolean).join(' ') || 'User';
        type = 'private';
        // Check if user has profile photo
        if (entity.photo && entity.photo.photoId) {
          avatarUrl = `/api/telegram/avatar/${entity.id}`;
        }
      } else if (entity.className === 'Chat') {
        name = entity.title || 'Chat';
        type = 'group';
        if (entity.photo && entity.photo.photoId) {
          avatarUrl = `/api/telegram/avatar/${entity.id}`;
        }
      } else if (entity.className === 'Channel') {
        name = entity.title || 'Channel';
        type = entity.broadcast ? 'channel' : 'group';
        if (entity.photo && entity.photo.photoId) {
          avatarUrl = `/api/telegram/avatar/${entity.id}`;
        }
      }

      return {
        id: entity.id.toString(),
        name,
        lastMessage: message?.message || '',
        lastMessageTime: formatTime(message?.date ? new Date(message.date * 1000) : new Date()),
        unreadCount: dialog.unreadCount || 0,
        isOnline: entity.status?.className === 'UserStatusOnline',
        type,
        avatar: avatarUrl
      };
    });

    // Cache entities for avatar download
    const sessionId = authTokenToSession.get(authToken);
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.cachedEntities = session.cachedEntities || new Map();
        dialogs.forEach((dialog: any) => {
          session.cachedEntities.set(dialog.entity.id.toString(), dialog.entity);
        });
      }
    }

    res.json(chats);
  } catch (error: any) {
    console.error('Get chats error:', error);
    res.status(500).json({ 
      message: 'Chatlarni yuklashda xatolik',
      error: error.toString()
    });
  }
});

// Format message time (HH:MM)
const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
};

// Get messages for a chat
router.get('/chats/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const chatIdParam = req.params.chatId;

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    const client = getClientFromToken(authToken);
    
    if (!client) {
      return res.status(401).json({ message: 'Sessiya topilmadi' });
    }

    // Get current user
    const me = await client.getMe();
    
    // Get messages from chat
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const chatIdNum = parseInt(chatId);
    const messages = await client.getMessages(chatIdNum, { limit: 50 });
    
    const formattedMessages = await Promise.all(messages.map(async (msg: any) => {
      const isOutgoing = msg.out || msg.fromId?.userId?.toString() === me.id.toString();
      
      let imageUrl = null;
      let imageId = null;
      
      // Check if message has photo
      if (msg.photo) {
        imageId = `${chatId}_${msg.id}`;
        imageUrl = `/api/telegram/media/${imageId}`;
      }
      
      return {
        id: msg.id.toString(),
        chatId,
        text: msg.message || '',
        time: formatMessageTime(msg.date ? new Date(msg.date * 1000) : new Date()),
        isOutgoing,
        status: isOutgoing ? (msg.id ? 'read' : 'sent') : 'read',
        senderId: msg.fromId?.userId?.toString() || 'unknown',
        senderName: 'User',
        image: imageUrl,
        imageId: imageId
      };
    }));

    // Cache messages for media download
    const sessionId = authTokenToSession.get(authToken);
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.cachedMessages = session.cachedMessages || new Map();
        messages.forEach((msg: any) => {
          session.cachedMessages.set(`${chatId}_${msg.id}`, msg);
        });
      }
    }

    res.json(formattedMessages.reverse()); // Reverse to show oldest first
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      message: 'Xabarlarni yuklashda xatolik',
      error: error.toString()
    });
  }
});

// Send message
router.post('/chats/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const chatIdParam = req.params.chatId;
    const { text } = req.body;

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Xabar matni kiritilishi shart' });
    }

    const client = getClientFromToken(authToken);
    
    if (!client) {
      return res.status(401).json({ message: 'Sessiya topilmadi' });
    }

    // Send message
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const chatIdNum = parseInt(chatId);
    const result = await client.sendMessage(chatIdNum, { message: text.trim() });
    
    const now = new Date();
    const message = {
      id: result.id.toString(),
      chatId,
      text: text.trim(),
      time: formatMessageTime(now),
      isOutgoing: true,
      status: 'sent',
      senderId: result.fromId?.toString() || 'me',
      senderName: 'Me'
    };

    res.json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      message: 'Xabarni yuborishda xatolik',
      error: error.toString()
    });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    // Find and disconnect client
    const sessionId = authTokenToSession.get(authToken);
    if (sessionId) {
      const client = clients.get(sessionId);
      if (client) {
        await client.disconnect();
        clients.delete(sessionId);
      }
      sessions.delete(sessionId);
      authTokenToSession.delete(authToken);
    }

    res.json({
      success: true,
      message: 'Tizimdan muvaffaqiyatli chiqildi'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Chiqishda xatolik',
      error: error.toString()
    });
  }
});

// Get current user info
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    let client = getClientFromToken(authToken);
    
    // If client not found, try to restore from session string
    if (!client) {
      const sessionString = req.headers['x-session-string'] as string;
      const apiId = req.headers['x-api-id'] as string;
      const apiHash = req.headers['x-api-hash'] as string;

      if (sessionString && apiId && apiHash) {
        try {
          // Restore client from session string
          const stringSession = new StringSession(sessionString);
          const restoredClient = new TelegramClient(
            stringSession,
            parseInt(apiId),
            apiHash,
            { connectionRetries: 5 }
          );

          await restoredClient.connect();
          
          // Create new session ID and store
          const sessionId = `session_${Date.now()}`;
          sessions.set(sessionId, {
            authenticated: true,
            authToken,
            sessionString,
            apiId,
            apiHash
          });
          clients.set(sessionId, restoredClient);
          authTokenToSession.set(authToken, sessionId);
          
          client = restoredClient;
        } catch (restoreError) {
          console.error('Session restore error:', restoreError);
          return res.status(401).json({ message: 'Sessiyani tiklashda xatolik' });
        }
      } else {
        return res.status(401).json({ message: 'Sessiya topilmadi' });
      }
    }

    const me = await client.getMe();
    
    res.json({
      id: me.id.toString(),
      firstName: me.firstName || '',
      lastName: me.lastName || '',
      username: me.username || '',
      phone: me.phone || '',
      isBot: me.bot || false
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      message: 'Foydalanuvchi ma\'lumotlarini yuklashda xatolik',
      error: error.toString()
    });
  }
});

// Download media (photos, videos, etc.)
router.get('/media/:imageId', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const imageId = req.params.imageId;

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    const client = getClientFromToken(authToken);
    const sessionId = authTokenToSession.get(authToken);
    
    if (!client || !sessionId) {
      return res.status(401).json({ message: 'Sessiya topilmadi' });
    }

    const session = sessions.get(sessionId);
    if (!session || !session.cachedMessages) {
      return res.status(404).json({ message: 'Xabar topilmadi' });
    }

    const message = session.cachedMessages.get(imageId);
    if (!message || !message.photo) {
      return res.status(404).json({ message: 'Rasm topilmadi' });
    }

    // Download photo as buffer
    const buffer = await client.downloadMedia(message, {
      workers: 1,
    });

    if (!buffer || !(buffer instanceof Buffer)) {
      return res.status(500).json({ message: 'Rasmni yuklashda xatolik' });
    }

    // Set appropriate content type
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(buffer);
  } catch (error: any) {
    console.error('Download media error:', error);
    res.status(500).json({ 
      message: 'Rasmni yuklashda xatolik',
      error: error.toString()
    });
  }
});

// Download profile avatar
router.get('/avatar/:entityId', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const entityId = req.params.entityId;

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    const client = getClientFromToken(authToken);
    const sessionId = authTokenToSession.get(authToken);
    
    if (!client || !sessionId) {
      return res.status(401).json({ message: 'Sessiya topilmadi' });
    }

    const session = sessions.get(sessionId);
    if (!session || !session.cachedEntities) {
      return res.status(404).json({ message: 'Entity topilmadi' });
    }

    const entity = session.cachedEntities.get(entityId);
    if (!entity || !entity.photo) {
      return res.status(404).json({ message: 'Avatar topilmadi' });
    }

    // Download profile photo as buffer
    const buffer = await client.downloadProfilePhoto(entity, {
      isBig: false, // Use small size for performance
    });

    if (!buffer || !(buffer instanceof Buffer)) {
      return res.status(404).json({ message: 'Avatar topilmadi' });
    }

    // Set appropriate content type
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(buffer);
  } catch (error: any) {
    console.error('Download avatar error:', error);
    res.status(404).json({ 
      message: 'Avatar topilmadi',
      error: error.toString()
    });
  }
});

// Mark messages as read
router.post('/chats/:chatId/read', async (req: Request, res: Response) => {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const chatIdParam = req.params.chatId;

    if (!authToken) {
      return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
    }

    const client = getClientFromToken(authToken);
    
    if (!client) {
      return res.status(401).json({ message: 'Sessiya topilmadi' });
    }

    // Mark as read
    const chatId = Array.isArray(chatIdParam) ? chatIdParam[0] : chatIdParam;
    const chatIdNum = parseInt(chatId);
    
    try {
      // Use markAsRead method which handles peer resolution automatically
      await client.markAsRead(chatIdNum);
      
      res.json({
        success: true,
        message: 'Xabarlar o\'qilgan deb belgilandi'
      });
    } catch (markError: any) {
      // If markAsRead fails, try alternative approach
      console.warn('markAsRead failed, trying alternative:', markError);
      
      // Get the entity first to ensure proper peer format
      const entity = await client.getEntity(chatIdNum);
      await client.invoke(
        new Api.messages.ReadHistory({
          peer: entity,
          maxId: 0
        })
      );
      
      res.json({
        success: true,
        message: 'Xabarlar o\'qilgan deb belgilandi'
      });
    }
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      message: 'Xabarlarni o\'qilgan deb belgilashda xatolik',
      error: error.toString()
    });
  }
});

export default router;

