import { supabase } from '../supabase';
import {
  Product,
  ProductListItem,
  ProductDetail,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  ProductStatus,
} from '../types/database.types';

/**
 * Helper para normalizar la imagen de portada y ordenar la lista de imágenes
 */
function normalizeProductListItem(raw: any): ProductListItem {
  const images = (raw.images || []).sort(
    (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
  );

  const coverImg =
    images.find((img: any) => img.is_cover)?.image_url ||
    images[0]?.image_url ||
    null;

  return {
    ...raw,
    images,
    cover_image: coverImg,
    category: raw.category || null,
    seller: raw.seller || null,
  };
}

/**
 * Servicio para gestión completa de publicaciones y productos en Soltapp
 */
export const productService = {
  /**
   * Consulta los productos activos para la pantalla principal (Home)
   * Ordenados de forma descendente por created_at con sus imágenes
   */
  async fetchHomeProducts(): Promise<ProductListItem[]> {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id,
        seller_id,
        category_id,
        title,
        description,
        price,
        currency,
        condition,
        status,
        location,
        created_at,
        updated_at,
        category:categories(id, name, slug, level),
        product_images(id, image_url, position, is_cover),
        seller:users(id, full_name, username, avatar_url)
      `
      )
      .eq('status', 'activo')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[productService.fetchHomeProducts] Error:', error.message);
      throw new Error(`Error al obtener productos para el Home: ${error.message}`);
    }

    return (data || []).map((prod: any) => {
      const rawImages = prod.product_images || prod.images || [];
      const images = rawImages.sort(
        (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
      );
      const cover =
        images.find((img: any) => img.is_cover)?.image_url ||
        images[0]?.image_url ||
        null;

      return {
        ...prod,
        images,
        cover_image: cover,
        category: prod.category || null,
        seller: prod.seller || null,
      };
    });
  },

  /**
   * Lista productos activos para el catálogo/feed con filtros opcionales y paginación
   */
  async getActiveProducts(filters: ProductFilters = {}): Promise<{ products: ProductListItem[]; count: number }> {
    const {
      categoryId,
      sellerId,
      status = 'activo',
      condition,
      searchQuery,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      ascending = false,
    } = filters;

    let query = supabase
      .from('products')
      .select(
        `
        id,
        seller_id,
        category_id,
        title,
        description,
        price,
        currency,
        condition,
        status,
        location,
        created_at,
        updated_at,
        category:categories(id, name, slug, level),
        images:product_images(id, image_url, position, is_cover),
        seller:users(id, full_name, username, avatar_url)
      `,
        { count: 'exact' }
      );

    // Filtro por estado (único o arreglo)
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else if (status) {
      query = query.eq('status', status);
    }

    // Filtro por categoría
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filtro por vendedor
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    // Filtro por condición
    if (condition) {
      query = query.eq('condition', condition);
    }

    // Filtros de precio
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Búsqueda por texto en título o descripción
    if (searchQuery && searchQuery.trim()) {
      const cleanTerm = searchQuery.trim();
      query = query.or(`title.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%`);
    }

    // Ordenamiento y Paginación
    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[productService.getActiveProducts] Error:', error.message);
      throw new Error(`Error al listar productos: ${error.message}`);
    }

    const formattedProducts = (data || []).map(normalizeProductListItem);

    return {
      products: formattedProducts,
      count: count || 0,
    };
  },

  /**
   * Obtiene el detalle completo de un producto por ID
   * Incluye vendedor (users), categoría (categories) y galería de fotos (product_images)
   */
  async getProductById(productId: string): Promise<ProductDetail | null> {
    if (!productId) return null;

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        category:categories(*),
        images:product_images(*),
        seller:users(*)
      `
      )
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      console.error(`[productService.getProductById] Error ID ${productId}:`, error.message);
      throw new Error(`Error al obtener el producto: ${error.message}`);
    }

    if (!data) return null;

    // Ordenar imágenes por posición
    const sortedImages = (data.images || []).sort(
      (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
    );

    return {
      ...data,
      images: sortedImages,
      category: data.category || null,
      seller: data.seller || null,
    } as ProductDetail;
  },

  /**
   * Crea una nueva publicación vinculando el seller_id autenticado e insertando sus imágenes
   */
  async createProduct(input: CreateProductInput): Promise<ProductDetail> {
    // 1. Obtener usuario autenticado actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Debes iniciar sesión para publicar un producto.');
    }

    // 2. Inserción del producto principal
    const productPayload = {
      seller_id: user.id,
      category_id: input.category_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      currency: input.currency || 'ARS',
      condition: input.condition,
      status: 'activo' as ProductStatus,
      location: input.location?.trim() || null,
    };

    const { data: createdProduct, error: productError } = await supabase
      .from('products')
      .insert(productPayload)
      .select()
      .single();

    if (productError || !createdProduct) {
      console.error('[productService.createProduct] Error insertando producto:', productError?.message);
      throw new Error(`Error al crear publicación: ${productError?.message}`);
    }

    // 3. Inserción secuencial de imágenes en public.product_images
    let insertedImages: any[] = [];
    if (input.images && input.images.length > 0) {
      const imagesToInsert = input.images.map((img, index) => {
        if (typeof img === 'string') {
          return {
            product_id: createdProduct.id,
            image_url: img,
            position: index,
            is_cover: index === 0,
          };
        }
        return {
          product_id: createdProduct.id,
          image_url: img.image_url,
          position: img.position ?? index,
          is_cover: img.is_cover !== undefined ? img.is_cover : index === 0,
        };
      });

      const { data: imgData, error: imgError } = await supabase
        .from('product_images')
        .insert(imagesToInsert)
        .select();

      if (imgError) {
        console.error('[productService.createProduct] Error insertando imágenes:', imgError.message);
        // No cancelamos el producto, pero advertimos
      } else {
        insertedImages = imgData || [];
      }
    }

    // 4. Retornar el detalle completo recién creado
    const fullDetail = await this.getProductById(createdProduct.id);
    if (!fullDetail) {
      return {
        ...createdProduct,
        images: insertedImages,
        category: null,
        seller: null,
      } as ProductDetail;
    }

    return fullDetail;
  },

  /**
   * Modifica los datos de un producto verificando permisos del vendedor
   */
  async updateProduct(productId: string, input: UpdateProductInput): Promise<ProductDetail> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('No tienes permisos para modificar este producto.');
    }

    // 1. Validar que el producto pertenezca al usuario autenticado
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single();

    if (checkError || !existing) {
      throw new Error('Producto no encontrado.');
    }

    if (existing.seller_id !== user.id) {
      throw new Error('No tienes autorización para editar esta publicación.');
    }

    // 2. Construir payload de actualización
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.category_id !== undefined) updatePayload.category_id = input.category_id;
    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
    if (input.price !== undefined) updatePayload.price = input.price;
    if (input.currency !== undefined) updatePayload.currency = input.currency;
    if (input.condition !== undefined) updatePayload.condition = input.condition;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.location !== undefined) updatePayload.location = input.location?.trim() || null;

    const { error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .eq('seller_id', user.id);

    if (updateError) {
      console.error(`[productService.updateProduct] Error ID ${productId}:`, updateError.message);
      throw new Error(`Error al actualizar producto: ${updateError.message}`);
    }

    // 3. Si se envían nuevas imágenes, reemplazamos la galería
    if (input.images !== undefined) {
      // Eliminar anteriores
      await supabase.from('product_images').delete().eq('product_id', productId);

      if (input.images.length > 0) {
        const imagesToInsert = input.images.map((img, index) => {
          if (typeof img === 'string') {
            return {
              product_id: productId,
              image_url: img,
              position: index,
              is_cover: index === 0,
            };
          }
          return {
            product_id: productId,
            image_url: img.image_url,
            position: img.position ?? index,
            is_cover: img.is_cover !== undefined ? img.is_cover : index === 0,
          };
        });

        await supabase.from('product_images').insert(imagesToInsert);
      }
    }

    const updatedDetail = await this.getProductById(productId);
    if (!updatedDetail) {
      throw new Error('Error al recuperar el producto actualizado.');
    }

    return updatedDetail;
  },

  /**
   * Cambia el estado de una publicación (ej: 'pausado', 'activo', 'vendido', 'eliminado')
   */
  async updateProductStatus(productId: string, status: ProductStatus): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Debes iniciar sesión para cambiar el estado de la publicación.');
    }

    const { error } = await supabase
      .from('products')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('seller_id', user.id);

    if (error) {
      console.error(`[productService.updateProductStatus] Error:`, error.message);
      throw new Error(`Error al cambiar el estado del producto: ${error.message}`);
    }
  },

  /**
   * Elimina un producto (soft delete por defecto estableciendo status = 'eliminado')
   */
  async deleteProduct(productId: string, softDelete: boolean = true): Promise<void> {
    if (softDelete) {
      await this.updateProductStatus(productId, 'eliminado');
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('No tienes permisos para eliminar este producto.');
    }

    // Hard delete: eliminar imágenes primero y luego el producto
    await supabase.from('product_images').delete().eq('product_id', productId);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', user.id);

    if (error) {
      console.error(`[productService.deleteProduct] Error:`, error.message);
      throw new Error(`Error al eliminar el producto: ${error.message}`);
    }
  },

  /**
   * Obtiene todos los productos publicados por un vendedor específico
   */
  async getProductsBySeller(sellerId: string, status?: ProductStatus): Promise<ProductListItem[]> {
    return (
      await this.getActiveProducts({
        sellerId,
        status: status || ['activo', 'pausado', 'vendido'],
        limit: 100,
      })
    ).products;
  },
};
