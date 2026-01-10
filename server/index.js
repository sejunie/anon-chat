const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/**
 * ✅ Render Health Check용
 */
app.get("/", (req, res) => res.send("OK"));

/**
 * ✅ Vercel 도메인(변동)까지 안전하게 허용 + 로컬 허용
 * - credentials:true 쓰는 순간 origin:* 는 절대 불가
 */
const allowed = (origin) => {
  if (!origin) return true; // curl/서버-서버 등 origin 없는 경우
  if (origin === "http://localhost:3000") return true;
  if (origin === "http://127.0.0.1:3000") return true;
  if (origin.endsWith(".vercel.app")) return true; // ✅ 모든 vercel preview/production 허용
  return false;
};

const io = new Server(server, {
  path: "/socket.io", // 명시(혹시 모를 꼬임 방지)
  cors: {
    origin: (origin, cb) => {
      if (allowed(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["polling", "websocket"],
  allowEIO3: true, // 구버전 호환(가끔 환경에 따라 필요)
});

let waiting = null;

io.on("connection", (socket) => {
  console.log("✅ client connected:", socket.id);

  socket.on("find", ({ nickname }) => {
    socket.nickname = (nickname || "익명").slice(0, 10);

    if (waiting && waiting.id !== socket.id) {
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
    if (!socket.partner) return;
    socket.partner.emit("message", {
      nickname: socket.nickname,
      text,
    });
  });

  socket.on("skip", () => {
    if (waiting && waiting.id === socket.id) waiting = null;

    if (socket.partner) {
      socket.partner.emit("partner_left");
      socket.partner.partner = null;
      socket.partner = null;
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ client disconnected:", socket.id);

    if (waiting && waiting.id === socket.id) waiting = null;

    if (socket.partner) {
      socket.partner.emit("partner_left");
      socket.partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("✅ Socket server listening on", PORT);
});
