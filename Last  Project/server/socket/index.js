import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function setupSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    socket.on("join_group", (groupId) => {
      const room = `group_${groupId}`;
      socket.join(room);
      console.log(`${socket.user.username} joined room ${room}`);

      socket.to(room).emit("user_joined", {
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on("leave_group", (groupId) => {
      const room = `group_${groupId}`;
      socket.leave(room);
      console.log(`${socket.user.username} left room ${room}`);

      socket.to(room).emit("user_left", {
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
    });

    socket.on("error", (err) => {
      console.error(`Socket error for ${socket.user.username}:`, err);
    });
  });
}
