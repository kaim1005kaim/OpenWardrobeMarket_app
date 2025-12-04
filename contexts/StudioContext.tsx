import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PublishedItem } from '@/types';
import { fetchStudioData } from '@/lib/studio-data';

interface StudioContextType {
  items: PublishedItem[];
  loading: boolean;
  refreshItems: () => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({
  children,
  initialItems = []
}: {
  children: ReactNode;
  initialItems?: PublishedItem[];
}) {
  console.log('[StudioProvider] Initializing with items count:', initialItems.length);

  // Initialize with preloaded data to prevent empty state on first render
  const [items, setItems] = useState<PublishedItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  // Update items when initialItems changes (when preload completes)
  React.useEffect(() => {
    if (initialItems.length > 0 && items.length === 0) {
      console.log('[StudioProvider] Updating items from initialItems:', initialItems.length);
      setItems(initialItems);
    }
  }, [initialItems]);

  const refreshItems = async () => {
    setLoading(true);
    try {
      const data = await fetchStudioData();
      setItems(data);
    } catch (error) {
      console.error('[StudioContext] Failed to refresh items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudioContext.Provider value={{ items, loading, refreshItems }}>
      {children}
    </StudioContext.Provider>
  );
}

export const useStudioData = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudioData must be used within a StudioProvider');
  }
  return context;
};
