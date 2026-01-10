"use client";

import { useEffect, useRef } from "react";

function TradingViewMiniChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "12M",
      colorTheme: "light",
      isTransparent: false,
      autosize: true,
    });

    el.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [symbol]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

export default function MarketCharts() {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 360,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          height: 160,
          border: "1px solid #ddd",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <TradingViewMiniChart symbol="SP:SPX" />
      </div>

      <div
        style={{
          height: 160,
          border: "1px solid #ddd",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <TradingViewMiniChart symbol="NASDAQ:NDX" />
      </div>

      <div
        style={{
          height: 160,
          border: "1px solid #ddd",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <TradingViewMiniChart symbol="COINBASE:BTCUSD" />
      </div>
    </div>
  );
}
