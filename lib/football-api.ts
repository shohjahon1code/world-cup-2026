// Free football APIs:
//   1) openfootball/worldcup.json  - to'liq jadval (80 ta o'yin), no auth
//   2) TheSportsDB                  - live natijalar, no auth (key="3" free demo)

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const SPORTSDB_KEY = process.env.SPORTSDB_KEY ?? "3"; // free demo key
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;
const WC_LEAGUE_ID = "4429";

export type ScheduleMatch = {
  externalId: string; // openfootball stable hash
  num: number | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  stage: string;
  group: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
};

type OpenfootballMatch = {
  round?: string;
  num?: number;
  date: string; // "2026-06-11"
  time?: string; // "13:00 UTC-6"
  team1: string | { name: string };
  team2: string | { name: string };
  group?: string;
  score?: { ft?: [number, number]; ht?: [number, number] } | null;
};

function teamName(t: OpenfootballMatch["team1"]): string {
  return typeof t === "string" ? t : t.name;
}

function parseKickoff(date: string, time?: string): Date {
  // openfootball format: "HH:MM UTC[+-]N" yoki "HH:MM"
  const fallback = new Date(`${date}T12:00:00Z`);
  if (!time) return fallback;
  const m = time.match(/^(\d{1,2}):(\d{2})\s*(?:UTC([+-]?\d+))?/);
  if (!m) {
    const direct = new Date(`${date}T${time}`);
    return isNaN(direct.getTime()) ? fallback : direct;
  }
  const [, hh, mm, tz] = m;
  const offset = tz ? parseInt(tz, 10) : 0;
  // Lokal vaqt -> UTC: utcMinutes = localMinutes - offset*60
  const base = new Date(`${date}T00:00:00Z`).getTime();
  const localMinutes = parseInt(hh, 10) * 60 + parseInt(mm, 10);
  const utcMinutes = localMinutes - offset * 60;
  const d = new Date(base + utcMinutes * 60_000);
  return isNaN(d.getTime()) ? fallback : d;
}

function stageFromRound(round?: string, group?: string): string {
  if (group) {
    // openfootball "Group A" yoki shunchaki "A" — har ikkalasini ham to'g'rilash
    return /^group\b/i.test(group) ? group : `Group ${group}`;
  }
  if (!round) return "Group stage";
  if (/Matchday/i.test(round)) return "Group stage";
  // Knockout: "Round of 32", "Round of 16", "Quarter-final", "Semi-final",
  // "Match for third place", "Final"
  return round;
}

/** Knockout bo'lib turg'un round nomlarini bracket'da pozitsiya tartibi bilan qaytaradi. */
export const KNOCKOUT_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
] as const;

export function isKnockoutStage(stage: string): boolean {
  return (KNOCKOUT_ORDER as readonly string[]).includes(stage);
}

/** Full WC2026 schedule (80 matches) — openfootball'dan. */
export async function fetchSchedule(): Promise<ScheduleMatch[]> {
  const res = await fetch(OPENFOOTBALL_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`openfootball fetch failed: ${res.status}`);
  const data = (await res.json()) as { matches: OpenfootballMatch[] };
  return data.matches.map((m, idx) => {
    const home = teamName(m.team1);
    const away = teamName(m.team2);
    // num openfootball'ning turg'un identifikatori (1..104). Knockout
    // jamoa nomlari placeholder'dan real nomga o'tganda ham id o'zgarmaydi.
    // Group stage uchun num bo'lmaydi — date+jamoa nomlari turg'un kalit beradi
    // (har bir juftlik bir kunda bir marta o'ynaydi).
    const slug = (s: string) => s.replace(/\s+/g, "_");
    const externalId =
      m.num != null ? `of-${m.num}` : `of-g-${m.date}-${slug(home)}-${slug(away)}`;
    void idx;
    const ft = m.score?.ft;
    const hasFt = Array.isArray(ft) && ft.length === 2;
    return {
      externalId,
      num: m.num ?? null,
      homeTeam: home,
      awayTeam: away,
      kickoff: parseKickoff(m.date, m.time),
      stage: stageFromRound(m.round, m.group),
      group: m.group ?? null,
      homeScore: hasFt ? ft[0] : null,
      awayScore: hasFt ? ft[1] : null,
      finished: hasFt,
    };
  });
}

export type LiveResult = {
  homeTeam: string;
  awayTeam: string;
  dateEvent: string; // "2026-06-11"
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";
};

type SportsDBEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  strPostponed?: string | null;
};

function mapStatus(s: string | null, postponed?: string | null): LiveResult["status"] {
  if (postponed && postponed !== "no") return "POSTPONED";
  if (!s || s === "NS" || s === "Not Started") return "SCHEDULED";
  if (/Match Finished|FT|AET|PEN/i.test(s)) return "FINISHED";
  if (/1H|2H|HT|Live|ET/i.test(s)) return "LIVE";
  return "SCHEDULED";
}

/** TheSportsDB'dan WC2026 event ro'yxati (live skorlar bilan).
 *
 * Bepul kalit (`SPORTSDB_KEY=3`)'da `eventsseason.php` faqat bir nechta yakuniy
 * o'yinni qaytaradi va LIVE/yangi tugagan o'yinlarni o'tkazib yuboradi. Shu uchun
 * biz uchta endpointni ham birga so'raymiz va idEvent bo'yicha dedup qilamiz:
 *   1) eventsseason  — to'liq mavsum (sekin yangilanadi)
 *   2) eventspastleague — yaqin o'tmish + hozir LIVE
 *   3) eventsnextleague — yaqin kelajak
 */
export async function fetchLiveResults(): Promise<LiveResult[]> {
  const endpoints = [
    `${SPORTSDB_BASE}/eventsseason.php?id=${WC_LEAGUE_ID}&s=2026`,
    `${SPORTSDB_BASE}/eventspastleague.php?id=${WC_LEAGUE_ID}`,
    `${SPORTSDB_BASE}/eventsnextleague.php?id=${WC_LEAGUE_ID}`,
  ];
  const results = await Promise.allSettled(
    endpoints.map((u) => fetch(u, { next: { revalidate: 60 } }))
  );
  // idEvent bo'yicha dedup — keyingi (yangiroq) endpointlardan kelgan yozuv
  // oldingisini almashtirib qo'yadi (past/next API'larida yangiroq status bo'ladi).
  const byId = new Map<string, SportsDBEvent>();
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value.ok) continue;
    let data: { events: SportsDBEvent[] | null };
    try {
      data = (await r.value.json()) as { events: SportsDBEvent[] | null };
    } catch {
      continue;
    }
    for (const e of data.events ?? []) {
      byId.set(e.idEvent, e);
    }
  }
  return Array.from(byId.values()).map((e) => ({
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    dateEvent: e.dateEvent,
    homeScore: e.intHomeScore == null ? null : Number(e.intHomeScore),
    awayScore: e.intAwayScore == null ? null : Number(e.intAwayScore),
    status: mapStatus(e.strStatus ?? null, e.strPostponed ?? null),
  }));
}

/** TheSportsDB jamoa nomi -> openfootball'dagi nom (DB'da shu saqlanadi). */
const TEAM_ALIASES: Record<string, string> = {
  "Bosnia-Herzegovina": "Bosnia & Herzegovina",
  // Backward-compat: TheSportsDB kelajakda FIFA-style nomlarga o'tsa ham ishlasin.
  "Korea Republic": "South Korea",
  "United States": "USA",
  "United States of America": "USA",
};

export function normalizeTeam(name: string): string {
  return TEAM_ALIASES[name] ?? name;
}
