import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log("Database Connected"))


    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            family: 4 // Use IPv4, skip trying IPv6
        })
    } catch (error) {
        console.error("❌ Database connection error:", error.message)
        console.error("Full Error:", error)
        process.exit(1)
    }

}

export default connectDB;

// Do not use '@' symbol in your databse user's password else it will show an error.