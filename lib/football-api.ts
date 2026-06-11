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
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  stage: string;
  group: string | null;
};

type OpenfootballMatch = {
  round?: string;
  date: string; // "2026-06-11"
  time?: string; // "13:00 UTC-6"
  team1: string | { name: string };
  team2: string | { name: string };
  group?: string;
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
  return round;
}

/** Full WC2026 schedule (80 matches) — openfootball'dan. */
export async function fetchSchedule(): Promise<ScheduleMatch[]> {
  const res = await fetch(OPENFOOTBALL_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`openfootball fetch failed: ${res.status}`);
  const data = (await res.json()) as { matches: OpenfootballMatch[] };
  return data.matches.map((m, idx) => {
    const home = teamName(m.team1);
    const away = teamName(m.team2);
    return {
      externalId: `of-${m.date}-${home}-${away}-${idx}`.replace(/\s+/g, "_"),
      homeTeam: home,
      awayTeam: away,
      kickoff: parseKickoff(m.date, m.time),
      stage: stageFromRound(m.round, m.group),
      group: m.group ?? null,
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

/** TheSportsDB'dan WC2026 hozirgi mavsumi event ro'yxati (live skorlar bilan). */
export async function fetchLiveResults(): Promise<LiveResult[]> {
  const url = `${SPORTSDB_BASE}/eventsseason.php?id=${WC_LEAGUE_ID}&s=2026`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`sportsdb fetch failed: ${res.status}`);
  const data = (await res.json()) as { events: SportsDBEvent[] | null };
  if (!data.events) return [];
  return data.events.map((e) => ({
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    dateEvent: e.dateEvent,
    homeScore: e.intHomeScore == null ? null : Number(e.intHomeScore),
    awayScore: e.intAwayScore == null ? null : Number(e.intAwayScore),
    status: mapStatus(e.strStatus ?? null, e.strPostponed ?? null),
  }));
}

/** TheSportsDB jamoa nomlari ba'zan boshqacha — moslashtirish. */
const TEAM_ALIASES: Record<string, string> = {
  "USA": "United States",
  "United States of America": "United States",
  "South Korea": "Korea Republic",
  // moslama -> openfootball'dagi nom
};

export function normalizeTeam(name: string): string {
  return TEAM_ALIASES[name] ?? name;
}
