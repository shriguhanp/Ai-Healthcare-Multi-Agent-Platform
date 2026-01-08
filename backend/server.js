import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import aiRouter from "./routes/aiRoute.js"; // 🔥 AI Route
import { chatWithAgent } from "./controllers/aiController.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

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
app.use("/api/ai", aiRouter); // /chat is under this

// 🔥 AI endpoint to connect Groq-powered agents
app.post("/api/ai/chat", chatWithAgent);

// test route
app.get("/", (req, res) => {
  res.send("API Working");
});

// server listener with port check
app
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
