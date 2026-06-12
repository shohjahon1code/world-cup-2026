// WC2026 scoring qoidalari:
//   1) Aniq score topdi (0:0 emas)  → home + away gollari yig'indisi
//   2) Aniq score topdi va 0:0     → 2 ochko (maxsus holat)
//   3) Aniq topmadi, lekin g'olibni
//      yoki durangni to'g'ri topdi  → 1 ochko
//   4) Boshqa                       → 0 ochko

export type ScoreLike = { home: number; away: number };

function outcome(s: ScoreLike): -1 | 0 | 1 {
  if (s.home > s.away) return 1;
  if (s.home < s.away) return -1;
  return 0;
}

export function isExactMatch(pred: ScoreLike, actual: ScoreLike): boolean {
  return pred.home === actual.home && pred.away === actual.away;
}

export function computePoints(pred: ScoreLike, actual: ScoreLike): number {
  if (isExactMatch(pred, actual)) {
    if (actual.home === 0 && actual.away === 0) return 2;
    return actual.home + actual.away;
  }
  return outcome(pred) === outcome(actual) ? 1 : 0;
}

/** Insonga tushunarli izoh (UI'da ko'rsatish uchun). */
export function pointsReason(pred: ScoreLike, actual: ScoreLike): {
  points: number;
  isExact: boolean;
  isOutcome: boolean;
} {
  const exact = isExactMatch(pred, actual);
  if (exact) {
    const pts = actual.home === 0 && actual.away === 0 ? 2 : actual.home + actual.away;
    return { points: pts, isExact: true, isOutcome: true };
  }
  const sameOutcome = outcome(pred) === outcome(actual);
  return { points: sameOutcome ? 1 : 0, isExact: false, isOutcome: sameOutcome };
}
