"use client";
import { useState, useEffect } from "react";
import { T, S, COINS, NEWS, PE, f2, usd } from "../lib/store";
import { PB, BHdr, CoinIcon } from "../components/UI";
import { API_URL } from "../lib/config";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────
   ORIGINAL DESIGN SYSTEM
   Dark theme + Neon Green (#00e5b0) + Blue (#3b82f6)
   Font: Sora / Segoe UI
───────────────────────────────────────────────────────────────*/

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  body, #root { background: ${T.bg}; font-family: 'Sora', 'Segoe UI', sans-serif; }

  /* ===== HIDE SCROLLBARS COMPLETELY - KEEP SCROLLING ===== */
  ::-webkit-scrollbar { display: none; width: 0; height: 0; background: transparent; }
  ::-webkit-scrollbar-track { display: none; background: transparent; }
  ::-webkit-scrollbar-thumb { display: none; background: transparent; }
  * { scrollbar-width: none; -ms-overflow-style: none; }

  .lx-card {
    background: ${T.card};
    border: 1px solid ${T.line};
    border-radius: 13px;
    transition: border-color 0.2s;
  }
  .lx-card:hover {
    border-color: ${T.acc};
  }

  .lx-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid ${T.line};
    background: ${T.card};
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 8px;
  }
  .lx-row:hover {
    border-color: ${T.acc};
    background: ${T.card2};
  }

  .tag-up   { background: rgba(16,185,129,0.1); color: ${T.green}; }
  .tag-down { background: rgba(239,68,68,0.1);  color: ${T.red}; }

  /* ===== MOBILE OVERRIDES ===== */
  @media (max-width: 480px) {
    .lx-card { border-radius: 11px; }
    .lx-row { padding: 10px 12px; margin-bottom: 6px; gap: 10px; }
  }
`;

/* ── Shared label ─────────────────────────────────── */
const SecLabel = ({ title, action, actionLabel }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    }}
  >
    <span
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: T.text,
        letterSpacing: 0.3,
      }}
    >
      {title}
    </span>
    {action && (
      <span
        onClick={action}
        style={{
          fontSize: 11,
          color: T.acc,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {actionLabel} →
      </span>
    )}
  </div>
);

/* ── Banner ──────────────────────────────────────────────── */
export function Banner({ px }) {
  const [active, setActive] = useState(0);

  const slides = [
    {
      title: "Trade Smarter",
      sub: "Real-time AI analytics",
      bg: "linear-gradient(135deg,#071a2e,#0c2a40,#0ea5e9)",
      icon: (
        <svg width="52" height="52" viewBox="0 0 62 62" fill="none">
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
      title: "Bank-Grade Security",
      sub: "Assets protected 24/7",
      bg: "linear-gradient(135deg,#071a12,#0c2a1a,#10b981)",
      icon: (
        <svg width="52" height="52" viewBox="0 0 62 62" fill="none">
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
      title: "Coin Base",
      sub: "Your gateway to crypto",
      bg: "linear-gradient(135deg,#140f28,#1e1040,#7c3aed)",
      icon: (
        <svg width="52" height="52" viewBox="0 0 62 62" fill="none">
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
    const t = setInterval(() => setActive((x) => (x + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const sl = slides[active];

  return (
    <div style={{ padding: "0 0 12px" }}>
      <div
        style={{
          borderRadius: 16,
          background: sl.bg,
          height: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 20px",
          position: "relative",
          overflow: "hidden",
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
        {sl.icon}
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
            {sl.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              marginTop: 3,
            }}
          >
            {sl.sub}
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
            onClick={() => setActive(i)}
            style={{
              height: 4,
              borderRadius: 2,
              cursor: "pointer",
              width: i === active ? 22 : 6,
              background: i === active ? T.acc : T.line,
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Market Row ───────────────────────────────────────────── */
function MarketRow({ c, px, nav }) {
  const p = px[c.id] || 0;
  const h = PE.h?.[c.id] || [];
  const prev = h.length > 1 ? h[Math.max(0, h.length - 20)].c : p;
  const chg = ((p - prev) / prev) * 100;
  const isUp = chg >= 0;
  const sl = h.slice(-14);
  const mn = Math.min(...sl.map((x) => x.c));
  const mx = Math.max(...sl.map((x) => x.c));
  const rg = mx - mn || 0.001;
  const pts = sl
    .map(
      (x, i) => `${i * (55 / (sl.length - 1))},${20 - ((x.c - mn) / rg) * 18}`,
    )
    .join(" ");

  return (
    <div className="lx-row" onClick={() => nav("trade", c.id)}>
      <CoinIcon c={c} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
          {c.id}
        </div>
        <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{c.name}</div>
      </div>
      <svg width="50" height="22" viewBox="0 0 56 22" style={{ flexShrink: 0 }}>
        {sl.length > 1 && (
          <polyline
            points={pts}
            fill="none"
            stroke={isUp ? T.green : T.red}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <div style={{ textAlign: "right", minWidth: 64, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
          {usd(p)}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: isUp ? T.green : T.red,
            marginTop: 1,
          }}
        >
          {isUp ? "+" : ""}
          {f2(chg, 2)}%
        </div>
      </div>
    </div>
  );
}

/* ── HomePage ─────────────────────────────────────────────── */
export function HomePage({ nav, px, user }) {
  const txs = (
    S.users?.[user?.username]?.transactions ||
    user?.transactions ||
    []
  ).slice(0, 5);

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
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .home-root { max-width: 100vw; overflow-x: hidden; }
        .home-grid { padding: 12px 14px 90px; }
        .qa-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .qa-card {
          background: ${T.card};
          border: 1px solid ${T.line};
          border-radius: 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 6px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .qa-card:hover { border-color: ${T.acc}; }
        .qa-icon {
          width: 48px; height: 48px;
          background: ${T.card2};
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
        }
        .qa-label {
          font-size: 11px; font-weight: 600;
          color: ${T.dim};
        }
        .hot-card {
          min-width: 110px;
          flex-shrink: 0;
          padding: 12px 10px;
          cursor: pointer;
        }
        @media (max-width: 380px) {
          .qa-icon { width: 42px; height: 42px; }
          .qa-label { font-size: 10px; }
          .hot-card { min-width: 95px; padding: 10px 8px; }
        }
      `}</style>

      <div
        className="home-root"
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
      >
        <div className="home-grid">
          <Banner px={px} />

          {/* Quick Actions */}
          <div className="qa-grid">
            {qa.map((a) => (
              <div key={a.l} onClick={() => nav(a.p)} className="qa-card">
                <div className="qa-icon">
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
                <span className="qa-label">{a.l}</span>
              </div>
            ))}
          </div>

          {/* Hot Trades */}
          <div>
            <SecLabel title="Hot Trades" />
            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {COINS.map((c) => {
                const p = px[c.id] || 0;
                const h = PE.h?.[c.id] || [];
                const prev = h.length > 1 ? h[h.length - 2].c : p;
                const chg = prev ? ((p - prev) / prev) * 100 : 0;
                const isUp = chg >= 0;
                return (
                  <div
                    key={c.id}
                    onClick={() => nav("trade", c.id)}
                    className="lx-card hot-card"
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <CoinIcon c={c} size={32} />
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {c.id}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: isUp ? T.green : T.red,
                          }}
                        >
                          {isUp ? "+" : ""}
                          {f2(chg, 2)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.dim }}>{usd(p)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Markets */}
          <div>
            <SecLabel
              title="Markets"
              action={() => nav("market")}
              actionLabel="View All"
            />
            {COINS.slice(0, 5).map((c) => (
              <MarketRow key={c.id} c={c} px={px} nav={nav} />
            ))}
          </div>

          {/* Recent Transactions */}
          {txs.length > 0 && (
            <div>
              <SecLabel
                title="Recent Activity"
                action={() => nav("history")}
                actionLabel="Full History"
              />
              {txs.map((tx, i) => {
                const m = COINS.find((c) => c.id === tx.coin);
                return (
                  <div
                    key={i}
                    style={{
                      background: T.card,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      marginBottom: 8,
                      border: `1px solid ${T.line}`,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: tx.up
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(239,68,68,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        color: m?.cl || T.acc,
                        border: `1px solid ${tx.up ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}
                    >
                      {m?.sym || "$"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.type} · {tx.coin}
                      </div>
                      <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>
                        {tx.date}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: tx.up ? T.green : T.red,
                        flexShrink: 0,
                      }}
                    >
                      {tx.up ? "+" : "-"}
                      {usd(tx.usd)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Header ───────────────────────────────────── */
function LxHdr({ title, back, subtitle }) {
  return (
    <div
      style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${T.line}`,
        background: T.bg,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={back}
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
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SortArrow = ({ k }) => (
    <span
      style={{
        fontSize: 9,
        marginLeft: 3,
        opacity: sortKey === k ? 1 : 0.3,
        color: sortKey === k ? T.acc : T.dim,
      }}
    >
      {sortKey === k ? (sortDir === -1 ? "▼" : "▲") : "▼"}
    </span>
  );

/* ── NewsPage ─────────────────────────────────────────────── */
export function NewsPage({ nav }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 20,
        background: T.bg,
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <LxHdr title="News" back={() => nav("home")} />
      <div style={{ padding: "14px 14px" }}>
        {NEWS.map((n, i) => (
          <div
            key={i}
            className="lx-card"
            style={{ padding: "15px 14px", marginBottom: 10 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 16,
                  background: "rgba(0,229,176,0.1)",
                  color: T.acc,
                }}
              >
                {n.src}
              </span>
              <span style={{ fontSize: 9, color: T.dim }}>{n.ts}</span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.text,
                lineHeight: 1.45,
                marginBottom: 8,
              }}
            >
              {n.ttl}
            </div>
            <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.7 }}>
              {n.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MarketPage ───────────────────────────────────────────── */
export function MarketPage({ px, nav }) {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("cap");
  const [sortDir, setSortDir] = useState(-1);
  const [favs, setFavs] = useState([]);

  const TABS = ["All", "⭐ Favorites", "Layer 1", "DeFi", "Meme"];
  const CATEGORIES = {
    BTC: "Layer 1",
    ETH: "Layer 1",
    BNB: "Layer 1",
    SOL: "Layer 1",
    ADA: "Layer 1",
    AVAX: "Layer 1",
    DOT: "Layer 1",
    MATIC: "Layer 1",
    TON: "Layer 1",
    UNI: "DeFi",
    AAVE: "DeFi",
    LINK: "DeFi",
    DOGE: "Meme",
    SHIB: "Meme",
    XRP: "Exchange",
    LTC: "Payment",
    XLM: "Payment",
    ATOM: "Interoperability",
    TRX: "Layer 1",
  };

  const toggleFav = (id, e) => {
    e.stopPropagation();
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  };
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const coins = COINS.filter((c) => {
    if (tab === "⭐ Favorites") return favs.includes(c.id);
    if (tab !== "All") return CATEGORIES[c.id] === tab;
    return true;
  })
    .filter(
      (c) =>
        search === "" ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()),
    )
    .map((c) => {
      const p = px[c.id] || 0;
      const h = PE.h?.[c.id] || [];
      const prev24 = h.length > 1 ? h[Math.max(0, h.length - 20)].c : p;
      const chg24 = prev24 ? ((p - prev24) / prev24) * 100 : 0;
      const vol =
        (px[c.id] || 1) * (800000 + Math.abs(c.id.charCodeAt(0)) * 12000);
      return { ...c, p, chg24, vol, h };
    })
    .sort((a, b) => {
      const map = { price: "p", change: "chg24", volume: "vol" };
      const key = map[sortKey] || "vol";
      return (a[key] - b[key]) * sortDir;
    });

  

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        overflow: "hidden",
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .mkt-hdr { display: grid; grid-template-columns: 24px 1fr 72px 68px 52px; gap: 0; padding: 8px 12px; border-bottom: 1px solid ${T.line}; background: ${T.surface}; }
        .mkt-row { display: grid; grid-template-columns: 24px 1fr 72px 68px 52px; align-items: center; padding: 10px 12px; border-bottom: 1px solid ${T.line}; cursor: pointer; transition: background 0.15s; }
        .mkt-vol { display: block; }
        @media (max-width: 430px) {
          .mkt-hdr { grid-template-columns: 22px 1fr 64px 60px; padding: 6px 10px; }
          .mkt-row { grid-template-columns: 22px 1fr 64px 60px; padding: 9px 10px; }
          .mkt-vol { display: none !important; }
          .mkt-sparkline { display: none !important; }
        }
      `}</style>

      <div
        style={{
          padding: "12px 14px 0",
          borderBottom: `1px solid ${T.line}`,
          background: T.bg,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
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
              cursor: "pointer",
              color: T.text,
              fontSize: 16,
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
            Markets
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: T.dim,
              background: T.card,
              border: `1px solid ${T.line}`,
              padding: "3px 8px",
              borderRadius: 16,
            }}
          >
            {coins.length} assets
          </span>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.dim}
            strokeWidth="2"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coin / token"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              background: T.card,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              color: T.text,
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 0,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px 8px 0 0",
                border: `1px solid ${tab === t ? T.acc : "transparent"}`,
                borderBottom:
                  tab === t ? `2px solid ${T.acc}` : `1px solid transparent`,
                background: tab === t ? "rgba(0,229,176,0.08)" : "transparent",
                color: tab === t ? T.acc : T.dim,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mkt-hdr">
        <div />
        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>Name</div>
        <div
          onClick={() => handleSort("price")}
          style={{
            fontSize: 10,
            color: T.dim,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "right",
          }}
        >
          Price <SortArrow k="price" />
        </div>
        <div
          onClick={() => handleSort("change")}
          style={{
            fontSize: 10,
            color: T.dim,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "right",
          }}
        >
          24h% <SortArrow k="change" />
        </div>
        <div
          className="mkt-vol"
          onClick={() => handleSort("volume")}
          style={{
            fontSize: 10,
            color: T.dim,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "right",
          }}
        >
          Vol <SortArrow k="volume" />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        {coins.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: T.dim,
              fontSize: 13,
            }}
          >
            {tab === "⭐ Favorites"
              ? "No favourites yet — tap ☆ to add"
              : "No results"}
          </div>
        ) : (
          coins.map((c, i) => {
            const isUp = c.chg24 >= 0;
            const isFav = favs.includes(c.id);
            const sl = c.h.slice(-14);
            const mn = Math.min(...sl.map((x) => x.c));
            const mx = Math.max(...sl.map((x) => x.c));
            const rg = mx - mn || 0.001;
            const pts = sl
              .map(
                (x, idx) =>
                  `${(idx / (sl.length - 1)) * 46},${16 - ((x.c - mn) / rg) * 14}`,
              )
              .join(" ");
            const volStr =
              c.vol >= 1e9
                ? (c.vol / 1e9).toFixed(1) + "B"
                : (c.vol / 1e6).toFixed(0) + "M";
            return (
              <div
                key={c.id}
                className="mkt-row"
                onClick={() => nav("trade", c.id)}
              >
                <div
                  onClick={(e) => toggleFav(c.id, e)}
                  style={{
                    fontSize: 13,
                    color: isFav ? T.gold : T.line,
                    cursor: "pointer",
                  }}
                >
                  {isFav ? "★" : "☆"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <CoinIcon c={c} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{ fontSize: 12, fontWeight: 700, color: T.text }}
                    >
                      {c.id}
                      <span
                        style={{ fontSize: 9, color: T.dim, marginLeft: 3 }}
                      >
                        /USDT
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                      {c.name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                    {usd(c.p)}
                  </div>
                  {sl.length > 1 && (
                    <svg
                      className="mkt-sparkline"
                      width="40"
                      height="14"
                      viewBox="0 0 46 16"
                    >
                      <polyline
                        points={pts}
                        fill="none"
                        stroke={isUp ? T.green : T.red}
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "3px 6px",
                      borderRadius: 5,
                      background: isUp
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(239,68,68,0.12)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: isUp ? T.green : T.red,
                    }}
                  >
                    {isUp ? "+" : ""}
                    {f2(c.chg24, 2)}%
                  </div>
                </div>
                <div
                  className="mkt-vol"
                  style={{ textAlign: "right", fontSize: 10, color: T.dim }}
                >
                  {volStr}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── HistoryPage ──────────────────────────────────────────── */
export function HistoryPage({ user, onBack }) {
  const [filt, sf] = useState("All");
  const all = user?.transactions || [];
  const list = filt === "All" ? all : all.filter((t) => t.type === filt);
  const statusColor = (s) =>
    ({ won: T.green, lost: T.red, pending: T.gold })[s] || T.dim;
  const FILTERS = [
    "All",
    "Binary Trade",
    "Deposit",
    "Withdraw",
    "Freeze",
    "Unfreeze",
  ];

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
      <style>{GLOBAL_CSS}</style>
      <LxHdr title="History" back={onBack} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "14px 14px 24px" }}>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 16,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => sf(t)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: `1px solid ${filt === t ? T.acc : T.line}`,
                  background: filt === t ? "rgba(0,229,176,0.1)" : T.card,
                  color: filt === t ? T.acc : T.dim,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 13, color: T.dim }}>
                No transactions found
              </div>
            </div>
          ) : (
            list.map((tx, i) => {
              const isBinary = tx.type === "Binary Trade";
              const sc = statusColor(tx.status);
              const typeIcon =
                {
                  "Binary Trade": "🎲",
                  Deposit: "💰",
                  Withdraw: "💸",
                  Freeze: "❄️",
                  Unfreeze: "🔥",
                }[tx.type] || "·";
              return (
                <div
                  key={i}
                  style={{
                    background: T.card,
                    borderRadius: 14,
                    marginBottom: 12,
                    border: `1px solid ${tx.status === "pending" ? T.gold : tx.status === "won" ? T.green : tx.status === "lost" ? T.red : T.line}`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderBottom: `1px solid ${T.line}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: T.card2,
                          border: `1px solid ${T.line}`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                        }}
                      >
                        {typeIcon}
                      </span>
                      <div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {tx.type}
                        </span>
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 12,
                            background: `${sc}18`,
                            color: sc,
                          }}
                        >
                          {(tx.status || "").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: T.dim }}>
                      {tx.formattedDate ||
                        new Date(tx.date).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                  </div>
                  <div style={{ padding: "14px 14px" }}>
                    {isBinary ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px 0",
                        }}
                      >
                        {[
                          {
                            label: "Order No.",
                            value: (
                              <span
                                style={{
                                  color: T.acc,
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                }}
                              >
                                {tx.orderNumber || "—"}
                              </span>
                            ),
                            key: "orderNo",
                          },
                          {
                            label: "Currency",
                            value: `${tx.coin}/USDT`,
                            key: "currency",
                          },
                          {
                            label: "Order Amount",
                            value: (
                              <span style={{ color: T.gold }}>
                                ${tx.amount}
                              </span>
                            ),
                            key: "orderAmount",
                          },
                          {
                            label: "Profit",
                            value: (
                              <span
                                style={{
                                  color:
                                    tx.status === "won"
                                      ? T.green
                                      : tx.status === "lost"
                                        ? T.red
                                        : T.dim,
                                }}
                              >
                                {tx.status === "won"
                                  ? `+$${tx.profitAmount || 0}`
                                  : tx.status === "lost"
                                    ? `-$${tx.amount}`
                                    : "—"}
                              </span>
                            ),
                            key: "profit",
                          },
                          {
                            label: "Direction",
                            value: (
                              <span
                                style={{
                                  color:
                                    tx.orderType === "up" ? T.green : T.red,
                                }}
                              >
                                {tx.orderType === "up"
                                  ? "Buy Up ↑"
                                  : "Buy Down ↓"}
                              </span>
                            ),
                            key: "direction",
                          },
                          {
                            label: "Scale",
                            value: (
                              <span style={{ color: T.blue }}>
                                {tx.profitPercent || 0}%
                              </span>
                            ),
                            key: "scale",
                          },
                          {
                            label: "Duration",
                            value: `${tx.timeSeconds || "—"}s`,
                            key: "duration",
                          },
                        ].map((item) => (
                          <div key={item.key} style={{ padding: "4px 0" }}>
                            <div
                              style={{
                                fontSize: 9,
                                color: T.dim,
                                marginBottom: 2,
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: T.text,
                              }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 11, color: T.dim }}>
                          Amount
                        </span>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color:
                              tx.type === "Deposit" || tx.type === "Unfreeze"
                                ? T.green
                                : T.red,
                          }}
                        >
                          {tx.type === "Deposit" || tx.type === "Unfreeze"
                            ? "+"
                            : "-"}
                          ${tx.usd || tx.amount || 0}
                        </span>
                      </div>
                    )}
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

/* ── ProfilePage ──────────────────────────────────────────── */
export function ProfilePage({ user, onLogout, onSub, re }) {
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [frozenTotal, setFrozenTotal] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(user?.balance || 0);
  const [, setTick] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState("male1");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // Load saved avatar on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      setSelectedAvatar(savedAvatar);
    }
  }, []);

  // Listen for avatar changes from other components
  useEffect(() => {
    const handleAvatarUpdate = () => {
      const savedAvatar = localStorage.getItem("userAvatar");
      if (savedAvatar) {
        setSelectedAvatar(savedAvatar);
      }
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdate);
    return () =>
      window.removeEventListener("avatarUpdated", handleAvatarUpdate);
  }, []);

  const calc = async () => {
    try {
      const sessionUser = localStorage.getItem("session");
      if (sessionUser) {
        const res = await fetch(`${API_URL}/api/users/${sessionUser}`);
        const u = await res.json();
        if (!u.error) {
          setFrozenBalance(parseFloat(Number(u.balance || 0).toFixed(2)));
          setFrozenTotal(parseFloat(Number(u.frozenTotal || 0).toFixed(2)));
          setCurrentBalance(parseFloat(Number(u.balance || 0).toFixed(2)));
          setTick((n) => n + 1);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    calc();
    const interval = setInterval(calc, 5000);
    return () => clearInterval(interval);
  }, []);

  const getAvatarUrl = (avatarId) => {
    const avatars = {
      male1: "https://api.dicebear.com/7.x/micah/svg?seed=Michael",
      male2: "https://api.dicebear.com/7.x/micah/svg?seed=James",
      male3: "https://api.dicebear.com/7.x/micah/svg?seed=David",
      female1: "https://api.dicebear.com/7.x/micah/svg?seed=Sarah",
      female2: "https://api.dicebear.com/7.x/micah/svg?seed=Emma",
      female3: "https://api.dicebear.com/7.x/micah/svg?seed=Lisa",
    };
    return avatars[avatarId] || avatars.male1;
  };

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
    localStorage.setItem("userAvatar", avatarId);
    setShowAvatarMenu(false);
    // Dispatch event so top bar updates
    window.dispatchEvent(new Event("avatarUpdated"));
  };

  const liveUser = S.users?.[user?.username] || user || {};
  const isBan = (S.banned || []).includes(user?.username);
  const binaryTradesCount = (liveUser?.transactions || []).filter(
    (t) => t.isBinaryTrade === true || t.type === "Binary Trade",
  ).length;
  const creditScore =
    S.users?.[user?.username]?.creditScore ?? liveUser?.creditScore ?? 50;
  const country =
    S.users?.[user?.username]?.country ||
    liveUser?.country ||
    user?.country ||
    "—";

  const menu = [
    {
      ic: "📊",
      l: "Binary History",
      s: "All binary trades",
      sp: "binaryhistory",
    },
    { ic: "🔐", l: "Security Settings", s: "Password & 2FA", sp: "sec" },
    { ic: "💳", l: "Bank Cards", s: "Payment cards", sp: "card" },
    { ic: "🔔", l: "Notifications", s: `${unreadCount} unread`, sp: "notif" },
    { ic: "🌐", l: "Language", s: "English", sp: "lang" },
    { ic: "📄", l: "Terms of Service", s: "Legal", sp: "terms" },
    { ic: "✏️", l: "Edit Profile", s: "Update info", sp: "edit" },
  ];

  const AVATARS_LIST = [
    {
      id: "male1",
      name: "Michael",
      image: "https://api.dicebear.com/7.x/micah/svg?seed=Michael",
    },
    {
      id: "male2",
      name: "James",
      image: "https://api.dicebear.com/7.x/micah/svg?seed=James",
    },
    {
      id: "male3",
      name: "David",
      image: "https://api.dicebear.com/7.x/micah/svg?seed=David",
    },
    {
      id: "female1",
      name: "Sarah",
      image: "https://api.dicebear.com/7.x/micah/svg?seed=Sarah",
    },
    {
      id: "female2",
      name: "Emma",
      image: "https://api.dicebear.com/7.x/micah/svg?seed=Emma",
    },
    {
      id: "female3",
      name: "Lisa",
      image: "https://api.dicebear.com/7.x/micah/svg?seed=Lisa",
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 80,
        background: T.bg,
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ padding: "20px 14px 0" }}>
        {isBan && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 11,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: 11,
              color: T.red,
              fontWeight: 500,
            }}
          >
            ⚠ Account suspended by administrator.
          </div>
        )}

        {/* Profile Header - Clickable Avatar with Dropdown */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 13,
            marginBottom: 18,
          }}
        >
          <div
            onClick={() => setShowAvatarMenu(!showAvatarMenu)}
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              flexShrink: 0,
              overflow: "hidden",
              border: `1.5px solid ${T.acc}`,
              cursor: "pointer",
            }}
          >
            <img
              src={getAvatarUrl(selectedAvatar)}
              alt="avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Avatar Dropdown Menu */}
          {showAvatarMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 10,
                width: 280,
                background: T.card,
                borderRadius: 16,
                border: `1px solid ${T.line}`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                zIndex: 1000,
                overflow: "hidden",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${T.line}`,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.text,
                  background: T.card2,
                  textAlign: "center",
                }}
              >
                Choose Avatar
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  padding: 16,
                }}
              >
                {AVATARS_LIST.map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 8px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background:
                        selectedAvatar === avatar.id
                          ? "rgba(0,229,176,0.1)"
                          : "transparent",
                      border:
                        selectedAvatar === avatar.id
                          ? `1px solid ${T.acc}`
                          : `1px solid transparent`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border:
                          selectedAvatar === avatar.id
                            ? `2px solid ${T.acc}`
                            : "none",
                      }}
                    >
                      <img
                        src={avatar.image}
                        alt={avatar.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: 11, color: T.text, fontWeight: 500 }}
                    >
                      {avatar.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
              {liveUser?.fullName || liveUser?.username}
            </div>
            <div style={{ fontSize: 10, color: T.dim, marginTop: 3 }}>
              @{liveUser?.username} · {liveUser?.email}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(145deg,#0f1622,#1a2840)",
            borderRadius: 18,
            padding: "18px 16px",
            marginBottom: 13,
            border: `1px solid rgba(0,229,176,0.15)`,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "rgba(0,229,176,0.5)",
              letterSpacing: 2.5,
              marginBottom: 5,
              fontWeight: 600,
            }}
          >
            TOTAL PORTFOLIO VALUE
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: T.text,
              marginBottom: 14,
            }}
          >
            {usd((currentBalance + frozenTotal).toFixed(2))}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 11,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 4,
                }}
              >
                Cash Balance
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>
                {usd(currentBalance)}
              </div>
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 11,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 4,
                }}
              >
                Frozen
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>
                {usd(frozenTotal)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            marginBottom: 13,
          }}
        >
          {[
            { l: "Binary Trades", v: String(binaryTradesCount) },
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
                  ? "● " + creditScore
                  : creditScore >= 50
                    ? "● " + creditScore
                    : "● " + creditScore,
              c:
                creditScore >= 80
                  ? T.green
                  : creditScore >= 50
                    ? T.gold
                    : T.red,
            },
            { l: "Country", v: country },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: T.card,
                borderRadius: 13,
                padding: "12px 12px",
                border: `1px solid ${T.line}`,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 9, color: T.dim, letterSpacing: 0.5 }}>
                {s.l}
              </div>
              <div
                style={{ fontSize: 13, fontWeight: 700, color: s.c || T.text }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: T.card,
            borderRadius: 16,
            padding: "4px 14px",
            border: `1px solid ${T.line}`,
            marginBottom: 13,
          }}
        >
          {menu.map((item, i) => (
            <div
              key={item.sp}
              onClick={() => onSub(item.sp)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 0",
                borderBottom:
                  i < menu.length - 1 ? `1px solid ${T.line}` : "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  flexShrink: 0,
                  background: T.card2,
                  border: `1px solid ${T.line}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: T.acc,
                }}
              >
                {item.ic}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {item.l}
                </div>
                <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                  {item.s}
                </div>
              </div>
              <span style={{ color: T.dim, fontSize: 14, flexShrink: 0 }}>
                ›
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 13,
            cursor: "pointer",
            background: "rgba(239,68,68,0.06)",
            border: `1px solid rgba(239,68,68,0.2)`,
            color: T.red,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Sign Out
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 9,
            color: T.dim,
            letterSpacing: 1.5,
          }}
        >
          COINBASE AI-QUANT · V2.1.0
        </div>
      </div>
    </div>
  );
}

/* ── AboutPage ────────────────────────────────────────────── */
export function AboutPage({ nav }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 24,
        background: T.bg,
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <LxHdr title="About" back={() => nav("home")} />
      <div style={{ padding: "20px 14px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              margin: "0 auto 13px",
              background: "linear-gradient(135deg,#1a1606,#2a2010)",
              border: `1.5px solid ${T.acc}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: T.acc,
            }}
          >
            ₿
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: T.text,
              marginBottom: 5,
            }}
          >
            Coinbase AI-Quant
          </div>
          <div
            style={{
              fontSize: 9,
              color: T.dim,
              letterSpacing: 3,
              fontWeight: 600,
            }}
          >
            VERSION 2.1.0
          </div>
        </div>
        <div
          style={{
            background: `linear-gradient(135deg, rgba(0,229,176,0.06), rgba(59,130,246,0.04))`,
            borderRadius: 16,
            padding: "18px 16px",
            marginBottom: 13,
            border: `1px solid rgba(0,229,176,0.15)`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: T.acc,
              marginBottom: 10,
            }}
          >
            Crypto creates economic freedom.
          </div>
          {[
            "Coinbase is on a mission to increase economic freedom for more than 1 billion people by building a trusted platform for trading, staking, safekeeping, and global transfers.",
            "We provide critical infrastructure for onchain activity and support builders who share our vision of an open financial system.",
            "Our institutional-grade platform combines the security of traditional finance with the innovation of decentralized technology.",
          ].map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: 12,
                color: T.dim,
                lineHeight: 1.75,
                marginBottom: i < 2 ? 9 : 0,
              }}
            >
              {p}
            </p>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
            marginBottom: 13,
          }}
        >
          {[
            { v: "1B+", l: "Target Users" },
            { v: "100+", l: "Countries" },
            { v: "24/7", l: "Uptime" },
            { v: "$0", l: "Transfer Fees" },
          ].map((s) => (
            <div
              key={s.l}
              className="lx-card"
              style={{ padding: "14px", textAlign: "center" }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: T.acc }}>
                {s.v}
              </div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 3 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 9,
            color: T.dim,
            letterSpacing: 2,
          }}
        >
          © 2026 COINBASE TECHNOLOGY, INC.
        </div>
      </div>
    </div>
  );
}
