import { supabase } from '../supabase';
import {
  UserRating,
  RatingSummary,
  RatingEligibility,
  UpsertRatingInput,
  PaginatedRatingsResponse,
} from '../types/rating.types';
import {
  calculateRatingSummary,
  validateRatingInput,
  isRateLimited,
} from '../utils/ratingCalculations';
import { appStorage } from './meetupOrderService';

const LOCAL_RATINGS_PREFIX = '@soltapp_user_ratings_';

export const ratingService = {
  /**
   * Verifica si el usuario actual tiene permisos y elegibilidad para valorar al usuario destino.
   */
  async canRateUser(targetUserId: string): Promise<RatingEligibility> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          can_rate: false,
          reason: 'Debes iniciar sesión para valorar a un usuario.',
        };
      }

      if (user.id === targetUserId) {
        return {
          can_rate: false,
          reason: 'No puedes valorarte a ti mismo.',
        };
      }

      // Intentar consultar la función RPC en Supabase
      const { data, error } = await supabase.rpc('can_rate_user', {
        p_target_user_id: targetUserId,
      });

      if (!error && data) {
        return data as RatingEligibility;
      }

      // Fallback local: verificar órdenes completadas si el RPC aún no está desplegado en la nube
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${targetUserId}),and(buyer_id.eq.${targetUserId},seller_id.eq.${user.id})`)
        .in('status', ['COMPLETED', 'DELIVERED']);

      const hasCompletedOrder = !ordersError && Array.isArray(orders) && orders.length > 0;

      // También verificar si existe orden en almacenamiento local (para pruebas en desarrollo/mock)
      let localTransaction = false;
      try {
        const rawOrders = await appStorage.getItem('@soltapp_meetup_orders');
        if (rawOrders) {
          const parsed = JSON.parse(rawOrders);
          if (Array.isArray(parsed)) {
            localTransaction = parsed.some(
              (o: any) =>
                ((o.buyer_id === user.id && o.seller_id === targetUserId) ||
                  (o.buyer_id === targetUserId && o.seller_id === user.id)) &&
                (o.status === 'COMPLETED' || o.status === 'DELIVERED')
            );
          }
        }
      } catch (_) {}

      if (!hasCompletedOrder && !localTransaction) {
        return {
          can_rate: false,
          reason: 'Solo puedes valorar a este usuario si han completado una compra o venta juntos.',
        };
      }

      // Consultar valoración existente
      const existing = await this.getMyRatingForUser(targetUserId);

      return {
        can_rate: true,
        has_rated_before: !!existing,
        existing_rating: existing
          ? {
              rating: existing.rating,
              comment: existing.comment,
              updated_at: existing.updated_at,
            }
          : null,
      };
    } catch (err: any) {
      console.warn('[ratingService.canRateUser] Error:', err.message);
      return {
        can_rate: false,
        reason: 'Error al comprobar elegibilidad para valorar.',
      };
    }
  },

  /**
   * Crea o actualiza una valoración de 1 a 5 estrellas con comentario opcional (máx 500 car.)
   */
  async upsertRating(
    targetUserId: string,
    rating: number,
    comment?: string | null
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para valorar a un usuario.' };
    }

    // 1. Validación en cliente
    const validation = validateRatingInput(
      { target_user_id: targetUserId, rating, comment },
      user.id
    );
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // 2. Verificar si existe rate limiting en memoria local / reciente
    const existing = await this.getMyRatingForUser(targetUserId);
    if (existing && isRateLimited(existing.updated_at, 30)) {
      return {
        success: false,
        error: 'Has calificado recientemente a este usuario. Por favor, espera unos segundos antes de volver a modificar tu voto.',
      };
    }

    const trimmedComment = comment?.trim() || null;

    try {
      // 3. Llamar al RPC en Supabase
      const { data, error } = await supabase.rpc('upsert_user_rating', {
        p_target_user_id: targetUserId,
        p_rating: rating,
        p_comment: trimmedComment,
      });

      if (!error && data?.success) {
        // Cachear localmente para disponibilidad offline inmediata
        await this.cacheLocalRating(targetUserId, user, rating, trimmedComment, data.id);
        return { success: true, id: data.id };
      }

      // Si falla RPC, intentar inserción/actualización directa en la tabla vía PostgREST
      const { data: directData, error: directError } = await supabase
        .from('user_ratings')
        .upsert(
          {
            reviewer_id: user.id,
            target_user_id: targetUserId,
            rating,
            comment: trimmedComment,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'reviewer_id,target_user_id' }
        )
        .select()
        .single();

      if (!directError && directData) {
        await this.cacheLocalRating(targetUserId, user, rating, trimmedComment, directData.id);
        return { success: true, id: directData.id };
      }

      // Fallback para entornos locales / offline
      const mockId = 'rating-' + Date.now();
      await this.cacheLocalRating(targetUserId, user, rating, trimmedComment, mockId);
      return { success: true, id: mockId };
    } catch (err: any) {
      console.warn('[ratingService.upsertRating] Fallback local tras error:', err.message);
      const mockId = 'rating-' + Date.now();
      await this.cacheLocalRating(targetUserId, user, rating, trimmedComment, mockId);
      return { success: true, id: mockId };
    }
  },

  /**
   * Obtiene el resumen consolidado de valoraciones (media redondeada a 1 decimal y distribución)
   */
  async getUserRatingSummary(targetUserId: string): Promise<RatingSummary> {
    try {
      // 1. Intentar RPC en Supabase
      const { data, error } = await supabase.rpc('get_user_rating_summary', {
        p_target_user_id: targetUserId,
      });

      if (!error && data && data.total_ratings !== undefined) {
        return data as RatingSummary;
      }

      // 2. Fallback: Consulta directa a la tabla user_ratings
      const { data: ratings, error: selectError } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('target_user_id', targetUserId);

      if (!selectError && ratings && ratings.length > 0) {
        return calculateRatingSummary(targetUserId, ratings);
      }

      // 3. Fallback: Almacenamiento local
      const localRatings = await this.getLocalRatings(targetUserId);
      if (localRatings.length > 0) {
        return calculateRatingSummary(targetUserId, localRatings);
      }

      // Resumen vacío inicial
      return calculateRatingSummary(targetUserId, []);
    } catch (err: any) {
      console.warn('[ratingService.getUserRatingSummary] Error:', err.message);
      return calculateRatingSummary(targetUserId, []);
    }
  },

  /**
   * Obtiene la lista paginada de valoraciones de un usuario con los datos del autor
   */
  async getUserRatingsPaginated(
    targetUserId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedRatingsResponse> {
    const limit = Math.max(1, Math.min(pageSize, 50));
    const offset = Math.max(0, (page - 1) * limit);

    try {
      // 1. Intentar RPC en Supabase
      const { data, error } = await supabase.rpc('get_user_ratings_paginated', {
        p_target_user_id: targetUserId,
        p_limit: limit,
        p_offset: offset,
      });

      if (!error && data && Array.isArray(data.items)) {
        return data as PaginatedRatingsResponse;
      }

      // 2. Fallback: Consulta con join a users vía PostgREST
      const { data: rows, count, error: queryError } = await supabase
        .from('user_ratings')
        .select('*, reviewer:users(id, full_name, username, avatar_url, created_at)', {
          count: 'exact',
        })
        .eq('target_user_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!queryError && rows) {
        return {
          target_user_id: targetUserId,
          total: count || rows.length,
          limit,
          offset,
          items: rows as UserRating[],
        };
      }

      // 3. Fallback: almacenamiento local
      const localList = await this.getLocalRatings(targetUserId);
      const paged = localList.slice(offset, offset + limit);

      return {
        target_user_id: targetUserId,
        total: localList.length,
        limit,
        offset,
        items: paged,
      };
    } catch (err: any) {
      console.warn('[ratingService.getUserRatingsPaginated] Error:', err.message);
      return {
        target_user_id: targetUserId,
        total: 0,
        limit,
        offset,
        items: [],
      };
    }
  },

  /**
   * Obtiene la valoración que el usuario actual ya realizó para el usuario destino (si existe)
   */
  async getMyRatingForUser(targetUserId: string): Promise<UserRating | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('reviewer_id', user.id)
        .eq('target_user_id', targetUserId)
        .maybeSingle();

      if (!error && data) {
        return data as UserRating;
      }

      // Fallback local
      const localList = await this.getLocalRatings(targetUserId);
      const found = localList.find((r) => r.reviewer_id === user.id);
      return found || null;
    } catch (_) {
      return null;
    }
  },

  // ==================== Métodos Auxiliares de Caché Local ====================

  async getLocalRatings(targetUserId: string): Promise<UserRating[]> {
    try {
      const raw = await appStorage.getItem(LOCAL_RATINGS_PREFIX + targetUserId);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async cacheLocalRating(
    targetUserId: string,
    reviewer: any,
    rating: number,
    comment: string | null,
    ratingId: string
  ): Promise<void> {
    try {
      const list = await this.getLocalRatings(targetUserId);
      const now = new Date().toISOString();
      const meta = reviewer.user_metadata || {};

      const newRecord: UserRating = {
        id: ratingId,
        reviewer_id: reviewer.id,
        target_user_id: targetUserId,
        rating,
        comment,
        created_at: now,
        updated_at: now,
        reviewer: {
          id: reviewer.id,
          full_name: meta.full_name || meta.name || 'Usuario de Soltapp',
          username: meta.username || null,
          avatar_url: meta.avatar_url || meta.picture || null,
        },
      };

      const existingIndex = list.findIndex((r) => r.reviewer_id === reviewer.id);
      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          rating,
          comment,
          updated_at: now,
        };
      } else {
        list.unshift(newRecord);
      }

      await appStorage.setItem(LOCAL_RATINGS_PREFIX + targetUserId, JSON.stringify(list));
    } catch (_) {}
  },
};
