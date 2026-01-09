"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Status = "idle" | "waiting" | "matched";

export default function Home() {
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => setLog((l) => [...l, "✅ 서버 연결됨"]));

    socket.on("waiting", () => {
      setStatus("waiting");
      setLog((l) => [...l, "⏳ 상대를 찾는 중..."]);
    });

    socket.on("matched", () => {
      setStatus("matched");
      setLog((l) => [...l, "🎉 매칭 완료!"]);
    });

    socket.on("message", (text: string) => {
      setLog((l) => [...l, `상대: ${text}`]);
    });

    socket.on("partner_left", () => {
      setStatus("idle");
      setLog((l) => [...l, "👋 상대가 나갔어"]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const find = () => socketRef.current?.emit("find");

  const skip = () => {
    socketRef.current?.emit("skip");
    setStatus("idle");
    setLog((l) => [...l, "⏭️ 스킵!"]);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("message", text);
    setLog((l) => [...l, `나: ${text}`]);
    setInput("");
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>익명 랜덤 채팅 MVP</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={find} disabled={status !== "idle"}>
          매칭 시작
        </button>
        <button onClick={skip} disabled={status === "idle"}>
          스킵/나가기
        </button>
        <span style={{ marginLeft: 8 }}>
          상태: <b>{status}</b>
        </span>
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          height: 360,
          overflowY: "auto",
          background: "#fafafa",
          whiteSpace: "pre-wrap",
        }}
      >
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={status === "matched" ? "메시지 입력" : "매칭 후 입력 가능"}
          disabled={status !== "matched"}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={send} disabled={status !== "matched"}>
          보내기
        </button>
      </div>
    </main>
  );
}

const socket = io("https://anon-chat-3pmu.onrender.com");