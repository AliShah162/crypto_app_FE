"use client";
import { useState } from "react";
import { T, S, COINS, PE, usd } from "../lib/store";

export default function AdminPanel({ onExit }) {
  const [tab, st] = useState("dash");
  const [sel, ss] = useState(null);
  const [q, sq] = useState("");
  const [, tick] = useState(0);
  const re = () => tick((n) => n + 1);

  const users = Object.values(S.users);
  const found = users.filter(
    (u) =>
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
      (u.fullName || "").toLowerCase().includes(q.toLowerCase())
  );

  const totDep  = users.reduce((s, u) => (u.transactions || []).filter((t) => t.type === "Deposit" ).reduce((a, t) => a + t.usd, s), 0);
  const totWith = users.reduce((s, u) => (u.transactions || []).filter((t) => t.type === "Withdraw").reduce((a, t) => a + t.usd, s), 0);
  const totTx   = users.reduce((s, u) => (u.transactions || []).length + s, 0);
  const online  = users.filter((u) => S.session === u.username).length;

  const disc = (u) => { if (S.session === u.username) S.session = null; S.banned.add(u.username); re(); };
  const rest = (u) => { S.banned.delete(u.username); re(); };
  const del  = (u) => { if (S.session === u.username) S.session = null; S.banned.delete(u.username); delete S.users[u.username]; ss(null); re(); };

  const SC = ({ icon, label, val, col }) => (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "16px 14px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: col || T.acc }}>{val}</div>
      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{label}</div>
    </div>
  );

  const UserRow = ({ u }) => {
    const isBan = S.banned.has(u.username);
    const isOn  = S.session === u.username;
    return (
      <div onClick={() => ss(u)} style={{ background: T.card, border: `1.5px solid ${isBan ? T.red : isOn ? T.green : T.line}`, borderRadius: 13, padding: "13px 15px", marginBottom: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: isBan ? "rgba(239,68,68,0.18)" : "linear-gradient(135deg,#00e5b0,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
          {(u.fullName || u.username || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>@{u.username}</span>
            {isBan && <span style={{ fontSize: 9, color: T.red, background: "rgba(239,68,68,0.12)", padding: "2px 7px", borderRadius: 8, fontWeight: 700 }}>BANNED</span>}
            {isOn  && <span style={{ fontSize: 9, color: T.green, background: "rgba(16,185,129,0.12)", padding: "2px 7px", borderRadius: 8, fontWeight: 700 }}>ONLINE</span>}
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{u.email} · {u.country || "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.acc }}>{usd(u.balance || 0)}</div>
          <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{(u.transactions || []).length} tx</div>
        </div>
      </div>
    );
  };

  const Detail = () => {
    const u = S.users[sel.username] || sel;
    if (!u) { ss(null); return null; }
    const isBan = S.banned.has(u.username);
    const isOn  = S.session === u.username;
    const txs   = u.transactions || [];
    const dep   = txs.filter((t) => t.type === "Deposit" ).reduce((s, t) => s + t.usd, 0);
    const wth   = txs.filter((t) => t.type === "Withdraw").reduce((s, t) => s + t.usd, 0);
    const hVal  = Object.entries(u.holdings || {}).reduce((s, [id, q]) => s + q * (PE.p[id] || 0), 0);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <button onClick={() => ss(null)} style={{ background: "none", border: "none", color: T.text, fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
          <span style={{ fontSize: 17, fontWeight: 900, color: T.text }}>User Detail</span>
        </div>
        <div style={{ background: isBan ? "rgba(239,68,68,0.06)" : T.card, border: `1.5px solid ${isBan ? T.red : T.line}`, borderRadius: 16, padding: "18px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#00e5b0,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
              {(u.fullName || u.username || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: T.text }}>@{u.username}</span>
                {isBan && <span style={{ fontSize: 10, color: T.red, background: "rgba(239,68,68,0.14)", padding: "2px 9px", borderRadius: 20, fontWeight: 700 }}>BANNED</span>}
                {isOn  && <span style={{ fontSize: 10, color: T.green, background: "rgba(16,185,129,0.14)", padding: "2px 9px", borderRadius: 20, fontWeight: 700 }}>● ONLINE</span>}
                {!isOn && !isBan && <span style={{ fontSize: 10, color: T.dim, background: T.line, padding: "2px 9px", borderRadius: 20, fontWeight: 700 }}>○ OFFLINE</span>}
              </div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 3 }}>{u.fullName} · {u.email}</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 1 }}>{u.phone} · {u.country}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 9, marginBottom: 15 }}>
            {[
              { l: "Cash Balance",   v: usd(u.balance || 0), c: T.acc   },
              { l: "Holdings",       v: usd(hVal),            c: T.gold  },
              { l: "Total Deposits", v: usd(dep),             c: T.green },
              { l: "Withdrawals",    v: usd(wth),             c: T.red   },
              { l: "Transactions",   v: String(txs.length),   c: T.blue  },
            ].map((s) => (
              <div key={s.l} style={{ background: T.card2, borderRadius: 10, padding: "10px 9px", textAlign: "center", border: `1px solid ${T.line}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {!isBan
              ? <button onClick={() => { disc(u); re(); }} style={{ padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>⚠ Disconnect</button>
              : <button onClick={() => { rest(u); re(); }} style={{ padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ Restore</button>
            }
            <button onClick={() => { if (window.confirm("Delete @" + u.username + "? Permanent.")) del(u); }} style={{ padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </div>
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.line}`, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.line}`, fontSize: 13, fontWeight: 800, color: T.text }}>Transaction History ({txs.length})</div>
          {txs.length === 0 && <div style={{ textAlign: "center", color: T.dim, padding: "24px", fontSize: 12 }}>No transactions yet.</div>}
          {txs.map((tx, i) => {
            const m = COINS.find((c) => c.id === tx.coin);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", borderBottom: i < txs.length - 1 ? `1px solid ${T.line}` : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: tx.up ? "rgba(16,185,129,0.13)" : "rgba(239,68,68,0.13)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: m?.cl || T.acc, flexShrink: 0 }}>{m?.sym || "$"}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{tx.type}·{tx.coin || "USD"}</div><div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{tx.date}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 700, color: tx.up ? T.green : T.red }}>{tx.up ? "+" : "-"}{usd(tx.usd)}</div></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const allAct = users.flatMap((u) => (u.transactions || []).map((tx) => ({ ...tx, _u: u.username }))).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ minHeight: "100vh", background: "#060b14", fontFamily: "'Sora','Segoe UI',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1a2540;border-radius:3px}button{font-family:inherit}`}</style>
      {/* Top bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.line}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>CoinBase <span style={{ color: T.red }}>Admin</span></div>
            <div style={{ fontSize: 10, color: T.dim }}>Control Panel · admin</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["dash", "users", "activity"].map((t) => (
            <button key={t} onClick={() => { st(t); ss(null); }} style={{ padding: "6px 14px", borderRadius: 18, border: `1.5px solid ${tab === t ? T.red : T.line}`, background: tab === t ? "rgba(239,68,68,0.1)" : "transparent", color: tab === t ? T.red : T.dim, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {t === "dash" ? "Dashboard" : t === "users" ? "Users" : "Activity"}
            </button>
          ))}
          <button onClick={onExit} style={{ padding: "6px 14px", borderRadius: 18, border: `1.5px solid ${T.line}`, background: "transparent", color: T.dim, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🚪 Exit</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "22px 16px" }}>
        {/* Dashboard */}
        {tab === "dash" && (
          <>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 16 }}>Platform Overview</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <SC icon="👥" label="Total Users"  val={users.length} col={T.acc}   />
              <SC icon="🟢" label="Online Now"   val={online}        col={T.green} />
              <SC icon="🚫" label="Banned"       val={S.banned.size} col={T.red}   />
              <SC icon="📊" label="Transactions" val={totTx}         col={T.gold}  />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <SC icon="💰" label="Total Deposits"    val={usd(totDep)}          col={T.green} />
              <SC icon="🏦" label="Total Withdrawals" val={usd(totWith)}         col={T.red}   />
              <SC icon="💼" label="Net Platform"      val={usd(totDep - totWith)} col={T.blue}  />
            </div>
            <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: "hidden" }}>
              <div style={{ padding: "13px 17px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Recent Users</span>
                <span onClick={() => st("users")} style={{ fontSize: 11, color: T.acc, cursor: "pointer", fontWeight: 700 }}>View All →</span>
              </div>
              {users.length === 0
                ? <div style={{ textAlign: "center", color: T.dim, padding: "28px", fontSize: 12 }}>No users yet.</div>
                : users.slice(-5).reverse().map((u, i) => (
                  <div key={u.username} onClick={() => { st("users"); ss(u); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 17px", borderBottom: i < Math.min(4, users.length - 1) ? `1px solid ${T.line}` : "none", cursor: "pointer", flexWrap: "wrap" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#00e5b0,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{(u.fullName || u.username || "?")[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>@{u.username}{S.banned.has(u.username) && <span style={{ fontSize: 9, color: T.red }}> BANNED</span>}{S.session === u.username && <span style={{ fontSize: 9, color: T.green }}> ● ONLINE</span>}</div>
                      <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{u.email}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>{usd(u.balance || 0)}</div>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {/* Users */}
        {tab === "users" && !sel && (
          <>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 14 }}>User Management ({users.length})</div>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input placeholder="Search username, email or name…" value={q} onChange={(e) => sq(e.target.value)} style={{ width: "100%", background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "11px 15px 11px 40px", fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit" }} />
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.dim, fontSize: 14 }}>🔍</span>
            </div>
            {found.length === 0
              ? <div style={{ textAlign: "center", color: T.dim, padding: "44px", fontSize: 12 }}>{users.length === 0 ? "No users yet." : "No results."}</div>
              : found.map((u) => <UserRow key={u.username} u={u} />)
            }
          </>
        )}
        {tab === "users" && sel && <Detail />}

        {/* Activity */}
        {tab === "activity" && (
          <>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 14 }}>All Platform Activity</div>
            {allAct.length === 0
              ? <div style={{ textAlign: "center", color: T.dim, padding: "44px", fontSize: 12 }}>No activity yet.</div>
              : allAct.map((tx, i) => {
                  const m = COINS.find((c) => c.id === tx.coin);
                  return (
                    <div key={i} style={{ background: T.card, borderRadius: 13, padding: "11px 15px", display: "flex", alignItems: "center", gap: 11, marginBottom: 8, border: `1px solid ${T.line}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: tx.up ? "rgba(16,185,129,0.13)" : "rgba(239,68,68,0.13)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: m?.cl || T.acc, flexShrink: 0 }}>{m?.sym || "$"}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{tx.type}·{tx.coin || "USD"}</div><div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>@{tx._u} · {tx.date}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 700, color: tx.up ? T.green : T.red }}>{tx.up ? "+" : "-"}{usd(tx.usd)}</div></div>
                    </div>
                  );
                })
            }
          </>
        )}
      </div>
    </div>
  );
}
