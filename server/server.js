import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";


// Create Expres app and HTTP Server...
const app = express();
const server = http.createServer(app);

//Initialize soket.io server
export const io = new Server(server, {
    cors: {origin:"*"}
})

//Store Online Users
export const userSocketMap = {};    // {userId: sockedId}

//Socket.io Connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected" , userId);

    if(userId) userSocketMap[userId] = socket.id;

    // Emit Online Users To All Connected Clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=> {
        console.log("User Disconnected" , userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})


// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

//Route Setup
app.use("/api/status", (req,res)=> res.send("Server is live..."));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)



// Connect to MongoDB 
await connectDB(); 



const PORT = process.env.port || 5000
server.listen(PORT, ()=> console.log("Server is running on PORT: "+ PORT));
