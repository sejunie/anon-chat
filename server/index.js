const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

// 랜덤 1:1 매칭 (메모리 MVP)
let waitingSocket = null;
const partner = new Map(); // socket.id -> 상대 socket.id

function pair(a, b) {
  partner.set(a.id, b.id);
  partner.set(b.id, a.id);
  a.emit("matched");
  b.emit("matched");
}

function unpair(socket) {
  const otherId = partner.get(socket.id);
  if (!otherId) return;

  partner.delete(socket.id);
  partner.delete(otherId);

  const other = io.sockets.sockets.get(otherId);
  if (other) other.emit("partner_left");
}

io.on("connection", (socket) => {
  socket.on("find", () => {
    if (partner.has(socket.id)) return;
    if (waitingSocket?.id === socket.id) return;

    if (waitingSocket && waitingSocket.connected) {
      const a = waitingSocket;
      waitingSocket = null;
      pair(a, socket);
    } else {
      waitingSocket = socket;
      socket.emit("waiting");
    }
  });

  socket.on("message", (text) => {
    const otherId = partner.get(socket.id);
    if (!otherId) return;
    const other = io.sockets.sockets.get(otherId);
    if (!other) return;
    other.emit("message", String(text).slice(0, 500));
  });

  socket.on("skip", () => {
    if (waitingSocket?.id === socket.id) waitingSocket = null;
    unpair(socket);
    socket.emit("skipped");
  });

  socket.on("disconnect", () => {
    if (waitingSocket?.id === socket.id) waitingSocket = null;
    unpair(socket);
  });
});

server.listen(3001, () => {
  console.log("✅ Socket server listening on http://localhost:3001");
});