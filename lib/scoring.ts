// WC2026 scoring qoidalari (qoidalar bir-birini bekor qilmaydi — qo'shiladi):
//   A) G'olibni yoki durangni to'g'ri topganga      → +1 ochko
//   B) Hisobni aniq topganga                        → +(home + away) ochko qo'shimcha
//   Maxsus: Aniq 0:0 → 2 ochko (kam uchraydi, bonus)
//
//   Natija:
//     - Aniq 0:0       → 2
//     - Aniq (0:0 emas) → home + away + 1   (B + A)
//     - Faqat g'olib/durang to'g'ri → 1     (faqat A)
//     - Boshqa          → 0

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
    return actual.home + actual.away + 1;
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
    const pts =
      actual.home === 0 && actual.away === 0 ? 2 : actual.home + actual.away + 1;
    return { points: pts, isExact: true, isOutcome: true };
  }
  const sameOutcome = outcome(pred) === outcome(actual);
  return { points: sameOutcome ? 1 : 0, isExact: false, isOutcome: sameOutcome };
}
