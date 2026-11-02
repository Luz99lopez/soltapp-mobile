import {
  roundToOneDecimal,
  calculateRatingSummary,
  validateRatingInput,
  isRateLimited,
} from './ratingCalculations';

export function runRatingTests() {
  const results: { test: string; passed: boolean; error?: string }[] = [];

  const assert = (condition: boolean, testName: string, message?: string) => {
    if (condition) {
      results.push({ test: testName, passed: true });
    } else {
      results.push({
        test: testName,
        passed: false,
        error: message || 'Assertion failed',
      });
    }
  };

  // --- 1. Pruebas de redondeo a 1 decimal (roundToOneDecimal) ---
  assert(roundToOneDecimal(4.6666) === 4.7, 'roundToOneDecimal(4.6666) debe ser 4.7');
  assert(roundToOneDecimal(4.3333) === 4.3, 'roundToOneDecimal(4.3333) debe ser 4.3');
  assert(roundToOneDecimal(5.0) === 5.0, 'roundToOneDecimal(5.0) debe ser 5.0');
  assert(roundToOneDecimal(4.05) === 4.1 || roundToOneDecimal(4.05) === 4.0, 'roundToOneDecimal(4.05) redondea correctamente');
  assert(roundToOneDecimal(0) === 0, 'roundToOneDecimal(0) debe ser 0');
  assert(roundToOneDecimal(NaN) === 0, 'roundToOneDecimal(NaN) debe retornar 0');

  // --- 2. Pruebas de cálculo de resumen y distribución (calculateRatingSummary) ---
  const emptySummary = calculateRatingSummary('user-1', []);
  assert(emptySummary.total_ratings === 0, 'Total de valoraciones vacías debe ser 0');
  assert(emptySummary.average_rating === 0, 'Media de valoraciones vacías debe ser 0.0');
  assert(emptySummary.distribution[5].percent === 0, 'Porcentaje 5 estrellas vacío debe ser 0');

  const singleFive = calculateRatingSummary('user-1', [{ rating: 5 }]);
  assert(singleFive.total_ratings === 1, 'Total de valoraciones con 1 voto debe ser 1');
  assert(singleFive.average_rating === 5, 'Media con un voto de 5 debe ser 5.0');
  assert(singleFive.distribution[5].percent === 100, 'Distribución de 5 estrellas debe ser 100%');
  assert(singleFive.distribution[4].percent === 0, 'Distribución de 4 estrellas debe ser 0%');

  const mixedRatings = calculateRatingSummary('user-2', [
    { rating: 5 },
    { rating: 5 },
    { rating: 4 },
    { rating: 3 },
  ]);
  // Suma: 5 + 5 + 4 + 3 = 17 / 4 = 4.25 -> 4.3
  assert(mixedRatings.total_ratings === 4, 'Total de 4 votos debe ser 4');
  assert(mixedRatings.average_rating === 4.3, 'Media de [5,5,4,3] (4.25) debe redondearse a 4.3');
  assert(mixedRatings.distribution[5].count === 2, 'Conteo de 5 estrellas debe ser 2');
  assert(mixedRatings.distribution[5].percent === 50, 'Porcentaje de 5 estrellas debe ser 50%');
  assert(mixedRatings.distribution[4].percent === 25, 'Porcentaje de 4 estrellas debe ser 25%');
  assert(mixedRatings.distribution[3].percent === 25, 'Porcentaje de 3 estrellas debe ser 25%');

  // --- 3. Pruebas de validación de entrada (validateRatingInput) ---
  const valid = validateRatingInput(
    { target_user_id: 'user-b', rating: 5, comment: 'Excelente atención' },
    'user-a'
  );
  assert(valid.isValid === true, 'Entrada válida debe pasar');

  const selfRating = validateRatingInput(
    { target_user_id: 'user-a', rating: 5, comment: 'Soy el mejor' },
    'user-a'
  );
  assert(selfRating.isValid === false, 'Auto-valoración debe ser rechazada');
  assert(selfRating.error?.includes('ti mismo') === true, 'Mensaje de auto-valoración correcto');

  const zeroRating = validateRatingInput(
    { target_user_id: 'user-b', rating: 0 },
    'user-a'
  );
  assert(zeroRating.isValid === false, 'Calificación 0 debe ser rechazada');

  const sixRating = validateRatingInput(
    { target_user_id: 'user-b', rating: 6 },
    'user-a'
  );
  assert(sixRating.isValid === false, 'Calificación 6 debe ser rechazada');

  const floatRating = validateRatingInput(
    { target_user_id: 'user-b', rating: 4.5 },
    'user-a'
  );
  assert(floatRating.isValid === false, 'Calificación no entera (4.5) debe ser rechazada');

  // Límite de 500 caracteres
  const text500 = 'a'.repeat(500);
  const valid500 = validateRatingInput(
    { target_user_id: 'user-b', rating: 4, comment: text500 },
    'user-a'
  );
  assert(valid500.isValid === true, 'Comentario de exactamente 500 caracteres debe ser aceptado');

  const text501 = 'a'.repeat(501);
  const invalid501 = validateRatingInput(
    { target_user_id: 'user-b', rating: 4, comment: text501 },
    'user-a'
  );
  assert(invalid501.isValid === false, 'Comentario de 501 caracteres debe ser rechazado');
  assert(invalid501.error?.includes('500') === true, 'Mensaje de error debe mencionar límite de 500 caracteres');

  // Comentario nulo o vacío opcional
  const nullComment = validateRatingInput(
    { target_user_id: 'user-b', rating: 3, comment: null },
    'user-a'
  );
  assert(nullComment.isValid === true, 'Comentario nulo (opcional) debe ser aceptado');

  // --- 4. Pruebas de Rate Limiting (isRateLimited) ---
  const now = Date.now();
  const tenSecondsAgo = new Date(now - 10 * 1000).toISOString();
  const thirtyFiveSecondsAgo = new Date(now - 35 * 1000).toISOString();

  assert(isRateLimited(tenSecondsAgo, 30) === true, 'Acción hace 10s con cooldown de 30s debe estar bloqueada (rate limited)');
  assert(isRateLimited(thirtyFiveSecondsAgo, 30) === false, 'Acción hace 35s con cooldown de 30s debe estar permitida');
  assert(isRateLimited(null, 30) === false, 'Sin fecha previa no debe haber rate limit');

  return results;
}
