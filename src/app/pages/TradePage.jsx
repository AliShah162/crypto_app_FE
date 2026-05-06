"use client";
import { useState, useEffect, useRef } from "react";
import { T, COINS, PE, f2, usd } from "../lib/store";
import { PB } from "../components/UI";
import { API_URL } from "../lib/config";

/* ── Binance Design Tokens ─────────────────────────────────── */
const B = {
  bg: "#0b0e11",
  surface: "#0f1217",
  card: "#161a21",
  card2: "#1c2130",
  border: "rgba(255,255,255,0.06)",
  gold: "#f0b90b",
  goldDim: "rgba(240,185,11,0.4)",
  green: "#0ecb81",
  red: "#f6465d",
  blue: "#1890ff",
  text: "#eaecef",
  textMid: "#848e9c",
  textDim: "#474d57",
};

const TRADE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; }
  .tr-page { font-family: 'IBM Plex Sans', sans-serif; background: ${B.bg}; color: ${B.text}; }
  .tr-input {
    width: 100%; background: ${B.surface};
    border: 1px solid ${B.border}; border-radius: 6px;
    padding: 12px 14px; font-size: 15px; color: ${B.text};
    font-family: 'IBM Plex Sans', sans-serif; outline: none;
    transition: border-color 0.2s;
  }
  .tr-input:focus { border-color: ${B.gold}; }
  .tr-input::placeholder { color: ${B.textDim}; font-size: 13px; }
  @keyframes trFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes trPulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }
  .tr-coin-chip {
    display: flex; flex-direction: column; align-items: center;
    padding: 10px 10px 8px; border-radius: 8px; cursor: pointer;
    border: 1px solid ${B.border};
    background: ${B.card};
    transition: border-color 0.2s, background 0.2s;
    min-width: 72px; flex-shrink: 0;
  }
  .tr-coin-chip.active {
    border-color: ${B.gold};
    background: rgba(240,185,11,0.07);
  }
  .tr-time-btn {
    flex: 1; padding: 10px 6px; border-radius: 6px;
    border: 1px solid ${B.border}; background: ${B.card};
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; text-align: center;
  }
  .tr-time-btn.active {
    border-color: currentColor;
  }
`;

/* ── Candlestick Chart ─────────────────────────────────────── */
function CChart({ coin, px }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width,
      H = cv.height;
    const cd = (PE.h[coin] || []).slice(-55);
    ctx.clearRect(0, 0, W, H);
    if (cd.length < 2) return;

    const vals = cd.flatMap((c) => [c.h, c.l]);
    const mn = Math.min(...vals),
      mx = Math.max(...vals),
      rng = mx - mn || 1;
    const pad = { r: 68, t: 8, b: 24 };
    const cw = (W - pad.r) / cd.length;
    const yp = (v) => pad.t + (1 - (v - mn) / rng) * (H - pad.t - pad.b);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i * (H - pad.t - pad.b)) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = "#474d57";
      ctx.font = "8px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(f2(mx - i * (rng / 4), 2), W - pad.r + 4, y + 3);
    }

    // Candles
    cd.forEach((c, i) => {
      const x = i * cw + cw * 0.12,
        bw = cw * 0.72;
      const isUp = c.c >= c.o;
      const col = isUp ? B.green : B.red;
      ctx.strokeStyle = col;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + bw / 2, yp(c.h));
      ctx.lineTo(x + bw / 2, yp(c.l));
      ctx.stroke();
      ctx.fillStyle = col;
      const y1 = yp(Math.max(c.o, c.c)),
        y2 = yp(Math.min(c.o, c.c));
      ctx.fillRect(x, y1, bw, Math.max(1, y2 - y1));
    });

    // Price line
    const cur = px[coin] || cd[cd.length - 1].c;
    const cy = yp(cur);
    const isUpOverall = cd.length > 1 && cur >= cd[0].c;
    ctx.strokeStyle = isUpOverall ? B.green : B.red;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W - pad.r, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    ctx.fillStyle = isUpOverall ? B.green : B.red;
    ctx.fillRect(W - pad.r, cy - 9, pad.r, 18);
    ctx.fillStyle = "#0b0e11";
    ctx.font = "bold 8px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(f2(cur, 2), W - pad.r + 34, cy + 3);

    // Time labels
    ctx.fillStyle = "#474d57";
    ctx.font = "8px 'IBM Plex Sans', sans-serif";
    [
      0,
      Math.floor(cd.length / 3),
      Math.floor((cd.length * 2) / 3),
      cd.length - 1,
    ].forEach((i) => {
      if (cd[i]) {
        const d = new Date(cd[i].t);
        ctx.fillText(
          `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`,
          i * cw + cw / 2,
          H - 5,
        );
      }
    });
  });

  return (
    <canvas
      ref={ref}
      width={348}
      height={200}
      style={{ width: "100%", height: 200, display: "block", borderRadius: 6 }}
    />
  );
}

const TIME_OPTIONS = [
  { seconds: 30, label: "30s", profitPercent: 20, color: B.green },
  { seconds: 60, label: "60s", profitPercent: 30, color: "#1890ff" },
  { seconds: 120, label: "2min", profitPercent: 40, color: B.gold },
  { seconds: 180, label: "3min", profitPercent: 50, color: "#b37feb" },
  { seconds: 240, label: "4min", profitPercent: 60, color: "#f759ab" },
];

async function getUserBalance(username) {
  const res = await fetch(`${API_URL}/api/users/${username}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return typeof data.balance === "number" ? data.balance : 0;
}

function generateOrderNumber() {
  const ts = Date.now().toString().slice(-10);
  const rnd = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `B${ts}${rnd}`;
}

/* ── Order Confirmation Screen ─────────────────────────────── */
function OrderConfirmation({ order, onClose }) {
  const isUp = order.orderType === "up";
  const profit = (order.amount * order.profitPercent) / 100;

  const rows = [
    {
      label: "Currency",
      value: `${order.coin}/USDT`,
      color: B.text,
      key: "currency",
    },
    {
      label: "Order No.",
      value: (
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11,
            color: B.gold,
          }}
        >
          {order.orderNumber}
        </span>
      ),
      color: null,
      key: "orderNo",
    },
    {
      label: "Order Amount",
      value: `$${order.amount}`,
      color: B.gold,
      key: "orderAmount",
    },
    {
      label: "Profit Amount",
      value: "0",
      color: B.textMid,
      key: "profitAmount",
    },
    {
      label: "Direction",
      value: isUp ? "Buy Up ↑" : "Buy Down ↓",
      color: isUp ? B.green : B.red,
      key: "direction",
    },
    {
      label: "Scale",
      value: `${order.profitPercent}%`,
      color: B.blue,
      key: "scale",
    },
    {
      label: "Duration",
      value: `${order.timeSeconds}s`,
      color: B.text,
      key: "duration",
    },
    {
      label: "Order Time",
      value: order.orderTime,
      color: B.textMid,
      key: "orderTime",
    },
  ];

  return (
    <div
      className="tr-page"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <style>{TRADE_CSS}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: B.card,
          borderRadius: 12,
          border: `1px solid ${isUp ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
          overflow: "hidden",
          animation: "trFadeUp 0.4s ease both",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            background: isUp ? "rgba(14,203,129,0.06)" : "rgba(246,70,93,0.06)",
            borderBottom: `1px solid ${B.border}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: isUp
                ? "rgba(14,203,129,0.12)"
                : "rgba(246,70,93,0.12)",
              border: `1px solid ${isUp ? "rgba(14,203,129,0.3)" : "rgba(246,70,93,0.3)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              margin: "0 auto 12px",
            }}
          >
            {isUp ? "↑" : "↓"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: B.text }}>
            Order Placed Successfully
          </div>
          <div style={{ fontSize: 11, color: B.textMid, marginTop: 4 }}>
            Your trade is being processed
          </div>
        </div>

        {/* Rows */}
        <div style={{ padding: "4px 20px" }}>
          {rows.map((row) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  row.key !== rows[rows.length - 1].key
                    ? `1px solid ${B.border}`
                    : "none",
              }}
            >
              <span style={{ fontSize: 12, color: B.textMid }}>
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: row.color || B.text,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Potential profit banner */}
        <div
          style={{
            margin: "0 20px 16px",
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(14,203,129,0.07)",
            border: "1px solid rgba(14,203,129,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: B.textMid }}>
            Potential Profit
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: B.green }}>
            +${profit.toFixed(2)}{" "}
            <span style={{ fontSize: 10, fontWeight: 400 }}>
              ({order.profitPercent}%)
            </span>
          </span>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "13px",
              background: B.gold,
              border: "none",
              borderRadius: 6,
              color: "#0b0e11",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main TradePage ────────────────────────────────────────── */
export default function TradePage({ nav, px, onTrade, coin }) {
  const [sel, setSel] = useState(coin || COINS[0]?.id || "BTC");
  const [selectedTime, setSelTime] = useState(TIME_OPTIONS[0]);
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState("up");
  const [err, setErr] = useState("");
  const [balance, setBalance] = useState(0);
  const [showConfirmation, setShow] = useState(false);
  const [placedOrder, setPlaced] = useState(null);
  const [tab, setTab] = useState("chart"); // "chart" | "info"
  const coinSelRef = useRef(null);

  useEffect(() => {
    const u = localStorage.getItem("session");
    if (u)
      getUserBalance(u)
        .then(setBalance)
        .catch(() => {});
  }, []);

  useEffect(() => {
    if (coinSelRef.current) {
      const el = coinSelRef.current.querySelector(`[data-coin="${sel}"]`);
      if (el)
        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
    }
  }, [sel]);

  const submitOrder = async () => {
    setErr("");
    const amt = parseFloat(amount);
    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      setErr("Not logged in");
      return;
    }
    if (!amt || amt <= 0) {
      setErr("Enter a valid amount");
      return;
    }

    let freshBalance;
    try {
      freshBalance = await getUserBalance(sessionUser);
    } catch {
      setErr("Cannot reach server. Check your connection.");
      return;
    }

    if (freshBalance < amt) {
      setBalance(freshBalance);
      setErr(`Insufficient balance. Available: ${usd(freshBalance)}`);
      return;
    }

    const orderNumber = generateOrderNumber();
    const orderData = {
      id: Date.now() + Math.random(),
      orderNumber,
      coin: sel,
      amount: amt,
      orderType,
      timeSeconds: selectedTime.seconds,
      profitPercent: selectedTime.profitPercent,
      status: "pending",
      startPrice: px[sel] || PE.p[sel] || 0,
      username: sessionUser,
      startTime: new Date().toISOString(),
    };

    try {
      const res = await fetch(
        `${API_URL}/api/users/${sessionUser}/pending-trades`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        },
      );
      if (!res.ok) throw new Error();
    } catch {
      setErr("Failed to place order. Please try again.");
      return;
    }

    try {
      await fetch(`${API_URL}/api/users/${sessionUser}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Binary Trade",
          orderNumber,
          coin: sel,
          amount: amt,
          orderType,
          timeSeconds: selectedTime.seconds,
          profitPercent: selectedTime.profitPercent,
          status: "pending",
          profitAmount: 0,
          date: new Date().toISOString(),
          formattedDate: new Date().toLocaleString(),
        }),
      });
    } catch {}

    await fetch(`${API_URL}/api/users/${sessionUser}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Trade Placed",
        body: `${orderType.toUpperCase()} $${amt} on ${sel} for ${selectedTime.seconds}s — ${orderNumber}`,
        type: "trade_placed",
      }),
    }).catch(() => {});

    setPlaced({ ...orderData, orderTime: new Date().toLocaleString() });
    setShow(true);
    setAmount("");
  };

  if (showConfirmation && placedOrder) {
    return (
      <OrderConfirmation
        order={placedOrder}
        onClose={() => {
          setShow(false);
          setPlaced(null);
          nav("home");
        }}
      />
    );
  }

  const price = px[sel] || 0;
  const hist = PE.h[sel] || [];
  const open =
    hist.length > 0 ? (hist[Math.max(0, hist.length - 40)].o ?? price) : price;
  const chg = open > 0 ? price - open : 0;
  const cpct = open > 0 ? (chg / open) * 100 : 0;
  const isUp = chg >= 0;

  const hi24 = hist.length
    ? Math.max(...hist.slice(-40).map((c) => c.h))
    : price;
  const lo24 = hist.length
    ? Math.min(...hist.slice(-40).map((c) => c.l))
    : price;

  const amt = parseFloat(amount);
  const potProfit =
    !isNaN(amt) && amt > 0 ? (amt * selectedTime.profitPercent) / 100 : 0;

  return (
    <div
      className="tr-page"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{TRADE_CSS}</style>

      {/* ── Top Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 16px 11px",
          borderBottom: `1px solid ${B.border}`,
          background: B.bg,
          position: "sticky",
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => nav("home")}
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            border: `1px solid ${B.border}`,
            background: B.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: B.textMid,
            fontSize: 15,
          }}
        >
          ←
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>
            {sel}/USDT
          </div>
          <div style={{ fontSize: 10, color: B.textMid }}>Binary Options</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: B.textMid }}>Balance</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: B.green }}>
            {usd(balance)}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "thin",
          paddingBottom: 16,
        }}
      >
        {/* Price row */}
        <div
          style={{
            padding: "12px 16px 10px",
            borderBottom: `1px solid ${B.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 26,
                fontWeight: 600,
                color: isUp ? B.green : B.red,
                lineHeight: 1,
              }}
            >
              {f2(price, 4)}
            </div>
            <div style={{ marginBottom: 2 }}>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: isUp
                    ? "rgba(14,203,129,0.1)"
                    : "rgba(246,70,93,0.1)",
                  color: isUp ? B.green : B.red,
                }}
              >
                {isUp ? "+" : ""}
                {f2(cpct, 2)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              ["24h High", f2(hi24, 4), B.green],
              ["24h Low", f2(lo24, 4), B.red],
              [
                "Change",
                `${isUp ? "+" : ""}${f2(chg, 4)}`,
                isUp ? B.green : B.red,
              ],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 9,
                    color: B.textDim,
                    letterSpacing: 0.3,
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color,
                    fontFamily: "'IBM Plex Mono',monospace",
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div
          style={{
            padding: "0 12px 12px",
            background: B.surface,
            borderBottom: `1px solid ${B.border}`,
          }}
        >
          {/* Chart tab bar */}
          <div
            style={{
              display: "flex",
              gap: 2,
              paddingTop: 10,
              paddingBottom: 8,
            }}
          >
            {["1m", "5m", "15m", "1h", "4h"].map((tf) => (
              <button
                key={tf}
                onClick={() => {}}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: "none",
                  background: tf === "1m" ? B.card : "transparent",
                  color: tf === "1m" ? B.text : B.textMid,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
          <CChart coin={sel} px={px} />
        </div>

        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* ── Coin Selector ── */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: B.textMid,
                fontWeight: 600,
                letterSpacing: 0.8,
                marginBottom: 9,
              }}
            >
              CURRENCY
            </div>
            <div
              ref={coinSelRef}
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                scrollbarWidth: "none",
                paddingBottom: 4,
              }}
            >
              {COINS.map((c) => (
                <div
                  key={c.id}
                  data-coin={c.id}
                  onClick={() => setSel(c.id)}
                  className={`tr-coin-chip${sel === c.id ? " active" : ""}`}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: c.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: c.cl,
                      marginBottom: 5,
                    }}
                  >
                    {c.sym}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: sel === c.id ? B.gold : B.text,
                    }}
                  >
                    {c.id}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: B.textDim,
                      fontFamily: "'IBM Plex Mono',monospace",
                      marginTop: 1,
                    }}
                  >
                    {f2(px[c.id] || 0, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Time Period ── */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: B.textMid,
                fontWeight: 600,
                letterSpacing: 0.8,
                marginBottom: 9,
              }}
            >
              ORDER PERIOD
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setSelTime(opt)}
                  className="tr-time-btn"
                  style={{
                    color:
                      selectedTime.seconds === opt.seconds
                        ? opt.color
                        : B.textMid,
                    borderColor:
                      selectedTime.seconds === opt.seconds
                        ? opt.color
                        : B.border,
                    background:
                      selectedTime.seconds === opt.seconds
                        ? `${opt.color}12`
                        : B.card,
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>
                    {opt.profitPercent}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Direction Buttons ── */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: B.textMid,
                fontWeight: 600,
                letterSpacing: 0.8,
                marginBottom: 9,
              }}
            >
              DIRECTION
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 9,
              }}
            >
              <button
                onClick={() => setOrderType("up")}
                style={{
                  padding: "14px 0",
                  borderRadius: 6,
                  fontFamily: "inherit",
                  border: `1.5px solid ${orderType === "up" ? B.green : B.border}`,
                  background:
                    orderType === "up" ? "rgba(14,203,129,0.1)" : B.card,
                  color: B.green,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                ↑ Buy Up
              </button>
              <button
                onClick={() => setOrderType("down")}
                style={{
                  padding: "14px 0",
                  borderRadius: 6,
                  fontFamily: "inherit",
                  border: `1.5px solid ${orderType === "down" ? B.red : B.border}`,
                  background:
                    orderType === "down" ? "rgba(246,70,93,0.1)" : B.card,
                  color: B.red,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                ↓ Buy Down
              </button>
            </div>
          </div>

          {/* ── Amount Input ── */}
          <div>
            <div
              style={{
                fontSize: 10,
                color: B.textMid,
                fontWeight: 600,
                letterSpacing: 0.8,
                marginBottom: 9,
              }}
            >
              AMOUNT (USD)
            </div>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 14,
                  color: B.textMid,
                  fontWeight: 500,
                }}
              >
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="tr-input"
                style={{ paddingLeft: 28 }}
              />
            </div>

            {/* Quick presets */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[10, 50, 100, 500].map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    borderRadius: 5,
                    border: `1px solid ${amount === String(p) ? B.gold : B.border}`,
                    background:
                      amount === String(p) ? "rgba(240,185,11,0.08)" : B.card,
                    color: amount === String(p) ? B.gold : B.textMid,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ${p}
                </button>
              ))}
            </div>
          </div>

          {/* ── Trade Breakdown ── */}
          {!isNaN(amt) && amt > 0 && (
            <div
              style={{
                background: B.card2,
                borderRadius: 8,
                padding: "13px 14px",
                border: `1px solid ${B.border}`,
                animation: "trFadeUp 0.3s ease both",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: B.textMid,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                TRADE BREAKDOWN
              </div>
              {[
                ["Wager", `$${amt.toFixed(2)}`, B.text],
                ["Potential Profit", `+$${potProfit.toFixed(2)}`, B.green],
                ["Total if Win", `$${(amt + potProfit).toFixed(2)}`, B.gold],
                ["Scale", `${selectedTime.profitPercent}%`, B.blue],
              ].map(([label, val, color]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 7,
                  }}
                >
                  <span style={{ fontSize: 12, color: B.textMid }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {err && (
            <div
              style={{
                padding: "10px 13px",
                borderRadius: 6,
                background: "rgba(246,70,93,0.08)",
                border: "1px solid rgba(246,70,93,0.2)",
                fontSize: 12,
                color: B.red,
                textAlign: "center",
              }}
            >
              {err}
            </div>
          )}

          {/* ── Place Order Button ── */}
          {/* CHANGED: Centered with max-width 260px, so it's less wide */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={submitOrder}
              style={{
                width: "100%",
                maxWidth: 260,
                padding: "15px 0",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.3,
                background:
                  orderType === "up"
                    ? "linear-gradient(90deg, #0ecb81, #07a86a)"
                    : "linear-gradient(90deg, #f6465d, #d63651)",
                color: "#fff",
                boxShadow:
                  orderType === "up"
                    ? "0 4px 16px rgba(14,203,129,0.25)"
                    : "0 4px 16px rgba(246,70,93,0.25)",
                transition: "opacity 0.2s, transform 0.1s",
              }}
            >
              {orderType === "up"
                ? "↑ Place Buy Up Order"
                : "↓ Place Buy Down Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
