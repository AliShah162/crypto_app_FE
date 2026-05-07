"use client";
import { useState, useEffect, useRef } from "react";
import { T, COINS, PE, f2, usd } from "../lib/store";
import { PB } from "../components/UI";
import { API_URL } from "../lib/config";

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
    const pad = { r: 66, t: 7, b: 22 };
    const cw = (W - pad.r) / cd.length;
    const yp = (v) => pad.t + (1 - (v - mn) / rng) * (H - pad.t - pad.b);

    // Grid lines
    ctx.strokeStyle = "#1a2540";
    ctx.lineWidth = 0.6;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (i * (H - pad.t - pad.b)) / 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = "#4b6080";
      ctx.font = "8px 'Sora', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(f2(mx - i * (rng / 5), 2), W - pad.r + 3, y + 3);
    }

    // Candles
    cd.forEach((c, i) => {
      const x = i * cw + cw * 0.1,
        bw = cw * 0.76;
      const isUp = c.c >= c.o;
      const col = isUp ? T.green : T.red;
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
    ctx.strokeStyle = T.red;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W - pad.r, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = T.red;
    ctx.fillRect(W - pad.r, cy - 8, pad.r, 16);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px 'Sora', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f2(cur, 2), W - pad.r + 33, cy + 3);
    ctx.fillStyle = "#4b6080";
    ctx.font = "8px 'Sora', sans-serif";
    [
      0,
      Math.floor(cd.length / 3),
      Math.floor((cd.length * 2) / 3),
      cd.length - 1,
    ].forEach((i) => {
      if (cd[i]) {
        const d = new Date(cd[i].t);
        ctx.fillText(
          d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"),
          i * cw + cw / 2,
          H - 4,
        );
      }
    });
  });

  return (
    <canvas
      ref={ref}
      width={348}
      height={200}
      style={{ width: "100%", height: 200, display: "block", borderRadius: 9 }}
    />
  );
}

const TIME_OPTIONS = [
  { seconds: 30, label: "30s", profitPercent: 20, color: T.green },
  { seconds: 60, label: "60s", profitPercent: 30, color: T.blue },
  { seconds: 120, label: "120s", profitPercent: 40, color: T.gold },
  { seconds: 180, label: "180s", profitPercent: 50, color: "#8b5cf6" },
  { seconds: 240, label: "240s", profitPercent: 60, color: "#ec4899" },
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
      color: T.text,
      key: "currency",
    },
    {
      label: "Order No.",
      value: (
        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.acc }}>
          {order.orderNumber}
        </span>
      ),
      color: null,
      key: "orderNo",
    },
    {
      label: "Order Amount",
      value: `$${order.amount}`,
      color: T.gold,
      key: "orderAmount",
    },
    { label: "Profit Amount", value: "0", color: T.dim, key: "profitAmount" },
    {
      label: "Direction",
      value: isUp ? "Buy Up ↑" : "Buy Down ↓",
      color: isUp ? T.green : T.red,
      key: "direction",
    },
    {
      label: "Scale",
      value: `${order.profitPercent}%`,
      color: T.blue,
      key: "scale",
    },
    {
      label: "Duration",
      value: `${order.timeSeconds}s`,
      color: T.text,
      key: "duration",
    },
    {
      label: "Order Time",
      value: order.orderTime,
      color: T.dim,
      key: "orderTime",
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
        background: T.bg,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: T.card,
          borderRadius: 16,
          border: `1px solid ${isUp ? T.green : T.red}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 20px 16px",
            background: isUp ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            borderBottom: `1px solid ${T.line}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: isUp
                ? "rgba(16,185,129,0.12)"
                : "rgba(239,68,68,0.12)",
              border: `1px solid ${isUp ? T.green : T.red}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              margin: "0 auto 12px",
            }}
          >
            {isUp ? "↑" : "↓"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
            Order Placed Successfully
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>
            Your trade is being processed
          </div>
        </div>

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
                    ? `1px solid ${T.line}`
                    : "none",
              }}
            >
              <span style={{ fontSize: 12, color: T.dim }}>{row.label}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: row.color || T.text,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            margin: "0 20px 16px",
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: T.dim }}>Potential Profit</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>
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
              background: "linear-gradient(135deg, #00e5b0, #3b82f6)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
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
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: T.bg,
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 16px 11px",
          borderBottom: `1px solid ${T.line}`,
          background: T.bg,
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
            borderRadius: 8,
            border: `1px solid ${T.line}`,
            background: T.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: T.text,
            fontSize: 16,
          }}
        >
          ←
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
            {sel}/USDT
          </div>
          <div style={{ fontSize: 10, color: T.dim }}>Binary Options</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: T.dim }}>Balance</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>
            {usd(balance)}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          paddingBottom: 16,
        }}
      >
        {/* Price row */}
        <div
          style={{
            padding: "12px 16px 10px",
            borderBottom: `1px solid ${T.line}`,
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
                fontFamily: "monospace",
                fontSize: 26,
                fontWeight: 600,
                color: isUp ? T.green : T.red,
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
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.1)",
                  color: isUp ? T.green : T.red,
                }}
              >
                {isUp ? "+" : ""}
                {f2(cpct, 2)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              ["24h High", f2(hi24, 4), T.green],
              ["24h Low", f2(lo24, 4), T.red],
              [
                "Change",
                `${isUp ? "+" : ""}${f2(chg, 4)}`,
                isUp ? T.green : T.red,
              ],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 9,
                    color: T.dim,
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
                    fontFamily: "monospace",
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
            background: T.card2,
            borderBottom: `1px solid ${T.line}`,
          }}
        >
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
                  background: tf === "1m" ? T.card : "transparent",
                  color: tf === "1m" ? T.text : T.dim,
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
                color: T.dim,
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "8px 5px",
                    borderRadius: 8,
                    border: `1.5px solid ${sel === c.id ? T.acc : T.line}`,
                    background: sel === c.id ? "rgba(0,229,176,0.07)" : T.card2,
                    cursor: "pointer",
                    textAlign: "center",
                    minWidth: 70,
                  }}
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
                      color: sel === c.id ? T.acc : T.text,
                    }}
                  >
                    {c.id}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: T.dim,
                      fontFamily: "monospace",
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
                color: T.dim,
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
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    borderRadius: 6,
                    border: `1.5px solid ${
                      selectedTime.seconds === opt.seconds ? opt.color : T.line
                    }`,
                    background:
                      selectedTime.seconds === opt.seconds
                        ? `${opt.color}15`
                        : T.card,
                    color:
                      selectedTime.seconds === opt.seconds ? opt.color : T.dim,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "center",
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: 9, marginTop: 2 }}>
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
                color: T.dim,
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
                  padding: "13px 0",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  border: `1.5px solid ${orderType === "up" ? T.green : T.line}`,
                  background:
                    orderType === "up" ? "rgba(16,185,129,0.1)" : T.card,
                  color: T.green,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ↑ Buy Up
              </button>
              <button
                onClick={() => setOrderType("down")}
                style={{
                  padding: "13px 0",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  border: `1.5px solid ${orderType === "down" ? T.red : T.line}`,
                  background:
                    orderType === "down" ? "rgba(239,68,68,0.1)" : T.card,
                  color: T.red,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
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
                color: T.dim,
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
                  color: T.dim,
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
                style={{
                  width: "100%",
                  background: T.card2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 10,
                  padding: "12px 14px 12px 28px",
                  fontSize: 15,
                  color: T.text,
                  outline: "none",
                  fontFamily: "inherit",
                }}
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
                    borderRadius: 6,
                    border: `1.5px solid ${amount === String(p) ? T.acc : T.line}`,
                    background:
                      amount === String(p) ? "rgba(0,229,176,0.08)" : T.card,
                    color: amount === String(p) ? T.acc : T.dim,
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
                background: T.card,
                borderRadius: 10,
                padding: "12px 14px",
                border: `1px solid ${T.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: T.dim,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                TRADE BREAKDOWN
              </div>
              {[
                ["Wager", `$${amt.toFixed(2)}`, T.text],
                ["Potential Profit", `+$${potProfit.toFixed(2)}`, T.green],
                ["Total if Win", `$${(amt + potProfit).toFixed(2)}`, T.acc],
                ["Scale", `${selectedTime.profitPercent}%`, T.blue],
              ].map(([label, val, color]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 7,
                  }}
                >
                  <span style={{ fontSize: 12, color: T.dim }}>{label}</span>
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
                borderRadius: 8,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: 12,
                color: T.red,
                textAlign: "center",
              }}
            >
              {err}
            </div>
          )}

          {/* ── Place Order Button ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={submitOrder}
              style={{
                width: "100%",
                maxWidth: 260,
                padding: "14px 0",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 700,
                background:
                  orderType === "up"
                    ? "linear-gradient(135deg, #00e5b0, #3b82f6)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                boxShadow:
                  orderType === "up"
                    ? "0 4px 14px rgba(0,229,176,0.3)"
                    : "0 4px 14px rgba(239,68,68,0.3)",
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
