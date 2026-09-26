import { productService } from './productService';
import { ProductListItem } from '../types/database.types';

/**
 * Consulta los productos activos para el feed principal
 */
export async function fetchHomeProducts(): Promise<ProductListItem[]> {
  return productService.fetchHomeProducts();
}

export * from './productService';
