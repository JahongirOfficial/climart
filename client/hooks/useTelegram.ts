import { useState, useCallback, useEffect } from 'react';

interface TelegramAuth {
  phoneNumber: string;
  apiId: string;
  apiHash: string;
}

interface TelegramUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
}

export const useTelegram = () => {
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem('telegram_auth_token')
  );
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('telegram_auth_token');
      if (token && !user) {
        try {
          const sessionString = localStorage.getItem('telegram_session_string');
          const apiId = localStorage.getItem('telegram_api_id');
          const apiHash = localStorage.getItem('telegram_api_hash');

          const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`
          };

          // Add session restoration headers if available
          if (sessionString) headers['x-session-string'] = sessionString;
          if (apiId) headers['x-api-id'] = apiId;
          if (apiHash) headers['x-api-hash'] = apiHash;

          const response = await fetch('/api/telegram/me', { headers });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setAuthToken(token);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('telegram_auth_token');
            localStorage.removeItem('telegram_session_string');
            localStorage.removeItem('telegram_api_id');
            localStorage.removeItem('telegram_api_hash');
            setAuthToken(null);
          }
        } catch (err) {
          console.error('Failed to load user:', err);
          localStorage.removeItem('telegram_auth_token');
          localStorage.removeItem('telegram_session_string');
          localStorage.removeItem('telegram_api_id');
          localStorage.removeItem('telegram_api_hash');
          setAuthToken(null);
        }
      }
    };

    loadUser();
  }, []);

  const sendCode = useCallback(async (auth: TelegramAuth) => {
    setLoading(true);
    setError(null);
    
    try {
      // Temporarily store API credentials for later use
      localStorage.setItem('telegram_temp_api_id', auth.apiId);
      localStorage.setItem('telegram_temp_api_hash', auth.apiHash);

      const response = await fetch('/api/telegram/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send code');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCode = useCallback(async (sessionId: string, code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to verify code');
      }

      const data = await response.json();
      
      if (data.authToken) {
        localStorage.setItem('telegram_auth_token', data.authToken);
        if (data.sessionString) {
          localStorage.setItem('telegram_session_string', data.sessionString);
        }
        // Store API credentials for session restoration
        const apiId = localStorage.getItem('telegram_temp_api_id');
        const apiHash = localStorage.getItem('telegram_temp_api_hash');
        if (apiId) {
          localStorage.setItem('telegram_api_id', apiId);
          localStorage.removeItem('telegram_temp_api_id');
        }
        if (apiHash) {
          localStorage.setItem('telegram_api_hash', apiHash);
          localStorage.removeItem('telegram_temp_api_hash');
        }
        setAuthToken(data.authToken);
        setUser(data.user);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      if (authToken) {
        await fetch('/api/telegram/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }

      localStorage.removeItem('telegram_auth_token');
      localStorage.removeItem('telegram_session_string');
      localStorage.removeItem('telegram_api_id');
      localStorage.removeItem('telegram_api_hash');
      localStorage.removeItem('telegram_temp_api_id');
      localStorage.removeItem('telegram_temp_api_hash');
      setAuthToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const getChats = useCallback(async () => {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/telegram/chats', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return response.json();
  }, [authToken]);

  const getMessages = useCallback(async (chatId: string) => {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/telegram/chats/${chatId}/messages`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }, [authToken]);

  const sendMessage = useCallback(async (chatId: string, text: string, image?: File | null) => {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    // For now, only send text (image support requires server-side changes)
    const response = await fetch(`/api/telegram/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: text || 'Image' })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }, [authToken]);

  const markAsRead = useCallback(async (chatId: string) => {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/telegram/chats/${chatId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }

    return response.json();
  }, [authToken]);

  return {
    authToken,
    user,
    loading,
    error,
    sendCode,
    verifyCode,
    logout,
    getChats,
    getMessages,
    sendMessage,
    markAsRead,
    isAuthenticated: !!authToken
  };
};
