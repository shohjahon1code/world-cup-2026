// Guruh bosqichi reytingini hisoblash.
// FIFA tartibi: ochko → gol farqi → urilgan gol → alifbo (head-to-head'siz, sodda).

export type MatchForStanding = {
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string | null;
  awayFlag?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  group?: string | null;
};

export type StandingRow = {
  team: string;
  flag: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  group: string;
};

function ensureRow(map: Map<string, StandingRow>, team: string, flag: string | null, group: string) {
  let r = map.get(team);
  if (!r) {
    r = {
      team,
      flag,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      group,
    };
    map.set(team, r);
  }
  return r;
}

/** Bitta guruh uchun reyting. Faqat FINISHED o'yinlar hisoblanadi. */
export function computeStandings(matches: MatchForStanding[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  if (matches.length === 0) return [];
  const group = matches[0].group ?? "";

  // Avval barcha jamoalarni boshlang'ich nolda chiqaramiz
  // (hatto bironta o'yin o'ynalmagan bo'lsa ham).
  for (const m of matches) {
    ensureRow(rows, m.homeTeam, m.homeFlag ?? null, group);
    ensureRow(rows, m.awayTeam, m.awayFlag ?? null, group);
  }

  for (const m of matches) {
    if (m.status !== "FINISHED" || m.homeScore == null || m.awayScore == null) continue;
    const h = ensureRow(rows, m.homeTeam, m.homeFlag ?? null, group);
    const a = ensureRow(rows, m.awayTeam, m.awayFlag ?? null, group);
    h.played++;
    a.played++;
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.won++;
      a.lost++;
      h.points += 3;
    } else if (m.homeScore < m.awayScore) {
      a.won++;
      h.lost++;
      a.points += 3;
    } else {
      h.drawn++;
      a.drawn++;
      h.points++;
      a.points++;
    }
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;
  }

  return [...rows.values()].sort(compareRows);
}

function compareRows(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.team.localeCompare(b.team);
}

/**
 * 12 guruhdan 8 ta eng yaxshi 3-o'rinli pley-offga o'tadi.
 * Bu jadval — kim o'tishini ko'rsatish uchun.
 */
export function bestThirdPlace(allStandings: StandingRow[][]): StandingRow[] {
  const thirds = allStandings
    .map((g) => g[2])
    .filter((r): r is StandingRow => !!r);
  return thirds.sort(compareRows).slice(0, 8);
}
