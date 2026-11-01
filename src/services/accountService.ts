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

// Usuarios predefinidos de la plataforma (cualquiera puede comprar y vender a la vez)
export const PRESET_USERS: SoltappUser[] = [
  {
    id: '122230dc-4ee3-407a-a32d-07a538b32212', // UUID de yassvica en Supabase
    fullName: 'yassvica',
    username: 'yassvica_1222',
    email: 'yassvica@soltapp.com',
    avatarUrl: null,
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2025',
  },
  {
    id: 'buyer-manuel-sans',
    fullName: 'Manuel Sans',
    username: 'manuelsans',
    email: 'manuel.sans@gmail.com',
    avatarUrl: null,
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2026',
  },
  {
    id: 'c2026302-b7da-4dee-8c96-6623a5a5f4d0', // UUID de Nestor en Supabase
    fullName: 'Nestor Enrique Sanabria',
    username: 'en.sanabria14_c202',
    email: 'en.sanabria14@gmail.com',
    avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocKMIck-mZqm3zNLDyjJ1rBjMw0IY8ZnonC9Tlv8cvWdYY4BMLOK=s96-c',
    rating: 5,
    location: '1629, Pilar',
    sinceYear: '2026',
  },
];

const ACTIVE_USER_STORAGE_KEY = '@soltapp_active_user_id';

export const accountService = {
  /**
   * Obtiene el usuario activo actualmente.
   * Si hay sesión en Supabase Auth, retorna los datos de ese usuario.
   * En entorno de pruebas/simulación, retorna el usuario seleccionado.
   */
  async getCurrentUser(): Promise<SoltappUser> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Usuario';
        return {
          id: user.id,
          fullName: fullName,
          username: user.email?.split('@')[0] || 'usuario',
          email: user.email || '',
          avatarUrl: meta.avatar_url || null,
          rating: 5,
          location: meta.location || '1629, Pilar',
          sinceYear: user.created_at ? new Date(user.created_at).getFullYear().toString() : '2026',
        };
      }
    } catch {}

    // Leer usuario activo en almacenamiento local
    let savedId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        savedId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      } catch {}
    } else {
      try {
        savedId = await AsyncStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      } catch {}
    }

    if (savedId) {
      const found = PRESET_USERS.find((u) => u.id === savedId);
      if (found) return found;
    }

    // Por defecto: yassvica
    return PRESET_USERS[0];
  },

  /**
   * Cambia el usuario activo para pruebas entre usuarios
   */
  async switchUser(userId: string): Promise<SoltappUser> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
        window.dispatchEvent(new Event('storage'));
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
   * Retorna la lista de usuarios predefinidos disponibles para simular
   */
  getPresetUsers(): SoltappUser[] {
    return PRESET_USERS;
  },
};
