// Runner de pruebas unitarias para el sistema de valoraciones
const {
  roundToOneDecimal,
  calculateRatingSummary,
  validateRatingInput,
  isRateLimited,
} = require('./ratingCalculationsCompiled.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}: ${message || 'Assertion failed'}`);
  }
}

console.log('\n======================================================');
console.log('  EJECUTANDO PRUEBAS UNITARIAS: SISTEMA DE VALORACIÓN');
console.log('======================================================\n');

console.log('1. Cálculo y Redondeo a 1 Decimal:');
assert(roundToOneDecimal(4.6666) === 4.7, 'Redondeo 4.6666 -> 4.7');
assert(roundToOneDecimal(4.3333) === 4.3, 'Redondeo 4.3333 -> 4.3');
assert(roundToOneDecimal(5.0) === 5.0, 'Redondeo 5.0 -> 5.0');
assert(roundToOneDecimal(0) === 0, 'Redondeo 0 -> 0');
assert(roundToOneDecimal(NaN) === 0, 'Manejo de NaN -> 0');

console.log('\n2. Cálculo de Resumen y Distribución de Estrellas:');
const empty = calculateRatingSummary('user-1', []);
assert(empty.total_ratings === 0, 'Total inicial vacío es 0');
assert(empty.average_rating === 0, 'Media inicial vacía es 0.0');
assert(empty.distribution[5].percent === 0, 'Porcentaje 5 estrellas vacío es 0%');

const single = calculateRatingSummary('user-1', [{ rating: 5 }]);
assert(single.total_ratings === 1, 'Total con 1 voto es 1');
assert(single.average_rating === 5.0, 'Media con 1 voto de 5 es 5.0');
assert(single.distribution[5].percent === 100, 'Distribución de 5 estrellas es 100%');

const mixed = calculateRatingSummary('user-2', [
  { rating: 5 },
  { rating: 5 },
  { rating: 4 },
  { rating: 3 },
]);
assert(mixed.total_ratings === 4, 'Total de 4 votos es 4');
assert(mixed.average_rating === 4.3, 'Media (4.25) se redondea con un decimal a 4.3');
assert(mixed.distribution[5].count === 2, 'Conteo de 5 estrellas es 2');
assert(mixed.distribution[5].percent === 50, 'Porcentaje de 5 estrellas es 50%');
assert(mixed.distribution[4].percent === 25, 'Porcentaje de 4 estrellas es 25%');
assert(mixed.distribution[3].percent === 25, 'Porcentaje de 3 estrellas es 25%');
assert(mixed.distribution[1].count === 0, 'Conteo de 1 estrella es 0');

console.log('\n3. Validaciones de Entrada y Reglas de Negocio:');
const valid = validateRatingInput(
  { target_user_id: 'user-b', rating: 5, comment: 'Excelente atención' },
  'user-a'
);
assert(valid.isValid === true, 'Entrada válida es aceptada');

const self = validateRatingInput(
  { target_user_id: 'user-a', rating: 5, comment: 'Soy el mejor' },
  'user-a'
);
assert(self.isValid === false, 'Auto-valoración es rechazada');

const outOfRangeLow = validateRatingInput({ target_user_id: 'user-b', rating: 0 }, 'user-a');
assert(outOfRangeLow.isValid === false, 'Calificación 0 (menor a 1) es rechazada');

const outOfRangeHigh = validateRatingInput({ target_user_id: 'user-b', rating: 6 }, 'user-a');
assert(outOfRangeHigh.isValid === false, 'Calificación 6 (mayor a 5) es rechazada');

const decimalRating = validateRatingInput({ target_user_id: 'user-b', rating: 3.5 }, 'user-a');
assert(decimalRating.isValid === false, 'Calificación no entera (3.5) es rechazada');

const char500 = 'x'.repeat(500);
const valid500 = validateRatingInput({ target_user_id: 'user-b', rating: 4, comment: char500 }, 'user-a');
assert(valid500.isValid === true, 'Comentario de exactamente 500 caracteres es aceptado');

const char501 = 'x'.repeat(501);
const invalid501 = validateRatingInput({ target_user_id: 'user-b', rating: 4, comment: char501 }, 'user-a');
assert(invalid501.isValid === false, 'Comentario de 501 caracteres es rechazado');

const nullComment = validateRatingInput({ target_user_id: 'user-b', rating: 4, comment: null }, 'user-a');
assert(nullComment.isValid === true, 'Comentario null/opcional es aceptado');

console.log('\n4. Rate Limiting (Ventana de 30 segundos):');
const now = Date.now();
const tenSecAgo = new Date(now - 10 * 1000).toISOString();
const thirtyFiveSecAgo = new Date(now - 35 * 1000).toISOString();

assert(isRateLimited(tenSecAgo, 30) === true, 'Voto modificado hace 10s está bloqueado por rate limit');
assert(isRateLimited(thirtyFiveSecAgo, 30) === false, 'Voto modificado hace 35s está permitido');
assert(isRateLimited(null, 30) === false, 'Primer voto (sin fecha previa) no tiene rate limit');

console.log('\n------------------------------------------------------');
console.log(`TOTAL: ${totalTests} | PASADAS: ${passedTests} | FALLIDAS: ${failedTests}`);
console.log('------------------------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ TODAS LAS PRUEBAS UNITARIAS PASARON EXITOSAMENTE.\n');
  process.exit(0);
}
