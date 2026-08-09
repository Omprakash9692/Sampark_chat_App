import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import { initSocket, userSockets, userActiveChats } from "./sockets/socket.js";

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Running"
    });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

await connectDB();

const server = http.createServer(app);

const io = initSocket(server);
app.set("io", io);
app.set("userSockets", userSockets);
app.set("userActiveChats", userActiveChats);

server.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});

