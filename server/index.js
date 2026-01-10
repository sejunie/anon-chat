const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

/**
 * ✅ Express CORS (xhr polling 필수)
 */
app.use(
  cors({
    origin: true, // 모든 origin 허용 (vercel 포함)
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.get("/", (req, res) => {
  res.send("OK");
});

const server = http.createServer(app);

/**
 * ✅ Socket.IO CORS
 */
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

// ====== 이하 네 채팅 로직 그대로 ======
let waiting = null;

io.on("connection", (socket) => {
  socket.on("find", ({ nickname }) => {
    socket.nickname = nickname || "익명";

    if (waiting) {
      socket.partner = waiting;
      waiting.partner = socket;

      socket.emit("matched");
      waiting.emit("matched");

      waiting = null;
    } else {
      waiting = socket;
      socket.emit("waiting");
    }
  });

  socket.on("message", (text) => {
    if (socket.partner) {
      socket.partner.emit("message", {
        nickname: socket.nickname,
        text,
      });
    }
  });

  socket.on("disconnect", () => {
    if (waiting === socket) waiting = null;

    if (socket.partner) {
      socket.partner.emit("partner_left");
      socket.partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("✅ Socket server listening on port", PORT);
});