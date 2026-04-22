"use client";
import { useState, useEffect, useCallback } from "react";
import { S, PE, COINS, usd, f2 } from "../lib/store";
import { getAllUsers, updateUserInDB } from "../lib/api";

const BASE_URL = "https://crypto-backend-production-11dc.up.railway.app";

/* ─── localStorage helpers (unchanged) ─── */
function loadLocalUsers() {
  if (typeof window === "undefined") return {};
  try {
    const main = JSON.parse(localStorage.getItem("users") || "{}");
    const out = {};
    for (const k in main) { if (k !== "admin") out[k] = main[k]; }
    return out;
  } catch { return {}; }
}
function saveUsers(data) {
  const safe = { ...data }; delete safe["admin"];
  localStorage.setItem("users", JSON.stringify(safe));
  S.users = { ...S.users, ...safe };
}
function loadBanned() {
  if (typeof window === "undefined") return [];
  try { const b = JSON.parse(localStorage.getItem("banned") || "[]"); return Array.isArray(b) ? b : []; }
  catch { return []; }
}
function saveBanned(list) { localStorage.setItem("banned", JSON.stringify(list)); S.banned = list; }

/* ─── helpers ─── */
function txTypeColor(type) {
  if (type === "Buy")      return { bg:"rgba(34,197,94,0.12)",  text:"#22c55e", border:"rgba(34,197,94,0.25)"  };
  if (type === "Sell")     return { bg:"rgba(239,68,68,0.12)",  text:"#ef4444", border:"rgba(239,68,68,0.25)"  };
  if (type === "Deposit")  return { bg:"rgba(59,130,246,0.12)", text:"#60a5fa", border:"rgba(59,130,246,0.25)" };
  if (type === "Withdraw") return { bg:"rgba(245,158,11,0.12)", text:"#fbbf24", border:"rgba(245,158,11,0.25)" };
  return                          { bg:"rgba(148,163,184,0.1)", text:"#94a3b8", border:"rgba(148,163,184,0.2)" };
}
function txIcon(type) {
  if (type === "Buy")      return "📈";
  if (type === "Sell")     return "📉";
  if (type === "Deposit")  return "💰";
  if (type === "Withdraw") return "💸";
  return "•";
}
function coinMeta(id) { return COINS.find(c => c.id === id) || { sym: id?.[0]||"?", cl:"#94a3b8", bg:"#1e293b", name: id }; }

/* ═══════════════════════════════════════════════════════
   ADMIN BALANCE & TRADE CONTROL
   ─ All operations are LOCAL FIRST (instant to user) ─
   ─ Then silently tries to sync to DB in background   ─
═══════════════════════════════════════════════════════ */
function AdminTradePanel({ username, usersState, setUsersState, onDone }) {
  const [action, setAction]   = useState("balance"); // balance | buy | sell
  const [coin, setCoin]       = useState("BTC");
  const [amount, setAmount]   = useState("");
  const [balInput, setBalInput] = useState("");
  const [balMode, setBalMode] = useState("set"); // set | add | subtract
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(false);

  // always read fresh from usersState (passed from parent)
  const u     = usersState[username] || {};
  const price = PE.p[coin] || 0;
  const held  = (u.holdings || {})[coin] || 0;

  /* ── apply locally to S.users + localStorage immediately ── */
  const applyLocal = (updatedUser) => {
    S.users[username] = { ...S.users[username], ...updatedUser };
    const newState = { ...usersState, [username]: { ...usersState[username], ...updatedUser } };
    setUsersState(newState);
    saveUsers(newState);
  };

  /* ── try to sync to DB in background (non-blocking) ── */
  const syncDB = async (data) => {
    try {
      if (typeof updateUserInDB === "function") {
        await updateUserInDB(username, data);
      }
    } catch (e) { /* silent — local already updated */ }
  };

  const apply = async () => {
    setMsg(null); setLoading(true);

    const now = new Date().toISOString().slice(0, 10);
    const fresh = S.users[username] || usersState[username] || {};

    /* ────── ADJUST BALANCE ────── */
    if (action === "balance") {
      const n = parseFloat(balInput);
      if (!balInput || isNaN(n)) { setMsg({ t:"e", m:"Enter a valid number." }); setLoading(false); return; }

      let newBal = fresh.balance || 0;
      let delta  = 0;
      if (balMode === "set")      { delta = n - newBal; newBal = n; }
      else if (balMode === "add") { delta = n; newBal += n; }
      else                        { delta = -Math.min(n, newBal); newBal = Math.max(0, newBal - n); }

      const newTx = {
        type: "Deposit", coin: "USD",
        usd: Math.abs(delta),
        date: now, up: delta >= 0,
        adminAdded: true,
        note: balMode === "set" ? `Admin set balance to $${n}` : balMode === "add" ? `Admin added $${n}` : `Admin deducted $${n}`,
      };

      const updatedUser = {
        ...fresh,
        balance: Math.max(0, newBal),
        transactions: [newTx, ...(fresh.transactions || [])],
      };

      applyLocal(updatedUser);
      syncDB({ balance: updatedUser.balance, transactions: updatedUser.transactions });
      setMsg({ t:"s", m: balMode === "set" ? `✅ Balance set to ${usd(newBal)}` : balMode === "add" ? `✅ Added ${usd(n)} → new balance ${usd(newBal)}` : `✅ Deducted ${usd(Math.min(n, fresh.balance||0))} → new balance ${usd(newBal)}` });
    }

    /* ────── FORCE BUY ────── */
    else if (action === "buy") {
      const qty = parseFloat(amount);
      if (!qty || qty <= 0) { setMsg({ t:"e", m:"Enter a valid quantity." }); setLoading(false); return; }
      const cost = qty * price;
      if ((fresh.balance || 0) < cost) { setMsg({ t:"e", m:`Insufficient balance. User has ${usd(fresh.balance||0)}, trade costs ${usd(cost)}.` }); setLoading(false); return; }

      const newHoldings = { ...(fresh.holdings || {}) };
      newHoldings[coin] = (newHoldings[coin] || 0) + qty;
      const newTx = { type:"Buy", coin, amount: qty, usd: cost, price, date: now, up: true, adminAction: true };
      const updatedUser = {
        ...fresh,
        balance: (fresh.balance || 0) - cost,
        holdings: newHoldings,
        transactions: [newTx, ...(fresh.transactions || [])],
      };
      applyLocal(updatedUser);
      syncDB({ balance: updatedUser.balance, holdings: updatedUser.holdings, transactions: updatedUser.transactions });
      setMsg({ t:"s", m:`✅ Forced Buy: ${qty} ${coin} for ${usd(cost)}. New balance: ${usd(updatedUser.balance)}` });
    }

    /* ────── FORCE SELL ────── */
    else if (action === "sell") {
      const qty = parseFloat(amount);
      if (!qty || qty <= 0) { setMsg({ t:"e", m:"Enter a valid quantity." }); setLoading(false); return; }
      if (held < qty) { setMsg({ t:"e", m:`User only holds ${f2(held,6)} ${coin}.` }); setLoading(false); return; }
      const proceeds = qty * price;
      const newHoldings = { ...(fresh.holdings || {}) };
      newHoldings[coin] = Math.max(0, (newHoldings[coin] || 0) - qty);
      const newTx = { type:"Sell", coin, amount: qty, usd: proceeds, price, date: now, up: false, adminAction: true };
      const updatedUser = {
        ...fresh,
        balance: (fresh.balance || 0) + proceeds,
        holdings: newHoldings,
        transactions: [newTx, ...(fresh.transactions || [])],
      };
      applyLocal(updatedUser);
      syncDB({ balance: updatedUser.balance, holdings: updatedUser.holdings, transactions: updatedUser.transactions });
      setMsg({ t:"s", m:`✅ Forced Sell: ${qty} ${coin} for ${usd(proceeds)}. New balance: ${usd(updatedUser.balance)}` });
    }

    setLoading(false);
    setAmount(""); setBalInput("");
  };

  const inp = { width:"100%", background:"#111827", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#e2e8f0", outline:"none", fontFamily:"inherit" };
  const tabBtn = (v, label) => (
    <button key={v} onClick={() => { setAction(v); setMsg(null); }}
      style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1px solid ${action===v?"#6366f1":"rgba(255,255,255,0.07)"}`, fontSize:12, fontWeight:700, cursor:"pointer", background:action===v?"rgba(99,102,241,0.2)":"transparent", color:action===v?"#a5b4fc":"#475569", transition:"all .15s" }}>
      {label}
    </button>
  );

  return (
    <div style={{ background:"#0f172a", borderRadius:12, border:"1px solid rgba(99,102,241,0.3)", padding:"18px 20px", marginTop:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>⚙ Admin Trade & Balance Control</div>

      {/* Action tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {tabBtn("balance","💰 Adjust Balance")}
        {tabBtn("buy","📈 Force Buy")}
        {tabBtn("sell","📉 Force Sell")}
      </div>

      {/* ── BALANCE PANEL ── */}
      {action === "balance" && (
        <div>
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {[["set","Set Exact"],["add","Add"],["subtract","Deduct"]].map(([v,l]) => (
              <button key={v} onClick={() => setBalMode(v)}
                style={{ flex:1, padding:"6px 4px", borderRadius:7, border:`1px solid ${balMode===v?"#22c55e":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:700, cursor:"pointer", background:balMode===v?"rgba(34,197,94,0.15)":"transparent", color:balMode===v?"#4ade80":"#475569" }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:5 }}>
              {balMode==="set" ? "New balance amount ($)" : balMode==="add" ? "Amount to add ($)" : "Amount to deduct ($)"}
            </div>
            <input style={inp} type="number" min="0" placeholder="e.g. 5000" value={balInput} onChange={e => setBalInput(e.target.value)} />
          </div>
          <div style={{ fontSize:12, color:"#334155", marginTop:4 }}>
            Current balance: <span style={{ color:"#22c55e", fontWeight:700 }}>{usd(u.balance||0)}</span>
            {balInput && !isNaN(parseFloat(balInput)) && (
              <span style={{ color:"#94a3b8", marginLeft:8 }}>→ will become: <span style={{ color:"#f1f5f9", fontWeight:700 }}>{
                balMode==="set" ? usd(parseFloat(balInput)) :
                balMode==="add" ? usd((u.balance||0) + parseFloat(balInput)) :
                usd(Math.max(0, (u.balance||0) - parseFloat(balInput)))
              }</span></span>
            )}
          </div>
        </div>
      )}

      {/* ── BUY / SELL PANEL ── */}
      {(action === "buy" || action === "sell") && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:5 }}>Coin</div>
              <select style={{ ...inp, cursor:"pointer" }} value={coin} onChange={e => setCoin(e.target.value)}>
                {COINS.map(c => <option key={c.id} value={c.id} style={{ background:"#111827" }}>{c.id} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:5 }}>Quantity</div>
              <input style={inp} type="number" min="0" placeholder="e.g. 0.5" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#475569", marginBottom:4 }}>
            <span>Live price: <strong style={{ color:"#f1f5f9" }}>{usd(price)}</strong></span>
            <span>User holds: <strong style={{ color:"#f1f5f9" }}>{f2(held,6)} {coin}</strong></span>
          </div>
          {amount && !isNaN(parseFloat(amount)) && (
            <div style={{ fontSize:12, fontWeight:700, color: action==="buy"?"#22c55e":"#ef4444", marginTop:4 }}>
              {action==="buy" ? "Cost from balance:" : "Credits to balance:"} {usd((parseFloat(amount)||0)*price)}
            </div>
          )}
          <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>
            User balance: <span style={{ color:"#22c55e", fontWeight:700 }}>{usd(u.balance||0)}</span>
          </div>
        </div>
      )}

      {/* Result message */}
      {msg && (
        <div style={{ fontSize:12, color:msg.t==="s"?"#22c55e":"#ef4444", background:msg.t==="s"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", borderRadius:8, padding:"10px 13px", marginTop:12, lineHeight:1.5 }}>
          {msg.m}
        </div>
      )}

      {/* Apply button */}
      <button onClick={apply} disabled={loading}
        style={{ marginTop:14, width:"100%", padding:"11px 0", borderRadius:9, border:"none", background:loading?"#1e293b":"linear-gradient(135deg,#6366f1,#3b82f6)", color:"#fff", fontSize:13, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", letterSpacing:"0.02em" }}>
        {loading ? "Applying…" : action==="balance" ? "💰 Apply Balance Change" : action==="buy" ? "📈 Force Buy" : "📉 Force Sell"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FULL USER DETAIL
═══════════════════════════════════════════════════════ */
function Detail({ sel, ss, disc, rest, del, changeScore, banned, usersState, setUsersState, onRefresh }) {
  if (!sel) return null;
  const u = usersState[sel.username] || S.users?.[sel.username] || sel;
  if (!u?.username) return null;

  const [dtab, setDtab]         = useState("overview");
  const [showTrade, setShowTrade] = useState(false);

  const isBan  = banned.includes(u.username);
  const txs    = u.transactions || [];
  const cards  = u.savedCards   || [];
  const deps   = txs.filter(t => t.type==="Deposit").reduce((s,t)=>s+(t.usd||0),0);
  const wths   = txs.filter(t => t.type==="Withdraw").reduce((s,t)=>s+(t.usd||0),0);
  const buys   = txs.filter(t => t.type==="Buy");
  const sells  = txs.filter(t => t.type==="Sell");
  const hVal   = Object.entries(u.holdings||{}).reduce((s,[id,q])=>s+q*(PE.p[id]||0),0);
  const score  = u.creditScore ?? 50;
  const scoreC = score>=70?"#22c55e":score>=40?"#f59e0b":"#ef4444";

  const pill = (t, label) => (
    <button onClick={() => setDtab(t)}
      style={{ padding:"7px 14px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", border:`1px solid ${dtab===t?"#6366f1":"rgba(255,255,255,0.07)"}`, background:dtab===t?"rgba(99,102,241,0.18)":"transparent", color:dtab===t?"#a5b4fc":"#475569", transition:"all .15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );

  return (
    <div style={{ animation:"fadeIn .3s ease both" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <button onClick={() => ss(null)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", fontFamily:"inherit", fontSize:12, fontWeight:600, padding:"7px 16px", borderRadius:8, cursor:"pointer", marginBottom:20 }}>
        ← Back to Users
      </button>

      {/* ── PROFILE HEADER CARD ── */}
      <div style={{ background:"#0b1120", borderRadius:16, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden", marginBottom:14 }}>
        <div style={{ height:4, background: isBan?"linear-gradient(90deg,#ef4444,#f97316)":"linear-gradient(90deg,#6366f1,#3b82f6,#22c55e)" }} />
        <div style={{ padding:"20px 24px", display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }} className="admin-profile-header">
          <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg,#6366f1,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:"#fff", flexShrink:0 }}>
            {u.username[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>@{u.username}</div>
            <div style={{ fontSize:12, color:"#475569", marginTop:2, fontFamily:"'DM Mono',monospace" }}>{u.email||"—"}</div>
            {u.fullName && <div style={{ fontSize:12, color:"#94a3b8", marginTop:3 }}>👤 {u.fullName}</div>}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
              {u.phone   && <span style={{ fontSize:11, color:"#64748b", background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:20 }}>📞 {u.phone}</span>}
              {u.country && <span style={{ fontSize:11, color:"#64748b", background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:20 }}>🌍 {u.country}</span>}
              {u.dob     && <span style={{ fontSize:11, color:"#64748b", background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:20 }}>🎂 {u.dob}</span>}
            </div>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", ...(isBan?{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.25)"}:{background:"rgba(34,197,94,0.12)",color:"#4ade80",border:"1px solid rgba(34,197,94,0.25)"}) }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:isBan?"#ef4444":"#22c55e" }} />
            {isBan?"BANNED":"ACTIVE"}
          </span>
        </div>

        {/* Quick stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:1, background:"rgba(255,255,255,0.03)", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          {[
            ["Cash Balance",   usd(u.balance||0), "#22c55e"],
            ["Holdings",       usd(hVal),          "#f59e0b"],
            ["Total Deposits", usd(deps),          "#60a5fa"],
            ["Withdrawals",    usd(wths),          "#f87171"],
            ["Buy Trades",     buys.length,        "#a5b4fc"],
            ["Sell Trades",    sells.length,       "#fb923c"],
            ["All Txns",       txs.length,         "#94a3b8"],
            ["Cards",          cards.length,       "#34d399"],
          ].map(([label, value, color]) => (
            <div key={label} style={{ padding:"13px 16px", background:"#0b1120" }}>
              <div style={{ fontSize:9, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:800, color, fontFamily:"'DM Mono',monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:14, paddingBottom:2, scrollbarWidth:"none" }}>
        {pill("overview","⬡ Overview")}
        {pill("trades",`📊 Trades (${txs.length})`)}
        {pill("holdings","💼 Holdings")}
        {pill("cards",`💳 Cards (${cards.length})`)}
        {pill("info","👤 Info")}
      </div>

      {/* ══ OVERVIEW ══ */}
      {dtab === "overview" && (
        <div>
          {/* Credit score */}
          <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", padding:"18px 22px", marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Credit Score</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ fontSize:36, fontWeight:900, color:scoreC, fontFamily:"'DM Mono',monospace" }}>
                {score}<span style={{ fontSize:16, color:"#334155", fontWeight:400 }}>/100</span>
              </div>
              <div style={{ display:"flex", gap:6 }} className="admin-score-controls">
                {[[-5,"#ef4444"],[-1,"#f97316"],[+1,"#22c55e"],[+5,"#3b82f6"]].map(([d,c]) => (
                  <button key={d} onClick={() => changeScore(u.username, d)}
                    style={{ width:38, height:32, borderRadius:7, background:"transparent", border:`1px solid ${c}`, color:c, fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    {d>0?`+${d}`:d}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:6, marginTop:14, overflow:"hidden" }}>
              <div style={{ width:`${score}%`, height:"100%", background:scoreC, borderRadius:6, transition:"width .4s ease" }} />
            </div>
          </div>

          {/* Admin control toggle */}
          <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(99,102,241,0.25)", padding:"14px 18px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#a5b4fc" }}>⚙ Admin Trade & Balance Control</div>
              <button onClick={() => setShowTrade(v=>!v)}
                style={{ padding:"5px 14px", borderRadius:7, border:"1px solid rgba(99,102,241,0.3)", background:"rgba(99,102,241,0.1)", color:"#a5b4fc", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                {showTrade?"Hide":"Open"}
              </button>
            </div>
            {showTrade && (
              <AdminTradePanel
                username={u.username}
                usersState={usersState}
                setUsersState={setUsersState}
                onDone={() => { setShowTrade(false); if (onRefresh) onRefresh(); }}
              />
            )}
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }} className="admin-action-row">
            {!isBan
              ? <button onClick={() => disc(u.username)} style={{ flex:1, minWidth:120, padding:"11px 0", borderRadius:9, border:"1px solid rgba(245,158,11,0.35)", background:"rgba(245,158,11,0.12)", color:"#fbbf24", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>🚫 Ban User</button>
              : <button onClick={() => rest(u.username)} style={{ flex:1, minWidth:120, padding:"11px 0", borderRadius:9, border:"1px solid rgba(34,197,94,0.35)", background:"rgba(34,197,94,0.12)", color:"#4ade80", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✅ Unban User</button>}
            <button onClick={() => del(u.username)} style={{ flex:1, minWidth:120, padding:"11px 0", borderRadius:9, border:"1px solid rgba(239,68,68,0.35)", background:"rgba(239,68,68,0.12)", color:"#f87171", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>🗑 Delete Account</button>
          </div>
        </div>
      )}

      {/* ══ TRADE HISTORY ══ */}
      {dtab === "trades" && (
        <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"38px 90px 1fr 95px 95px 75px", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:10, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.07em" }}>
            <span/><span>Type</span><span>Detail</span><span style={{textAlign:"right"}}>Qty</span><span style={{textAlign:"right"}}>USD</span><span style={{textAlign:"right"}}>Date</span>
          </div>
          {txs.length === 0 && <div style={{ padding:40, textAlign:"center", color:"#334155", fontSize:13 }}>No transactions yet</div>}
          {txs.map((tx,i) => {
            const colors = txTypeColor(tx.type);
            return (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"38px 90px 1fr 95px 95px 75px", padding:"11px 16px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }} className="table-row-hover">
                <span style={{ fontSize:16 }}>{txIcon(tx.type)}</span>
                <span>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20, background:colors.bg, color:colors.text, border:`1px solid ${colors.border}` }}>{tx.type}</span>
                  {tx.adminAction && <div style={{ fontSize:9, color:"#6366f1", marginTop:2 }}>🔧 admin</div>}
                  {tx.adminAdded  && <div style={{ fontSize:9, color:"#22c55e", marginTop:2 }}>💰 admin</div>}
                </span>
                <span>
                  <div style={{ fontSize:12, fontWeight:700, color:"#cbd5e1" }}>{tx.coin||"USD"}</div>
                  {tx.amount && <div style={{ fontSize:10, color:"#475569" }}>{f2(tx.amount,6)} @ {usd(tx.price||0)}</div>}
                  {tx.note   && <div style={{ fontSize:10, color:"#475569", fontStyle:"italic" }}>{tx.note}</div>}
                </span>
                <span style={{ fontSize:12, fontWeight:700, color:tx.up?"#22c55e":"#ef4444", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>
                  {tx.amount ? f2(tx.amount,4) : "—"}
                </span>
                <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{usd(tx.usd||0)}</span>
                <span style={{ fontSize:10, color:"#475569", textAlign:"right" }}>{tx.date||"—"}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ HOLDINGS ══ */}
      {dtab === "holdings" && (
        <div>
          <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:12, padding:"16px 20px", marginBottom:12, border:"1px solid rgba(99,102,241,0.2)" }}>
            <div style={{ fontSize:10, color:"#6366f1", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Total Holdings Value</div>
            <div style={{ fontSize:28, fontWeight:900, color:"#f1f5f9", fontFamily:"'DM Mono',monospace" }}>{usd(hVal)}</div>
          </div>
          <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"44px 1fr 120px 100px 90px", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:10, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.07em" }}>
              <span/><span>Coin</span><span style={{textAlign:"right"}}>Quantity</span><span style={{textAlign:"right"}}>Price</span><span style={{textAlign:"right"}}>Value</span>
            </div>
            {Object.entries(u.holdings||{}).filter(([,q])=>q>0).length===0 && (
              <div style={{ padding:40, textAlign:"center", color:"#334155", fontSize:13 }}>No holdings</div>
            )}
            {Object.entries(u.holdings||{}).filter(([,q])=>q>0).map(([id,q]) => {
              const cm  = coinMeta(id);
              const val = q*(PE.p[id]||0);
              return (
                <div key={id} style={{ display:"grid", gridTemplateColumns:"44px 1fr 120px 100px 90px", padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }} className="table-row-hover">
                  <div style={{ width:32, height:32, borderRadius:"50%", background:cm.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:cm.cl }}>{cm.sym}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{id}</div>
                    <div style={{ fontSize:10, color:"#475569" }}>{cm.name}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{f2(q,6)}</div>
                  <div style={{ fontSize:12, color:"#94a3b8", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{usd(PE.p[id]||0)}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#22c55e", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{usd(val)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ CARDS ══ */}
      {dtab === "cards" && (
        <div>
          {cards.length===0 && <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", padding:40, textAlign:"center", color:"#334155", fontSize:13 }}>No saved cards</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
            {cards.map((c,i) => (
              <div key={c.id||i} style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c,#0f3460)", borderRadius:16, padding:"20px 20px 16px", border:"1px solid rgba(59,130,246,0.2)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%", background:"rgba(99,102,241,0.08)" }} />
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:3, marginBottom:14, textTransform:"uppercase" }}>Bank Card</div>
                <div style={{ fontSize:17, fontWeight:900, color:"#fff", letterSpacing:3, marginBottom:14, fontFamily:"'DM Mono',monospace" }}>{c.display||"**** **** **** ****"}</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:2, marginBottom:2 }}>CARD HOLDER</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>{c.name||"—"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:2, marginBottom:2 }}>EXPIRES</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontFamily:"'DM Mono',monospace" }}>{c.exp||"—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ PERSONAL INFO ══ */}
      {dtab === "info" && (
        <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
          {[
            ["Username",      u.username,          "👤"],
            ["Email",         u.email||"—",        "✉️"],
            ["Full Name",     u.fullName||"—",     "📝"],
            ["Phone",         u.phone||"—",        "📞"],
            ["Date of Birth", u.dob||"—",          "🎂"],
            ["Country",       u.country||"—",      "🌍"],
            ["Status",        isBan?"BANNED":"ACTIVE","🔒"],
            ["Credit Score",  `${score} / 100`,    "⭐"],
            ["Cash Balance",  usd(u.balance||0),   "💰"],
            ["Holdings",      usd(hVal),           "📈"],
            ["Total Txns",    txs.length,          "📊"],
            ["Saved Cards",   cards.length,        "💳"],
          ].map(([label,value,icon],i,arr) => (
            <div key={label} style={{ display:"flex", alignItems:"center", padding:"14px 22px", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
              <span style={{ fontSize:16, width:28, flexShrink:0 }}>{icon}</span>
              <span style={{ flex:1, fontSize:12, color:"#475569", fontWeight:600 }}>{label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN ADMIN PANEL
═══════════════════════════════════════════════════════ */
export default function AdminPanel({ onBack, onExit }) {
  const exit = onBack || onExit;

  const [tab, setTab]               = useState("dash");
  const [sel, setSel]               = useState(null);
  const [q, setQ]                   = useState("");
  const [usersState, setUsersState] = useState({});
  const [banned, setBanned]         = useState(loadBanned);
  const [loading, setLoading]       = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let dbUsers = {}, dbSuccess = false;
      if (typeof getAllUsers === "function") {
        const res        = await getAllUsers();
        const usersArray = Array.isArray(res) ? res : Array.isArray(res?.users) ? res.users : Array.isArray(res?.data) ? res.data : null;
        if (usersArray) {
          usersArray.forEach(u => { const k = u.username?.toLowerCase(); if (k && k!=="admin") dbUsers[k] = { ...u, username:k }; });
          dbSuccess = true;
        }
      }
      if (dbSuccess) { saveUsers(dbUsers); setUsersState(dbUsers); }
      else { setUsersState(loadLocalUsers()); }
    } catch { setUsersState(loadLocalUsers()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { S.banned = banned; }, [banned]);

  const users = Object.values(usersState);
  const found = users.filter(u =>
    u.username?.toLowerCase().includes(q.toLowerCase()) ||
    (u.email||"").toLowerCase().includes(q.toLowerCase())
  );

  const updateUsers = (data) => { setUsersState(data); saveUsers(data); };

  const changeScore = async (username, delta) => {
    const updated  = { ...usersState };
    const newScore = Math.max(0, Math.min(100, (updated[username]?.creditScore??50) + delta));
    updated[username] = { ...updated[username], creditScore: newScore };
    updateUsers(updated);
    if (S.users[username]) S.users[username].creditScore = newScore;
    try { if (typeof updateUserInDB==="function") await updateUserInDB(username, { creditScore: newScore }); }
    catch {}
  };

  const disc = (username) => { const n = banned.includes(username)?banned:[...banned,username]; setBanned(n); saveBanned(n); };
  const rest = (username) => { const n = banned.filter(x=>x!==username); setBanned(n); saveBanned(n); };
  const del  = async (username) => {
    try {
      await fetch(`https://crypto-backend-production-11dc.up.railway.app/api/users/${username.toLowerCase()}`, { method:"DELETE" });
      const local = JSON.parse(localStorage.getItem("users")||"{}");
      delete local[username.toLowerCase()];
      localStorage.setItem("users", JSON.stringify(local));
      const updated = { ...usersState }; delete updated[username];
      updateUsers(updated);
      const nb = banned.filter(x=>x!==username); setBanned(nb); saveBanned(nb);
      setSel(null);
    } catch (e) { console.error("Delete failed:", e); }
  };

  const totalBalance  = users.reduce((a,u)=>a+(u.balance||0),0);
  const totalHoldings = users.reduce((a,u)=>a+Object.entries(u.holdings||{}).reduce((s,[id,q])=>s+q*(PE.p[id]||0),0),0);
  const totalTxns     = users.reduce((a,u)=>a+(u.transactions||[]).length,0);

  return (
    <div style={ds.shell} className="admin-shell">
      <style>{globalStyles}</style>

      {/* ── SIDEBAR ── */}
      <aside style={ds.sidebar} className="admin-sidebar">
        <div style={ds.sidebarTop} className="admin-sidebar-top">
          <div style={ds.logo}>
            <div style={ds.logoMark}>A</div>
            <div>
              <div style={ds.logoName}>AdminOS</div>
              <div style={ds.logoSub} className="admin-logo-sub">CoinBase Control</div>
            </div>
          </div>
          <nav style={ds.nav} className="admin-nav">
            {[["dash","Dashboard","📊"],["users","Users","👥"]].map(([id,label,icon]) => (
              <button key={id} onClick={() => { setTab(id); setSel(null); }} style={{ ...ds.navItem, ...(tab===id?ds.navActive:{}) }}>
                <span style={ds.navIcon}>{icon}</span>{label}
                {tab===id && <span style={ds.navIndicator} />}
              </button>
            ))}
            <div style={{ height:1, background:"rgba(255,255,255,0.05)", margin:"8px 0" }} />
            {[["Withdrawal Requests","💸"],["Deposit","💰"],["Notifications","🔔"],["Support Tickets","🎫"]].map(([label,icon]) => (
              <button key={label} style={{ ...ds.navItem, opacity:0.35, cursor:"default" }} disabled>
                <span style={ds.navIcon}>{icon}</span>{label}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={exit} style={ds.exitBtn}>⎋ Exit Panel</button>
      </aside>

      {/* ── MAIN ── */}
      <main style={ds.main}>
        <div style={ds.topbar} className="admin-topbar">
          <div>
            <div style={ds.pageTitle}>
              {tab==="dash" ? "Hi, Welcome back 👋" : sel ? `@${sel.username}` : "Users"}
            </div>
            <div style={ds.pageSubtitle}>
              {tab==="dash" ? "Platform overview" : sel ? "Full user profile" : `${users.length} registered accounts`}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={fetchUsers} style={ds.refreshBtn}>↻ Refresh</button>
            <div style={ds.topbarTime}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        {tab==="dash" && (
          <div style={ds.content} className="admin-content">
            <div style={ds.kpiGrid} className="admin-kpi-grid">
              {[
                {label:"Total Users",        value:users.length,       color:"#6366f1",icon:"👥",sub:"registered accounts"},
                {label:"Banned Accounts",    value:banned.length,      color:"#ef4444",icon:"🚫",sub:"access blocked"},
                {label:"Platform Cash",      value:usd(totalBalance),  color:"#22c55e",icon:"💰",sub:"total user balances"},
                {label:"Holdings Value",     value:usd(totalHoldings), color:"#f59e0b",icon:"📈",sub:"crypto portfolios"},
                {label:"Total Transactions", value:totalTxns,          color:"#60a5fa",icon:"📊",sub:"all time"},
              ].map(({label,value,color,icon,sub}) => (
                <div key={label} style={ds.kpiCard}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${color}1a`, border:`1px solid ${color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:12 }}>{icon}</div>
                  <div style={{ fontSize:26, fontWeight:900, color, letterSpacing:"-0.03em", marginBottom:3, fontFamily:"'DM Mono',monospace" }}>{value}</div>
                  <div style={{ fontSize:11, color:"#475569", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
                  <div style={{ fontSize:10, color:"#334155", marginTop:2 }}>{sub}</div>
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:color, opacity:0.5, borderRadius:"0 0 12px 12px" }} />
                </div>
              ))}
            </div>

            {/* Recent activity feed */}
            <div style={{ marginTop:22 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Recent Activity (All Users)</div>
              <div style={{ background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)", overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 130px 90px 90px", padding:"10px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:10, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  <span/><span>User / Action</span><span>Coin</span><span style={{textAlign:"right"}}>Amount</span><span style={{textAlign:"right"}}>Date</span>
                </div>
                {users.flatMap(u =>
                  (u.transactions||[]).slice(0,5).map(tx=>({...tx,_user:u.username}))
                ).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,15).map((tx,i) => {
                  const colors = txTypeColor(tx.type);
                  return (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"36px 1fr 130px 90px 90px", padding:"11px 18px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }} className="table-row-hover">
                      <span style={{ fontSize:16 }}>{txIcon(tx.type)}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#cbd5e1" }}>@{tx._user}</div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:colors.bg, color:colors.text, border:`1px solid ${colors.border}` }}>{tx.type}</span>
                        {tx.adminAction && <span style={{ marginLeft:4, fontSize:9, color:"#6366f1" }}>🔧</span>}
                        {tx.adminAdded  && <span style={{ marginLeft:4, fontSize:9, color:"#22c55e" }}>💰</span>}
                      </div>
                      <span style={{ fontSize:12, color:"#94a3b8" }}>{tx.coin||"USD"}{tx.amount?` · ${f2(tx.amount,4)}`:""}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{usd(tx.usd||0)}</span>
                      <span style={{ fontSize:10, color:"#475569", textAlign:"right" }}>{tx.date||"—"}</span>
                    </div>
                  );
                })}
                {totalTxns===0 && <div style={{ padding:40, textAlign:"center", color:"#334155", fontSize:13 }}>No activity yet</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS LIST ── */}
        {tab==="users" && !sel && (
          <div style={ds.content} className="admin-content">
            <div style={ds.searchWrap}>
              <span style={ds.searchIcon}>⌕</span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by username or email…" style={ds.searchInput} />
            </div>
            <div style={ds.userTable}>
              <div style={{ ...ds.tableHeader, gridTemplateColumns:"2fr 2fr 1fr 1fr 70px 70px" }} className="admin-table-header">
                <span>Username</span><span>Email</span><span>Balance</span><span>Trades</span><span>Credit</span><span>Status</span>
              </div>
              {loading && <div style={ds.emptyState}>Loading users…</div>}
              {!loading && found.length===0 && <div style={ds.emptyState}>No users found</div>}
              {!loading && found.map((u,i) => {
                const isBan      = banned.includes(u.username);
                const tradeCount = (u.transactions||[]).filter(t=>t.type==="Buy"||t.type==="Sell").length;
                const score      = u.creditScore??50;
                const sc         = score>=70?"#22c55e":score>=40?"#f59e0b":"#ef4444";
                return (
                  <div key={u.username}
                    style={{ ...ds.tableRow, gridTemplateColumns:"2fr 2fr 1fr 1fr 70px 70px", animationDelay:`${i*30}ms` }}
                    onClick={()=>setSel(u)} className="table-row-hover admin-table-row">
                    <span style={ds.rowUsername} className="admin-row-username">
                      <span style={ds.rowAvatar}>{u.username[0].toUpperCase()}</span>@{u.username}
                    </span>
                    <span style={ds.rowMeta} className="admin-row-email">{u.email||"—"}</span>
                    <span style={ds.rowBalance} className="admin-row-balance">{usd(u.balance||0)}</span>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>{tradeCount}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:sc, fontFamily:"'DM Mono',monospace" }}>{score}</span>
                    <span>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, ...(isBan?{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.25)"}:{background:"rgba(34,197,94,0.12)",color:"#4ade80",border:"1px solid rgba(34,197,94,0.25)"}) }}>
                        {isBan?"Banned":"Active"}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── USER DETAIL ── */}
        {tab==="users" && sel && (
          <div style={ds.content} className="admin-content">
            <Detail
              sel={sel} ss={setSel}
              disc={disc} rest={rest} del={del}
              changeScore={changeScore} banned={banned}
              usersState={usersState}
              setUsersState={setUsersState}
              onRefresh={fetchUsers}
            />
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── STYLES ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Mono:wght@300;400;500&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Syne',sans-serif; }
  .table-row-hover:hover { background:rgba(99,102,241,0.05) !important; }
  select option { background:#111827; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @media(max-width:640px){
    .admin-shell{flex-direction:column !important}
    .admin-sidebar{width:100% !important;flex-direction:row !important;align-items:center !important;padding:10px 14px !important;border-right:none !important;border-bottom:1px solid rgba(255,255,255,0.06) !important;justify-content:space-between !important}
    .admin-sidebar-top{flex-direction:row !important;align-items:center !important;gap:10px !important}
    .admin-nav{flex-direction:row !important;gap:4px !important}
    .admin-logo-sub{display:none !important}
    .admin-content{padding:14px !important}
    .admin-topbar{padding:12px 14px !important;flex-wrap:wrap;gap:8px}
    .admin-kpi-grid{grid-template-columns:1fr 1fr !important;gap:10px !important}
    .admin-table-header{display:none !important}
    .admin-table-row{display:flex !important;flex-wrap:wrap !important;gap:6px !important;align-items:center !important;padding:12px !important}
    .admin-row-email{display:none !important}
    .admin-row-username{flex:1 !important;min-width:0 !important}
    .admin-row-balance{font-size:11px !important}
    .admin-profile-header{flex-wrap:wrap !important}
    .admin-score-controls{flex-wrap:wrap !important;gap:4px !important}
    .admin-action-row{flex-direction:column !important}
  }
`;

const ds = {
  shell:      { display:"flex", minHeight:"100vh", background:"#080c14", color:"#e2e8f0", fontFamily:"'Syne',sans-serif" },
  sidebar:    { width:230, background:"#0b1120", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"24px 14px", flexShrink:0 },
  sidebarTop: { display:"flex", flexDirection:"column", gap:28 },
  logo:       { display:"flex", alignItems:"center", gap:10, padding:"0 4px" },
  logoMark:   { width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"#fff", flexShrink:0 },
  logoName:   { fontWeight:900, fontSize:15, color:"#f1f5f9", letterSpacing:"0.02em" },
  logoSub:    { fontSize:10, color:"#475569", letterSpacing:"0.07em", textTransform:"uppercase" },
  nav:        { display:"flex", flexDirection:"column", gap:2 },
  navItem:    { display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:9, background:"transparent", border:"none", color:"#64748b", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .18s", textAlign:"left", position:"relative", width:"100%" },
  navActive:  { background:"rgba(99,102,241,0.12)", color:"#a5b4fc" },
  navIcon:    { fontSize:15, width:20, textAlign:"center", flexShrink:0 },
  navIndicator:{ position:"absolute", right:10, width:5, height:5, borderRadius:"50%", background:"#6366f1" },
  exitBtn:    { padding:"9px 12px", borderRadius:8, background:"transparent", border:"1px solid rgba(255,255,255,0.07)", color:"#475569", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" },
  refreshBtn: { padding:"6px 14px", borderRadius:8, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", color:"#a5b4fc", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" },
  main:       { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar:     { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 28px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(8,12,20,0.8)", backdropFilter:"blur(12px)", flexShrink:0 },
  pageTitle:  { fontSize:22, fontWeight:900, color:"#f1f5f9", letterSpacing:"-0.02em" },
  pageSubtitle:{ fontSize:12, color:"#475569", marginTop:2 },
  topbarTime: { fontSize:11, color:"#334155", fontFamily:"'DM Mono',monospace" },
  content:    { padding:"24px 28px", flex:1, overflowY:"auto" },
  kpiGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14, marginBottom:4 },
  kpiCard:    { background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)", padding:"18px 20px", position:"relative", overflow:"hidden", animation:"fadeUp .4s ease both" },
  searchWrap: { position:"relative", marginBottom:14 },
  searchIcon: { position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#334155", fontSize:18, pointerEvents:"none" },
  searchInput:{ width:"100%", padding:"11px 14px 11px 42px", background:"#0b1120", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, color:"#e2e8f0", fontFamily:"'Syne',sans-serif", fontSize:13, outline:"none" },
  userTable:  { background:"#0b1120", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)", overflow:"hidden" },
  tableHeader:{ display:"grid", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:10, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em" },
  tableRow:   { display:"grid", padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.03)", cursor:"pointer", transition:"background .15s", alignItems:"center", animation:"slideIn .3s ease both" },
  rowUsername:{ display:"flex", alignItems:"center", gap:9, fontSize:13, fontWeight:600, color:"#cbd5e1" },
  rowAvatar:  { width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#6366f1,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff", flexShrink:0 },
  rowMeta:    { fontSize:12, color:"#475569", fontFamily:"'DM Mono',monospace" },
  rowBalance: { fontSize:13, fontWeight:600, color:"#22c55e", fontFamily:"'DM Mono',monospace" },
  emptyState: { padding:40, textAlign:"center", color:"#334155", fontSize:13 },
};