const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

// ✅ 개발/배포 허용 Origin
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://anon-chat-tawny.vercel.app", // ✅ 지금 쓰는 Vercel 주소
];


const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // socket.io는 origin이 없는 경우도 있음(서버-서버/로컬 테스트)
      if (!origin) return callback(null, true);

      const allowList = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://anon-chat-tawny.vercel.app",
        "https://anon-chat-19e390389-sejunies-projects.vercel.app",
      ];

      // ✅ 모든 vercel.app 서브도메인 허용 (배포할 때 도메인 바뀌어도 OK)
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      if (allowList.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let waitingSocket = null;
const partner = new Map(); // socket.id -> partnerId
const nicknames = new Map(); // socket.id -> nickname

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("find", ({ nickname } = {}) => {
    nicknames.set(socket.id, (nickname || "익명").toString().slice(0, 10));

    if (waitingSocket && waitingSocket.id !== socket.id) {
      const other = waitingSocket;
      waitingSocket = null;

      partner.set(socket.id, other.id);
      partner.set(other.id, socket.id);

      socket.emit("matched");
      other.emit("matched");
    } else {
      waitingSocket = socket;
      socket.emit("waiting");
    }
  });

  socket.on("skip", () => {
    const otherId = partner.get(socket.id);
    if (otherId) {
      const otherSocket = io.sockets.sockets.get(otherId);
      otherSocket?.emit("partner_left");
      partner.delete(otherId);
      partner.delete(socket.id);
    }

    if (waitingSocket?.id === socket.id) {
      waitingSocket = null;
    }

    socket.emit("partner_left");
  });

  socket.on("message", (text) => {
    const otherId = partner.get(socket.id);
    if (!otherId) return;

    const myName = nicknames.get(socket.id) || "익명";
    const otherSocket = io.sockets.sockets.get(otherId);

    // ✅ 반드시 객체로 보냄 (프론트에서 nickname/text로 표시)
    otherSocket?.emit("message", {
      nickname: myName,
      text,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnected:", socket.id, reason);

    const otherId = partner.get(socket.id);
    if (otherId) {
      const otherSocket = io.sockets.sockets.get(otherId);
      otherSocket?.emit("partner_left");
      partner.delete(otherId);
      partner.delete(socket.id);
    }

    if (waitingSocket?.id === socket.id) {
      waitingSocket = null;
    }

    nicknames.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Socket server listening on port ${PORT}`);
});
