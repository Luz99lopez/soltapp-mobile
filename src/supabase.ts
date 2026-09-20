import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupportedStorage } from '@supabase/supabase-js';

// URL del proyecto real de Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpfcbpvjinwfkkwpffey.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZmNicHZqaW53Zmtrd3BmZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODkzNTksImV4cCI6MjEwNTM2NTM1OX0.s8xPjB5dgSQMSf4LPkd-KtO06NGZ2CBwgK2mDBAki_s';

// Adaptador de almacenamiento condicional y seguro para Web (SSR / Client) y Móvil (AsyncStorage)
const customStorage: SupportedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
