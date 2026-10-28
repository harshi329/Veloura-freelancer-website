import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/veloura';

export async function connectDB(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || process.env.MONGODB_URI || DEFAULT_URI;
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
