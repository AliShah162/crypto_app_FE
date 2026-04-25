"use client";
import { useState, useEffect } from "react";
import { T, S, COINS, NEWS, PE, f2, usd } from "../lib/store";
import { PB, BHdr, CoinIcon } from "../components/UI";

// ── Banner ─────────────────────────────────────────────
export function Banner() {
  const [s, ss] = useState(0);
  const sl = [
    {
      g: "linear-gradient(135deg,#071a2e,#0c2a40,#0ea5e9)",
      title: "Trade Smarter",
      sub: "Real-time AI analytics",
      ico: (
        <svg width="62" height="62" viewBox="0 0 62 62" fill="none">
          <circle
            cx="31"
            cy="31"
            r="29"
            fill="rgba(14,165,233,0.12)"
            stroke="#0ea5e9"
            strokeWidth="1.2"
          />
          <polyline
            points="7,43 17,27 27,34 39,15 55,21"
            fill="none"
            stroke="#00e5b0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="39" cy="15" r="4" fill="#f59e0b" />
        </svg>
      ),
    },
    {
      g: "linear-gradient(135deg,#071a12,#0c2a1a,#10b981)",
      title: "Bank-Grade Security",
      sub: "Assets protected 24/7",
      ico: (
        <svg width="62" height="62" viewBox="0 0 62 62" fill="none">
          <circle
            cx="31"
            cy="31"
            r="29"
            fill="rgba(16,185,129,0.1)"
            stroke="#10b981"
            strokeWidth="1.2"
          />
          <path
            d="M31 10L50 18L50 36C50 48 31 54 31 54C31 54 12 48 12 36L12 18Z"
            fill="rgba(16,185,129,0.12)"
            stroke="#10b981"
            strokeWidth="1.4"
          />
          <path
            d="M22 32L28 38L41 25"
            stroke="#00e5b0"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ),
    },
    {
      g: "linear-gradient(135deg,#140f28,#1e1040,#7c3aed)",
      title: "Coin Base",
      sub: "Your gateway to crypto",
      ico: (
        <svg width="62" height="62" viewBox="0 0 62 62" fill="none">
          <circle
            cx="31"
            cy="31"
            r="29"
            fill="rgba(124,58,237,0.12)"
            stroke="#7c3aed"
            strokeWidth="1.2"
          />
          <circle
            cx="31"
            cy="31"
            r="12"
            fill="rgba(124,58,237,0.15)"
            stroke="#a78bfa"
            strokeWidth="1.2"
          />
          <text
            x="31"
            y="37"
            textAnchor="middle"
            fontSize="14"
            fill="#f59e0b"
            fontWeight="bold"
          >
            ₿
          </text>
        </svg>
      ),
    },
  ];
  useEffect(() => {
    const t = setInterval(() => ss((x) => (x + 1) % 3), 3400);
    return () => clearInterval(t);
  }, []);
  const sl2 = sl[s];
  return (
    <div style={{ padding: "0 13px 12px" }}>
      <div
        style={{
          borderRadius: 19,
          background: sl2.g,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 17,
          padding: "0 20px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 7px 26px rgba(0,0,0,0.5)",
          transition: "background 0.8s",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.025)",
            top: -52,
            right: -28,
          }}
        />
        {sl2.ico}
        <div>
          <div style={{ fontSize: 19, fontWeight: 900, color: "#fff" }}>
            {sl2.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              marginTop: 3,
            }}
          >
            {sl2.sub}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            onClick={() => ss(i)}
            style={{
              height: 5,
              borderRadius: 3,
              cursor: "pointer",
              width: i === s ? 22 : 7,
              background: i === s ? T.acc : T.line,
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Home ───────────────────────────────────────────────
export function HomePage({ nav, px, user }) {
  const txs = (
    S.users?.[user?.username]?.transactions ||
    user?.transactions ||
    []
  ).slice(0, 3);
  const qa = [
    {
      l: "News",
      c: T.acc,
      p: "news",
      d: "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2M18 14h-8M15 18h-5M10 6h8v4h-8V6Z",
    },
    {
      l: "Deposit",
      c: T.blue,
      p: "deposit",
      d: "M12 3v12m0 0-4-4m4 4 4-4M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2",
    },
    {
      l: "Withdraw",
      c: T.gold,
      p: "withdraw",
      d: "M12 21V9m0 0 4 4m-4-4-4 4M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2",
    },
    {
      l: "About",
      c: "#a78bfa",
      p: "about",
      d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6v-4m0-4h.01",
    },
  ];
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingBottom: 80,
      }}
    >
      <Banner />
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "4px 13px 18px",
        }}
      >
        {qa.map((a) => (
          <div
            key={a.l}
            onClick={() => nav(a.p)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                background: T.card2,
                borderRadius: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${T.line}`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={a.c}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={a.d} />
              </svg>
            </div>
            <span style={{ fontSize: 11, color: T.dim, fontWeight: 500 }}>
              {a.l}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: T.text,
          padding: "0 15px 9px",
        }}
      >
        Hot Trades
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "0 13px 18px",
        }}
      >
        {COINS.map((c) => {
          const p = px[c.id] || 0;
          const h = PE.h[c.id] || [];
          const prev = h.length > 1 ? h[h.length - 2].c : p;
          const chg = prev ? ((p - prev) / prev) * 100 : 0;
          return (
            <div
              key={c.id}
              onClick={() => nav("trade", c.id)}
              style={{
                minWidth: 90,
                background: T.card,
                borderRadius: 15,
                padding: "11px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                border: `1px solid ${T.line}`,
                cursor: "pointer",
              }}
            >
              <CoinIcon c={c} size={38} />
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                {c.id}
              </div>
              <div style={{ fontSize: 10, color: T.dim }}>{usd(p)}</div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: chg >= 0 ? T.green : T.red,
                }}
              >
                {chg >= 0 ? "+" : ""}
                {f2(chg, 2)}%
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 15px 9px",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
          Markets
        </span>
        <span
          onClick={() => nav("market")}
          style={{
            fontSize: 11,
            color: T.acc,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          View All
        </span>
      </div>
      <div style={{ padding: "0 13px", cursor: "pointer" }}>
        {COINS.map((c) => {
          const p = px[c.id] || 0;
          const h = PE.h[c.id] || [];
          const prev = h.length > 1 ? h[Math.max(0, h.length - 20)].c : p;
          const chg = ((p - prev) / prev) * 100;
          const sl = h.slice(-12);
          const mn = Math.min(...sl.map((x) => x.c)),
            mx = Math.max(...sl.map((x) => x.c)),
            rg = mx - mn || 0.001;
          const pts = sl
            .map((x, i) => `${i * 5},${20 - ((x.c - mn) / rg) * 18}`)
            .join(" ");
          return (
            <div
              key={c.id}
              onClick={() => nav("trade", c.id)}
              style={{
                background: T.card,
                borderRadius: 13,
                padding: "11px 13px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                cursor: "pointer",
                marginBottom: 8,
                border: `1px solid ${T.line}`,
              }}
            >
              <CoinIcon c={c} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {c.id}
                </div>
                <div style={{ fontSize: 10, color: T.dim }}>{c.name}</div>
              </div>
              <svg width="48" height="20" viewBox="0 0 48 20">
                <polyline
                  points={pts}
                  fill="none"
                  stroke={chg >= 0 ? T.green : T.red}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {usd(p)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: chg >= 0 ? T.green : T.red,
                  }}
                >
                  {chg >= 0 ? "+" : ""}
                  {f2(chg, 2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {txs.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "9px 15px 9px",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
              Recent Transactions
            </span>
            <span
              onClick={() => nav("history")}
              style={{
                fontSize: 11,
                color: T.acc,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              All History
            </span>
          </div>
          <div style={{ padding: "0 13px 13px" }}>
            {txs.map((tx, i) => {
              const m = COINS.find((c) => c.id === tx.coin);
              return (
                <div
                  key={i}
                  style={{
                    background: T.card,
                    borderRadius: 12,
                    padding: "10px 13px",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    marginBottom: 7,
                    border: `1px solid ${T.line}`,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: tx.up
                        ? "rgba(16,185,129,0.14)"
                        : "rgba(239,68,68,0.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      color: m?.cl || T.acc,
                      flexShrink: 0,
                    }}
                  >
                    {m?.sym || "$"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 11, fontWeight: 700, color: T.text }}
                    >
                      {tx.type}·{tx.coin}
                    </div>
                    <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                      {tx.date}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tx.up ? T.green : T.red,
                      }}
                    >
                      {tx.up ? "+" : "-"}
                      {usd(tx.usd)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── News ───────────────────────────────────────────────
export function NewsPage({ nav }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        paddingBottom: 20,
      }}
    >
      <BHdr title="News" back={() => nav("home")} />
      <div style={{ padding: "11px 13px" }}>
        {NEWS.map((n, i) => (
          <div
            key={i}
            style={{
              background: T.card,
              borderRadius: 13,
              padding: "14px 13px",
              marginBottom: 9,
              border: `1px solid ${T.line}`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.text,
                lineHeight: 1.5,
                marginBottom: 7,
              }}
            >
              {n.ttl}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 7,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: n.cl }}>
                {n.src}
              </span>
              <span style={{ fontSize: 10, color: T.dim }}>{n.ts}</span>
            </div>
            <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.65 }}>
              {n.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Market ─────────────────────────────────────────────
export function MarketPage({ px, nav }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingBottom: 80,
      }}
    >
      <BHdr title="Market" back={() => nav("home")} />
      <div style={{ padding: "11px 13px" }}>
        {COINS.map((c) => {
          const p = px[c.id] || 0;
          const h = PE.h[c.id] || [];
          const prev = h.length > 1 ? h[Math.max(0, h.length - 20)].c : p;
          const chg = ((p - prev) / prev) * 100;
          return (
            <div
              key={c.id}
              onClick={() => nav("trade", c.id)}
              style={{
                background: T.card,
                borderRadius: 13,
                padding: "11px 13px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                marginBottom: 8,
                border: `1px solid ${T.line}`,
                cursor: "pointer",
              }}
            >
              <CoinIcon c={c} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {c.id}
                </div>
                <div style={{ fontSize: 10, color: T.dim }}>{c.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {usd(p)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: chg >= 0 ? T.green : T.red,
                  }}
                >
                  {chg >= 0 ? "+" : ""}
                  {f2(chg, 2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History ────────────────────────────────────────────
export function HistoryPage({ user }) {
  const [filt, sf] = useState("All");
  const all = user?.transactions || [];
  const list = filt === "All" ? all : all.filter((t) => t.type === filt);
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingBottom: 80,
      }}
    >
      <div style={{ padding: "17px 13px 9px" }}>
        <div
          style={{
            fontSize: 19,
            fontWeight: 900,
            color: T.text,
            marginBottom: 11,
          }}
        >
          History
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 11,
            overflowX: "auto",
          }}
        >
          {["All", "Buy", "Sell", "Deposit", "Withdraw"].map((t) => (
            <button
              key={t}
              onClick={() => sf(t)}
              style={{
                padding: "5px 12px",
                borderRadius: 17,
                border: `1.5px solid ${filt === t ? T.acc : T.line}`,
                background: filt === t ? "rgba(0,229,176,0.08)" : T.card,
                color: filt === t ? T.acc : T.dim,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: T.dim,
              fontSize: 12,
              padding: "40px 0",
            }}
          >
            No{" "}
            {filt === "All"
              ? "transactions yet."
              : filt.toLowerCase() + " history yet."}
          </div>
        ) : (
          list.map((tx, i) => {
            const m = COINS.find((c) => c.id === tx.coin);
            return (
              <div
                key={i}
                style={{
                  background: T.card,
                  borderRadius: 13,
                  padding: "11px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  marginBottom: 8,
                  border: `1px solid ${T.line}`,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: tx.up
                      ? "rgba(16,185,129,0.13)"
                      : "rgba(239,68,68,0.13)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    color: m?.cl || T.acc,
                    flexShrink: 0,
                  }}
                >
                  {m?.sym || "$"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                    {tx.type}·{tx.coin || "USD"}
                  </div>
                  <div style={{ fontSize: 9, color: T.dim, marginTop: 1 }}>
                    {tx.date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: tx.up ? T.green : T.red,
                    }}
                  >
                    {tx.up ? "+" : "-"}
                    {usd(tx.usd)}
                  </div>
                  {tx.amount && (
                    <div style={{ fontSize: 9, color: T.dim, marginTop: 1 }}>
                      {f2(tx.amount, 4)} {tx.coin}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────────────────
export function ProfilePage({ user, onLogout, onSub, re }) {
  const [frozenHVal, setFrozenHVal] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const calc = () => {
      try {
        const u = S.users?.[user?.username];
        if (!u) return;
        const hv = Object.entries(u.holdings || {}).reduce(
          (s, [id, q]) => s + Number(q || 0) * Number(PE.p[id] || 0),
          0,
        );
        setFrozenHVal(hv);
        setFrozenBalance(Number(u.balance || 0));
        setTick((n) => n + 1);
      } catch (err) {
        console.error("Profile balance calc error:", err);
      }
    };
    
    calc();
    const interval = setInterval(calc, 4000);
    
    // ✅ SAFE LISTENER FOR TRADE COMPLETION EVENT
    const handleTradeComplete = (event) => {
      try {
        if (event?.detail?.username === user?.username) {
          console.log("Trade completed, refreshing profile balance...");
          calc();
        }
      } catch (err) {
        // Silently fail - interval will still update
        console.log("Trade completion event error:", err);
      }
    };
    
    // ✅ SAFE LISTENER FOR FOCUS EVENT
    const handleFocus = () => {
      try {
        calc();
      } catch (err) {
        console.log("Focus event error:", err);
      }
    };
    
    // ✅ SAFE LISTENER FOR STORAGE EVENT
    const handleStorage = () => {
      try {
        calc();
      } catch (err) {
        console.log("Storage event error:", err);
      }
    };
    
    window.addEventListener("tradeCompleted", handleTradeComplete);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("tradeCompleted", handleTradeComplete);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user?.username]);

  const liveUser = S.users?.[user?.username] || user || {};
  const isBan = (S.banned || []).includes(user?.username);
  const tot = frozenBalance + frozenHVal;

  const creditScore =
    S.users?.[user?.username]?.creditScore ?? liveUser?.creditScore ?? 50;

  const country =
    S.users?.[user?.username]?.country ||
    liveUser?.country ||
    user?.country ||
    "—";

  const menu = [
    { ic: "📊", l: "Binary History", s: "View all binary trades", sp: "binaryhistory" },
    { ic: "🔐", l: "Security Settings", s: "Password & 2FA", sp: "sec" },
    { ic: "💳", l: "Bank Cards", s: "Payment cards", sp: "card" },
    { ic: "🔔", l: "Notifications", s: "Alerts & prefs", sp: "notif" },
    { ic: "🌐", l: "Language", s: "English", sp: "lang" },
    { ic: "📄", l: "Terms of Service", s: "Legal", sp: "terms" },
    { ic: "✏️", l: "Edit Profile", s: "Update info", sp: "edit" },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingBottom: 80,
      }}
    >
      <div style={{ padding: "18px 15px 0" }}>
        {isBan && (
          <div
            style={{
              background: "rgba(239,68,68,0.09)",
              border: "1px solid rgba(239,68,68,0.28)",
              borderRadius: 11,
              padding: "11px 13px",
              marginBottom: 14,
              fontSize: 12,
              color: T.red,
              fontWeight: 600,
            }}
          >
            ⚠️ Account suspended by admin. Contact support.
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {(liveUser?.fullName || liveUser?.username || "U")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
              {liveUser?.fullName || liveUser?.username}
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
              @{liveUser?.username} · {liveUser?.email}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg,#0c2340,#1a3a5c)",
            borderRadius: 16,
            padding: "16px 15px",
            marginBottom: 13,
            boxShadow: "0 5px 18px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            TOTAL PORTFOLIO VALUE
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 11,
            }}
          >
            {usd(tot)}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.22)",
                borderRadius: 9,
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 2,
                }}
              >
                Cash Balance
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.acc }}>
                {usd(frozenBalance)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.22)",
                borderRadius: 9,
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 2,
                }}
              >
                Holdings
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.gold }}>
                {usd(frozenHVal)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 13,
          }}
        >
          {[
            {
              l: "Trades",
              v: String(
                (liveUser?.transactions || []).filter(
                  (t) => t.type === "Buy" || t.type === "Sell",
                ).length,
              ),
            },
            {
              l: "Deposits",
              v: String(
                (liveUser?.transactions || []).filter(
                  (t) => t.type === "Deposit",
                ).length,
              ),
            },
            {
              l: "Credit Score",
              v:
                creditScore >= 80
                  ? "🟢 " + creditScore
                  : creditScore >= 50
                    ? "🟡 " + creditScore
                    : "🔴 " + creditScore,
            },
            {
              l: "Country",
              v: country,
            },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: T.card,
                borderRadius: 12,
                padding: "11px 8px",
                textAlign: "center",
                border: `1px solid ${T.line}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: T.acc }}>
                {s.v}
              </div>
              <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "4px 13px",
            border: `1px solid ${T.line}`,
            marginBottom: 11,
          }}
        >
          {menu.map((item, i) => (
            <div
              key={item.sp}
              onClick={() => onSub(item.sp)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "13px 0",
                borderBottom:
                  i < menu.length - 1 ? `1px solid ${T.line}` : "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {item.l}
                </div>
                <div style={{ fontSize: 9, color: T.dim, marginTop: 1 }}>
                  {item.s}
                </div>
              </div>
              <span style={{ color: T.dim, fontSize: 17 }}>›</span>
            </div>
          ))}
        </div>

        <PB lbl="🚪  Log Out" onClick={onLogout} ghost danger />
      </div>
    </div>
  );
}

// ── About ──────────────────────────────────────────────
export function AboutPage({ nav }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingBottom: 20,
      }}
    >
      <BHdr title="About Us" back={() => nav("home")} />
      <div style={{ padding: "18px 15px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,rgba(0,229,176,0.15),rgba(59,130,246,0.15))",
              border: `1.5px solid ${T.acc}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 11px",
              fontSize: 26,
            }}
          >
            ₿
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 900,
              color: T.text,
              marginBottom: 3,
            }}
          >
            Coinbase AI-Quant
          </div>
          <div
            style={{
              fontSize: 10,
              color: T.dim,
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            VERSION: 2.1.0
          </div>
        </div>
        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "16px",
            border: `1px solid ${T.line}`,
            marginBottom: 13,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.acc,
              marginBottom: 9,
            }}
          >
            Crypto creates economic freedom.
          </div>
          {[
            "Crypto creates economic freedom by ensuring people can participate fairly in the economy. Coinbase is on a mission to increase economic freedom for more than 1 billion people.",
            "We provide a trusted platform for trading, staking, safekeeping, spending, and fast, free global transfers.",
            "We provide critical infrastructure for onchain activity and support builders who share our vision.",
          ].map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: 11,
                color: T.dim,
                lineHeight: 1.75,
                marginBottom: 8,
              }}
            >
              {p}
            </p>
          ))}
        </div>
        <div
          style={{
            background:
              "linear-gradient(135deg,rgba(0,229,176,0.07),rgba(59,130,246,0.07))",
            borderRadius: 13,
            padding: "15px",
            border: "1px solid rgba(0,229,176,0.17)",
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>
            Our mission:
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: T.text,
              lineHeight: 1.4,
            }}
          >
            Increase economic freedom for 1 billion+ people.
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 10,
            color: T.dim,
            letterSpacing: 1,
          }}
        >
          © 2026 COINBASE TECHNOLOGY.
        </div>
      </div>
    </div>
  );
}