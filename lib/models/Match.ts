import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const MATCH_STATUSES = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

const MatchSchema = new Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeFlag: { type: String, default: null },
    awayFlag: { type: String, default: null },
    kickoff: { type: Date, required: true, index: true },
    stage: { type: String, required: true }, // "Group A", "Round of 32", ...
    group: { type: String, default: null },
    status: { type: String, enum: MATCH_STATUSES, default: "SCHEDULED", index: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
  },
  { timestamps: true }
);

export type MatchDoc = InferSchemaType<typeof MatchSchema> & { _id: string };

export const Match: Model<MatchDoc> =
  (models.Match as Model<MatchDoc>) || model<MatchDoc>("Match", MatchSchema);
