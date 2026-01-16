import express from "express";
import upload from "../middleware/aiUpload.js";
import { analyzePrescription, getMedicalAdherenceCoach, chatWithAgent } from "../controllers/aiController.js";

const router = express.Router();

router.post(
  "/analyze",
  upload.single("prescription"),
  analyzePrescription
);

router.post("/medical-coach", getMedicalAdherenceCoach);

// Chat endpoint for AI agents (diagnostic and masc)
router.post("/chat", chatWithAgent);

export default router;

