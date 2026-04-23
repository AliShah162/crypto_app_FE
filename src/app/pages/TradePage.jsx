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

export default function TradePage({ nav, px, onTrade, coin }) {
  const [sel, ss] = useState(coin || "BTC");

  const [tf, stf] = useState("5M");
  const [qty, sq] = useState("");
  const [done, sd] = useState(null);
  const [err, se] = useState("");
  const [, forceUpdate] = useState(0);


  const u = S.get();
  const price = px[sel] || 0;
  const hist = PE.h[sel] || [];
  // Safe access — hist entries now always have o/h/l/c from fixed PE
  const open  = hist.length > 0 ? (hist[Math.max(0, hist.length - 40)].o ?? price) : price;
  const hi    = hist.length > 0 ? Math.max(...hist.slice(-40).map((c) => c.h ?? c.c)) : price;
  const lo    = hist.length > 0 ? Math.min(...hist.slice(-40).map((c) => c.l ?? c.c)) : price;
  const chg   = open > 0 ? price - open : 0;
  const cpct  = open > 0 ? (chg / open) * 100 : 0;

  const buy = () => {
    se("");
    const cost = parseFloat(qty) * price;
    if (!qty || isNaN(cost) || cost <= 0) { se("Enter a valid quantity"); return; }
    if (!u || u.balance < cost) { se(`Need ${usd(cost)}`); return; }

    const newBalance  = u.balance - cost;
    const newHoldings = { ...(u.holdings || {}), [sel]: ((u.holdings || {})[sel] || 0) + parseFloat(qty) };
    const newTxns     = [
      { type: "Buy", coin: sel, amount: parseFloat(qty), usd: cost, price, date: new Date().toISOString().slice(0, 10), up: true },
      ...(u.transactions || []),
    ];
    S.updateUser(u.username, { balance: newBalance, holdings: newHoldings, transactions: newTxns });
    onTrade({ action: "Buy", coin: sel, qty: parseFloat(qty), cost });
    sd({ action: "Buy", coin: sel, qty, cost });
    sq("");
    forceUpdate((n) => n + 1);
  };

  const sell = () => {
    se("");
    const qn   = parseFloat(qty);
    const held = (u?.holdings || {})[sel] || 0;
    if (!qty || isNaN(qn) || qn <= 0) { se("Enter a valid quantity"); return; }
    if (!u || held < qn) { se(`Only hold ${f2(held, 4)} ${sel}`); return; }

    const proceeds    = qn * price;
    const newBalance  = u.balance + proceeds;
    const newHoldings = { ...(u.holdings || {}), [sel]: held - qn };
    const newTxns     = [
      { type: "Sell", coin: sel, amount: qn, usd: proceeds, price, date: new Date().toISOString().slice(0, 10), up: false },
      ...(u.transactions || []),
    ];
    S.updateUser(u.username, { balance: newBalance, holdings: newHoldings, transactions: newTxns });
    onTrade({ action: "Sell", coin: sel, qty: qn, cost: proceeds });
    sd({ action: "Sell", coin: sel, qty, cost: proceeds });
    sq("");
    forceUpdate((n) => n + 1);
  };

  const prevC = hist.length > 1 ? (hist[hist.length - 2].c ?? price) : price;
  const holds = Object.entries(u?.holdings || {}).filter(([, v]) => v > 0);

  if (done)
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
          {done.action === "Buy" ? "🟢" : "🔴"}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: T.text,
            marginBottom: 5,
          }}
        >
          {done.action} Order Placed!
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 3 }}>
          {done.action === "Buy" ? "Purchased" : "Sold"}{" "}
          <span style={{ color: T.acc, fontWeight: 700 }}>
            {done.qty} {done.coin}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 24 }}>
          for{" "}
          <span style={{ color: T.acc, fontWeight: 700 }}>
            {usd(done.cost)}
          </span>
        </div>
        <div style={{ width: "100%", marginBottom: 9 }}>
          <PB lbl="Continue Trading" onClick={() => sd(null)} />
        </div>
        <PB lbl="Back to Home" onClick={() => nav("home")} ghost />
      </div>
    );

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
        {/* Price header */}
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
              HIGH{" "}
              <span style={{ color: T.text, fontWeight: 700 }}>
                {f2(hi, 2)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
              LOW{" "}
              <span style={{ color: T.text, fontWeight: 700 }}>
                {f2(lo, 2)}
              </span>
            </div>
          </div>
        </div>
        {/* TF buttons */}
        <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
          {["1M", "5M", "15M", "30M", "1H"].map((t) => (
            <button
              key={t}
              onClick={() => stf(t)}
              style={{
                padding: "4px 9px",
                borderRadius: 16,
                border: `1.5px solid ${tf === t ? T.acc : T.line}`,
                background: tf === t ? "rgba(0,229,176,0.09)" : "transparent",
                color: tf === t ? T.acc : T.dim,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Chart */}
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
        {/* OPEN / PREV CLOSE */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: T.card,
            borderRadius: 10,
            padding: "9px 13px",
            marginBottom: 9,
            border: `1px solid ${T.line}`,
          }}
        >
          <div>
            <span style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>
              OPEN{" "}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
              {f2(open, 2)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 10, color: T.red, fontWeight: 700 }}>
              PREV CLOSE{" "}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
              {f2(prevC, 2)}
            </span>
          </div>
        </div>
        {/* Coin selector */}
        <div
          style={{
            background: T.card,
            borderRadius: 11,
            padding: "9px 8px",
            marginBottom: 9,
            border: `1px solid ${T.line}`,
            overflow: "hidden",
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
            Crypto
          </div>
          <div style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            overflowY: "visible",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: 4,
          }}>
            {COINS.map((c) => (
              <div
                key={c.id}
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
        {/* Holdings badge */}
        {(u?.holdings?.[sel] || 0) > 0 && (
          <div
            style={{
              background: "rgba(0,229,176,0.06)",
              borderRadius: 9,
              padding: "7px 11px",
              marginBottom: 9,
              border: "1px solid rgba(0,229,176,0.17)",
            }}
          >
            <span style={{ fontSize: 11, color: T.acc, fontWeight: 700 }}>
              Holdings:{" "}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
              {f2(u.holdings[sel], 4)} {sel}
            </span>
            <span style={{ fontSize: 10, color: T.dim }}>
              {" "}
              ≈ {usd(u.holdings[sel] * price)}
            </span>
          </div>
        )}
        {/* Positions */}
        <div style={{ marginBottom: 9 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>
              Positions
            </span>
            <span style={{ fontSize: 10, color: T.dim }}>{holds.length}</span>
          </div>
          {holds.length === 0 ? (
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
              No open positions
            </div>
          ) : (
            holds.map(([id, q]) => {
              const m = COINS.find((c) => c.id === id);
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
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: m?.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: m?.cl,
                      flexShrink: 0,
                    }}
                  >
                    {m?.sym}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 11, fontWeight: 700, color: T.text }}
                    >
                      {id}
                    </div>
                    <div style={{ fontSize: 9, color: T.dim }}>{f2(q, 4)}</div>
                  </div>
                  <div
                    style={{ fontSize: 11, fontWeight: 700, color: T.green }}
                  >
                    {usd(q * (px[id] || 0))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Qty input */}
        <div
          style={{
            background: T.card,
            borderRadius: 11,
            padding: "11px",
            marginBottom: 9,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: T.dim,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            QUANTITY ({sel})
          </div>
          <input
            type="number"
            value={qty}
            onChange={(e) => sq(e.target.value)}
            placeholder="Enter quantity"
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
              marginBottom: 5,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: T.dim,
            }}
          >
            <span>≈ {usd((parseFloat(qty) || 0) * price)}</span>
            <span>
              Bal:{" "}
              <strong style={{ color: T.text }}>{usd(S.get()?.balance ?? u?.balance ?? 0)}</strong>
            </span>
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
        {/* Buy/Sell */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            paddingBottom: 12,
          }}
        >
          <button
            onClick={buy}
            style={{
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 13px rgba(16,185,129,0.27)",
            }}
          >
            Buy Up
          </button>
          <button
            onClick={sell}
            style={{
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 13px rgba(239,68,68,0.27)",
            }}
          >
            Buy Down
          </button>
        </div>
      </div>
    </div>
  );
}