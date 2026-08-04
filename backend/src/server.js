import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket, userSockets, userActiveChats } from "./sockets/socket.js";

const PORT = 5000;

connectDB();

const server = http.createServer(app);


const io = initSocket(server);
app.set("io", io);
app.set("userSockets", userSockets);
app.set("userActiveChats", userActiveChats);

server.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});
