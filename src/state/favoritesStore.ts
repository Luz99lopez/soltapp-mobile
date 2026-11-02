import type { ProductListItem } from '../types/database.types';

export interface FavoriteEntry {
  productId: string;
  product: ProductListItem | null;
}

export interface FavoritesRepository {
  list(userId: string): Promise<FavoriteEntry[]>;
  add(userId: string, productId: string): Promise<void>;
  remove(userId: string, productId: string): Promise<void>;
}

export interface FavoritesSnapshot {
  userId: string | null;
  ready: boolean;
  loaded: boolean;
  loading: boolean;
  entries: FavoriteEntry[];
  pending: string[];
  error: string | null;
  actionError: string | null;
}

// Shared across screens, but never across signed-in users. Supabase is the source of truth.
export function createFavoritesStore(repository: FavoritesRepository) {
  let state: FavoritesSnapshot = {
    userId: null, ready: false, loaded: false, loading: false,
    entries: [], pending: [], error: null, actionError: null,
  };
  let generation = 0;
  let request = 0;
  const listeners = new Set<() => void>();
  const patch = (changes: Partial<FavoritesSnapshot>) => {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener());
  };

  const refresh = async () => {
    const userId = state.userId;
    if (!userId || state.pending.length) return;
    const currentGeneration = generation;
    const currentRequest = ++request;
    patch({ loading: true, error: null });
    try {
      const entries = await repository.list(userId);
      if (generation === currentGeneration && request === currentRequest) {
        patch({ entries, loaded: true });
      }
    } catch {
      if (generation === currentGeneration && request === currentRequest) {
        patch({ error: 'No pudimos cargar tus favoritos. Revisá tu conexión e intentá nuevamente.' });
      }
    } finally {
      if (generation === currentGeneration && request === currentRequest) patch({ loading: false });
    }
  };

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setUser(userId: string | null) {
      if (state.ready && state.userId === userId) return;
      generation++;
      request++;
      patch({ userId, ready: true, loaded: false, loading: false, entries: [], pending: [], error: null, actionError: null });
    },
    refresh,
    clearActionError: () => patch({ actionError: null }),
    async toggle(productId: string, product: ProductListItem | null = null) {
      if (!state.ready) return;
      if (!state.userId) {
        patch({ actionError: 'Iniciá sesión para guardar tus favoritos.' });
        return;
      }
      if (!state.loaded) {
        patch({ actionError: 'Primero necesitamos cargar tus favoritos. Reintentá desde la pantalla Favoritos.' });
        return;
      }
      if (state.pending.includes(productId)) return;
      const userId = state.userId;
      const currentGeneration = generation;
      const saved = state.entries.some((entry) => entry.productId === productId);
      // Invalidate any read started before this write so it cannot restore stale hearts.
      request++;
      patch({ pending: [...state.pending, productId], loading: false, actionError: null });
      try {
        if (saved) await repository.remove(userId, productId);
        else await repository.add(userId, productId);
        if (generation !== currentGeneration) return;
        patch({ entries: saved
          ? state.entries.filter((entry) => entry.productId !== productId)
          : [{ productId, product }, ...state.entries.filter((entry) => entry.productId !== productId)],
        });
      } catch {
        if (generation === currentGeneration) {
          patch({ actionError: 'No pudimos guardar el cambio. Intentá nuevamente.' });
        }
      } finally {
        if (generation === currentGeneration) {
          patch({ pending: state.pending.filter((id) => id !== productId) });
        }
      }
    },
  };
}
