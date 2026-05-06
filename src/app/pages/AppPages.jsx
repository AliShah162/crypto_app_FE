"use client";
import { useState, useEffect } from "react";
import { T, S, COINS, NEWS, PE, f2, usd } from "../lib/store";
import { PB, BHdr, CoinIcon } from "../components/UI";
import { API_URL } from "../lib/config";

/* ─────────────────────────────────────────────────────────────
   LUXURY DESIGN SYSTEM
   Obsidian + Champagne Gold + Ice Blue
   Font: Cormorant Garamond (display) + DM Sans (body)
───────────────────────────────────────────────────────────────*/
const LX = {
  bg:      "#080b12",
  surface: "#0d1117",
  card:    "#111620",
  card2:   "#161c28",
  glass:   "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.07)",
  borderHover: "rgba(212,175,55,0.35)",
  gold:    "#d4af37",
  goldLight:"#f0d060",
  goldDim: "rgba(212,175,55,0.5)",
  ice:     "#a8d8f0",
  iceGlow: "rgba(168,216,240,0.15)",
  green:   "#00c896",
  red:     "#f04060",
  text:    "#eef0f5",
  textDim: "#6b7280",
  textMid: "#9ca3af",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

const GLOBAL_CSS = `
  ${FONTS}
  * { box-sizing: border-box; }
  body, #root { background: ${LX.bg}; font-family: 'DM Sans', sans-serif; }

  /* ===== HIDE SCROLLBARS COMPLETELY - KEEP SCROLLING ===== */
  ::-webkit-scrollbar { display: none; width: 0; height: 0; background: transparent; }
  ::-webkit-scrollbar-track { display: none; background: transparent; }
  ::-webkit-scrollbar-thumb { display: none; background: transparent; }
  * { scrollbar-width: none; -ms-overflow-style: none; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.92); opacity: 0.6; }
    50%  { transform: scale(1.06); opacity: 0.2; }
    100% { transform: scale(0.92); opacity: 0.6; }
  }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .lx-card {
    background: ${LX.card};
    border: 1px solid ${LX.border};
    border-radius: 16px;
    transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s;
  }
  .lx-card:hover {
    border-color: ${LX.borderHover};
    box-shadow: 0 0 28px rgba(212,175,55,0.06);
  }

  .lx-btn-gold {
    background: linear-gradient(135deg, #c49a00, #f0d060, #c49a00);
    background-size: 200%;
    border: none;
    color: #080b12;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background-position 0.4s, transform 0.15s, box-shadow 0.3s;
  }
  .lx-btn-gold:hover {
    background-position: right;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(212,175,55,0.3);
  }

  .lx-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px;
    border-radius: 13px;
    cursor: pointer;
    border: 1px solid ${LX.border};
    background: ${LX.card};
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 8px;
  }
  .lx-row:hover {
    border-color: ${LX.borderHover};
    background: ${LX.card2};
  }

  .tag-up   { background: rgba(0,200,150,0.1); color: #00c896; }
  .tag-down { background: rgba(240,64,96,0.1);  color: #f04060; }

  .animate-in { animation: fadeUp 0.4s ease both; }

  /* ===== MOBILE OVERRIDES ===== */
  @media (max-width: 480px) {
    .lx-card { border-radius: 13px; }
    .lx-row { padding: 10px 12px; margin-bottom: 6px; gap: 10px; }
  }
`;

/* ── Shared luxury label ─────────────────────────────────── */
const SecLabel = ({ title, action, actionLabel }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:600, color:LX.text, letterSpacing:0.3 }}>
      {title}
    </span>
    {action && (
      <span onClick={action} style={{ fontSize:11, color:LX.gold, fontWeight:600, cursor:"pointer", letterSpacing:0.5 }}>
        {actionLabel} →
      </span>
    )}
  </div>
);

/* ── Price Ticker ─────────────────────────────────────────── */
function PriceTicker({ px }) {
  const items = COINS.map(c => {
    const p = px[c.id] || 0;
    const h = PE.h?.[c.id] || [];
    const prev = h.length > 1 ? h[h.length - 2].c : p;
    const chg = prev ? ((p - prev) / prev) * 100 : 0;
    return { ...c, p, chg };
  });
  const doubled = [...items, ...items];
  return (
    <div style={{
      overflow:"hidden", borderBottom:`1px solid ${LX.border}`,
      borderTop:`1px solid ${LX.border}`,
      background:"rgba(212,175,55,0.03)",
      padding:"6px 0",
    }}>
      <div style={{
        display:"flex", gap:28,
        animation:"ticker 28s linear infinite",
        width:"max-content",
      }}>
        {doubled.map((c, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:600, color:LX.textMid }}>{c.id}</span>
            <span style={{ fontSize:10, fontWeight:700, color:LX.text }}>{usd(c.p)}</span>
            <span style={{ fontSize:9.5, fontWeight:600, color: c.chg >= 0 ? LX.green : LX.red }}>
              {c.chg >= 0 ? "▲" : "▼"} {Math.abs(f2(c.chg,2))}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Banner ──────────────────────────────────────────────── */
export function Banner({ px }) {
  const [active, setActive] = useState(0);

  const slides = [
    {
      eyebrow: "MARKET INTELLIGENCE",
      title: "Trade with Precision",
      sub: "AI-driven signals. Institutional-grade analytics.",
      accent: LX.gold,
      bg: "radial-gradient(ellipse at 70% 50%, rgba(212,175,55,0.12) 0%, transparent 60%), linear-gradient(135deg,#0a0e18,#111620)",
      glyph: (
        <svg width="60" height="60" viewBox="0 0 72 72" fill="none" style={{ flexShrink:0 }}>
          <circle cx="36" cy="36" r="34" stroke="rgba(212,175,55,0.2)" strokeWidth="1"/>
          <circle cx="36" cy="36" r="26" stroke="rgba(212,175,55,0.1)" strokeWidth="1"/>
          <polyline points="8,52 20,32 32,40 46,18 64,24"
            fill="none" stroke={LX.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="46" cy="18" r="4" fill={LX.gold}/>
          <circle cx="64" cy="24" r="3" fill="rgba(212,175,55,0.4)"/>
        </svg>
      ),
    },
    {
      eyebrow: "VAULT SECURITY",
      title: "Bank-Grade Protection",
      sub: "Multi-layer encryption. Cold storage reserves.",
      accent: LX.ice,
      bg: "radial-gradient(ellipse at 70% 50%, rgba(168,216,240,0.1) 0%, transparent 60%), linear-gradient(135deg,#080c15,#0f1a24)",
      glyph: (
        <svg width="60" height="60" viewBox="0 0 72 72" fill="none" style={{ flexShrink:0 }}>
          <circle cx="36" cy="36" r="34" stroke="rgba(168,216,240,0.2)" strokeWidth="1"/>
          <path d="M36 10L58 20L58 42C58 56 36 64 36 64C36 64 14 56 14 42L14 20Z"
            fill="rgba(168,216,240,0.06)" stroke={LX.ice} strokeWidth="1.5"/>
          <path d="M26 38L33 45L48 30" stroke={LX.ice} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
      ),
    },
    {
      eyebrow: "COINBASE AI-QUANT",
      title: "The Premium Exchange",
      sub: "Institutional liquidity. Zero compromise.",
      accent: "#a78bfa",
      bg: "radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.12) 0%, transparent 60%), linear-gradient(135deg,#0c0a18,#16102a)",
      glyph: (
        <svg width="60" height="60" viewBox="0 0 72 72" fill="none" style={{ flexShrink:0 }}>
          <circle cx="36" cy="36" r="34" stroke="rgba(167,139,250,0.25)" strokeWidth="1"/>
          <circle cx="36" cy="36" r="14" fill="rgba(124,58,237,0.12)" stroke="#a78bfa" strokeWidth="1.5"/>
          <text x="36" y="43" textAnchor="middle" fontSize="18" fill={LX.gold} fontWeight="700" fontFamily="serif">₿</text>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setActive(x => (x + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const sl = slides[active];

  return (
    <div>
      <div style={{
        borderRadius:16, background:sl.bg, minHeight:130,
        display:"flex", alignItems:"center", gap:16, padding:"16px 20px",
        position:"relative", overflow:"hidden",
        boxShadow:`0 2px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
        border:`1px solid rgba(255,255,255,0.07)`,
        transition:"background 0.9s",
      }}>
        {/* decorative corner lines */}
        <div style={{ position:"absolute", top:0, left:0, width:36, height:36,
          borderTop:`1px solid ${sl.accent}`, borderLeft:`1px solid ${sl.accent}`,
          opacity:0.35, borderRadius:"14px 0 0 0" }}/>
        <div style={{ position:"absolute", bottom:0, right:0, width:36, height:36,
          borderBottom:`1px solid ${sl.accent}`, borderRight:`1px solid ${sl.accent}`,
          opacity:0.35, borderRadius:"0 0 14px 0" }}/>

        {sl.glyph}
        <div style={{ animation:"slideIn 0.4s ease both", flex:1, minWidth:0 }} key={active}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:sl.accent, marginBottom:5, opacity:0.8 }}>
            {sl.eyebrow}
          </div>
          <div style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(18px, 5vw, 26px)",
            fontWeight:700, color:LX.text, lineHeight:1.15,
          }}>
            {sl.title}
          </div>
          <div style={{ fontSize:"clamp(10px, 2.5vw, 11px)", color:LX.textDim, marginTop:5, lineHeight:1.5 }}>
            {sl.sub}
          </div>
        </div>
      </div>

      {/* dots */}
      <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:10 }}>
        {[0,1,2].map(i => (
          <div key={i} onClick={() => setActive(i)} style={{
            height:3, borderRadius:2, cursor:"pointer",
            width: i === active ? 24 : 6,
            background: i === active ? LX.gold : LX.border,
            transition:"all 0.35s",
          }}/>
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
  const mn = Math.min(...sl.map(x => x.c));
  const mx = Math.max(...sl.map(x => x.c));
  const rg = mx - mn || 0.001;
  const pts = sl.map((x,i) => `${i*(55/(sl.length-1))},${20 - ((x.c-mn)/rg)*18}`).join(" ");

  return (
    <div className="lx-row" onClick={() => nav("trade", c.id)}>
      <CoinIcon c={c} size={36}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:LX.text }}>{c.id}</div>
        <div style={{ fontSize:10, color:LX.textDim, marginTop:1 }}>{c.name}</div>
      </div>
      <svg width="50" height="22" viewBox="0 0 56 22" style={{ flexShrink:0 }}>
        {sl.length > 1 && (
          <polyline points={pts} fill="none"
            stroke={isUp ? LX.green : LX.red}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        )}
      </svg>
      <div style={{ textAlign:"right", minWidth:64, flexShrink:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:LX.text }}>{usd(p)}</div>
        <div style={{ fontSize:10, fontWeight:600, color: isUp ? LX.green : LX.red, marginTop:1 }}>
          {isUp ? "+" : ""}{f2(chg,2)}%
        </div>
      </div>
    </div>
  );
}

/* ── HomePage ─────────────────────────────────────────────── */
export function HomePage({ nav, px, user }) {
  const txs = (S.users?.[user?.username]?.transactions || user?.transactions || []).slice(0,5);

  const qa = [
    {
      l: "News",
      c: "#f0d060",
      p: "news",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0d060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>
        </svg>
      ),
    },
    {
      l: "Deposit",
      c: "#00c896",
      p: "deposit",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v13"/>
          <path d="M7 11l5 5 5-5"/>
          <path d="M3 19h18"/>
        </svg>
      ),
    },
    {
      l: "Withdraw",
      c: "#f04060",
      p: "withdraw",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f04060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21V8"/>
          <path d="M7 13l5-5 5 5"/>
          <path d="M3 5h18"/>
        </svg>
      ),
    },
    {
      l: "About",
      c: "#a78bfa",
      p: "about",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <circle cx="12" cy="8" r="0.5" fill="#a78bfa" stroke="#a78bfa" strokeWidth="1"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        /* ── prevent ANY horizontal overflow on mobile ── */
        .home-root { max-width: 100vw; overflow-x: hidden; }

        .home-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 22px;
          padding: 20px 24px;
          max-width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 1100px) {
          .home-grid { grid-template-columns: 1fr; }
          .home-right-col { display: none !important; }
        }
        @media (max-width: 900px) {
          .home-grid { padding: 12px 12px 90px; gap: 14px; }
        }
        @media (max-width: 600px) {
          .home-grid { padding: 10px 10px 90px; gap: 12px; }
          .home-right-col { display: none !important; }
        }

        /* ── Quick Actions: 4 equal columns, never overflow ── */
        .qa-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }
        .qa-card {
          background: ${LX.card};
          border: 1px solid ${LX.border};
          border-radius: 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 12px 4px;
          cursor: pointer;
          min-width: 0;
          overflow: hidden;
          transition: border-color 0.25s;
        }
        .qa-card:hover { border-color: ${LX.borderHover}; }
        .qa-icon-wrap {
          width: 40px; height: 40px;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .qa-label {
          font-size: 10px; font-weight: 600;
          color: ${LX.textMid};
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }
        @media (max-width: 380px) {
          .qa-grid { gap: 6px; }
          .qa-card { padding: 10px 3px; gap: 5px; }
          .qa-icon-wrap { width: 34px; height: 34px; border-radius: 9px; }
          .qa-label { font-size: 9px; }
        }

        /* ── Hot trades ── */
        .hot-card {
          min-width: 120px;
          flex-shrink: 0;
          padding: 13px 12px 11px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        @media (max-width: 430px) {
          .hot-card { min-width: 105px; padding: 11px 10px 10px; gap: 8px; }
        }
        @media (max-width: 380px) {
          .hot-card { min-width: 95px; padding: 10px 9px 9px; }
        }
      `}</style>

      <PriceTicker px={px}/>

      <div className="home-root" style={{ flex:1, overflowY:"auto", overflowX:"hidden", scrollbarWidth:"none", msOverflowStyle:"none" }}>
        <div className="home-grid">

          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0, overflow:"hidden" }}>

            <Banner px={px}/>

            {/* Quick Actions */}
            <div className="qa-grid">
              {qa.map((a, idx) => (
                <div key={a.l} onClick={() => nav(a.p)} className="qa-card"
                  style={{ animation:`fadeUp 0.4s ease ${idx*0.07}s both` }}>
                  <div className="qa-icon-wrap" style={{
                    background: `${a.c}14`,
                    border:`1px solid ${a.c}40`,
                    boxShadow:`0 0 12px ${a.c}16`,
                  }}>
                    {a.icon}
                  </div>
                  <span className="qa-label">{a.l}</span>
                </div>
              ))}
            </div>

            {/* Hot Trades */}
            <div>
              <SecLabel title="Hot Trades"/>
              <div style={{ display:"flex", gap:10, overflowX:"auto", scrollbarWidth:"none", paddingBottom:4 }}>
                {COINS.map((c, idx) => {
                  const p = px[c.id] || 0;
                  const h = PE.h?.[c.id] || [];
                  const prev = h.length > 1 ? h[h.length-2].c : p;
                  const chg = prev ? ((p-prev)/prev)*100 : 0;
                  const isUp = chg >= 0;
                  const color = isUp ? LX.green : LX.red;
                  const sl = h.slice(-16);
                  const mn = Math.min(...sl.map(x=>x.c));
                  const mx = Math.max(...sl.map(x=>x.c));
                  const rg = mx-mn||0.001;
                  const pts = sl.map((x,i)=>`${(i/(sl.length-1))*100},${28-((x.c-mn)/rg)*24}`).join(" ");
                  return (
                    <div key={c.id} onClick={() => nav("trade", c.id)}
                      className="lx-card hot-card"
                      style={{ animation:`fadeUp 0.4s ease ${idx*0.06}s both` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <CoinIcon c={c} size={30}/>
                        <div style={{
                          padding:"3px 7px", borderRadius:20, fontSize:9, fontWeight:700,
                          background: isUp ? "rgba(0,200,150,0.12)" : "rgba(240,64,96,0.12)",
                          color, flexShrink:0,
                        }}>
                          {isUp?"+":""}{f2(chg,2)}%
                        </div>
                      </div>
                      <svg width="100%" height="26" viewBox="0 0 100 28" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`g-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
                            <stop offset="100%" stopColor={color} stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        {sl.length>1&&<polygon points={`0,28 ${pts} 100,28`} fill={`url(#g-${c.id})`}/>}
                        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:LX.text }}>{c.id}</div>
                        <div style={{ fontSize:9.5, color:LX.textDim, marginTop:1 }}>{usd(p)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Markets (mobile) */}
            <div className="markets-mobile">
              <style>{`@media(min-width:1101px){.markets-mobile{display:none!important}}`}</style>
              <SecLabel title="Markets" action={() => nav("market")} actionLabel="View All"/>
              {COINS.map(c => <MarketRow key={c.id} c={c} px={px} nav={nav}/>)}
            </div>

            {/* Recent Transactions */}
            {txs.length > 0 && (
              <div>
                <SecLabel title="Recent Activity" action={() => nav("history")} actionLabel="Full History"/>
                {txs.map((tx, i) => {
                  const m = COINS.find(c => c.id === tx.coin);
                  return (
                    <div key={i} style={{
                      background:LX.card, borderRadius:13, padding:"12px 14px",
                      display:"flex", alignItems:"center", gap:11, marginBottom:8,
                      border:`1px solid ${LX.border}`,
                    }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, flexShrink:0,
                        background: tx.up ? "rgba(0,200,150,0.12)" : "rgba(240,64,96,0.1)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:14, color: m?.cl || LX.gold,
                        border:`1px solid ${tx.up ? "rgba(0,200,150,0.2)" : "rgba(240,64,96,0.2)"}`,
                      }}>
                        {m?.sym || "$"}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:LX.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {tx.type} · {tx.coin}
                        </div>
                        <div style={{ fontSize:10, color:LX.textDim, marginTop:2 }}>{tx.date}</div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color: tx.up ? LX.green : LX.red, flexShrink:0 }}>
                        {tx.up?"+":"-"}{usd(tx.usd)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="home-right-col" style={{
            display:"flex", flexDirection:"column", gap:16,
            height:"calc(100vh - 60px - 40px)", position:"sticky", top:0, minWidth:0,
          }}>
            {/* Balance Card */}
            <div style={{
              background:"linear-gradient(145deg,#0f1622,#18243a)",
              borderRadius:18, padding:"22px 20px", flexShrink:0,
              border:`1px solid rgba(212,175,55,0.15)`,
              boxShadow:"0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)",
              position:"relative", overflow:"hidden",
            }}>
              <div style={{
                position:"absolute", top:-30, right:-30, width:140, height:140,
                borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
              }}/>
              <div style={{ fontSize:9, color:LX.goldDim, letterSpacing:2.5, marginBottom:6, fontWeight:600 }}>
                AVAILABLE BALANCE
              </div>
              <div style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:32, fontWeight:700, color:LX.text, marginBottom:18, lineHeight:1,
              }}>
                {usd(user?.balance || 0)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                <button className="lx-btn-gold" onClick={() => nav("deposit")} style={{
                  padding:"11px", borderRadius:11, fontSize:11, letterSpacing:0.5,
                }}>
                  + Deposit
                </button>
                <button onClick={() => nav("withdraw")} style={{
                  padding:"11px", borderRadius:11, fontSize:11, fontWeight:600, letterSpacing:0.5,
                  background:"rgba(240,64,96,0.1)", border:"1px solid rgba(240,64,96,0.25)",
                  color:LX.red, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                  transition:"background 0.2s",
                }}>
                  − Withdraw
                </button>
              </div>
            </div>

            {/* Markets right panel */}
            <div style={{
              background:LX.card, borderRadius:16, border:`1px solid ${LX.border}`,
              flex:1, minHeight:0, display:"flex", flexDirection:"column", overflow:"hidden",
            }}>
              <div style={{
                padding:"15px 16px 12px", flexShrink:0,
                borderBottom:`1px solid ${LX.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600, color:LX.text }}>Markets</span>
                <span onClick={() => nav("market")} style={{ fontSize:10, color:LX.gold, fontWeight:600, cursor:"pointer", letterSpacing:0.5 }}>
                  View All →
                </span>
              </div>
              <div style={{ flex:1, overflowY:"scroll", padding:"10px 12px 12px", scrollbarWidth:"thin" }}>
                {COINS.map(c => <MarketRow key={c.id} c={c} px={px} nav={nav}/>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Luxury Back Header ───────────────────────────────────── */
function LxHdr({ title, back, subtitle }) {
  return (
    <div style={{
      padding:"16px 16px 13px",
      borderBottom:`1px solid ${LX.border}`,
      background:LX.bg,
      position:"sticky", top:0, zIndex:10,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={back} style={{
          width:36, height:36, borderRadius:10, border:`1px solid ${LX.border}`,
          background:LX.card, display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:LX.gold, fontSize:16, flexShrink:0,
          transition:"border-color 0.2s",
        }}>
          ←
        </button>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(17px, 5vw, 20px)", fontWeight:700, color:LX.text }}>
            {title}
          </div>
          {subtitle && <div style={{ fontSize:10, color:LX.textDim, marginTop:1 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── NewsPage ─────────────────────────────────────────────── */
export function NewsPage({ nav }) {
  return (
    <div style={{ flex:1, overflowY:"auto", paddingBottom:20, background:LX.bg }}>
      <style>{GLOBAL_CSS}</style>
      <LxHdr title="Market Intelligence" subtitle="Latest crypto news & analysis" back={() => nav("home")}/>
      <div style={{ padding:"14px 14px" }}>
        {NEWS.map((n, i) => (
          <div key={i} className="lx-card"
            style={{ padding:"16px 15px", marginBottom:10,
              animation:`fadeUp 0.4s ease ${i*0.06}s both` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{
                fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20,
                background:"rgba(212,175,55,0.1)", color:LX.gold, letterSpacing:0.8,
              }}>
                {n.src}
              </span>
              <span style={{ fontSize:9, color:LX.textDim }}>{n.ts}</span>
            </div>
            <div style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:"clamp(14px, 4vw, 16px)", fontWeight:600, color:LX.text, lineHeight:1.45, marginBottom:9,
            }}>
              {n.ttl}
            </div>
            <div style={{ fontSize:11, color:LX.textMid, lineHeight:1.7 }}>{n.body}</div>
            <div style={{ marginTop:14, height:1, background:`linear-gradient(90deg, ${LX.gold}33, transparent)` }}/>
          </div>
        ))}
      </div>
    </div>
  );
}
const SortArrow = ({ sortKey, sortDir, k }) => (
  <span style={{ fontSize: 9, marginLeft: 3, opacity: sortKey === k ? 1 : 0.3, color: sortKey === k ? LX.gold : LX.textDim }}>
    {sortKey === k ? (sortDir === -1 ? "▼" : "▲") : "▼"}
  </span>
);
/* ── MarketPage ───────────────────────────────────────────── */
export function MarketPage({ px, nav }) {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("cap");
  const [sortDir, setSortDir] = useState(-1);
  const [favs, setFavs] = useState([]);

  const TABS = ["All", "⭐ Favorites", "Layer 1", "DeFi", "Meme"];

  const CATEGORIES = {
    BTC: "Layer 1", ETH: "Layer 1", BNB: "Layer 1",
    SOL: "Layer 1", ADA: "Layer 1", AVAX: "Layer 1",
    DOT: "Layer 1", MATIC: "Layer 1",
    UNI: "DeFi", AAVE: "DeFi", LINK: "DeFi",
    DOGE: "Meme", SHIB: "Meme", PEPE: "Meme",
  };

  const toggleFav = (id, e) => {
    e.stopPropagation();
    setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const coins = COINS
    .filter(c => {
      if (tab === "⭐ Favorites") return favs.includes(c.id);
      if (tab !== "All") return CATEGORIES[c.id] === tab;
      return true;
    })
    .filter(c =>
      search === "" ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    .map(c => {
      const p = px[c.id] || 0;
      const h = PE.h?.[c.id] || [];
      const prev24 = h.length > 1 ? h[Math.max(0, h.length - 20)].c : p;
      const chg24 = prev24 ? ((p - prev24) / prev24) * 100 : 0;
      const vol = (px[c.id] || 1) * (800000 + Math.abs(c.id.charCodeAt(0)) * 12000);
      return { ...c, p, chg24, vol, h };
    })
    .sort((a, b) => {
      const map = { price: "p", change: "chg24", volume: "vol" };
      const key = map[sortKey] || "vol";
      return (a[key] - b[key]) * sortDir;
    });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: LX.bg, overflow: "hidden", maxWidth: "100vw" }}>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .mkt-hdr { display: grid; grid-template-columns: 24px 1fr 72px 68px 52px; gap: 0; padding: 8px 12px; border-bottom: 1px solid ${LX.border}; background: ${LX.surface}; }
        .mkt-row { display: grid; grid-template-columns: 24px 1fr 72px 68px 52px; align-items: center; padding: 11px 12px; border-bottom: 1px solid ${LX.border}; cursor: pointer; transition: background 0.15s; }
        .mkt-vol { display: block; }
        @media (max-width: 430px) {
          .mkt-hdr { grid-template-columns: 22px 1fr 64px 60px; padding: 7px 10px; }
          .mkt-row { grid-template-columns: 22px 1fr 64px 60px; padding: 10px 10px; }
          .mkt-vol { display: none !important; }
          .mkt-sparkline { display: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "14px 14px 0", borderBottom: `1px solid ${LX.border}`, background: LX.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
          <button onClick={() => nav("home")} style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${LX.border}`,
            background: LX.card, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: LX.gold, fontSize: 16, flexShrink: 0,
          }}>←</button>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(17px, 5vw, 20px)", fontWeight: 700, color: LX.text }}>
            Markets
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 10, color: LX.textDim,
            background: LX.card, border: `1px solid ${LX.border}`,
            padding: "4px 10px", borderRadius: 20, flexShrink: 0,
          }}>
            {coins.length} assets
          </span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={LX.textDim} strokeWidth="2" strokeLinecap="round"
            style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coin / token"
            style={{
              width: "100%", padding: "10px 14px 10px 36px",
              background: LX.card, border: `1px solid ${LX.border}`,
              borderRadius: 11, color: LX.text, fontSize: 12,
              fontFamily: "'DM Sans',sans-serif", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 12px", borderRadius: "10px 10px 0 0",
              border: `1px solid ${tab === t ? LX.gold : "transparent"}`,
              borderBottom: tab === t ? `2px solid ${LX.gold}` : `1px solid transparent`,
              background: tab === t ? "rgba(212,175,55,0.08)" : "transparent",
              color: tab === t ? LX.gold : LX.textDim,
              fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap",
              flexShrink: 0, transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div className="mkt-hdr">
        <div/>
        <div style={{ fontSize: 10, color: LX.textDim, fontWeight: 600, letterSpacing: 0.3 }}>Name</div>
        <div onClick={() => handleSort("price")}
          style={{ fontSize: 10, color: LX.textDim, fontWeight: 600, cursor: "pointer", textAlign: "right" }}>
          Price <SortArrow sortKey={sortKey} sortDir={sortDir} k="price"/>
        </div>
        <div onClick={() => handleSort("change")}
          style={{ fontSize: 10, color: LX.textDim, fontWeight: 600, cursor: "pointer", textAlign: "right" }}>
          24h% <SortArrow sortKey={sortKey} sortDir={sortDir} k="change"/>
        </div>
        <div className="mkt-vol" onClick={() => handleSort("volume")}
          style={{ fontSize: 10, color: LX.textDim, fontWeight: 600, cursor: "pointer", textAlign: "right" }}>
          Vol <SortArrow sortKey={sortKey} sortDir={sortDir} k="volume"/>
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>
        {coins.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: LX.textDim, fontSize: 13 }}>
            {tab === "⭐ Favorites" ? "No favourites yet — tap ☆ to add" : "No results"}
          </div>
        ) : coins.map((c, i) => {
          const isUp = c.chg24 >= 0;
          const color = isUp ? LX.green : LX.red;
          const isFav = favs.includes(c.id);

          const sl = c.h.slice(-14);
          const mn = Math.min(...sl.map(x => x.c));
          const mx = Math.max(...sl.map(x => x.c));
          const rg = mx - mn || 0.001;
          const pts = sl.map((x, idx) =>
            `${(idx / (sl.length - 1)) * 46},${16 - ((x.c - mn) / rg) * 14}`
          ).join(" ");

          const volStr = c.vol >= 1e9
            ? (c.vol / 1e9).toFixed(1) + "B"
            : (c.vol / 1e6).toFixed(0) + "M";

          return (
            <div key={c.id}
              className="mkt-row"
              style={{
                background: "transparent",
                animation: `fadeUp 0.3s ease ${Math.min(i, 10) * 0.04}s both`,
              }}
              onClick={() => nav("trade", c.id)}
              onMouseEnter={e => e.currentTarget.style.background = LX.card}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div onClick={e => toggleFav(c.id, e)}
                style={{ fontSize: 13, color: isFav ? LX.gold : LX.border, cursor: "pointer", lineHeight: 1 }}>
                {isFav ? "★" : "☆"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <CoinIcon c={c} size={32}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: LX.text }}>
                    {c.id}
                    <span style={{ fontSize: 9, color: LX.textDim, fontWeight: 400, marginLeft: 3 }}>/USDT</span>
                  </div>
                  <div style={{ fontSize: 10, color: LX.textDim, marginTop: 1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: LX.text, marginBottom: 2 }}>
                  {usd(c.p)}
                </div>
                {sl.length > 1 && (
                  <svg className="mkt-sparkline" width="40" height="14" viewBox="0 0 46 16" style={{ display: "block", marginLeft: "auto" }}>
                    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-block",
                  padding: "3px 6px", borderRadius: 6,
                  background: isUp ? "rgba(0,200,150,0.12)" : "rgba(240,64,96,0.12)",
                  fontSize: 11, fontWeight: 700, color,
                }}>
                  {isUp ? "+" : ""}{f2(c.chg24, 2)}%
                </div>
              </div>

              <div className="mkt-vol" style={{ textAlign: "right", fontSize: 10, color: LX.textDim, fontWeight: 500 }}>
                {volStr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── HistoryPage ──────────────────────────────────────────── */
export function HistoryPage({ user, onBack }) {
  const [filt, sf] = useState("All");
  const all = user?.transactions || [];
  const list = filt === "All" ? all : all.filter(t => t.type === filt);

  const statusColor = s => ({ won:LX.green, lost:LX.red, pending:LX.gold }[s] || LX.textDim);

  const FILTERS = ["All","Binary Trade","Deposit","Withdraw","Freeze","Unfreeze"];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:LX.bg }}>
      <style>{GLOBAL_CSS}</style>
      <LxHdr title="Transaction History" back={onBack}/>

      <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"thin" }}>
        <div style={{ padding:"14px 14px 24px" }}>

          {/* Filter Pills */}
          <div style={{ display:"flex", gap:7, marginBottom:16, overflowX:"auto", scrollbarWidth:"none", paddingBottom:4 }}>
            {FILTERS.map(t => (
              <button key={t} onClick={() => sf(t)} style={{
                padding:"6px 13px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${filt===t ? LX.gold : LX.border}`,
                background: filt===t ? "rgba(212,175,55,0.1)" : LX.card,
                color: filt===t ? LX.gold : LX.textDim,
                fontSize:11, fontWeight:600, whiteSpace:"nowrap",
                fontFamily:"'DM Sans',sans-serif",
                transition:"all 0.2s",
              }}>{t}</button>
            ))}
          </div>

          {list.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <div style={{ fontSize:42, marginBottom:12 }}>◈</div>
              <div style={{ fontSize:13, color:LX.textDim }}>No transactions found</div>
            </div>
          ) : list.map((tx, i) => {
            const isBinary = tx.type === "Binary Trade";
            const sc = statusColor(tx.status);
            const typeIcon = { "Binary Trade":"◈", "Deposit":"↓", "Withdraw":"↑", "Freeze":"❄", "Unfreeze":"✦" }[tx.type] || "·";

            return (
              <div key={i} style={{
                background:LX.card, borderRadius:16, marginBottom:12,
                border:`1px solid ${tx.status==="pending" ? "rgba(212,175,55,0.3)" : tx.status==="won" ? "rgba(0,200,150,0.25)" : tx.status==="lost" ? "rgba(240,64,96,0.25)" : LX.border}`,
                overflow:"hidden",
                animation:`fadeUp 0.35s ease ${Math.min(i,8)*0.05}s both`,
              }}>
                <div style={{
                  padding:"12px 14px",
                  background: isBinary ? "rgba(212,175,55,0.04)" : "transparent",
                  borderBottom:`1px solid ${LX.border}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{
                      width:32, height:32, borderRadius:9, display:"inline-flex",
                      alignItems:"center", justifyContent:"center",
                      background:LX.card2, border:`1px solid ${LX.border}`,
                      fontSize:14, color:LX.gold, flexShrink:0,
                    }}>{typeIcon}</span>
                    <div>
                      <span style={{ fontSize:12, fontWeight:700, color:LX.text }}>{tx.type}</span>
                      <span style={{
                        marginLeft:8, fontSize:9, fontWeight:700, padding:"2px 8px",
                        borderRadius:20, background:`${sc}18`, color:sc, letterSpacing:0.5,
                      }}>
                        {(tx.status||"").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize:9.5, color:LX.textDim, flexShrink:0, marginLeft:8 }}>
                    {tx.formattedDate || new Date(tx.date).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>

                <div style={{ padding:"14px 14px" }}>
  {isBinary ? (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 0" }}>
      {[
        { label: "Order No.", value: <span key="orderNo" style={{ color:LX.gold, fontFamily:"monospace", fontSize:11 }}>{tx.orderNumber||"—"}</span>, key: "orderNo" },
        { label: "Currency", value: `${tx.coin}/USDT`, key: "currency" },
        { label: "Order Amount", value: <span key="orderAmount" style={{ color:LX.gold }}>${tx.amount}</span>, key: "orderAmount" },
        { label: "Profit", value: (
          <span key="profit" style={{ color: tx.status==="won"?LX.green:tx.status==="lost"?LX.red:LX.textDim }}>
            {tx.status==="won"?`+$${tx.profitAmount||0}`:tx.status==="lost"?`-$${tx.amount}`:"—"}
          </span>
        ), key: "profit" },
        { label: "Direction", value: (
          <span key="direction" style={{ color: tx.orderType==="up"?LX.green:LX.red }}>
            {tx.orderType==="up"?"Buy Up ↑":"Buy Down ↓"}
          </span>
        ), key: "direction" },
        { label: "Scale", value: <span key="scale" style={{ color:LX.ice }}>{tx.profitPercent||0}%</span>, key: "scale" },
        { label: "Duration", value: `${tx.timeSeconds||"—"}s`, key: "duration" },
      ].map((item) => (
        <div key={item.key} style={{ padding:"4px 0" }}>
          <div style={{ fontSize:9, color:LX.textDim, letterSpacing:0.5, marginBottom:3 }}>{item.label}</div>
          <div style={{ fontSize:12, fontWeight:600, color:LX.text }}>{item.value}</div>
        </div>
      ))}
    </div>
  ) : (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:11, color:LX.textDim }}>Amount</span>
      <span style={{
        fontSize:16, fontWeight:700,
        color: tx.type==="Deposit"||tx.type==="Unfreeze" ? LX.green : LX.red,
      }}>
        {tx.type==="Deposit"||tx.type==="Unfreeze" ? "+" : "-"}
        ${tx.usd || tx.amount || 0}
      </span>
    </div>
  )}
</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── ProfilePage ──────────────────────────────────────────── */
export function ProfilePage({ user, onLogout, onSub, re }) {
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [frozenTotal, setFrozenTotal] = useState(0);
  const [, setTick] = useState(0);
  const [userNotifications, setUserNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const sessionUser = localStorage.getItem("session");
    if (sessionUser === "admin") return;
    if (sessionUser) {
      try {
        const response = await fetch(`${API_URL}/api/users/${sessionUser}/notifications`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setUserNotifications(data);
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
          const allNotifs = JSON.parse(localStorage.getItem("user_notifications") || "{}");
          allNotifs[sessionUser] = data;
          localStorage.setItem("user_notifications", JSON.stringify(allNotifs));
          window.dispatchEvent(new CustomEvent("notificationsUpdated", { detail: { count: unread } }));
        }
      } catch(err) { console.error(err); }
    }
  };

  const calc = async () => {
    try {
      const sessionUser = localStorage.getItem("session");
      if (sessionUser) {
        const res = await fetch(`${API_URL}/api/users/${sessionUser}`);
        const u = await res.json();
        if (!u.error) {
          setFrozenBalance(parseFloat(Number(u.balance||0).toFixed(2)));
          setFrozenTotal(parseFloat(Number(u.frozenTotal||0).toFixed(2)));
          setTick(n => n+1);
        }
      }
    } catch(err) { console.error(err); }
  };

   

  const liveUser = S.users?.[user?.username] || user || {};
  const isBan = (S.banned||[]).includes(user?.username);
  const binaryTradesCount = (liveUser?.transactions||[]).filter(t=>t.isBinaryTrade===true||t.type==="Binary Trade").length;
  const creditScore = S.users?.[user?.username]?.creditScore ?? liveUser?.creditScore ?? 50;
  const country = S.users?.[user?.username]?.country || liveUser?.country || user?.country || "—";

  const menu = [
    { ic:"◈", l:"Binary History",   s:"All binary trades",   sp:"binaryhistory" },
    { ic:"⬡", l:"Security Settings", s:"Password & 2FA",      sp:"sec" },
    { ic:"▣", l:"Bank Cards",        s:"Payment cards",       sp:"card" },
    { ic:"◉", l:"Notifications",     s:`${unreadCount} unread`, sp:"notif" },
    { ic:"◯", l:"Language",          s:"English",             sp:"lang" },
    { ic:"◻", l:"Terms of Service",  s:"Legal",               sp:"terms" },
    { ic:"✏", l:"Edit Profile",      s:"Update info",         sp:"edit" },
  ];

  const initial = (liveUser?.fullName||liveUser?.username||"U")[0].toUpperCase();

  return (
    <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"none", paddingBottom:80, background:LX.bg }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ padding:"20px 14px 0" }}>

        {isBan && (
          <div style={{
            background:"rgba(240,64,96,0.08)", border:"1px solid rgba(240,64,96,0.25)",
            borderRadius:12, padding:"12px 14px", marginBottom:16,
            fontSize:11, color:LX.red, fontWeight:500, lineHeight:1.5,
          }}>
            ⚠ Account suspended by administrator. Contact support for resolution.
          </div>
        )}

        {/* Profile Header */}
        <div style={{ display:"flex", alignItems:"center", gap:13, marginBottom:18 }}>
          <div style={{
            width:58, height:58, borderRadius:16, flexShrink:0,
            background:"linear-gradient(135deg,#1a3020,#2a4030)",
            border:`1.5px solid ${LX.gold}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:24, fontWeight:700, color:LX.gold,
            boxShadow:`0 0 20px rgba(212,175,55,0.15)`,
          }}>
            {initial}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(17px, 5vw, 20px)", fontWeight:700, color:LX.text }}>
              {liveUser?.fullName||liveUser?.username}
            </div>
            <div style={{ fontSize:10, color:LX.textDim, marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              @{liveUser?.username} · {liveUser?.email}
            </div>
          </div>
        </div>

        {/* Portfolio Card */}
        <div style={{
          background:"linear-gradient(145deg,#0f1622,#1a2840)",
          borderRadius:18, padding:"18px 16px", marginBottom:13,
          border:`1px solid rgba(212,175,55,0.15)`,
          boxShadow:"0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)" }}/>
          <div style={{ fontSize:9, color:LX.goldDim, letterSpacing:2.5, marginBottom:5, fontWeight:600 }}>
            TOTAL PORTFOLIO VALUE
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(26px, 8vw, 34px)", fontWeight:700, color:LX.text, marginBottom:14 }}>
            {usd((frozenBalance+frozenTotal).toFixed(2))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
            {[
              { label:"Cash Balance", val: usd(frozenBalance.toFixed(2)), color:LX.green },
              { label:"Frozen",       val: usd(frozenTotal.toFixed(2)),   color:LX.red },
            ].map(item => (
              <div key={item.label} style={{
                background:"rgba(0,0,0,0.3)", borderRadius:11, padding:"10px 12px",
                border:`1px solid rgba(255,255,255,0.05)`,
              }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:4, letterSpacing:0.5 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:13 }}>
          {[
            { l:"Binary Trades",  v:String(binaryTradesCount) },
            { l:"Deposits",       v:String((liveUser?.transactions||[]).filter(t=>t.type==="Deposit").length) },
            { l:"Credit Score",   v: creditScore >= 80 ? "● "+creditScore : creditScore >= 50 ? "● "+creditScore : "● "+creditScore,
              c: creditScore >= 80 ? LX.green : creditScore >= 50 ? LX.gold : LX.red },
            { l:"Country",        v:country },
          ].map(s => (
            <div key={s.l} style={{
              background:LX.card, borderRadius:13, padding:"13px 12px",
              border:`1px solid ${LX.border}`,
              display:"flex", flexDirection:"column", gap:4,
            }}>
              <div style={{ fontSize:9, color:LX.textDim, letterSpacing:0.5 }}>{s.l}</div>
              <div style={{ fontSize:13, fontWeight:700, color:s.c||LX.text }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div style={{
          background:LX.card, borderRadius:16, padding:"4px 14px",
          border:`1px solid ${LX.border}`, marginBottom:13,
        }}>
          {menu.map((item, i) => (
            <div key={item.sp} onClick={() => onSub(item.sp)} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"13px 0",
              borderBottom: i < menu.length-1 ? `1px solid ${LX.border}` : "none",
              cursor:"pointer",
            }}>
              <span style={{
                width:34, height:34, borderRadius:9, flexShrink:0,
                background:LX.card2, border:`1px solid ${LX.border}`,
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                fontSize:13, color:LX.gold,
              }}>{item.ic}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:LX.text }}>{item.l}</div>
                <div style={{ fontSize:10, color:LX.textDim, marginTop:1 }}>{item.s}</div>
              </div>
              <span style={{ color:LX.textDim, fontSize:14, flexShrink:0 }}>›</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button onClick={onLogout} style={{
          width:"100%", padding:"13px", borderRadius:13, cursor:"pointer",
          background:"rgba(240,64,96,0.06)", border:`1px solid rgba(240,64,96,0.2)`,
          color:LX.red, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
          letterSpacing:0.5, transition:"background 0.2s",
        }}>
          Sign Out
        </button>

        <div style={{ textAlign:"center", marginTop:18, fontSize:9, color:LX.textDim, letterSpacing:1.5 }}>
          COINBASE AI-QUANT · V2.1.0
        </div>
      </div>
    </div>
  );
}

/* ── AboutPage ────────────────────────────────────────────── */
export function AboutPage({ nav }) {
  return (
    <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"none", paddingBottom:24, background:LX.bg }}>
      <style>{GLOBAL_CSS}</style>
      <LxHdr title="About Us" back={() => nav("home")}/>
      <div style={{ padding:"20px 14px" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{
            width:68, height:68, borderRadius:20, margin:"0 auto 13px",
            background:"linear-gradient(135deg,#1a1606,#2a2010)",
            border:`1.5px solid ${LX.gold}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, color:LX.gold,
            boxShadow:`0 0 30px rgba(212,175,55,0.2)`,
          }}>₿</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(20px, 6vw, 26px)", fontWeight:700, color:LX.text, marginBottom:5 }}>
            Coinbase AI-Quant
          </div>
          <div style={{ fontSize:9, color:LX.goldDim, letterSpacing:3, fontWeight:600 }}>
            VERSION 2.1.0
          </div>
        </div>

        {/* Mission statement */}
        <div style={{
          background:`linear-gradient(135deg, rgba(212,175,55,0.06), rgba(168,216,240,0.04))`,
          borderRadius:16, padding:"18px 16px", marginBottom:13,
          border:`1px solid rgba(212,175,55,0.15)`,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:0, left:0, width:"100%", height:2,
            background:`linear-gradient(90deg, ${LX.gold}, transparent)`, opacity:0.6 }}/>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(15px, 4.5vw, 18px)", fontWeight:600, color:LX.gold, marginBottom:10, lineHeight:1.35 }}>
            Crypto creates economic freedom.
          </div>
          {[
            "Coinbase is on a mission to increase economic freedom for more than 1 billion people by building a trusted platform for trading, staking, safekeeping, and global transfers.",
            "We provide critical infrastructure for onchain activity and support builders who share our vision of an open financial system.",
            "Our institutional-grade platform combines the security of traditional finance with the innovation of decentralized technology.",
          ].map((p, i) => (
            <p key={i} style={{ fontSize:12, color:LX.textMid, lineHeight:1.75, marginBottom:i<2?9:0 }}>{p}</p>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:13 }}>
          {[
            { v:"1B+",    l:"Target Users" },
            { v:"100+",   l:"Countries" },
            { v:"24/7",   l:"Uptime" },
            { v:"$0",     l:"Transfer Fees" },
          ].map(s => (
            <div key={s.l} className="lx-card" style={{ padding:"14px", textAlign:"center" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:LX.gold }}>{s.v}</div>
              <div style={{ fontSize:10, color:LX.textDim, marginTop:3, letterSpacing:0.3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", fontSize:9, color:LX.textDim, letterSpacing:2 }}>
          © 2026 COINBASE TECHNOLOGY, INC.
        </div>
      </div>
    </div>
  );
}