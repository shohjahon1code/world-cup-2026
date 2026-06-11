import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const PredictionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    predHome: { type: Number, required: true, min: 0 },
    predAway: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export type PredictionDoc = InferSchemaType<typeof PredictionSchema> & {
  _id: Types.ObjectId;
};

export const Prediction: Model<PredictionDoc> =
  (models.Prediction as Model<PredictionDoc>) ||
  model<PredictionDoc>("Prediction", PredictionSchema);
