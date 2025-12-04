import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SplashContextType {
  isAppReady: boolean;
  setAppReady: () => void;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export function SplashProvider({ children }: { children: ReactNode }) {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleSetAppReady = () => {
    console.log('[SplashContext] App is ready');
    setIsAppReady(true);
  };

  return (
    <SplashContext.Provider value={{ isAppReady, setAppReady: handleSetAppReady }}>
      {children}
    </SplashContext.Provider>
  );
}

export const useSplashReady = () => {
  const context = useContext(SplashContext);
  if (!context) {
    throw new Error('useSplashReady must be used within a SplashProvider');
  }
  return context;
};
