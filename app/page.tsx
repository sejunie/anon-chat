"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import MarketCharts from "./MarketCharts";

type Status = "idle" | "waiting" | "matched";

export default function Home() {
  const socketRef = useRef<Socket | null>(null);

  const logBoxRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [nickname, setNickname] = useState("");

 // ✅ 소켓 연결 (한 번만)
useEffect(() => {
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "https://anon-chat-3pmu.onrender.com"; // ← Render 서버 주소

  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    setLog((l) => [...l, "✅ 서버 연결됨"]);
  });

  ssocket.on("connect_error", (err: any) => {
  setLog((l) => [...l, `❌ 연결 실패: ${err?.message ?? "unknown error"}`]);
});

  socket.on("waiting", () => {
    setStatus("waiting");
    setLog((l) => [...l, "⏳ 상대를 찾는 중..."]);
  });

  socket.on("matched", () => {
    setStatus("matched");
    setLog((l) => [...l, "🎉 매칭 완료!"]);
  });

  socket.on("message", (data) => {
    setLog((l) => [...l, `${data.nickname}: ${data.text}`]);
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

  // ✅ 스크롤 튐 방지: 사용자가 아래 근처일 때만 자동 스크롤
  useLayoutEffect(() => {
    const el = logBoxRef.current;
    if (!el) return;

    if (shouldStickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [log]);

  const find = () => {
  socketRef.current?.emit("find", {
    nickname: nickname.trim(),
  });
};

  const skip = () => {
    socketRef.current?.emit("skip");
    setStatus("idle");
    setLog((l) => [...l, "⏭️ 스킵!"]);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("message", text);
    setLog((l) => [...l, `${nickname.trim() || "나"}: ${text}`]);
    setInput("");
  };

  return (
    <>
      <MarketCharts />

      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>익명 랜덤 채팅 MVP</h1>

<div style={{ marginTop: 16 }}>
  <input
    value={nickname}
    onChange={(e) => setNickname(e.target.value)}
    placeholder="닉네임 입력 (최대 10자)"
    maxLength={10}
    disabled={status !== "idle"}
    style={{ padding: 8, width: "100%" }}
  />
</div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
<button
  onClick={find}
  disabled={status !== "idle" || !nickname.trim()}
>
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
          ref={logBoxRef}
          onScroll={() => {
            const el = logBoxRef.current;
            if (!el) return;
            const nearBottom =
              el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            shouldStickToBottomRef.current = nearBottom;
          }}
          style={{
            marginTop: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            height: 360,
            overflowY: "auto",
            overscrollBehavior: "contain",
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
            placeholder={
              status === "matched" ? "메시지 입력" : "매칭 후 입력 가능"
            }
            disabled={status !== "matched"}
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={send} disabled={status !== "matched"}>
            보내기
          </button>
        </div>
      </main>
    </>
  );
}