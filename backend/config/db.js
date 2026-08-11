import mongoose from "mongoose";

const connectDB = async () => {
    try {  
        await mongoose.connect("mongodb+srv://omprakashkhatuasonu_db_user:EmkXa5svPeTYOD1n@cluster0.vurpbuo.mongodb.net/final");
        console.log(`MongoDB Connected`);
    } catch (err) {
        console.error("MongoDB Connection Failed", err.message);
    }
}

export default connectDB;