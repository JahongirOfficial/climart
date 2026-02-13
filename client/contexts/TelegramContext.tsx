import { createContext, useContext, useState, ReactNode } from 'react';

interface TelegramContextType {
  isTelegramOpen: boolean;
  openTelegram: () => void;
  closeTelegram: () => void;
  toggleTelegram: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

  const openTelegram = () => setIsTelegramOpen(true);
  const closeTelegram = () => setIsTelegramOpen(false);
  const toggleTelegram = () => setIsTelegramOpen(prev => !prev);

  return (
    <TelegramContext.Provider value={{ isTelegramOpen, openTelegram, closeTelegram, toggleTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegramModal = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegramModal must be used within TelegramProvider');
  }
  return context;
};
