"use client";
import { useState, useEffect, useCallback } from "react";
import { S, PE, usd } from "../lib/store";
import { getAllUsers, updateUserInDB } from "../lib/api"; // ✅ make sure api.js exports updateUserInDB

/* ================= LOAD ================= */
function loadLocalUsers() {
  if (typeof window === "undefined") return {};
  try {
    const main = JSON.parse(localStorage.getItem("users") || "{}");
    // ✅ FIX: filter out admin from user list
    const filtered = {};
    for (const key in main) {
      if (key !== "admin") filtered[key] = main[key];
    }
    return filtered;
  } catch {
    return {};
  }
}

/* ================= SAVE ================= */
function saveUsers(data) {
  // Never save admin into the regular users list
  const safe = { ...data };
  delete safe["admin"];
  localStorage.setItem("users", JSON.stringify(safe));
  S.users = { ...S.users, ...safe };
}

/* ================= BANNED helpers ================= */
function loadBanned() {
  if (typeof window === "undefined") return [];
  try {
    const b = JSON.parse(localStorage.getItem("banned") || "[]");
    return Array.isArray(b) ? b : [];
  } catch {
    return [];
  }
}

function saveBanned(list) {
  localStorage.setItem("banned", JSON.stringify(list));
  S.banned = list;
}

/* ================= DETAIL ================= */
function Detail({ sel, ss, disc, rest, del, changeScore, banned }) {
  if (!sel) return null;
  const u = S.users?.[sel.username] || sel;
  if (!u?.username) return null;

  const isBan = banned.includes(u.username);
  const txs = u.transactions || [];
  const dep = txs
    .filter((t) => t.type === "Deposit")
    .reduce((s, t) => s + (t.usd || 0), 0);
  const wth = txs
    .filter((t) => t.type === "Withdraw")
    .reduce((s, t) => s + (t.usd || 0), 0);
  const hVal = Object.entries(u.holdings || {}).reduce(
    (s, [id, q]) => s + q * (PE.p[id] || 0),
    0,
  );
  const score = u.creditScore ?? 50;
  const scoreColor =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={ds.detailWrap}>
      <style>{detailAnim}</style>
      <button onClick={() => ss(null)} style={ds.ghostBtn}>
        <span style={{ marginRight: 6 }}>←</span> Back to Users
      </button>
      <div style={ds.profileCard}>
        <div style={ds.profileHeader}>
          <div style={ds.avatar}>{u.username[0].toUpperCase()}</div>
          <div>
            <div style={ds.profileName}>@{u.username}</div>
            <div style={ds.profileEmail}>{u.email || "—"}</div>
            {u.country ? (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                🌍 {u.country}
              </div>
            ) : null}
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span
              style={{ ...ds.badge, ...(isBan ? ds.badgeBan : ds.badgeActive) }}
            >
              <span
                style={{
                  ...ds.badgeDot,
                  background: isBan ? "#ef4444" : "#22c55e",
                }}
              />
              {isBan ? "BANNED" : "ACTIVE"}
            </span>
          </div>
        </div>
        <div style={ds.divider} />
        <div style={ds.scoreSection}>
          <div style={ds.scoreLabel}>Credit Score</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ ...ds.scoreValue, color: scoreColor }}>
              {score}
              <span style={ds.scoreMax}>/100</span>
            </div>
            <div style={ds.scoreControls}>
              {[
                [-5, "#ef4444"],
                [-1, "#f97316"],
                [+1, "#22c55e"],
                [+5, "#3b82f6"],
              ].map(([delta, color]) => (
                <button
                  key={delta}
                  onClick={() => changeScore(u.username, delta)}
                  style={{ ...ds.scoreBtn, borderColor: color, color }}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
          <div style={ds.scoreBarTrack}>
            <div
              style={{
                ...ds.scoreBarFill,
                width: `${score}%`,
                background: scoreColor,
              }}
            />
          </div>
        </div>
        <div style={ds.divider} />
        <div style={ds.statsGrid}>
          {[
            ["Cash Balance", usd(u.balance || 0)],
            ["Holdings Value", usd(hVal)],
            ["Total Deposits", usd(dep)],
            ["Total Withdrawals", usd(wth)],
            ["Transactions", txs.length],
          ].map(([label, value]) => (
            <div key={label} style={ds.statItem}>
              <div style={ds.statLabel}>{label}</div>
              <div style={ds.statValue}>{value}</div>
            </div>
          ))}
        </div>
        <div style={ds.divider} />
        <div style={ds.actionRow}>
          {!isBan ? (
            <button
              onClick={() => disc(u.username)}
              style={{ ...ds.actionBtn, ...ds.warnBtn }}
            >
              Ban User
            </button>
          ) : (
            <button
              onClick={() => rest(u.username)}
              style={{ ...ds.actionBtn, ...ds.successBtn }}
            >
              Unban User
            </button>
          )}
          <button
            onClick={() => del(u.username)}
            style={{ ...ds.actionBtn, ...ds.dangerBtn }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN ================= */
export default function AdminPanel({ onBack, onExit }) {
  const exit = onBack || onExit;

  const [tab, setTab] = useState("dash");
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [usersState, setUsersState] = useState({});
  const [banned, setBanned] = useState(loadBanned);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch from DB + merge with localStorage, filter out admin
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let dbUsers = {};
      if (typeof getAllUsers === "function") {
        const res = await getAllUsers();
        if (res && !res.error && Array.isArray(res)) {
          res.forEach((u) => {
            const key = u.username?.toLowerCase();
            if (key && key !== "admin") dbUsers[key] = { ...u, username: key };
          });
        }
      }
      const local = loadLocalUsers(); // already filters admin
      const merged = { ...dbUsers, ...local };
      saveUsers(merged);
      setUsersState(merged);
    } catch (e) {
      console.error("Failed to fetch users:", e);
      setUsersState(loadLocalUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  useEffect(() => {
    S.banned = banned;
  }, [banned]);

  const users = Object.values(usersState);
  const found = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(q.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(q.toLowerCase()),
  );

  const updateUsers = (data) => {
    setUsersState(data);
    saveUsers(data);
  };

  // ✅ FIX: changeScore also updates MongoDB so it persists + user sees it instantly
  const changeScore = async (username, delta) => {
    const updated = { ...usersState };
    const newScore = Math.max(
      0,
      Math.min(100, (updated[username]?.creditScore ?? 50) + delta),
    );
    updated[username] = { ...updated[username], creditScore: newScore };
    updateUsers(updated);

    // Also update in S.users so ProfilePage picks it up immediately
    if (S.users[username]) {
      S.users[username].creditScore = newScore;
    }

    // Persist to MongoDB
    try {
      if (typeof updateUserInDB === "function") {
        await updateUserInDB(username, { creditScore: newScore });
      }
    } catch (e) {
      console.error("Failed to sync credit score to DB:", e);
    }
  };

  const disc = (username) => {
    const next = banned.includes(username) ? banned : [...banned, username];
    setBanned(next);
    saveBanned(next);
  };

  const rest = (username) => {
    const next = banned.filter((x) => x !== username);
    setBanned(next);
    saveBanned(next);
  };

  const del = async (username) => {
    try {
      await fetch(`http://localhost:5000/api/users/${username.toLowerCase()}`, {
        method: "DELETE",
      });

      // REMOVE FROM LOCAL STORAGE TOO
      const local = JSON.parse(localStorage.getItem("users") || "{}");
      delete local[username.toLowerCase()];
      localStorage.setItem("users", JSON.stringify(local));

      // UPDATE STATE
      const updated = { ...usersState };
      delete updated[username];
      updateUsers(updated);

      const nextBanned = banned.filter((x) => x !== username);
      setBanned(nextBanned);
      saveBanned(nextBanned);

      setSel(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const totalBalance = users.reduce((a, u) => a + (u.balance || 0), 0);

  return (
    <div style={ds.shell}>
      <style>{globalStyles}</style>
      <aside style={ds.sidebar}>
        <div style={ds.sidebarTop}>
          <div style={ds.logo}>
            <div style={ds.logoMark}>A</div>
            <div>
              <div style={ds.logoName}>AdminOS</div>
              <div style={ds.logoSub}>Control Panel</div>
            </div>
          </div>
          <nav style={ds.nav}>
            {[
              ["dash", "Dashboard", "⬡"],
              ["users", "Users", "◈"],
            ].map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{ ...ds.navItem, ...(tab === id ? ds.navActive : {}) }}
              >
                <span style={ds.navIcon}>{icon}</span>
                {label}
                {tab === id && <span style={ds.navIndicator} />}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={exit} style={ds.exitBtn}>
          ⎋ Exit Panel
        </button>
      </aside>

      <main style={ds.main}>
        <div style={ds.topbar}>
          <div>
            <div style={ds.pageTitle}>
              {tab === "dash" ? "Dashboard" : "User Management"}
            </div>
            <div style={ds.pageSubtitle}>
              {tab === "dash"
                ? "Platform overview"
                : `${users.length} registered accounts`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={fetchUsers} style={ds.refreshBtn}>
              ↻ Refresh
            </button>
            <div style={ds.topbarTime}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {tab === "dash" && (
          <div style={ds.content}>
            <div style={ds.kpiGrid}>
              {[
                ["Total Users", users.length, "#3b82f6", "👥"],
                ["Banned Accounts", banned.length, "#ef4444", "🚫"],
                ["Platform Balance", usd(totalBalance), "#22c55e", "💰"],
              ].map(([label, value, color, icon]) => (
                <div key={label} style={ds.kpiCard}>
                  <div style={{ ...ds.kpiIcon, color }}>{icon}</div>
                  <div style={{ ...ds.kpiValue, color }}>{value}</div>
                  <div style={ds.kpiLabel}>{label}</div>
                  <div style={{ ...ds.kpiAccent, background: color }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "users" && !sel && (
          <div style={ds.content}>
            <div style={ds.searchWrap}>
              <span style={ds.searchIcon}>⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by username or email…"
                style={ds.searchInput}
              />
            </div>
            <div style={ds.userTable}>
              <div style={ds.tableHeader}>
                <span>Username</span>
                <span>Email</span>
                <span>Balance</span>
                <span>Status</span>
              </div>
              {loading && <div style={ds.emptyState}>Loading users…</div>}
              {!loading && found.length === 0 && (
                <div style={ds.emptyState}>No users found</div>
              )}
              {!loading &&
                found.map((u, i) => {
                  const isBan = banned.includes(u.username);
                  return (
                    <div
                      key={u.username}
                      style={{ ...ds.tableRow, animationDelay: `${i * 40}ms` }}
                      onClick={() => setSel(u)}
                      className="table-row-hover"
                    >
                      <span style={ds.rowUsername}>
                        <span style={ds.rowAvatar}>
                          {u.username[0].toUpperCase()}
                        </span>
                        @{u.username}
                      </span>
                      <span style={ds.rowMeta}>{u.email || "—"}</span>
                      <span style={ds.rowBalance}>{usd(u.balance || 0)}</span>
                      <span>
                        <span
                          style={{
                            ...ds.badge,
                            ...(isBan ? ds.badgeBan : ds.badgeActive),
                          }}
                        >
                          <span
                            style={{
                              ...ds.badgeDot,
                              background: isBan ? "#ef4444" : "#22c55e",
                            }}
                          />
                          {isBan ? "Banned" : "Active"}
                        </span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {tab === "users" && sel && (
          <div style={ds.content}>
            <Detail
              sel={sel}
              ss={setSel}
              disc={disc}
              rest={rest}
              del={del}
              changeScore={changeScore}
              banned={banned}
            />
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= STYLES ================= */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Syne', sans-serif; }
  .table-row-hover:hover { background: rgba(59,130,246,0.06) !important; transform: translateX(2px); }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
`;

const detailAnim = `
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
`;

const ds = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#080c14",
    color: "#e2e8f0",
    fontFamily: "'Syne', sans-serif",
  },
  sidebar: {
    width: 220,
    background: "#0b1120",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
    flexShrink: 0,
  },
  sidebarTop: { display: "flex", flexDirection: "column", gap: 32 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "0 4px" },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 16,
    color: "#fff",
    flexShrink: 0,
  },
  logoName: {
    fontWeight: 800,
    fontSize: 15,
    color: "#f1f5f9",
    letterSpacing: "0.02em",
  },
  logoSub: {
    fontSize: 10,
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.18s",
    textAlign: "left",
    position: "relative",
  },
  navActive: { background: "rgba(59,130,246,0.1)", color: "#93c5fd" },
  navIcon: { fontSize: 16, width: 18, textAlign: "center" },
  navIndicator: {
    position: "absolute",
    right: 8,
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "#3b82f6",
  },
  exitBtn: {
    padding: "9px 12px",
    borderRadius: 8,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#475569",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  refreshBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.2)",
    color: "#93c5fd",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(11,17,32,0.6)",
    backdropFilter: "blur(10px)",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  pageSubtitle: { fontSize: 12, color: "#475569", marginTop: 2 },
  topbarTime: {
    fontSize: 11,
    color: "#334155",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.04em",
  },
  content: { padding: "24px 28px", flex: 1, overflowY: "auto" },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  kpiCard: {
    background: "#0b1120",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "20px 22px",
    position: "relative",
    overflow: "hidden",
    animation: "fadeUp 0.4s ease both",
  },
  kpiIcon: { fontSize: 20, marginBottom: 10 },
  kpiValue: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  kpiAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
  searchWrap: { position: "relative", marginBottom: 16 },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#334155",
    fontSize: 18,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "11px 14px 11px 42px",
    background: "#0b1120",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    color: "#e2e8f0",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    outline: "none",
  },
  userTable: {
    background: "#0b1120",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.2fr 1fr",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: 10,
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.2fr 1fr",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    cursor: "pointer",
    transition: "all 0.15s",
    alignItems: "center",
    animation: "slideIn 0.3s ease both",
  },
  rowUsername: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd5e1",
  },
  rowAvatar: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: "linear-gradient(135deg,#1d4ed8,#6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
  },
  rowMeta: {
    fontSize: 12,
    color: "#475569",
    fontFamily: "'DM Mono', monospace",
  },
  rowBalance: {
    fontSize: 13,
    fontWeight: 600,
    color: "#22c55e",
    fontFamily: "'DM Mono', monospace",
  },
  emptyState: {
    padding: 40,
    textAlign: "center",
    color: "#334155",
    fontSize: 13,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  badgeActive: {
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.2)",
  },
  badgeBan: {
    background: "rgba(239,68,68,0.1)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.2)",
  },
  badgeDot: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },
  detailWrap: { animation: "fadeIn 0.3s ease both" },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#64748b",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: "7px 14px",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 20,
  },
  profileCard: {
    background: "#0b1120",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "20px 22px",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: "linear-gradient(135deg, #1d4ed8, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
  },
  profileName: { fontSize: 16, fontWeight: 800, color: "#f1f5f9" },
  profileEmail: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
    fontFamily: "'DM Mono', monospace",
  },
  divider: { height: 1, background: "rgba(255,255,255,0.05)" },
  scoreSection: { padding: "18px 22px" },
  scoreLabel: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    fontFamily: "'DM Mono', monospace",
  },
  scoreMax: { fontSize: 14, color: "#334155", fontWeight: 400 },
  scoreControls: { display: "flex", gap: 6 },
  scoreBtn: {
    width: 36,
    height: 30,
    borderRadius: 6,
    background: "transparent",
    border: "1px solid",
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  scoreBarTrack: {
    height: 4,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.4s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 1,
    background: "rgba(255,255,255,0.03)",
  },
  statItem: { padding: "16px 20px", background: "#0b1120" },
  statLabel: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 700,
    color: "#cbd5e1",
    fontFamily: "'DM Mono', monospace",
  },
  actionRow: { display: "flex", gap: 10, padding: "18px 22px" },
  actionBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  warnBtn: {
    background: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  successBtn: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.3)",
  },
  dangerBtn: {
    background: "rgba(239,68,68,0.15)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
  },
};
