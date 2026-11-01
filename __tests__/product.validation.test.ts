import {
  PRODUCT_LIMITS,
  PRODUCT_MESSAGES,
  parsePrecio,
  primerError,
  productSchema,
} from '../src/utils/validation';

const productoValido = {
  title: 'Bicicleta rodado 29',
  quickInfo: '',
  description: 'Poco uso, con casco incluido',
  categoryId: 10,
  price: '150000',
  currency: 'ARS',
  condition: 'como_nuevo',
  photos: ['file:///foto1.jpg'],
};

describe('Precio: cómo lo interpreta la app (parsePrecio)', () => {
  it('PUB-07: un número entero', () => {
    expect(parsePrecio('150000')).toBe(150000);
  });

  it('PUB-07: un decimal con punto', () => {
    expect(parsePrecio('99.5')).toBe(99.5);
  });

  it('PUB-05: texto sin números no es un precio', () => {
    expect(Number.isNaN(parsePrecio('abc'))).toBe(true);
  });

  it('PUB-05: campo vacío no es un precio', () => {
    expect(Number.isNaN(parsePrecio(''))).toBe(true);
  });

  it('ignora símbolos como el "$" y los espacios', () => {
    expect(parsePrecio('$ 500')).toBe(500);
  });

  it('HALLAZGO PUB-09: "1.500" (mil quinientos en Argentina) se lee como 1,5', () => {
    expect(parsePrecio('1.500')).toBe(1.5);
  });

  it('HALLAZGO PUB-09: "1500,50" pierde la coma y vale 150050', () => {
    expect(parsePrecio('1500,50')).toBe(150050);
  });

  it('HALLAZGO PUB-10: "-5" pierde el signo y vale 5', () => {
    expect(parsePrecio('-5')).toBe(5);
  });
});

describe('Alta de producto (PUB-01 a PUB-14)', () => {
  it('PUB-01: acepta un producto con todos los datos válidos', () => {
    expect(productSchema.safeParse(productoValido).success).toBe(true);
  });

  it('PUB-02: rechaza título vacío sin información rápida', () => {
    const resultado = productSchema.safeParse({ ...productoValido, title: '' });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.tituloVacio);
  });

  it('PUB-02: un título de solo espacios cuenta como vacío', () => {
    const resultado = productSchema.safeParse({ ...productoValido, title: '    ' });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.tituloVacio);
  });

  it('PUB-03: sin título pero con información rápida, es válido', () => {
    const resultado = productSchema.safeParse({ ...productoValido, title: '', quickInfo: 'Bici playera' });
    expect(resultado.success).toBe(true);
  });

  it('PUB-04: rechaza si no hay categoría seleccionada', () => {
    const resultado = productSchema.safeParse({ ...productoValido, categoryId: null });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.categoriaVacia);
  });

  it.each(['', 'abc', '$', '   '])('PUB-05: rechaza el precio "%s"', (precio) => {
    const resultado = productSchema.safeParse({ ...productoValido, price: precio });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.precioInvalido);
  });

  it.each(['0', '0.0', '000'])('PUB-06: rechaza el precio cero "%s"', (precio) => {
    const resultado = productSchema.safeParse({ ...productoValido, price: precio });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.precioInvalido);
  });

  it('PUB-07: acepta el precio mínimo 0.01 (límite)', () => {
    const resultado = productSchema.safeParse({ ...productoValido, price: '0.01' });
    expect(resultado.success).toBe(true);
  });

  it('HALLAZGO PUB-10: un precio "-5" se acepta (la app le quita el signo)', () => {
    const resultado = productSchema.safeParse({ ...productoValido, price: '-5' });
    expect(resultado.success).toBe(true);
  });

  it('PUB-11: sin título y sin categoría, avisa primero del título', () => {
    const resultado = productSchema.safeParse({ ...productoValido, title: '', categoryId: null });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.tituloVacio);
  });

  it('PUB-11: sin categoría y sin precio, avisa primero de la categoría', () => {
    const resultado = productSchema.safeParse({ ...productoValido, categoryId: null, price: '' });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.categoriaVacia);
  });

  it('PUB-12: acepta un título de exactamente 60 caracteres (límite)', () => {
    const resultado = productSchema.safeParse({ ...productoValido, title: 'a'.repeat(PRODUCT_LIMITS.titleMax) });
    expect(resultado.success).toBe(true);
  });

  it('PUB-12: rechaza un título de 61 caracteres', () => {
    const resultado = productSchema.safeParse({ ...productoValido, title: 'a'.repeat(61) });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.tituloLargo);
  });

  it('PUB-12: acepta una descripción de exactamente 500 caracteres (límite)', () => {
    const resultado = productSchema.safeParse({ ...productoValido, description: 'a'.repeat(500) });
    expect(resultado.success).toBe(true);
  });

  it('PUB-12: rechaza una descripción de 501 caracteres', () => {
    const resultado = productSchema.safeParse({ ...productoValido, description: 'a'.repeat(501) });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.descripcionLarga);
  });

  it('PUB-13: acepta la moneda USD', () => {
    expect(productSchema.safeParse({ ...productoValido, currency: 'USD' }).success).toBe(true);
  });

  it('PUB-13: rechaza una moneda desconocida', () => {
    const resultado = productSchema.safeParse({ ...productoValido, currency: 'EUR' });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.monedaInvalida);
  });

  it.each(['nuevo', 'como_nuevo', 'bueno', 'regular'])('PUB-13: acepta el estado "%s"', (estado) => {
    expect(productSchema.safeParse({ ...productoValido, condition: estado }).success).toBe(true);
  });

  it('PUB-13: rechaza un estado desconocido', () => {
    const resultado = productSchema.safeParse({ ...productoValido, condition: 'roto' });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.condicionInvalida);
  });

  it('PUB-14: acepta exactamente 10 fotos (límite)', () => {
    const fotos = Array.from({ length: 10 }, (_, i) => `file:///f${i}.jpg`);
    expect(productSchema.safeParse({ ...productoValido, photos: fotos }).success).toBe(true);
  });

  it('PUB-14: rechaza 11 fotos', () => {
    const fotos = Array.from({ length: 11 }, (_, i) => `file:///f${i}.jpg`);
    const resultado = productSchema.safeParse({ ...productoValido, photos: fotos });
    expect(primerError(resultado)).toBe(PRODUCT_MESSAGES.demasiadasFotos);
  });

  it('HALLAZGO PUB-15: sin fotos se puede publicar (la app usa una imagen por defecto)', () => {
    expect(productSchema.safeParse({ ...productoValido, photos: [] }).success).toBe(true);
  });

  it('HALLAZGO PUB-16: la descripción vacía se acepta aunque el campo dice "Descripción*"', () => {
    expect(productSchema.safeParse({ ...productoValido, description: '' }).success).toBe(true);
  });
});