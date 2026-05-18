import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAppState } from '../hooks/useAppState';

type AppContextValue = ReturnType<typeof useAppState>;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const value = useAppState();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return value;
}
