function roundToOneDecimal(value) {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function calculateRatingSummary(targetUserId, ratingsList) {
  const total = ratingsList.length;

  const counts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sum = 0;

  for (const item of ratingsList) {
    const star = Math.round(item.rating);
    if (star >= 1 && star <= 5) {
      counts[star] = (counts[star] || 0) + 1;
      sum += star;
    }
  }

  const rawAverage = total > 0 ? sum / total : 0;
  const average_rating = roundToOneDecimal(rawAverage);

  const getPercent = (count) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return {
    target_user_id: targetUserId,
    total_ratings: total,
    average_rating,
    distribution: {
      5: { count: counts[5], percent: getPercent(counts[5]) },
      4: { count: counts[4], percent: getPercent(counts[4]) },
      3: { count: counts[3], percent: getPercent(counts[3]) },
      2: { count: counts[2], percent: getPercent(counts[2]) },
      1: { count: counts[1], percent: getPercent(counts[1]) },
    },
  };
}

function validateRatingInput(input, currentUserId) {
  if (!input.target_user_id || input.target_user_id.trim() === '') {
    return { isValid: false, error: 'Se debe especificar el usuario a valorar.' };
  }

  if (currentUserId && currentUserId === input.target_user_id) {
    return { isValid: false, error: 'No puedes valorarte a ti mismo.' };
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { isValid: false, error: 'La valoración debe ser un número entero entre 1 y 5 estrellas.' };
  }

  if (input.comment !== undefined && input.comment !== null) {
    const trimmed = input.comment.trim();
    if (trimmed.length > 500) {
      return {
        isValid: false,
        error: `El comentario no puede superar los 500 caracteres (actual: ${trimmed.length}).`,
      };
    }
  }

  return { isValid: true };
}

function isRateLimited(lastUpdatedAt, cooldownSeconds = 30) {
  if (!lastUpdatedAt) return false;

  const lastDate = typeof lastUpdatedAt === 'string' ? new Date(lastUpdatedAt) : lastUpdatedAt;
  const elapsedMs = Date.now() - lastDate.getTime();
  const cooldownMs = cooldownSeconds * 1000;

  return elapsedMs < cooldownMs;
}

module.exports = {
  roundToOneDecimal,
  calculateRatingSummary,
  validateRatingInput,
  isRateLimited,
};
