import {
  PURCHASE_MESSAGES,
  formatSubtotal,
  parsePrecioMostrado,
  primerError,
  purchaseSchema,
} from '../src/utils/validation';

const compraValida = {
  buyerId: 'user-comprador-1',
  productId: 'prod-1',
  sellerId: 'user-vendedor-1',
  price: '$25.000',
  paymentMethod: 'efectivo',
};

describe('Subtotal del carrito (formatSubtotal, código real de CartScreen)', () => {
  it('COM-01: respeta un precio que ya empieza con "$"', () => {
    expect(formatSubtotal('$25.000')).toBe('$25.000');
  });

  it('COM-01: agrega el "$" si falta', () => {
    expect(formatSubtotal('25000')).toBe('$25000');
  });

  it('COM-02: el total es igual al subtotal (hoy hay un solo producto, sin envío)', () => {
    expect(formatSubtotal('$150.000')).toBe('$150.000');
  });

  it('HALLAZGO COM-03: no valida el precio, "abc" también recibe el "$"', () => {
    expect(formatSubtotal('abc')).toBe('$abc');
  });
});

describe('Precio como se muestra en la app (parsePrecioMostrado)', () => {
  it.each([
    ['$25.000', 25000],
    ['25000', 25000],
    ['$1.500,50', 1500.5],
    ['$150.000', 150000],
    ['99,5', 99.5],
  ])('COM-04: entiende "%s"', (texto, esperado) => {
    expect(parsePrecioMostrado(texto)).toBe(esperado);
  });

  it.each(['', 'abc', '-5', '$-5', '1.5', '$'])('COM-04: no entiende "%s"', (texto) => {
    expect(Number.isNaN(parsePrecioMostrado(texto))).toBe(true);
  });
});

describe('Compra: reglas mínimas propuestas (COM-05 a COM-12)', () => {
  it('COM-05: acepta una compra con todos los datos', () => {
    expect(purchaseSchema.safeParse(compraValida).success).toBe(true);
  });

  it('COM-06: rechaza si el comprador no tiene sesión', () => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, buyerId: '' });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.sinSesion);
  });

  it('COM-07: rechaza si falta el producto', () => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, productId: '' });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.sinProducto);
  });

  it('COM-08: rechaza si falta el vendedor', () => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, sellerId: '' });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.sinVendedor);
  });

  it.each(['', 'abc', '$0', '0', '-5'])('COM-09: rechaza el precio "%s"', (precio) => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, price: precio });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.precioInvalido);
  });

  it('COM-09: acepta el precio mínimo "$0,01" (límite)', () => {
    expect(purchaseSchema.safeParse({ ...compraValida, price: '$0,01' }).success).toBe(true);
  });

  it('COM-10: acepta el método qr_soltapp', () => {
    expect(purchaseSchema.safeParse({ ...compraValida, paymentMethod: 'qr_soltapp' }).success).toBe(true);
  });

  it('COM-10: rechaza un método de pago desconocido', () => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, paymentMethod: 'bitcoin' });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.pagoInvalido);
  });

  it('COM-11: rechaza que el vendedor compre su propio producto', () => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, buyerId: 'u1', sellerId: 'u1' });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.autocompra);
  });

  it('COM-12: sin sesión y sin producto, avisa primero de la sesión', () => {
    const resultado = purchaseSchema.safeParse({ ...compraValida, buyerId: '', productId: '' });
    expect(primerError(resultado)).toBe(PURCHASE_MESSAGES.sinSesion);
  });
});