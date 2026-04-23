"use client";
import { useState, useEffect, useRef } from "react";
import { T, S, COINS, PE, f2, usd } from "../lib/store";
import { PB } from "../components/UI";

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
    ctx.strokeStyle = "#1a2540";
    ctx.lineWidth = 0.6;
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (i * (H - pad.t - pad.b)) / 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = "#4b6080";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(f2(mx - i * (rng / 5), 2), W - pad.r + 3, y + 3);
    }
    cd.forEach((c, i) => {
      const x = i * cw + cw * 0.1,
        bw = cw * 0.76;
      const up = c.c >= c.o,
        col = up ? "#10b981" : "#ef4444";
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
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f2(cur, 2), W - pad.r + 33, cy + 3);
    ctx.fillStyle = "#4b6080";
    ctx.font = "8px sans-serif";
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
  { seconds: 30, label: "30s", profitPercent: 20, color: "#10b981" },
  { seconds: 60, label: "60s", profitPercent: 30, color: "#3b82f6" },
  { seconds: 120, label: "120s", profitPercent: 40, color: "#f59e0b" },
  { seconds: 180, label: "180s", profitPercent: 50, color: "#8b5cf6" },
  { seconds: 240, label: "240s", profitPercent: 60, color: "#ec4899" },
];

export default function TradePage({ nav, px, onTrade, coin }) {
  const [sel, ss] = useState(coin || COINS[0]?.id || "BTC");
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[0]);
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState("up");
  const [activeOrder, setActiveOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState("");
  const [, forceUpdate] = useState(0);
  const coinSelectorRef = useRef(null);
  const timerRef = useRef(null);

  const u = S.get();
  const price = px[sel] || 0;
  const hist = PE.h[sel] || [];
  const open =
    hist.length > 0 ? (hist[Math.max(0, hist.length - 40)].o ?? price) : price;
  const chg = open > 0 ? price - open : 0;
  const cpct = open > 0 ? (chg / open) * 100 : 0;

  const completeTrade = useRef(() => {});

  useEffect(() => {
    completeTrade.current = () => {
      if (!activeOrder) return;

      const currentPrice = px[activeOrder.coin] || 0;
      const isWin =
        (activeOrder.orderType === "up" &&
          currentPrice >= activeOrder.startPrice) ||
        (activeOrder.orderType === "down" &&
          currentPrice <= activeOrder.startPrice);

      const profitPercent = activeOrder.profitPercent / 100;
      const profitAmount = activeOrder.amount * profitPercent;
      const finalAmount = activeOrder.amount + profitAmount;

      // ✅ FIXED: Read fresh from localStorage using username stored in activeOrder
      // This prevents stale in-memory S.users from losing transactions written earlier
      let currentUser;
      try {
        const raw = JSON.parse(localStorage.getItem("users") || "{}");
        currentUser = raw[activeOrder.username] || S.get();
      } catch {
        currentUser = S.get();
      }

      const newBalance = (currentUser.balance || 0) + (isWin ? finalAmount : 0);

      const binaryTransaction = {
        type: "Binary Trade",
        coin: activeOrder.coin,
        amount: activeOrder.amount,
        usd: isWin ? profitAmount : activeOrder.amount,
        price: currentPrice,
        date: new Date().toISOString(),
        up: isWin,
        isBinaryTrade: true,
        duration: activeOrder.timeSeconds,
        profitPercent: activeOrder.profitPercent,
        orderType: activeOrder.orderType,
        startPrice: activeOrder.startPrice,
        endPrice: currentPrice,
        profitAmount: isWin ? profitAmount : -activeOrder.amount,
        tradeDetails: {
          type: isWin ? "WIN" : "LOSS",
          coin: activeOrder.coin,
          amount: activeOrder.amount,
          profit: isWin ? profitAmount : -activeOrder.amount,
          finalAmount: isWin ? finalAmount : 0,
          lostAmount: isWin ? 0 : activeOrder.amount,
          startPrice: activeOrder.startPrice,
          endPrice: currentPrice,
          duration: activeOrder.timeSeconds,
          profitPercent: activeOrder.profitPercent,
          orderType: activeOrder.orderType,
          timestamp: new Date().toISOString(),
        },
      };

      const newTxns = [binaryTransaction, ...(currentUser.transactions || [])];

      const updatedUser = {
        ...currentUser,
        balance: newBalance,
        transactions: newTxns,
      };

      S.updateUser(currentUser.username, {
        balance: newBalance,
        transactions: newTxns,
      });

      onTrade({
        action: "Binary Trade",
        type: isWin ? "WIN" : "LOSS",
        coin: activeOrder.coin,
        amount: activeOrder.amount,
        result: isWin ? "WIN" : "LOSS",
        profit: isWin ? profitAmount : -activeOrder.amount,
        tradeDetails: binaryTransaction.tradeDetails,
      });

      setDone({
        action: isWin ? "WINNER!" : "LOSS!",
        coin: activeOrder.coin,
        amount: activeOrder.amount,
        profit: isWin ? profitAmount : -activeOrder.amount,
        isWin,
        finalAmount: isWin ? finalAmount : 0,
      });

      setActiveOrder(null);
      setTimeLeft(null);
      forceUpdate((n) => n + 1);
    };
  }, [activeOrder, px, onTrade]);

  useEffect(() => {
    if (coinSelectorRef.current && sel) {
      const selectedElement = coinSelectorRef.current.querySelector(
        `[data-coin="${sel}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [sel]);

  useEffect(() => {
    if (activeOrder && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (activeOrder && timeLeft === 0) {
      completeTrade.current();
    }
    return () => clearTimeout(timerRef.current);
  }, [activeOrder, timeLeft]);

  const submitOrder = () => {
    setErr("");
    const amt = parseFloat(amount);

    if (!amt || amt <= 0) {
      setErr("Enter a valid amount");
      return;
    }

    if (!u || (u.balance || 0) < amt) {
      setErr(`Insufficient balance. Available: ${usd(u?.balance || 0)}`);
      return;
    }

    const newBalance = (u.balance || 0) - amt;
    S.updateUser(u.username, { balance: newBalance });

    const order = {
      coin: sel,
      amount: amt,
      orderType: orderType,
      timeSeconds: selectedTime.seconds,
      profitPercent: selectedTime.profitPercent,
      startPrice: price,
      startTime: Date.now(),
      username: u.username,
    };

    setActiveOrder(order);
    setTimeLeft(selectedTime.seconds);
    setAmount("");
    forceUpdate((n) => n + 1);
  };

  const cancelOrder = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const currentUser = S.get();
    const refundBalance = (currentUser.balance || 0) + activeOrder.amount;
    S.updateUser(currentUser.username, { balance: refundBalance });
    setActiveOrder(null);
    setTimeLeft(null);
    forceUpdate((n) => n + 1);
  };

  const holdings = Object.entries(u?.holdings || {}).filter(
    ([, qty]) => qty > 0,
  );
  const availableBalance = u?.balance || 0;

  if (done) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 11 }}>
          {done.isWin ? "🎉" : "💔"}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: T.text,
            marginBottom: 5,
          }}
        >
          {done.isWin ? "YOU WON!" : "YOU LOST!"}
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 3 }}>
          {done.isWin ? "You won" : "You lost"}{" "}
          <span
            style={{ color: done.isWin ? T.green : T.red, fontWeight: 700 }}
          >
            {usd(Math.abs(done.profit))}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 24 }}>
          {done.isWin
            ? `Total returned: ${usd(done.finalAmount)}`
            : `Wagered: ${usd(done.amount)}`}
        </div>
        <div style={{ width: "100%", marginBottom: 9 }}>
          <PB lbl="Continue Trading" onClick={() => setDone(null)} />
        </div>
        <PB lbl="Back to Home" onClick={() => nav("home")} ghost />
      </div>
    );
  }

  if (activeOrder) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: T.card,
            borderRadius: 20,
            padding: 30,
            textAlign: "center",
            width: "100%",
            maxWidth: 350,
            border: `2px solid ${T.acc}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 10 }}>⏳</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: T.text,
              marginBottom: 5,
            }}
          >
            Active Trade
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: T.acc,
              marginBottom: 10,
              fontFamily: "monospace",
            }}
          >
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 13, color: T.dim }}>{activeOrder.coin}</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: activeOrder.orderType === "up" ? T.green : T.red,
              }}
            >
              {activeOrder.orderType.toUpperCase()} ${activeOrder.amount}
            </div>
            <div style={{ fontSize: 12, color: T.gold, marginTop: 5 }}>
              Win: +{activeOrder.profitPercent}% ($
              {((activeOrder.amount * activeOrder.profitPercent) / 100).toFixed(
                2,
              )}
              )
            </div>
          </div>
          <button
            onClick={cancelOrder}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: `1.5px solid ${T.red}`,
              background: "transparent",
              color: T.red,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 15px 9px",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <button
          onClick={() => nav("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.text,
            fontSize: 20,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ←
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>
          {sel}
        </span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ padding: "11px 13px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 9,
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.text }}>
              {f2(price, 4)}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: chg >= 0 ? T.green : T.red,
                marginTop: 1,
              }}
            >
              {chg >= 0 ? "+" : ""}
              {f2(chg, 4)} ({cpct >= 0 ? "+" : ""}
              {f2(cpct, 2)}%)
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.dim }}>
              Balance:{" "}
              <span style={{ color: T.green, fontWeight: 700 }}>
                {usd(availableBalance)}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: T.card,
            borderRadius: 11,
            padding: "7px 5px",
            marginBottom: 9,
            border: `1px solid ${T.line}`,
          }}
        >
          <CChart coin={sel} px={px} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            marginBottom: 15,
          }}
        >
          <button
            onClick={() => setOrderType("up")}
            style={{
              padding: "13px 0",
              borderRadius: 12,
              border: `2px solid ${orderType === "up" ? T.green : T.line}`,
              background: orderType === "up" ? "rgba(16,185,129,0.15)" : T.card,
              color: T.green,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Buy Up 📈
          </button>
          <button
            onClick={() => setOrderType("down")}
            style={{
              padding: "13px 0",
              borderRadius: 12,
              border: `2px solid ${orderType === "down" ? T.red : T.line}`,
              background:
                orderType === "down" ? "rgba(239,68,68,0.15)" : T.card,
              color: T.red,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Buy Down 📉
          </button>
        </div>

        <div style={{ marginBottom: 15 }}>
          <div
            style={{
              fontSize: 11,
              color: T.dim,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Select order period
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => setSelectedTime(opt)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `2px solid ${selectedTime.seconds === opt.seconds ? opt.color : T.line}`,
                  background:
                    selectedTime.seconds === opt.seconds
                      ? `${opt.color}20`
                      : T.card,
                  color:
                    selectedTime.seconds === opt.seconds ? opt.color : T.text,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {TIME_OPTIONS.map((opt) => (
              <div
                key={opt.profitPercent}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "4px",
                  background:
                    selectedTime.seconds === opt.seconds
                      ? `${opt.color}15`
                      : "transparent",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: opt.color,
                }}
              >
                {opt.profitPercent}%
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: T.card,
            borderRadius: 11,
            padding: "9px 8px",
            marginBottom: 9,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: T.acc,
              fontWeight: 700,
              marginBottom: 7,
              paddingLeft: 2,
            }}
          >
            Currency
          </div>
          <div
            ref={coinSelectorRef}
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              overflowY: "visible",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: 4,
            }}
          >
            {COINS.map((c) => (
              <div
                key={c.id}
                data-coin={c.id}
                onClick={() => ss(c.id)}
                style={{
                  minWidth: 74,
                  padding: "8px 5px",
                  borderRadius: 10,
                  border: `2px solid ${sel === c.id ? T.acc : T.line}`,
                  background: sel === c.id ? "rgba(0,229,176,0.07)" : T.card2,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: c.cl,
                    margin: "0 auto 4px",
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
                <div style={{ fontSize: 8, color: T.dim, marginTop: 1 }}>
                  {f2(px[c.id] || 0, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: T.card,
            borderRadius: 11,
            padding: "11px",
            marginBottom: 9,
            border: `1px solid ${T.line}`,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: T.dim,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Currency
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
              {sel}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: T.dim,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Price
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.acc }}>
              {usd(price)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: T.dim,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Amount
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: "100%",
                background: T.card2,
                border: `1px solid ${T.line}`,
                borderRadius: 9,
                padding: "10px 12px",
                fontSize: 14,
                color: T.text,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {amount && !isNaN(parseFloat(amount)) && (
              <div style={{ fontSize: 11, color: T.gold, marginTop: 5 }}>
                Potential win:{" "}
                {usd(parseFloat(amount) * (selectedTime.profitPercent / 100))}
              </div>
            )}
          </div>
        </div>

        {err && (
          <div
            style={{
              color: T.red,
              fontSize: 11,
              marginBottom: 8,
              textAlign: "center",
              padding: "7px",
              background: "rgba(239,68,68,0.09)",
              borderRadius: 8,
            }}
          >
            {err}
          </div>
        )}

        <button
          onClick={submitOrder}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#6366f1,#3b82f6)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 15,
            boxShadow: "0 4px 13px rgba(99,102,241,0.3)",
          }}
        >
          Submit Order
        </button>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>
              💼 Your Crypto Holdings
            </span>
            <span style={{ fontSize: 10, color: T.dim }}>
              {holdings.length} assets
            </span>
          </div>
          {holdings.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: T.dim,
                fontSize: 11,
                padding: "12px",
                background: T.card,
                borderRadius: 9,
                border: `1px solid ${T.line}`,
              }}
            >
              No crypto holdings yet.
            </div>
          ) : (
            holdings.map(([id, qty]) => {
              const coinData = COINS.find((c) => c.id === id);
              if (!coinData) return null;
              const currentValue = qty * (px[id] || 0);
              return (
                <div
                  key={id}
                  style={{
                    background: T.card,
                    borderRadius: 9,
                    padding: "9px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 6,
                    border: `1px solid ${T.line}`,
                    cursor: "pointer",
                  }}
                  onClick={() => ss(id)}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: coinData.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: coinData.cl,
                      flexShrink: 0,
                    }}
                  >
                    {coinData.sym}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 11, fontWeight: 700, color: T.text }}
                    >
                      {id}
                    </div>
                    <div style={{ fontSize: 9, color: T.dim }}>
                      {f2(qty, 6)}
                    </div>
                  </div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: T.green }}
                  >
                    {usd(currentValue)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
