import { supabase } from '../supabase';
import type { ProductListItem } from '../types/database.types';
import type { FavoriteEntry, FavoritesRepository } from '../state/favoritesStore';

const PAGE_SIZE = 500;

export const favoriteService: FavoritesRepository = {
  async list(userId) {
    const entries: FavoriteEntry[] = [];
    // Paginate explicitly: the Supabase default row limit must not hide saved products.
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase.from('favorites')
        .select(`product_id, product:products(
          id, seller_id, category_id, title, description, price, currency,
          condition, status, location, created_at, updated_at,
          images:product_images(id, image_url, position, is_cover)
        )`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('product_id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as unknown as { product_id: string; product: ProductListItem | null }[];
      entries.push(...rows.map(({ product_id, product }) => {
        const images = [...(product?.images ?? [])].sort((a, b) => a.position - b.position);
        return {
          productId: product_id,
          product: product ? {
            ...product, images,
            cover_image: images.find((image) => image.is_cover)?.image_url ?? images[0]?.image_url ?? null,
          } : null,
        };
      }));
      if (rows.length < PAGE_SIZE) break;
    }
    return entries;
  },
  async add(userId, productId) {
    // A repeated add from another device is harmless; the database enforces uniqueness.
    const { error } = await supabase.from('favorites').upsert(
      { user_id: userId, product_id: productId },
      { onConflict: 'user_id,product_id', ignoreDuplicates: true },
    );
    if (error) throw error;
  },
  async remove(userId, productId) {
    const { error } = await supabase.from('favorites').delete()
      .eq('user_id', userId).eq('product_id', productId);
    if (error) throw error;
  },
};
