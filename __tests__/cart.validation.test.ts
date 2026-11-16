import { cartValidationSchema } from '../src/utils/validation';

describe('Validaciones de la Compra y Carrito (CartScreen)', () => {
  it('debería validar correctamente una compra con datos válidos', () => {
    const validCart = {
      productId: 'prod-123',
      sellerId: 'seller-456',
      title: 'Zelda Breath of the Wild',
      price: '$25.000',
      paymentMethod: 'efectivo',
    };

    const result = cartValidationSchema.safeParse(validCart);
    expect(result.success).toBe(true);
  });

  it('debería fallar si falta el productId o sellerId', () => {
    const invalidCart = {
      productId: '',
      sellerId: '',
      title: 'Zelda Breath of the Wild',
      price: '$25.000',
      paymentMethod: 'efectivo',
    };

    const result = cartValidationSchema.safeParse(invalidCart);
    expect(result.success).toBe(false);
  });

  it('debería rechazar precios negativos en la compra', () => {
    const invalidPriceCart = {
      productId: 'prod-123',
      sellerId: 'seller-456',
      title: 'Zelda Breath of the Wild',
      price: '-$1.000',
      paymentMethod: 'efectivo',
    };

    const result = cartValidationSchema.safeParse(invalidPriceCart);
    expect(result.success).toBe(false);
  });
});