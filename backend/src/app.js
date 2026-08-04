import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json());

app.use(cookieParser());

// Serve static uploads folder
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);

app.get("/",(req,res)=>{
    res.json({
        success: true,
        message: "API Running"
    })
})

app.use(errorHandler);

export default app;