import { ProductCondition, ProductStatus } from '../types/database.types';

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  nuevo: 'Nuevo', como_nuevo: 'Como nuevo', bueno: 'Bueno', regular: 'Regular',
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  activo: 'Activo', pausado: 'Pausado', vendido: 'Vendido', eliminado: 'Eliminado',
};

export function formatProductPrice(price: number, currency = 'ARS'): string {
  const amount = Number(price).toLocaleString('es-AR', { maximumFractionDigits: 2 });
  return currency.toUpperCase() === 'USD' ? `USD ${amount}` : `$ ${amount}`;
}

// El formulario usa el formato argentino: 1.234,56.
export function parseProductPrice(value: string): number {
  const normalized = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(normalized)) return NaN;
  return Number(normalized.replace(/\./g, '').replace(',', '.'));
}
