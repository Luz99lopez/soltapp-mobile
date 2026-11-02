import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export interface SoltappUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  rating: number;
  location: string;
  sinceYear: string;
}

// Usuarios reales registrados en Supabase
export const PRESET_USERS: SoltappUser[] = [
  {
    id: 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb',
    fullName: 'Kike Sanabria',
    username: 'kikesanabria14_f12e',
    email: 'kikesanabria14@gmail.com',
    avatarUrl: null,
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2026',
  },
  {
    id: '122230dc-4ee3-407a-a32d-07a538b32212',
    fullName: 'yassvica',
    username: 'yassvica_1222',
    email: 'yassvica@gmail.com',
    avatarUrl: null,
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2025',
  },
  {
    id: 'c2026302-b7da-4dee-8c96-6623a5a5f4d0',
    fullName: 'Nestor Enrique Sanabria',
    username: 'en.sanabria14_c202',
    email: 'en.sanabria14@gmail.com',
    avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocKMIck-mZqm3zNLDyjJ1rBjMw0IY8ZnonC9Tlv8cvWdYY4BMLOK=s96-c',
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2026',
  },
  {
    id: '75bd20e2-1358-4505-b95a-d212136eb7cb',
    fullName: 'Luz López',
    username: 'luzlopez9914_75bd',
    email: 'luzlopez9914@gmail.com',
    avatarUrl: null,
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2026',
  },
];

const ACTIVE_USER_STORAGE_KEY = '@soltapp_active_user_id';

export const accountService = {
  /**
   * Obtiene el usuario activo actualmente.
   * 1. Prioriza el usuario seleccionado en el conmutador de simulación (si existe).
   * 2. Si no hay conmutador, resuelve el usuario autenticado en Supabase Auth y consulta public.users.
   * 3. Fallback al primer usuario predefinido (Kike Sanabria).
   */
  async getCurrentUser(): Promise<SoltappUser> {
    // 1. Priorizar SIEMPRE la sesión real autenticada en Supabase Auth
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        let avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        let username = user.user_metadata?.username || user.email?.split('@')[0] || 'usuario';

        // Consultar public.users para nombre real
        try {
          const { data: dbUser } = await supabase
            .from('users')
            .select('full_name, avatar_url, username')
            .eq('id', user.id)
            .maybeSingle();

          if (dbUser?.full_name && dbUser.full_name.trim().length > 0) {
            fullName = dbUser.full_name.trim();
          }
          if (dbUser?.avatar_url) {
            avatarUrl = dbUser.avatar_url;
          }
          if (dbUser?.username) {
            username = dbUser.username;
          }
        } catch {}

        if (!fullName || fullName.trim().length === 0) {
          fullName = username || user.email?.split('@')[0] || 'Usuario Soltapp';
        }

        return {
          id: user.id,
          fullName,
          username,
          email: user.email || '',
          avatarUrl,
          rating: 5,
          location: user.user_metadata?.location || '1629, Pilar',
          sinceYear: user.created_at ? new Date(user.created_at).getFullYear().toString() : '2026',
        };
      }
    } catch (e) {
      console.warn('[accountService.getCurrentUser] Error auth:', e);
    }

    // 2. Si no hay sesión autenticada activa, verificar si se configuró un usuario simulado
    let savedId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (typeof sessionStorage !== 'undefined') {
          savedId = sessionStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        }
        if (!savedId && typeof localStorage !== 'undefined') {
          savedId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        }
      } catch {}
    } else {
      try {
        savedId = await AsyncStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      } catch {}
    }

    if (savedId) {
      const found = PRESET_USERS.find((u) => u.id === savedId);
      if (found) {
        return found;
      }
    }

    // 3. Fallback al primer usuario predefinido (Kike Sanabria)
    return PRESET_USERS[0];
  },

  /**
   * Cambia el usuario activo para pruebas entre usuarios
   */
  async switchUser(userId: string): Promise<SoltappUser> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('soltapp_user_switched', { detail: { userId } }));
      } catch {}
    } else {
      try {
        await AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
      } catch {}
    }

    const found = PRESET_USERS.find((u) => u.id === userId);
    return found || PRESET_USERS[0];
  },

  /**
   * Limpia el usuario activo guardado (por ejemplo, al cerrar sesión)
   */
  async clearActiveUser(): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('soltapp_user_switched', { detail: { userId: null } }));
      } catch {}
    } else {
      try {
        await AsyncStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      } catch {}
    }
  },

  /**
   * Retorna la lista de usuarios predefinidos disponibles para simular
   */
  getPresetUsers(): SoltappUser[] {
    return PRESET_USERS;
  },
};
