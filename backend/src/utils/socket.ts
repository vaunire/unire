import { Socket, Server as SocketServer } from "socket.io";
import { Server as httpServer } from "http"
import { verifyToken } from "@clerk/express";
import { connectDB } from "../config/database";

export const initializeSocket = (httpServer: httpServer) => { }