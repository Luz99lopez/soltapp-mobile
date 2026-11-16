import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../supabase';
import { favoriteService } from '../services/favoriteService';
import { createFavoritesStore } from '../state/favoritesStore';

type Store = ReturnType<typeof createFavoritesStore>;
const FavoritesContext = createContext<Store | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createFavoritesStore(favoriteService));
  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      store.setUser(session?.user.id ?? null);
      // Leave the auth callback before querying Supabase (avoid auth lock deadlocks).
      setTimeout(() => { if (mounted) void store.refresh(); }, 0);
    });
    const appSubscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void store.refresh();
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
      appSubscription.remove();
      store.setUser(null);
    };
  }, [store]);
  return <FavoritesContext.Provider value={store}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const store = useContext(FavoritesContext);
  if (!store) throw new Error('FavoritesProvider is required');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, refresh: store.refresh, toggle: store.toggle, clearActionError: store.clearActionError };
}
