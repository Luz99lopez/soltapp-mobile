import {
  calculateRatingSummary,
  isRateLimited,
  roundToOneDecimal,
  validateRatingInput,
} from '../src/utils/ratingCalculations';

// Estas pruebas importan el código REAL de src/utils/ratingCalculations.ts
// (no una copia). Casos RAT-xx de la matriz.

const entrada = (cambios: any = {}): any => ({
  target_user_id: 'vendedor-1',
  rating: 5,
  comment: 'Excelente vendedor',
  ...cambios,
});

// Fija la hora de "ahora" mientras corre una prueba, para que sea siempre igual.
function conHora(ahora: number, prueba: () => void) {
  const original = Date.now;
  Date.now = () => ahora;
  try {
    prueba();
  } finally {
    Date.now = original;
  }
}

describe('Redondeo a 1 decimal (RAT-01)', () => {
  it.each([
    [4.6666, 4.7],
    [4.3333, 4.3],
    [4.25, 4.3],
    [5, 5],
    [0, 0],
  ])('RAT-01: %s se redondea a %s', (valor, esperado) => {
    expect(roundToOneDecimal(valor)).toBe(esperado);
  });

  it('RAT-01: NaN devuelve 0', () => {
    expect(roundToOneDecimal(NaN)).toBe(0);
  });

  it('RAT-01: Infinity devuelve 0', () => {
    expect(roundToOneDecimal(Infinity)).toBe(0);
  });
});

describe('Resumen y distribución de estrellas (RAT-08)', () => {
  it('RAT-08: sin votos, todo vale 0', () => {
    const r = calculateRatingSummary('u1', []);
    expect(r.total_ratings).toBe(0);
    expect(r.average_rating).toBe(0);
    expect(r.distribution[5].percent).toBe(0);
  });

  it('RAT-08: un solo voto de 5 estrellas', () => {
    const r = calculateRatingSummary('u1', [{ rating: 5 }]);
    expect(r.total_ratings).toBe(1);
    expect(r.average_rating).toBe(5);
    expect(r.distribution[5].percent).toBe(100);
  });

  it('RAT-08: cuatro votos [5, 5, 4, 3] dan media 4.3 (4.25 redondeado)', () => {
    const r = calculateRatingSummary('u1', [{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 3 }]);
    expect(r.total_ratings).toBe(4);
    expect(r.average_rating).toBe(4.3);
  });

  it('RAT-08: porcentajes de [5, 5, 4, 3] son 50 / 25 / 25', () => {
    const r = calculateRatingSummary('u1', [{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 3 }]);
    expect(r.distribution[5].count).toBe(2);
    expect(r.distribution[5].percent).toBe(50);
    expect(r.distribution[4].percent).toBe(25);
    expect(r.distribution[3].percent).toBe(25);
    expect(r.distribution[1].count).toBe(0);
  });

  it('devuelve el id del usuario valorado', () => {
    expect(calculateRatingSummary('abc', []).target_user_id).toBe('abc');
  });

  it('HALLAZGO RAT-09: un voto fuera de rango cuenta en el total pero no en la media', () => {
    // [5, 9]: la media debería ser 5, pero el 9 se ignora en la suma y cuenta en el total: 5 / 2 = 2.5
    const r = calculateRatingSummary('u1', [{ rating: 5 }, { rating: 9 }]);
    expect(r.total_ratings).toBe(2);
    expect(r.average_rating).toBe(2.5);
  });

  it('HALLAZGO RAT-10: con votos [5, 4, 3] los porcentajes suman 99 y no 100', () => {
    const r = calculateRatingSummary('u1', [{ rating: 5 }, { rating: 4 }, { rating: 3 }]);
    const suma = r.distribution[5].percent + r.distribution[4].percent + r.distribution[3].percent;
    expect(suma).toBe(99);
  });

  it('un voto con decimales (4.6) se cuenta como 5 estrellas', () => {
    const r = calculateRatingSummary('u1', [{ rating: 4.6 }]);
    expect(r.distribution[5].count).toBe(1);
  });
});

describe('Validación de una valoración (RAT-02, RAT-03, RAT-04)', () => {
  it('acepta una valoración correcta', () => {
    expect(validateRatingInput(entrada(), 'comprador-1').isValid).toBe(true);
  });

  it('RAT-02: rechaza la auto-valoración', () => {
    const r = validateRatingInput(entrada({ target_user_id: 'u1' }), 'u1');
    expect(r.isValid).toBe(false);
    expect(r.error).toBe('No puedes valorarte a ti mismo.');
  });

  it('RAT-02: sin usuario actual no se puede detectar la auto-valoración', () => {
    expect(validateRatingInput(entrada({ target_user_id: 'u1' }), null).isValid).toBe(true);
  });

  it.each([0, 6, 3.5, -1, NaN])('RAT-03: rechaza la calificación %s', (estrellas) => {
    const r = validateRatingInput(entrada({ rating: estrellas }), 'comprador-1');
    expect(r.isValid).toBe(false);
    expect(r.error).toBe('La valoración debe ser un número entero entre 1 y 5 estrellas.');
  });

  it.each([1, 2, 3, 4, 5])('RAT-03: acepta la calificación %s', (estrellas) => {
    expect(validateRatingInput(entrada({ rating: estrellas }), 'comprador-1').isValid).toBe(true);
  });

  it('RAT-04: acepta un comentario de exactamente 500 caracteres (límite)', () => {
    expect(validateRatingInput(entrada({ comment: 'a'.repeat(500) }), 'comprador-1').isValid).toBe(true);
  });

  it('RAT-04: rechaza un comentario de 501 caracteres', () => {
    const r = validateRatingInput(entrada({ comment: 'a'.repeat(501) }), 'comprador-1');
    expect(r.isValid).toBe(false);
    expect(r.error).toBe('El comentario no puede superar los 500 caracteres (actual: 501).');
  });

  it('RAT-04: el comentario es opcional (null y undefined)', () => {
    expect(validateRatingInput(entrada({ comment: null }), 'comprador-1').isValid).toBe(true);
    expect(validateRatingInput(entrada({ comment: undefined }), 'comprador-1').isValid).toBe(true);
  });

  it('RAT-11: rechaza si falta el usuario a valorar', () => {
    const r = validateRatingInput(entrada({ target_user_id: '  ' }), 'comprador-1');
    expect(r.error).toBe('Se debe especificar el usuario a valorar.');
  });

  it('HALLAZGO RAT-12: los espacios no cuentan: 500 letras con espacios alrededor se aceptan', () => {
    // La base de datos cuenta char_length sin recortar: si el servicio envía el texto sin recortar, podría rechazarlo.
    const comentario = '   ' + 'a'.repeat(500) + '   ';
    expect(validateRatingInput(entrada({ comment: comentario }), 'comprador-1').isValid).toBe(true);
  });
});

describe('Límite de tiempo entre modificaciones (RAT-05 y RAT-06)', () => {
  const AHORA = 1_800_000_000_000;

  it('RAT-05: una modificación hecha hace 10 segundos está bloqueada', () => {
    conHora(AHORA, () => {
      expect(isRateLimited(new Date(AHORA - 10_000))).toBe(true);
    });
  });

  it('RAT-06: una modificación hecha hace 35 segundos está permitida', () => {
    conHora(AHORA, () => {
      expect(isRateLimited(new Date(AHORA - 35_000))).toBe(false);
    });
  });

  it('RAT-05: a los 29 segundos sigue bloqueada', () => {
    conHora(AHORA, () => {
      expect(isRateLimited(new Date(AHORA - 29_000))).toBe(true);
    });
  });

  it('RAT-06: a los 30 segundos exactos ya se permite (límite)', () => {
    conHora(AHORA, () => {
      expect(isRateLimited(new Date(AHORA - 30_000))).toBe(false);
    });
  });

  it('el primer voto (sin fecha previa) no tiene límite', () => {
    expect(isRateLimited(null)).toBe(false);
    expect(isRateLimited(undefined)).toBe(false);
  });

  it('RAT-13: acepta la fecha como texto ISO', () => {
    conHora(AHORA, () => {
      expect(isRateLimited(new Date(AHORA - 5_000).toISOString())).toBe(true);
    });
  });

  it('RAT-13: respeta un tiempo de espera distinto de 30 segundos', () => {
    conHora(AHORA, () => {
      expect(isRateLimited(new Date(AHORA - 40_000), 60)).toBe(true);
    });
  });
});