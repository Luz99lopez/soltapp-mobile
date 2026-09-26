export type ProductCondition = 'nuevo' | 'como_nuevo' | 'bueno' | 'regular';
export type ProductStatus = 'activo' | 'pausado' | 'vendido' | 'eliminado';
export type CategoryLevel = 0 | 1 | 2; // 0 = raíz, 1 = subcategoría, 2 = rubro

/**
 * Tabla: public.users
 */
export interface UserProfile {
  id: string; // UUID (PK vinculada a auth.users.id)
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Tabla: public.categories
 */
export interface Category {
  id: number; // BIGINT PK
  parent_id: number | null; // FK autoreferenciada
  name: string;
  slug: string;
  level: number; // 0=raíz, 1=subcategoría, 2=rubro
  is_active: boolean;
  created_at: string;
  children?: Category[]; // Auxiliar para árboles anidados
}

/**
 * Tabla: public.product_images
 */
export interface ProductImage {
  id: string; // UUID PK
  product_id: string; // UUID FK
  image_url: string;
  position: number;
  is_cover: boolean;
  created_at: string;
}

/**
 * Tabla: public.products
 */
export interface Product {
  id: string; // UUID PK
  seller_id: string; // UUID FK a users.id
  category_id: number; // BIGINT FK a categories.id
  title: string;
  description: string | null;
  price: number;
  currency: string; // Default 'ARS'
  condition: ProductCondition;
  status: ProductStatus;
  location: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Modelos Enriquecidos (Joins)
 */

// Producto para listas, feed y catálogos
export interface ProductListItem extends Product {
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'level'> | null;
  images?: Pick<ProductImage, 'id' | 'image_url' | 'position' | 'is_cover'>[];
  cover_image?: string | null;
  seller?: Pick<UserProfile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null;
}

// Producto con detalle completo
export interface ProductDetail extends Product {
  category: Category | null;
  images: ProductImage[];
  seller: UserProfile | null;
}

/**
 * DTOs para Creación y Actualización
 */

export interface ProductImageInput {
  image_url: string;
  position?: number;
  is_cover?: boolean;
}

export interface CreateProductInput {
  category_id: number;
  title: string;
  description?: string | null;
  price: number;
  currency?: string;
  condition: ProductCondition;
  location?: string | null;
  images?: (string | ProductImageInput)[]; // URLs simples o con metadata
}

export interface UpdateProductInput {
  category_id?: number;
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  location?: string | null;
  images?: (string | ProductImageInput)[];
}

export interface ProductFilters {
  categoryId?: number;
  sellerId?: string;
  status?: ProductStatus | ProductStatus[];
  condition?: ProductCondition;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'price';
  ascending?: boolean;
}
