import { favoriteService } from '../src/services/favoriteService';
import { supabase } from '../src/supabase';

// Estas pruebas importan el código REAL de src/services/favoriteService.ts.
// Lo único simulado es Supabase, así que corren sin internet. Casos BD-xx de la matriz.

jest.mock('../src/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const from = supabase.from as jest.Mock;

// Simula la consulta encadenada de list(): select -> eq -> order -> order -> range
function consultaLista(paginas: any[]) {
  const b: any = {};
  ['select', 'eq', 'order'].forEach((m) => (b[m] = jest.fn(() => b)));
  b.range = jest.fn();
  paginas.forEach((p) => b.range.mockResolvedValueOnce(p));
  from.mockReturnValue(b);
  return b;
}

// Simula delete().eq().eq()
function consultaBorrado(error: any = null) {
  const b: any = {};
  let n = 0;
  b.delete = jest.fn(() => b);
  b.eq = jest.fn(() => (++n < 2 ? b : Promise.resolve({ error })));
  from.mockReturnValue(b);
  return b;
}

function consultaAlta(error: any = null) {
  const b: any = { upsert: jest.fn().mockResolvedValue({ error }) };
  from.mockReturnValue(b);
  return b;
}

const fila = (id: string, images: any[] = [], extra: any = {}) => ({
  product_id: id,
  product: { id, title: 'Producto ' + id, images, ...extra },
});

async function capturarError(promesa: Promise<any>) {
  try {
    await promesa;
    return null;
  } catch (e) {
    return e;
  }
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('Agregar y quitar favoritos (BD-06, BD-07, BD-08)', () => {
  it('BD-06: agregar guarda el par usuario-producto en la tabla favorites', async () => {
    const b = consultaAlta();
    await favoriteService.add('u1', 'p1');
    expect(from).toHaveBeenCalledWith('favorites');
    expect(b.upsert).toHaveBeenCalledWith(
      { user_id: 'u1', product_id: 'p1' },
      { onConflict: 'user_id,product_id', ignoreDuplicates: true }
    );
  });

  it('BD-08: agregar el mismo favorito dos veces envía la misma petición que ignora duplicados', async () => {
    const b = consultaAlta();
    await favoriteService.add('u1', 'p1');
    await favoriteService.add('u1', 'p1');
    expect(b.upsert).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(b.upsert.mock.calls[0])).toBe(JSON.stringify(b.upsert.mock.calls[1]));
  });

  it('BD-07: quitar borra solo el favorito de ese usuario y ese producto', async () => {
    const b = consultaBorrado();
    await favoriteService.remove('u1', 'p1');
    expect(from).toHaveBeenCalledWith('favorites');
    expect(b.delete).toHaveBeenCalledTimes(1);
    expect(b.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(b.eq).toHaveBeenCalledWith('product_id', 'p1');
  });

  it('BD-17: si Supabase falla al agregar, el error se propaga', async () => {
    consultaAlta({ message: 'sin permiso' });
    const error: any = await capturarError(favoriteService.add('u1', 'p1'));
    expect(error.message).toBe('sin permiso');
  });

  it('BD-17: si Supabase falla al quitar, el error se propaga', async () => {
    consultaBorrado({ message: 'sin conexión' });
    const error: any = await capturarError(favoriteService.remove('u1', 'p1'));
    expect(error.message).toBe('sin conexión');
  });
});

describe('Listar favoritos (BD-09, BD-14 a BD-17)', () => {
  it('BD-09: pide solo los favoritos del usuario indicado', async () => {
    const b = consultaLista([{ data: [], error: null }]);
    await favoriteService.list('u1');
    expect(from).toHaveBeenCalledWith('favorites');
    expect(b.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('BD-09: ordena por fecha descendente y desempata por producto', async () => {
    const b = consultaLista([{ data: [], error: null }]);
    await favoriteService.list('u1');
    expect(b.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(b.order).toHaveBeenCalledWith('product_id', { ascending: true });
  });

  it('BD-14: sin favoritos devuelve una lista vacía', async () => {
    consultaLista([{ data: [], error: null }]);
    expect(await favoriteService.list('u1')).toEqual([]);
  });

  it('BD-14: si Supabase devuelve data nula también devuelve una lista vacía', async () => {
    consultaLista([{ data: null, error: null }]);
    expect(await favoriteService.list('u1')).toEqual([]);
  });

  it('BD-15: la portada es la imagen marcada como is_cover y las imágenes salen ordenadas', async () => {
    consultaLista([{
      data: [fila('p1', [
        { id: 'b', image_url: 'img-b', position: 2, is_cover: true },
        { id: 'a', image_url: 'img-a', position: 1, is_cover: false },
      ])],
      error: null,
    }]);
    const [f]: any[] = await favoriteService.list('u1');
    expect(f.product.cover_image).toBe('img-b');
    expect(f.product.images[0].image_url).toBe('img-a');
  });

  it('BD-15: sin portada marcada usa la primera imagen por posición', async () => {
    consultaLista([{
      data: [fila('p1', [
        { id: 'b', image_url: 'img-b', position: 2, is_cover: false },
        { id: 'a', image_url: 'img-a', position: 1, is_cover: false },
      ])],
      error: null,
    }]);
    const [f]: any[] = await favoriteService.list('u1');
    expect(f.product.cover_image).toBe('img-a');
  });

  it('BD-15: un producto sin imágenes tiene portada nula', async () => {
    consultaLista([{ data: [fila('p1', [])], error: null }]);
    const [f]: any[] = await favoriteService.list('u1');
    expect(f.product.cover_image).toBeNull();
  });

  it('BD-15: si el producto ya no existe, el favorito vuelve con product nulo', async () => {
    consultaLista([{ data: [{ product_id: 'p9', product: null }], error: null }]);
    expect(await favoriteService.list('u1')).toEqual([{ productId: 'p9', product: null }]);
  });

  it('BD-16: con más de 500 favoritos pide la segunda página y junta todo', async () => {
    const pagina1 = Array.from({ length: 500 }, (_, i) => fila('a' + i));
    const pagina2 = [fila('b1'), fila('b2'), fila('b3')];
    const b = consultaLista([{ data: pagina1, error: null }, { data: pagina2, error: null }]);
    const lista = await favoriteService.list('u1');
    expect(lista.length).toBe(503);
    expect(b.range).toHaveBeenCalledTimes(2);
    expect(b.range).toHaveBeenCalledWith(0, 499);
    expect(b.range).toHaveBeenCalledWith(500, 999);
  });

  it('BD-16: con exactamente 500 favoritos hace una consulta más, que viene vacía', async () => {
    const pagina1 = Array.from({ length: 500 }, (_, i) => fila('a' + i));
    const b = consultaLista([{ data: pagina1, error: null }, { data: [], error: null }]);
    const lista = await favoriteService.list('u1');
    expect(lista.length).toBe(500);
    expect(b.range).toHaveBeenCalledTimes(2);
  });

  it('BD-17: si Supabase devuelve un error al listar, el error se propaga', async () => {
    consultaLista([{ data: null, error: { message: 'timeout' } }]);
    const error: any = await capturarError(favoriteService.list('u1'));
    expect(error.message).toBe('timeout');
  });
});