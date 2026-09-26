import { supabase } from '../supabase';
import { UserProfile } from '../types/database.types';

/**
 * Servicio para gestión y sincronización de perfiles de usuario (public.users)
 */
export const userService = {
  /**
   * Obtiene el perfil de un usuario por su ID (UUID)
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[userService.getProfile] Error ID ${userId}:`, error.message);
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }

    return (data as UserProfile) || null;
  },

  /**
   * Obtiene el perfil público del usuario autenticado actualmente
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    return this.getProfile(user.id);
  },

  /**
   * Actualiza los datos del perfil del usuario autenticado
   */
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      throw new Error('No tienes permisos para modificar este perfil.');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[userService.updateProfile] Error:`, error.message);
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    return data as UserProfile;
  },

  /**
   * Sincroniza o crea el registro en public.users a partir de los datos de Auth
   */
  async syncUserFromAuth(): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || null;
    const avatarUrl = meta.avatar_url || meta.picture || null;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[userService.syncUserFromAuth] Error upsert:', error.message);
    }

    return (data as UserProfile) || null;
  },
};
