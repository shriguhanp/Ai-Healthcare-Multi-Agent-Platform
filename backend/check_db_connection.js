import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
    console.log("Checking MONGODB_URI...");
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is undefined in .env");
        return;
    }
    console.log("MONGODB_URI is defined (starts with " + process.env.MONGODB_URI.substring(0, 10) + "...)");

    try {
        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`, {
            serverSelectionTimeoutMS: 5000,
            family: 4
        })
        console.log("✅ Database Connected Successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Database connection error:", error.message);
        console.error("Full Error:", error);
        process.exit(1);
    }
}

connectDB();
