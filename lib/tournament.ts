import { KNOCKOUT_ORDER, isKnockoutStage } from "./football-api";
import { computeStandings, bestThirdPlace, type StandingRow } from "./standings";
import type { SerializedMatch } from "./queries";

export const GROUP_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;
export type GroupLetter = (typeof GROUP_LETTERS)[number];

export type RoundKey = (typeof KNOCKOUT_ORDER)[number];

export type GroupBundle = {
  letter: GroupLetter;
  stage: string; // "Group A"
  matches: SerializedMatch[];
  standings: StandingRow[];
};

/** Barcha o'yinlarni 12 ta guruh karta uchun guruhlaydi. */
export function groupByGroup(matches: SerializedMatch[]): GroupBundle[] {
  return GROUP_LETTERS.map((letter) => {
    const stage = `Group ${letter}`;
    const groupMatches = matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    return {
      letter,
      stage,
      matches: groupMatches,
      standings: computeStandings(groupMatches),
    };
  });
}

export function thirdPlaceTable(groups: GroupBundle[]): StandingRow[] {
  return bestThirdPlace(groups.map((g) => g.standings));
}

/** Knockout o'yinlarni round bo'yicha ajratadi (num yoki kickoff bo'yicha tartiblangan). */
export function groupByRound(
  matches: SerializedMatch[]
): Record<RoundKey, SerializedMatch[]> {
  const result = Object.fromEntries(
    KNOCKOUT_ORDER.map((k) => [k, [] as SerializedMatch[]])
  ) as Record<RoundKey, SerializedMatch[]>;

  for (const m of matches) {
    if (!isKnockoutStage(m.stage)) continue;
    result[m.stage as RoundKey].push(m);
  }

  for (const round of KNOCKOUT_ORDER) {
    result[round].sort((a, b) => {
      if (a.num != null && b.num != null) return a.num - b.num;
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    });
  }
  return result;
}

/**
 * Hozir jadval qaysi bosqichda? Avtomatik default view tanlash uchun.
 * - Knockout o'yini boshlangan/tugagan bo'lsa → "bracket"
 * - Hech qanday o'yin yo'q bo'lsa → "groups"
 * - Aks holda → "groups"
 */
export function autoDefaultView(matches: SerializedMatch[]): "groups" | "bracket" {
  const anyKnockoutTouched = matches.some(
    (m) =>
      isKnockoutStage(m.stage) &&
      (m.status === "LIVE" || m.status === "FINISHED")
  );
  return anyKnockoutTouched ? "bracket" : "groups";
}

/** Final natijasi (g'olib aniqlangan bo'lsa). */
export function getChampion(matches: SerializedMatch[]):
  | { team: string; flag: string | null }
  | null {
  const final = matches.find((m) => m.stage === "Final");
  if (!final || final.status !== "FINISHED") return null;
  if (final.homeScore == null || final.awayScore == null) return null;
  if (final.homeScore === final.awayScore) return null; // pen ma'lumoti yo'q
  return final.homeScore > final.awayScore
    ? { team: final.homeTeam, flag: final.homeFlag ?? null }
    : { team: final.awayTeam, flag: final.awayFlag ?? null };
}
