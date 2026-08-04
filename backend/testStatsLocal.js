import mongoose from 'mongoose';
import { getAdminStats } from './src/controllers/admin.controller.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const req = {};
    const res = {
      status: (code) => ({
        json: (data) => console.log(JSON.stringify(data, null, 2))
      })
    };
    await getAdminStats(req, res, (err) => console.error("Next called with error:", err));
  } catch (err) {
    console.error("Crash:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
