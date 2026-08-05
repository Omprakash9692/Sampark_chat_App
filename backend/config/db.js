import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sampark";
        await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected`);
    } catch (err) {
        console.error("MongoDB Connection Failed", err.message);
    }
}

export default connectDB;