import { supabase } from '../supabase';
import { Category } from '../types/database.types';

/**
 * Servicio para gestión y consulta del árbol jerárquico de categorías
 */
export const categoryService = {
  /**
   * Obtiene todas las categorías raíz (level = 0) activas
   */
  async getRootCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('level', 0)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[categoryService.getRootCategories] Error:', error.message);
      throw new Error(`Error al obtener categorías raíz: ${error.message}`);
    }

    return (data as Category[]) || [];
  },

  /**
   * Obtiene las subcategorías hijas directas a partir de un parent_id
   */
  async getSubcategories(parentId: number): Promise<Category[]> {
    if (parentId === undefined || parentId === null) {
      return [];
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error(`[categoryService.getSubcategories] Error parentId ${parentId}:`, error.message);
      throw new Error(`Error al obtener subcategorías: ${error.message}`);
    }

    return (data as Category[]) || [];
  },

  /**
   * Obtiene una categoría por su ID
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`[categoryService.getCategoryById] Error ID ${id}:`, error.message);
      throw new Error(`Error al obtener la categoría: ${error.message}`);
    }

    return (data as Category) || null;
  },

  /**
   * Obtiene una categoría por su slug amigable
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`[categoryService.getCategoryBySlug] Error slug ${slug}:`, error.message);
      throw new Error(`Error al obtener la categoría: ${error.message}`);
    }

    return (data as Category) || null;
  },

  /**
   * Obtiene el árbol completo de categorías multinivel (raíces con sus hijos)
   */
  async getCategoryTree(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[categoryService.getCategoryTree] Error:', error.message);
      throw new Error(`Error al obtener el árbol de categorías: ${error.message}`);
    }

    const allCategories = (data as Category[]) || [];
    const rootCategories: Category[] = [];
    const categoryMap = new Map<number, Category>();

    // Inicializar categorías en el mapa
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Construir estructura arbórea
    allCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id)!.children?.push(node);
      } else if (cat.level === 0) {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  },
};
