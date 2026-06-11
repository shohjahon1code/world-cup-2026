import mongoose from "mongoose";

// Next.js hot-reload paytida bir nechta connection ochilmasligi uchun cache.
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as unknown as { mongooseCache?: Cache };
const cache: Cache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
if (!globalForMongoose.mongooseCache) globalForMongoose.mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error(".env'da DATABASE_URL belgilanmagan");
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
