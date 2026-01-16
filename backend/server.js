import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import aiRouter from "./routes/aiRoute.js";
import hospitalRouter from "./routes/hospitalRoute.js";
import prescriptionRouter from "./routes/prescriptionRoute.js";
import chatRouter from "./routes/chatRoute.js";

import { chatWithAgent } from "./controllers/aiController.js";
import { initializeSocket } from "./socketServer.js";
import { scheduleDailyTokenReset } from "./scheduledTasks.js";
import fs from 'fs';

// Ensure required directories exist
if (!fs.existsSync('uploads/chat')) {
  fs.mkdirSync('uploads/chat', { recursive: true });
}
if (!fs.existsSync('uploads/prescriptions')) {
  fs.mkdirSync('uploads/prescriptions', { recursive: true });
}

// app config
const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// database & cloudinary
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api routes
app.use("/api/user", userRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ai", aiRouter);
app.use("/api/hospital", hospitalRouter);
app.use("/api/prescription", prescriptionRouter);
app.use("/api/chat", chatRouter);

// 🔥 AI endpoint
app.post("/api/ai/chat", chatWithAgent);

// test route
app.get("/", (req, res) => {
  res.send("API Working");
});

// Initialize Socket.io
initializeSocket(httpServer);

// Schedule daily token reset
scheduleDailyTokenReset();

// server listener with port check
httpServer
  .listen(port, () => console.log(`Server running on http://localhost:${port}`))
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${port} is already in use!`);
      console.error(`Please either:`);
      console.error(`  1. Stop the process using port ${port}`);
      console.error(`  2. Or set a different PORT in your .env file\n`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
