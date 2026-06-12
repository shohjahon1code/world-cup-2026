import { Types } from "mongoose";
import { connectDB } from "./db";
import { User } from "./models/User";
import { Match } from "./models/Match";
import { Prediction } from "./models/Prediction";

export type LeaderRow = {
  id: string;
  name: string;
  points: number;
  exactCount: number;
  totalPredictions: number;
  isAdmin: boolean;
};

export async function getLeaderboard(): Promise<LeaderRow[]> {
  await connectDB();
  const users = await User.find().lean();
  const stats = await Prediction.aggregate([
    {
      $group: {
        _id: "$userId",
        points: { $sum: "$points" },
        exactCount: {
          $sum: { $cond: [{ $eq: ["$isExact", true] }, 1, 0] },
        },
        totalPredictions: { $sum: 1 },
      },
    },
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  const rows: LeaderRow[] = users.map((u) => {
    const s = map.get(String(u._id));
    return {
      id: String(u._id),
      name: u.name,
      points: s?.points ?? 0,
      exactCount: s?.exactCount ?? 0,
      totalPredictions: s?.totalPredictions ?? 0,
      isAdmin: u.isAdmin,
    };
  });
  rows.sort((a, b) => b.points - a.points || b.exactCount - a.exactCount || a.name.localeCompare(b.name));
  return rows;
}

function dayRange(date: Date) {
  // Asia/Tashkent = UTC+5
  const tashkent = new Date(date.getTime() + 5 * 3600_000);
  tashkent.setUTCHours(0, 0, 0, 0);
  const start = new Date(tashkent.getTime() - 5 * 3600_000);
  const end = new Date(start.getTime() + 24 * 3600_000);
  return { start, end };
}

export async function getMatchesForDay(date: Date) {
  await connectDB();
  const { start, end } = dayRange(date);
  const matches = await Match.find({ kickoff: { $gte: start, $lt: end } })
    .sort({ kickoff: 1 })
    .lean();
  return matches.map(serializeMatch);
}

export async function getNextMatch() {
  await connectDB();
  const now = new Date();
  // Avval LIVE'ni qidiramiz
  const live = await Match.findOne({ status: "LIVE" }).sort({ kickoff: 1 }).lean();
  if (live) return serializeMatch(live);
  // Keyin keyingi SCHEDULED
  const next = await Match.findOne({
    status: { $in: ["SCHEDULED", "POSTPONED"] },
    kickoff: { $gte: new Date(now.getTime() - 30 * 60_000) }, // 30 min lag
  })
    .sort({ kickoff: 1 })
    .lean();
  if (next) return serializeMatch(next);
  // Yo'q bo'lsa — eng oxirgi tugagan
  const last = await Match.findOne({ status: "FINISHED" }).sort({ kickoff: -1 }).lean();
  return last ? serializeMatch(last) : null;
}

export async function getStats() {
  await connectDB();
  const [totalMatches, totalPredictions] = await Promise.all([
    Match.countDocuments(),
    Prediction.countDocuments(),
  ]);
  return { totalMatches, totalPredictions };
}

export async function getAllMatches() {
  await connectDB();
  const matches = await Match.find().sort({ kickoff: 1 }).lean();
  return matches.map(serializeMatch);
}

export async function getMatch(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const match = await Match.findById(id).lean();
  return match ? serializeMatch(match) : null;
}

export async function getMatchPredictions(matchId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(matchId)) return [];
  const preds = await Prediction.find({ matchId }).populate("userId").lean();
  return preds.map((p) => ({
    id: String(p._id),
    user: {
      id: String((p.userId as any)._id),
      name: (p.userId as any).name as string,
      isAdmin: (p.userId as any).isAdmin as boolean,
    },
    predHome: p.predHome,
    predAway: p.predAway,
    points: p.points,
    isExact: !!p.isExact,
  }));
}

export async function getUser(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) return null;
  const u = await User.findById(id).lean();
  if (!u) return null;
  return { id: String(u._id), name: u.name, isAdmin: u.isAdmin };
}

export async function getUserPredictions(userId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(userId)) return [];
  const preds = await Prediction.find({ userId }).populate("matchId").lean();
  return preds
    .filter((p) => p.matchId)
    .map((p) => ({
      id: String(p._id),
      predHome: p.predHome,
      predAway: p.predAway,
      points: p.points,
      isExact: !!p.isExact,
      match: serializeMatch(p.matchId as any),
    }))
    .sort((a, b) => new Date(b.match.kickoff).getTime() - new Date(a.match.kickoff).getTime());
}

export async function getAllUsers() {
  await connectDB();
  const users = await User.find().sort({ name: 1 }).lean();
  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    isAdmin: u.isAdmin,
  }));
}

function serializeMatch(m: any) {
  return {
    id: String(m._id),
    externalId: m.externalId,
    num: m.num ?? null,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeFlag: m.homeFlag ?? null,
    awayFlag: m.awayFlag ?? null,
    kickoff: new Date(m.kickoff).toISOString(),
    stage: m.stage,
    group: m.group ?? null,
    status: m.status,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
  };
}

export type SerializedMatch = ReturnType<typeof serializeMatch>;
