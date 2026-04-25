"use client";
import { useState, useEffect, useCallback } from "react";
import { S, PE, COINS, usd, f2 } from "../lib/store";
import {
  getAllUsers,
  updateUserInDB,
  getBinaryTrades,
  getAllUsersWithPlainPasswords,
  adminUpdatePassword,
  getAllWithdrawals,
  approveWithdrawal,
} from "../lib/api";
import { addUserNotification } from "../lib/notifications";

const BASE_URL = "https://crypto-backend-production-11dc.up.railway.app";

/* ─── helpers ─── */
function loadLocalUsers() {
  if (typeof window === "undefined") return {};
  try {
    const m = JSON.parse(localStorage.getItem("users") || "{}");
    const o = {};
    for (const k in m) {
      if (k !== "admin") o[k] = m[k];
    }
    return o;
  } catch {
    return {};
  }
}
function saveUsers(data) {
  const s = { ...data };
  delete s["admin"];
  localStorage.setItem("users", JSON.stringify(s));
  S.users = { ...S.users, ...s };
}
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

function isBinaryTrade(tx) {
  if (!tx) return false;
  return (
    tx.isBinaryTrade === true ||
    tx.type === "Binary Trade" ||
    (tx.type && tx.type.includes("Binary")) ||
    (tx.tradeDetails &&
      (tx.tradeDetails.type === "WIN" || tx.tradeDetails.type === "LOSS"))
  );
}

function typeColor(tx) {
  const isBinary = isBinaryTrade(tx);
  if (isBinary) return tx.up ? "#22c55e" : "#ef4444";
  if (tx.type === "Buy") return "#22c55e";
  if (tx.type === "Sell") return "#ef4444";
  if (tx.type === "Deposit") return "#60a5fa";
  if (tx.type === "Withdraw") return "#f59e0b";
  return "#94a3b8";
}

function typeIcon(tx) {
  const isBinary = isBinaryTrade(tx);
  if (isBinary) return tx.up ? "🎉" : "💔";
  if (tx.type === "Buy") return "📈";
  if (tx.type === "Sell") return "📉";
  if (tx.type === "Deposit") return "💰";
  if (tx.type === "Withdraw") return "💸";
  return "•";
}

function coinMeta(id) {
  const found = COINS.find((c) => c.id === id);
  if (found) return found;
  return {
    sym: id?.slice(0, 2) || "?",
    cl: "#94a3b8",
    bg: "#1e293b",
    name: id || "Unknown",
  };
}

/* ══════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════ */
const C = {
  bg: "#f0f2f5",
  card: "#ffffff",
  sidebar: "#1e2a3a",
  sideHov: "rgba(255,255,255,0.07)",
  sideAct: "rgba(99,102,241,0.25)",
  accent: "#6366f1",
  accentL: "#818cf8",
  text: "#1e293b",
  sub: "#64748b",
  border: "#e2e8f0",
  green: "#22c55e",
  red: "#ef4444",
  gold: "#f59e0b",
  blue: "#3b82f6",
};

/* ══════════════════════════════════════════════════════
   PASSWORD EDITOR MODAL
══════════════════════════════════════════════════════ */
function PasswordEditor({ username, currentPassword, onSave, onClose }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState(null);

  const handleSave = () => {
    if (!newPassword) {
      setMsg({ t: "e", m: "Please enter a new password" });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ t: "e", m: "Password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ t: "e", m: "Passwords do not match" });
      return;
    }
    onSave(newPassword);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: C.card,
        borderRadius: 16,
        padding: "24px",
        width: "min(400px, 90vw)",
        zIndex: 1002,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        border: `1px solid ${C.border}`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: C.text,
          marginBottom: 16,
        }}
      >
        🔐 Change Password for @{username}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            color: C.sub,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          NEW PASSWORD
        </div>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 9,
            fontSize: 13,
            color: C.text,
            outline: "none",
            background: "#f8fafc",
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            color: C.sub,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          CONFIRM PASSWORD
        </div>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 9,
            fontSize: 13,
            color: C.text,
            outline: "none",
            background: "#f8fafc",
          }}
        />
      </div>
      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            background: msg.t === "s" ? C.green + "15" : C.red + "15",
            color: msg.t === "s" ? C.green : C.red,
          }}
        >
          {msg.m}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 9,
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Save Password
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 9,
            border: `1.5px solid ${C.border}`,
            background: "transparent",
            color: C.sub,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   BALANCE EDITOR
══════════════════════════════════════════════════════ */
function BalanceEditor({ username, usersState, setUsersState }) {
  const [mode, setMode] = useState("add");
  const [val, setVal] = useState("");
  const [msg, setMsg] = useState(null);

  const u = usersState[username] || {};
  const now = new Date().toISOString().slice(0, 10);

  const apply = () => {
    const n = parseFloat(val);
    if (!val || isNaN(n) || n < 0) {
      setMsg({ t: "e", m: "Enter a valid positive number." });
      return;
    }
    const fresh = S.users[username] || usersState[username] || {};
    let newBal = fresh.balance || 0;
    let delta = 0;
    let note = "";
    if (mode === "set") {
      delta = n - newBal;
      newBal = n;
      note = `Admin set balance to ${usd(n)}`;
    } else if (mode === "add") {
      delta = n;
      newBal += n;
      note = `Admin credited ${usd(n)}`;
    } else {
      delta = -n;
      newBal = Math.max(0, newBal - n);
      note = `Admin deducted ${usd(n)}`;
    }

    const tx = {
      type: delta >= 0 ? "Deposit" : "Withdraw",
      coin: "USD",
      usd: Math.abs(delta),
      date: now,
      up: delta >= 0,
      adminAdded: true,
      note,
    };
    const updated = {
      ...fresh,
      balance: Math.max(0, newBal),
      transactions: [tx, ...(fresh.transactions || [])],
    };
    S.users[username] = updated;
    const ns = { ...usersState, [username]: updated };
    setUsersState(ns);
    saveUsers(ns);
    try {
      if (typeof updateUserInDB === "function")
        updateUserInDB(username, {
          balance: updated.balance,
          transactions: updated.transactions,
        });
    } catch {}
    setMsg({ t: "s", m: `Done! New balance: ${usd(Math.max(0, newBal))}` });
    setVal("");
  };

  const preview = () => {
    const n = parseFloat(val);
    if (!n || isNaN(n)) return null;
    const cur = u.balance || 0;
    const nb =
      mode === "set" ? n : mode === "add" ? cur + n : Math.max(0, cur - n);
    return usd(nb);
  };

  const btn = (v, label, color) => (
    <button
      onClick={() => {
        setMode(v);
        setMsg(null);
      }}
      style={{
        flex: 1,
        padding: "7px 0",
        borderRadius: 7,
        border: `1.5px solid ${mode === v ? color : C.border}`,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        background: mode === v ? color + "18" : "transparent",
        color: mode === v ? color : C.sub,
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: C.text,
          marginBottom: 14,
        }}
      >
        💰 Adjust User Balance
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {btn("add", "＋ Add", C.green)}
        {btn("subtract", "− Deduct", C.red)}
        {btn("set", "= Set Exact", C.accent)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: C.sub,
              fontWeight: 700,
            }}
          >
            $
          </span>
          <input
            type="number"
            min="0"
            placeholder="0.00"
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setMsg(null);
            }}
            style={{
              width: "100%",
              padding: "10px 12px 10px 26px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 9,
              fontSize: 14,
              color: C.text,
              outline: "none",
              fontFamily: "inherit",
              background: "#f8fafc",
            }}
          />
        </div>
        <button
          onClick={apply}
          style={{
            padding: "10px 20px",
            borderRadius: 9,
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          Apply
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.sub }}>
        Current:{" "}
        <strong style={{ color: C.text }}>{usd(u.balance || 0)}</strong>
        {preview() && (
          <span style={{ marginLeft: 8 }}>
            →{" "}
            <strong style={{ color: mode === "subtract" ? C.red : C.green }}>
              {preview()}
            </strong>
          </span>
        )}
      </div>
      {msg && (
        <div
          style={{
            marginTop: 10,
            padding: "9px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: msg.t === "s" ? C.green + "15" : C.red + "15",
            color: msg.t === "s" ? C.green : C.red,
            border: `1px solid ${msg.t === "s" ? C.green + "30" : C.red + "30"}`,
          }}
        >
          {msg.t === "s" ? "✅ " : "❌ "}
          {msg.m}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FORCE TRADE PANEL
══════════════════════════════════════════════════════ */
function ForceTradePanel({ username, usersState, setUsersState }) {
  const [action, setAction] = useState("buy");
  const [coin, setCoin] = useState("BTC");
  const [qty, setQty] = useState("");
  const [msg, setMsg] = useState(null);

  const u = usersState[username] || {};
  const price = PE.p[coin] || 0;
  const held = (u.holdings || {})[coin] || 0;
  const now = new Date().toISOString().slice(0, 10);

  const apply = () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) {
      setMsg({ t: "e", m: "Enter a valid quantity." });
      return;
    }
    const fresh = S.users[username] || usersState[username] || {};
    let updated;

    if (action === "buy") {
      const cost = q * price;
      if ((fresh.balance || 0) < cost) {
        setMsg({
          t: "e",
          m: `User only has ${usd(fresh.balance || 0)}. Trade costs ${usd(cost)}.`,
        });
        return;
      }
      const newH = {
        ...(fresh.holdings || {}),
        [coin]: ((fresh.holdings || {})[coin] || 0) + q,
      };
      const tx = {
        type: "Buy",
        coin,
        amount: q,
        usd: cost,
        price,
        date: now,
        up: true,
        adminAction: true,
      };
      updated = {
        ...fresh,
        balance: (fresh.balance || 0) - cost,
        holdings: newH,
        transactions: [tx, ...(fresh.transactions || [])],
      };
      setMsg({
        t: "s",
        m: `Bought ${q} ${coin} for ${usd(cost)}. New balance: ${usd(updated.balance)}`,
      });
    } else {
      if (held < q) {
        setMsg({ t: "e", m: `User only holds ${usd(held)} ${coin}.` });
        return;
      }
      const proceeds = q * price;
      const newH = { ...(fresh.holdings || {}), [coin]: Math.max(0, held - q) };
      const tx = {
        type: "Sell",
        coin,
        amount: q,
        usd: proceeds,
        price,
        date: now,
        up: false,
        adminAction: true,
      };
      updated = {
        ...fresh,
        balance: (fresh.balance || 0) + proceeds,
        holdings: newH,
        transactions: [tx, ...(fresh.transactions || [])],
      };
      setMsg({
        t: "s",
        m: `Sold ${q} ${coin} for ${usd(proceeds)}. New balance: ${usd(updated.balance)}`,
      });
    }

    S.users[username] = updated;
    const ns = { ...usersState, [username]: updated };
    setUsersState(ns);
    saveUsers(ns);
    try {
      if (typeof updateUserInDB === "function")
        updateUserInDB(username, {
          balance: updated.balance,
          holdings: updated.holdings,
          transactions: updated.transactions,
        });
    } catch {}
    setQty("");
  };

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: C.text,
          marginBottom: 14,
        }}
      >
        ⚙ Force Trade (Creates Holdings)
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => {
            setAction("buy");
            setMsg(null);
          }}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 7,
            border: `1.5px solid ${action === "buy" ? C.green : C.border}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            background: action === "buy" ? C.green + "15" : "transparent",
            color: action === "buy" ? C.green : C.sub,
          }}
        >
          📈 Force Buy
        </button>
        <button
          onClick={() => {
            setAction("sell");
            setMsg(null);
          }}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 7,
            border: `1.5px solid ${action === "sell" ? C.red : C.border}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            background: action === "sell" ? C.red + "15" : "transparent",
            color: action === "sell" ? C.red : C.sub,
          }}
        >
          📉 Force Sell
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: C.sub,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Coin
          </div>
          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 9,
              fontSize: 13,
              color: C.text,
              outline: "none",
              fontFamily: "inherit",
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            {COINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: C.sub,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Quantity
          </div>
          <input
            type="number"
            min="0"
            placeholder="e.g. 0.5"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setMsg(null);
            }}
            style={{
              width: "100%",
              padding: "9px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 9,
              fontSize: 13,
              color: C.text,
              outline: "none",
              fontFamily: "inherit",
              background: "#f8fafc",
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.sub,
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          Live price: <strong style={{ color: C.text }}>{usd(price)}</strong>
        </span>
        <span>
          Holds:{" "}
          <strong style={{ color: C.text }}>
            {f2(held, 4)} {coin}
          </strong>
        </span>
        <span>
          Balance:{" "}
          <strong style={{ color: C.green }}>{usd(u.balance || 0)}</strong>
        </span>
      </div>
      {qty && !isNaN(parseFloat(qty)) && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: action === "buy" ? C.green : C.red,
            marginBottom: 10,
          }}
        >
          {action === "buy" ? "Cost:" : "Credits:"}{" "}
          {usd((parseFloat(qty) || 0) * price)}
        </div>
      )}
      <button
        onClick={apply}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 9,
          border: "none",
          background: action === "buy" ? C.green : C.red,
          color: "#fff",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {action === "buy" ? "📈 Execute Buy" : "📉 Execute Sell"}
      </button>
      {msg && (
        <div
          style={{
            marginTop: 10,
            padding: "9px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: msg.t === "s" ? C.green + "15" : C.red + "15",
            color: msg.t === "s" ? C.green : C.red,
            border: `1px solid ${msg.t === "s" ? C.green + "30" : C.red + "30"}`,
          }}
        >
          {msg.t === "s" ? "✅ " : "❌ "}
          {msg.m}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   USER DETAIL DRAWER
══════════════════════════════════════════════════════ */
function UserDrawer({
  username,
  usersState,
  setUsersState,
  banned,
  changeScore,
  disc,
  rest,
  del,
  onClose,
}) {
  const [tab, setTab] = useState("overview");
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const u = usersState[username] || S.users?.[username] || {};
  const isBan = banned.includes(username);
  const allTransactions = u.transactions || [];

  const binaryTrades = [
    ...allTransactions.filter((t) => isBinaryTrade(t)),
    ...(u.binaryTrades || []),
  ].filter(
    (t, i, arr) =>
      arr.findIndex((x) => x.date === t.date && x.coin === t.coin) === i,
  );
  const sortedTransactions = [...allTransactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  const cards = u.savedCards || [];
  const hVal = Object.entries(u.holdings || {}).reduce(
    (s, [id, q]) => s + q * (PE.p[id] || 0),
    0,
  );
  const deps = allTransactions
    .filter((t) => t.type === "Deposit")
    .reduce((s, t) => s + (t.usd || 0), 0);
  const wths = allTransactions
    .filter((t) => t.type === "Withdraw")
    .reduce((s, t) => s + (t.usd || 0), 0);
  const score = u.creditScore ?? 50;
  const sc = score >= 70 ? C.green : score >= 40 ? C.gold : C.red;

  const binaryWins = binaryTrades.filter((t) => t.up === true).length;
  const binaryLosses = binaryTrades.filter((t) => t.up === false).length;
  const totalBinaryVolume = binaryTrades.reduce(
    (s, t) => s + (t.amount || 0),
    0,
  );
  const totalBinaryProfit = binaryTrades.reduce(
    (s, t) => s + (t.profitAmount || t.tradeDetails?.profit || 0),
    0,
  );
  const totalBinaryWon = binaryTrades
    .filter((t) => t.up)
    .reduce((s, t) => s + (t.profitAmount || t.tradeDetails?.profit || 0), 0);
  const totalBinaryLost = binaryTrades
    .filter((t) => !t.up)
    .reduce((s, t) => s + (t.amount || 0), 0);

  const handlePasswordChange = async (newPassword) => {
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const result = await adminUpdatePassword(username, newPassword, adminKey);

      if (result.success) {
        const fresh = S.users[username] || usersState[username] || {};
        const updated = {
          ...fresh,
          password: newPassword,
          plainPassword: newPassword,
        };

        S.users[username] = updated;
        const ns = { ...usersState, [username]: updated };
        setUsersState(ns);
        saveUsers(ns);

        setShowPasswordEditor(false);
        alert("✅ Password updated successfully!");
      } else {
        alert(
          "❌ Failed to update password: " + (result.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Password update error:", error);
      alert("❌ Failed to update password");
    }
  };

  const tabs = [
    ["overview", "📊 Overview"],
    ["balance", "💰 Balance"],
    ["binary", "🎲 Binary Trades"],
    ["history", "📜 All Activity"],
    ["holdings", "💼 Holdings"],
    ["cards", "💳 Cards"],
    ["info", "ℹ️ Info"],
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(680px,100vw)",
        background: C.bg,
        boxShadow: "-4px 0 32px rgba(0,0,0,0.14)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: C.sidebar,
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 8,
            width: 34,
            height: 34,
            cursor: "pointer",
            fontSize: 18,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ←
        </button>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            background: "linear-gradient(135deg,#6366f1,#3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 900,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
            @{username}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {u.email || "—"}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 20,
            ...(isBan
              ? { background: "rgba(239,68,68,0.2)", color: "#f87171" }
              : { background: "rgba(34,197,94,0.2)", color: "#4ade80" }),
          }}
        >
          {isBan ? "BANNED" : "ACTIVE"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          gap: 1,
        }}
      >
        <div
          style={{
            padding: "12px 8px",
            textAlign: "center",
            background: C.card,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>
            {usd(u.balance || 0)}
          </div>
          <div style={{ fontSize: 9, color: C.sub }}>Balance</div>
        </div>
        <div
          style={{
            padding: "12px 8px",
            textAlign: "center",
            background: C.card,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>
            {usd(hVal)}
          </div>
          <div style={{ fontSize: 9, color: C.sub }}>Holdings</div>
        </div>
        <div
          style={{
            padding: "12px 8px",
            textAlign: "center",
            background: C.card,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: C.blue }}>
            {binaryTrades.length}
          </div>
          <div style={{ fontSize: 9, color: C.sub }}>Binary Trades</div>
        </div>
        <div
          style={{
            padding: "12px 8px",
            textAlign: "center",
            background: C.card,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: binaryWins >= binaryLosses ? C.green : C.red,
            }}
          >
            {binaryWins}/{binaryLosses}
          </div>
          <div style={{ fontSize: 9, color: C.sub }}>W/L</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          overflowX: "auto",
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          scrollbarWidth: "none",
          flexShrink: 0,
        }}
      >
        {tabs.map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "11px 16px",
              border: "none",
              borderBottom: `2.5px solid ${tab === t ? C.accent : "transparent"}`,
              background: "transparent",
              fontSize: 12,
              fontWeight: 700,
              color: tab === t ? C.accent : C.sub,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}>
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.sub,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Credit Score
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: sc }}>
                  {score}
                  <span style={{ fontSize: 12, color: C.sub, fontWeight: 400 }}>
                    /100
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: 8,
                  background: C.border,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${score}%`,
                    height: "100%",
                    background: sc,
                    borderRadius: 8,
                    transition: "width .4s",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                {[
                  [-5, C.red],
                  [-1, C.gold],
                  [+1, C.green],
                  [+5, C.blue],
                ].map(([d, c]) => (
                  <button
                    key={d}
                    onClick={() => changeScore(username, d)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 7,
                      border: `1.5px solid ${c}`,
                      background: c + "15",
                      color: c,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                ["Total Deposits", usd(deps), C.blue],
                ["Total Withdrawals", usd(wths), C.gold],
                ["Binary Trades", binaryTrades.length, C.accent],
                [
                  "Win/Loss",
                  `${binaryWins}/${binaryLosses}`,
                  binaryWins >= binaryLosses ? C.green : C.red,
                ],
                ["Binary Volume", usd(totalBinaryVolume), "#8b5cf6"],
                [
                  "Binary P&L",
                  usd(totalBinaryProfit),
                  totalBinaryProfit >= 0 ? C.green : C.red,
                ],
                ["Total Won", usd(totalBinaryWon), C.green],
                ["Total Lost", usd(totalBinaryLost), C.red],
              ].map(([l, v, c]) => (
                <div
                  key={l}
                  style={{
                    background: C.card,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: c,
                      marginBottom: 3,
                    }}
                  >
                    {v}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {!isBan ? (
                <button
                  onClick={() => disc(username)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 9,
                    border: `1.5px solid ${C.gold}`,
                    background: C.gold + "15",
                    color: C.gold,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🚫 Ban User
                </button>
              ) : (
                <button
                  onClick={() => rest(username)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 9,
                    border: `1.5px solid ${C.green}`,
                    background: C.green + "15",
                    color: C.green,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✅ Unban
                </button>
              )}
              <button
                onClick={() => {
                  del(username);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 9,
                  border: `1.5px solid ${C.red}`,
                  background: C.red + "15",
                  color: C.red,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        )}

        {tab === "balance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BalanceEditor
              username={username}
              usersState={usersState}
              setUsersState={setUsersState}
            />
            <ForceTradePanel
              username={username}
              usersState={usersState}
              setUsersState={setUsersState}
            />
          </div>
        )}

        {tab === "binary" && (
          <div>
            {binaryTrades.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: C.sub,
                  padding: "60px 20px",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎲</div>
                <div>No binary trades yet</div>
                <div style={{ fontSize: 11, marginTop: 6, color: C.sub }}>
                  User has not placed any binary trades
                </div>
              </div>
            ) : (
              binaryTrades.map((tx, i) => {
                const details = tx.tradeDetails || {};
                return (
                  <div
                    key={i}
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${tx.up ? C.green : C.red}`,
                      padding: "14px 16px",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 28, flexShrink: 0 }}>
                        {tx.up ? "🎉" : "💔"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: tx.up ? C.green : C.red,
                            }}
                          >
                            {tx.up ? "WINNER" : "LOSS"}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: C.accent + "15",
                              color: C.accent,
                            }}
                          >
                            {tx.duration || details.duration || "?"}s
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background:
                                tx.orderType === "up" ||
                                details.orderType === "up"
                                  ? C.green + "15"
                                  : C.red + "15",
                              color:
                                tx.orderType === "up" ||
                                details.orderType === "up"
                                  ? C.green
                                  : C.red,
                            }}
                          >
                            {tx.orderType === "up" || details.orderType === "up"
                              ? "📈 UP"
                              : "📉 DOWN"}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.sub }}>
                          {new Date(tx.date).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: tx.up ? C.green : C.red,
                          }}
                        >
                          {tx.up
                            ? `+${usd(tx.profitAmount || details.profit || 0)}`
                            : `-${usd(tx.amount)}`}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        background: C.bg,
                        borderRadius: 8,
                        padding: "10px 12px",
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          color: "black",
                          fontSize: 11,
                        }}
                      >
                        <div>
                          <span style={{ color: C.sub }}>Amount:</span>{" "}
                          <strong>{usd(tx.amount)}</strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>Profit %:</span>{" "}
                          <strong style={{ color: tx.up ? C.green : C.red }}>
                            {tx.profitPercent || details.profitPercent || "?"}%
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>Start Price:</span>{" "}
                          <strong>
                            $
                            {(tx.startPrice || details.startPrice || 0).toFixed(
                              2,
                            )}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>End Price:</span>{" "}
                          <strong>
                            ${(tx.endPrice || details.endPrice || 0).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "history" && (
          <div>
            {sortedTransactions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: C.sub,
                  padding: "60px 20px",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div>No activity yet</div>
              </div>
            ) : (
              sortedTransactions.map((tx, i) => {
                const isBin = isBinaryTrade(tx);
                return (
                  <div
                    key={i}
                    style={{
                      background: C.card,
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      padding: "12px 14px",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div style={{ fontSize: 24, flexShrink: 0 }}>
                        {typeIcon(tx)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: typeColor(tx) + "18",
                              color: typeColor(tx),
                            }}
                          >
                            {isBin
                              ? `BINARY ${tx.up ? "WIN" : "LOSS"}`
                              : tx.type}
                          </span>
                          {tx.adminAction && (
                            <span style={{ fontSize: 10, color: C.accent }}>
                              🔧 Admin Action
                            </span>
                          )}
                          {tx.adminAdded && (
                            <span style={{ fontSize: 10, color: C.green }}>
                              💰 Admin Credit
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: C.sub }}>
                            {tx.date?.split?.("T")?.[0] || tx.date || "—"}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.sub }}>
                          {tx.coin || "USD"}
                          {tx.amount ? ` · ${f2(tx.amount, 4)} ${tx.coin}` : ""}
                          {tx.price ? ` @ ${usd(tx.price)}` : ""}
                          {isBin &&
                            (tx.duration || tx.tradeDetails?.duration) && (
                              <span>
                                {" "}
                                · {tx.duration || tx.tradeDetails?.duration}s ·{" "}
                                {(tx.orderType ||
                                  tx.tradeDetails?.orderType) === "up"
                                  ? "📈 UP"
                                  : "📉 DOWN"}
                              </span>
                            )}
                          {tx.note && (
                            <span style={{ fontStyle: "italic" }}>
                              {" "}
                              — {tx.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: tx.up ? C.green : C.red,
                          }}
                        >
                          {isBin
                            ? tx.up
                              ? `+${usd(tx.profitAmount || tx.tradeDetails?.profit || 0)}`
                              : `-${usd(tx.amount)}`
                            : tx.up
                              ? "+"
                              : "-"}
                          {usd(tx.usd || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "holdings" && (
          <div>
            <div
              style={{
                background: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "14px 16px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.sub,
                  fontWeight: 600,
                  marginBottom: 3,
                }}
              >
                TOTAL HOLDINGS VALUE
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>
                {usd(hVal)}
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>
                Holdings are created via Force Trade only
              </div>
            </div>
            {Object.entries(u.holdings || {}).filter(([, q]) => q > 0)
              .length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: C.sub,
                  padding: "40px 0",
                  fontSize: 13,
                }}
              >
                No crypto holdings. Use Force Trade to add.
              </div>
            ) : (
              Object.entries(u.holdings || {})
                .filter(([, q]) => q > 0)
                .map(([id, q]) => {
                  const cm = coinMeta(id);
                  const val = q * (PE.p[id] || 0);
                  return (
                    <div
                      key={id}
                      style={{
                        background: C.card,
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        padding: "12px 14px",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: cm.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          color: cm.cl,
                          flexShrink: 0,
                        }}
                      >
                        {cm.sym}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.text,
                          }}
                        >
                          {id}
                        </div>
                        <div style={{ fontSize: 11, color: C.sub }}>
                          {f2(q, 6)} · @ {usd(PE.p[id] || 0)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: C.green,
                        }}
                      >
                        {usd(val)}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {tab === "cards" && (
          <div>
            {cards.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: C.sub,
                  padding: "40px 0",
                  fontSize: 13,
                }}
              >
                No saved cards
              </div>
            )}
            {cards.map((c, i) => (
              <div
                key={c.id || i}
                style={{
                  background: "linear-gradient(135deg,#0c2340,#1a3a5c)",
                  borderRadius: 14,
                  padding: "18px 18px 14px",
                  marginBottom: 12,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: 3,
                    marginBottom: 12,
                  }}
                >
                  BANK CARD
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: 3,
                    marginBottom: 14,
                    fontFamily: "monospace",
                  }}
                >
                  {c.display || "**** **** **** ****"}
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                    }}
                  >
                    {c.name || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    Exp: {c.exp || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "info" && (
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {[
              ["Username", u.username || "—", "👤"],
              ["Full Name", u.fullName || "—", "📝"],
              ["Email", u.email || "—", "✉️"],
              [
                "Password",
                u.password || u.plainPassword || "Not set",
                "🔐",
                true,
              ],
              ["Phone", u.phone || "—", "📞"],
              ["Date of Birth", u.dob || "—", "🎂"],
              ["Country", u.country || "—", "🌍"],
              ["Status", isBan ? "BANNED" : "ACTIVE", "🔒"],
              ["Credit Score", `${score}/100`, "⭐"],
              ["Cash Balance", usd(u.balance || 0), "💰"],
              ["Holdings Value", usd(hVal), "📈"],
              ["Binary Trades", binaryTrades.length, "🎲"],
              ["Binary Wins", binaryWins, "🏆"],
              ["Binary Losses", binaryLosses, "💔"],
              ["Binary Volume", usd(totalBinaryVolume), "💹"],
              [
                "Binary P&L",
                usd(totalBinaryProfit),
                totalBinaryProfit >= 0 ? "📈" : "📉",
              ],
              ["Total Won", usd(totalBinaryWon), "✅"],
              ["Total Lost", usd(totalBinaryLost), "❌"],
              ["Saved Cards", cards.length, "💳"],
            ].map(([l, v, ic, editable], i, arr) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "13px 18px",
                  borderBottom:
                    i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <span style={{ fontSize: 16, width: 26, flexShrink: 0 }}>
                  {ic}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: C.sub,
                    fontWeight: 600,
                  }}
                >
                  {l}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {v}
                </span>
                {editable && (
                  <button
                    onClick={() => setShowPasswordEditor(true)}
                    style={{
                      marginLeft: 8,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${C.accent}`,
                      background: C.accent + "15",
                      color: C.accent,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPasswordEditor && (
        <>
          <div
            onClick={() => setShowPasswordEditor(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1001,
            }}
          />
          <PasswordEditor
            username={username}
            currentPassword={u.password || "••••••"}
            onSave={handlePasswordChange}
            onClose={() => setShowPasswordEditor(false)}
          />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN ADMIN PANEL
══════════════════════════════════════════════════════ */
export default function AdminPanel({ onBack, onExit }) {
  const exit = onBack || onExit;

  const [tab, setTab] = useState("dashboard");
  const [usersState, setUsersState] = useState({});
  const [banned, setBanned] = useState(loadBanned);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selUser, setSelUser] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const res = await getAllWithdrawals(adminKey);

      if (res && !res.error && Array.isArray(res)) {
        setWithdrawals(res);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    }
  }, []);

  const handleWithdrawalAction = async (username, requestId, action) => {
    if (processingWithdrawal === requestId) return;

    setProcessingWithdrawal(requestId);
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const result = await approveWithdrawal(username, requestId, action, adminKey);

      if (result.success) {
        // Find the withdrawal request to get the amount
        const withdrawal = withdrawals.find(w => w.id === requestId && w.username === username);
        const amount = withdrawal?.amount || 0;
        
        // Add notification for the user
        if (action === "approve") {
          addUserNotification(username, "✅ Withdrawal Approved", `Your withdrawal request for ${usd(amount)} has been approved`);
        } else {
          addUserNotification(username, "❌ Withdrawal Rejected", `Your withdrawal request for ${usd(amount)} has been rejected`);
        }
        
        alert(`✅ Withdrawal ${action}d successfully!`);
        // Refresh both lists without page reload
        await fetchWithdrawals();
        await fetchUsers();
        // Close drawer if open for this user
        if (selUser === username) setSelUser(null);
      } else {
        alert(`❌ Failed to ${action} withdrawal: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";

      const res = await getAllUsersWithPlainPasswords(adminKey);

      if (res.error) {
        console.error("Error fetching users:", res.error);
        setUsersState(loadLocalUsers());
      } else if (Array.isArray(res)) {
        const dbUsers = {};
        res.forEach((u) => {
          const k = u.username?.toLowerCase();
          if (k && k !== "admin") {
            dbUsers[k] = {
              ...u,
              username: k,
              password: u.plainPassword || "No password set",
            };
          }
        });

        await Promise.all(
          Object.keys(dbUsers).map(async (username) => {
            try {
              const trades = await getBinaryTrades(username);
              if (Array.isArray(trades) && trades.length > 0) {
                dbUsers[username].binaryTrades = trades;
              }
            } catch {}
          }),
        );

        saveUsers(dbUsers);
        setUsersState(dbUsers);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsersState(loadLocalUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWithdrawals();
  }, [fetchUsers, fetchWithdrawals]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUsersState((prev) => {
        const fresh = loadLocalUsers();
        const merged = { ...fresh };
        for (const k in prev) {
          if (prev[k].binaryTrades) {
            merged[k] = { ...merged[k], binaryTrades: prev[k].binaryTrades };
          }
        }
        return merged;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    S.banned = banned;
  }, [banned]);

  const users = Object.values(usersState);
  const totalBalance = users.reduce((a, u) => a + (u.balance || 0), 0);
  const totalHoldings = users.reduce(
    (a, u) =>
      a +
      Object.entries(u.holdings || {}).reduce(
        (s, [id, q]) => s + q * (PE.p[id] || 0),
        0,
      ),
    0,
  );

  const allTxns = users
    .flatMap((u) =>
      (u.transactions || []).map((tx) => ({ ...tx, _user: u.username })),
    )
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

  const allBinaryTrades = [
    ...allTxns.filter((t) => isBinaryTrade(t)),
    ...users.flatMap((u) =>
      (u.binaryTrades || []).map((t) => ({ ...t, _user: u.username })),
    ),
  ].filter(
    (t, i, arr) =>
      arr.findIndex(
        (x) => x._user === t._user && x.date === t.date && x.coin === t.coin,
      ) === i,
  );
  const allDeposits = allTxns.filter((t) => t.type === "Deposit");
  const allWithdraws = allTxns.filter((t) => t.type === "Withdraw");
  const totalBinaryVolume = allBinaryTrades.reduce(
    (s, t) => s + (t.amount || 0),
    0,
  );
  const totalBinaryProfit = allBinaryTrades.reduce(
    (s, t) => s + (t.profitAmount || t.tradeDetails?.profit || 0),
    0,
  );

  const found = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(q.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(q.toLowerCase()),
  );

  // ✅ SAFE FALLBACKS - Prevent "Cannot read properties of undefined" errors
  const safeWithdrawals = withdrawals || [];
  const safeFound = found || [];
  const safeAllTxns = allTxns || [];
  const safeAllBinaryTrades = allBinaryTrades || [];
  const safeAllDeposits = allDeposits || [];
  const safeAllWithdraws = allWithdraws || [];

  const changeScore = async (username, delta) => {
    const updated = { ...usersState };
    const newScore = Math.max(
      0,
      Math.min(100, (updated[username]?.creditScore ?? 50) + delta),
    );
    updated[username] = { ...updated[username], creditScore: newScore };
    setUsersState(updated);
    saveUsers(updated);
    if (S.users[username]) S.users[username].creditScore = newScore;
    try {
      if (typeof updateUserInDB === "function")
        await updateUserInDB(username, { creditScore: newScore });
    } catch {}
  };

  const disc = (username) => {
    const n = banned.includes(username) ? banned : [...banned, username];
    setBanned(n);
    saveBanned(n);
  };
  const rest = (username) => {
    const n = banned.filter((x) => x !== username);
    setBanned(n);
    saveBanned(n);
  };
  const del = async (username) => {
    try {
      await fetch(`${BASE_URL}/api/users/${username.toLowerCase()}`, {
        method: "DELETE",
      });
      const local = JSON.parse(localStorage.getItem("users") || "{}");
      delete local[username.toLowerCase()];
      localStorage.setItem("users", JSON.stringify(local));
      const up = { ...usersState };
      delete up[username];
      setUsersState(up);
      saveUsers(up);
      const nb = banned.filter((x) => x !== username);
      setBanned(nb);
      saveBanned(nb);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "withdrawals", label: "Withdrawals", icon: "💸" },
    { id: "binary", label: "Binary Trades", icon: "🎲" },
    { id: "deposits", label: "Deposits", icon: "💰" },
    { id: "activity", label: "All Activity", icon: "📋" },
  ];

  const NavBtn = ({ id, label, icon }) => {
    let cnt = null;
    if (id === "users") cnt = users.length;
    else if (id === "withdrawals")
      cnt = safeWithdrawals.filter((w) => w.status === "pending").length;
    else if (id === "binary") cnt = safeAllBinaryTrades.length;
    else if (id === "deposits") cnt = safeAllDeposits.length;
    else if (id === "withdraws") cnt = safeAllWithdraws.length;
    else if (id === "activity") cnt = safeAllTxns.length;

    return (
      <button
        onClick={() => {
          setTab(id);
          setSideOpen(false);
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "11px 14px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: tab === id ? "rgba(99,102,241,0.22)" : "transparent",
          color: tab === id ? "#a5b4fc" : "rgba(255,255,255,0.55)",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          transition: "all .15s",
          textAlign: "left",
          position: "relative",
        }}
      >
        <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {cnt !== null && cnt > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 20,
              background:
                tab === id
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.08)",
              color: tab === id ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          >
            {cnt}
          </span>
        )}
      </button>
    );
  };

  const TxTable = ({ rows, title }) => (
    <div>
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: C.text,
            marginBottom: 14,
          }}
        >
          {title}
        </div>
      )}
      {!rows || rows.length === 0 ? (
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: "40px",
            textAlign: "center",
            color: C.sub,
            fontSize: 13,
          }}
        >
          No records yet
        </div>
      ) : (
        rows.map((tx, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              padding: "13px 16px",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{typeIcon(tx)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                    @{tx._user}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: typeColor(tx) + "18",
                      color: typeColor(tx),
                    }}
                  >
                    {isBinaryTrade(tx)
                      ? `BINARY ${tx.up ? "WIN" : "LOSS"}`
                      : tx.type}
                  </span>
                  {tx.adminAction && (
                    <span style={{ fontSize: 10, color: C.accent }}>
                      🔧 admin
                    </span>
                  )}
                  {tx.adminAdded && (
                    <span style={{ fontSize: 10, color: C.green }}>💰 admin</span>
                  )}
                  {isBinaryTrade(tx) &&
                    (tx.duration || tx.tradeDetails?.duration) && (
                      <>
                        <span style={{ fontSize: 10, color: C.gold }}>
                          ⏱ {tx.duration || tx.tradeDetails?.duration}s
                        </span>
                        <span style={{ fontSize: 10, color: C.accent }}>
                          {(tx.orderType || tx.tradeDetails?.orderType) === "up"
                            ? "📈 UP"
                            : "📉 DOWN"}
                        </span>
                      </>
                    )}
                </div>
                <div style={{ fontSize: 11, color: C.sub }}>
                  {isBinaryTrade(tx) ? (
                    <>
                      <span style={{ fontWeight: 700, color: C.text }}>
                        {tx.coin}
                      </span>
                      {` · Invested: ${usd(tx.amount)}`}
                      {tx.up ? (
                        <span
                          style={{ color: C.green, fontWeight: 700 }}
                        >{` · Won: +${usd(tx.profitAmount || tx.tradeDetails?.profit || 0)}`}</span>
                      ) : (
                        <span
                          style={{ color: C.red, fontWeight: 700 }}
                        >{` · Lost: -${usd(tx.amount)}`}</span>
                      )}
                      {tx.startPrice ? ` · Entry: $${f2(tx.startPrice, 2)}` : ""}
                      {tx.endPrice ? ` → $${f2(tx.endPrice, 2)}` : ""}
                    </>
                  ) : (
                    <>
                      {tx.coin || "USD"}
                      {tx.amount ? ` · ${f2(tx.amount, 4)} ${tx.coin}` : ""}
                      {tx.price ? ` @ ${usd(tx.price)}` : ""}
                    </>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: tx.up ? C.green : C.red,
                  }}
                >
                  {isBinaryTrade(tx)
                    ? tx.up
                      ? `+${usd(tx.profitAmount || tx.tradeDetails?.profit || 0)}`
                      : `-${usd(tx.amount)}`
                    : tx.up
                      ? "+"
                      : "-"}
                  {usd(tx.usd || 0)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Admin API Key Input Screen
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem("adminApiKey");
    if (savedKey) {
      setShowKeyInput(false);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  if (showKeyInput) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: C.bg,
        }}
      >
        <div
          style={{
            background: C.card,
            borderRadius: 16,
            padding: "32px",
            width: "min(400px, 90vw)",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.text,
              marginBottom: 8,
            }}
          >
            Admin Verification Required
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 20 }}>
            Please enter your admin API key to access the panel
          </div>
          <input
            type="password"
            placeholder="Enter admin API key"
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16,
              outline: "none",
            }}
          />
          <button
            onClick={() => {
              if (adminKeyInput) {
                localStorage.setItem("adminApiKey", adminKeyInput);
                setShowKeyInput(false);
                fetchUsers();
                fetchWithdrawals();
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: C.accent,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Verify & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Inter','Syne',sans-serif",
        position: "relative",
      }}
    >
      <style>{css}</style>

      {selUser && (
        <div
          onClick={() => setSelUser(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 999,
          }}
        />
      )}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 89,
          }}
        />
      )}

      <aside
        style={{
          width: 220,
          background: C.sidebar,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "22px 12px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
        className="ap-sidebar"
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 4px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 18,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#f1f5f9" }}>
                AdminOS
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.07em",
                }}
              >
                BINARY TRACKER
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {navItems.map((n) => (
              <NavBtn key={n.id} {...n} />
            ))}
          </nav>
        </div>
        <button
          onClick={exit}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ⎋ Exit Panel
        </button>
      </aside>

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          background: C.sidebar,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "22px 12px",
          transform: sideOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s",
          zIndex: 90,
        }}
        className="ap-sidebar-mob"
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 4px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 18,
                color: "#fff",
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#f1f5f9" }}>
                AdminOS
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                TRACKER
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {navItems.map((n) => (
              <NavBtn key={n.id} {...n} />
            ))}
          </nav>
        </div>
        <button
          onClick={exit}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ⎋ Exit
        </button>
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${C.border}`,
            padding: "0 24px",
            height: 62,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="ap-hamburger"
              onClick={() => setSideOpen((v) => !v)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 20,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ☰
            </button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                {navItems.find((n) => n.id === tab)?.label || "Dashboard"}
              </div>
              <div style={{ fontSize: 11, color: C.sub }}>Admin Panel</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={fetchUsers}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                background: "#fff",
                color: C.sub,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ↻ Refresh
            </button>
            <div style={{ fontSize: 11, color: C.sub }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div
          style={{ flex: 1, padding: "24px", overflowY: "auto" }}
          className="ap-content"
        >
          {tab === "dashboard" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    label: "Total Users",
                    value: users.length,
                    color: C.accent,
                    icon: "👥",
                  },
                  {
                    label: "Banned",
                    value: banned.length,
                    color: C.red,
                    icon: "🚫",
                  },
                  {
                    label: "Platform Cash",
                    value: usd(totalBalance),
                    color: C.green,
                    icon: "💰",
                  },
                  {
                    label: "Holdings",
                    value: usd(totalHoldings),
                    color: C.gold,
                    icon: "📈",
                  },
                  {
                    label: "Binary Trades",
                    value: safeAllBinaryTrades.length,
                    color: C.blue,
                    icon: "🎲",
                  },
                  {
                    label: "Binary Volume",
                    value: usd(totalBinaryVolume),
                    color: "#8b5cf6",
                    icon: "💹",
                  },
                  {
                    label: "Binary P&L",
                    value: usd(totalBinaryProfit),
                    color: totalBinaryProfit >= 0 ? C.green : C.red,
                    icon: "📊",
                  },
                  {
                    label: "Pending Withdrawals",
                    value: safeWithdrawals.filter((w) => w.status === "pending")
                      .length,
                    color: C.gold,
                    icon: "💸",
                  },
                ].map(({ label, value, color, icon }) => (
                  <div
                    key={label}
                    style={{
                      background: C.card,
                      borderRadius: 14,
                      border: `1px solid ${C.border}`,
                      padding: "18px 20px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color,
                        marginBottom: 3,
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: color,
                        opacity: 0.6,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: C.text,
                  marginBottom: 12,
                }}
              >
                📋 Recent Activity
              </div>
              <TxTable rows={safeAllTxns.slice(0, 15)} />
            </div>
          )}

          {tab === "users" && (
            <div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 16,
                    color: C.sub,
                  }}
                >
                  ⌕
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search username or email…"
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 40px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 10,
                    fontSize: 13,
                    color: C.text,
                    outline: "none",
                    background: C.card,
                    fontFamily: "inherit",
                  }}
                />
              </div>
              {loading && (
                <div style={{ textAlign: "center", color: C.sub, padding: 40 }}>
                  Loading users…
                </div>
              )}
              {!loading && (
                <div className="user-table-grid" style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: "1000px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(100px, 1.5fr) minmax(150px, 2fr) minmax(100px, 1fr) minmax(80px, 0.8fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(50px, 0.5fr) minmax(80px, 0.8fr)",
                        padding: "11px 16px",
                        borderBottom: `1px solid ${C.border}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.sub,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        gap: "8px",
                      }}
                    >
                      <span>Username</span>
                      <span>Email</span>
                      <span>Password</span>
                      <span>Balance</span>
                      <span>Binary</span>
                      <span>W/L</span>
                      <span>Score</span>
                      <span>Status</span>
                    </div>
                    {safeFound.length === 0 && (
                      <div
                        style={{
                          padding: 40,
                          textAlign: "center",
                          color: C.sub,
                          fontSize: 13,
                        }}
                      >
                        No users found
                      </div>
                    )}
                    {safeFound.map((u, i) => {
                      const isBan = banned.includes(u.username);
                      const userBinaryTrades = [
                        ...(u.transactions || []).filter((t) =>
                          isBinaryTrade(t),
                        ),
                        ...(u.binaryTrades || []),
                      ].filter(
                        (t, i, arr) =>
                          arr.findIndex(
                            (x) => x.date === t.date && x.coin === t.coin,
                          ) === i,
                      );
                      const binaryCount = userBinaryTrades.length;
                      const binaryWins = userBinaryTrades.filter(
                        (t) => t.up === true,
                      ).length;
                      const binaryLosses = userBinaryTrades.filter(
                        (t) => t.up === false,
                      ).length;
                      const wl =
                        binaryWins + binaryLosses > 0
                          ? `${binaryWins}/${binaryLosses}`
                          : "0/0";
                      const sc = u.creditScore ?? 50;
                      const scC =
                        sc >= 70 ? C.green : sc >= 40 ? C.gold : C.red;

                      const displayPassword =
                        u.password || u.plainPassword || "No password set";

                      return (
                        <div
                          key={u.username}
                          onClick={() => setSelUser(u.username)}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(100px, 1.5fr) minmax(150px, 2fr) minmax(100px, 1fr) minmax(80px, 0.8fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(50px, 0.5fr) minmax(80px, 0.8fr)",
                            padding: "13px 16px",
                            borderBottom:
                              i < safeFound.length - 1
                                ? `1px solid ${C.border}`
                                : "none",
                            cursor: "pointer",
                            transition: "background .15s",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 9,
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background:
                                  "linear-gradient(135deg,#6366f1,#3b82f6)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#fff",
                                flexShrink: 0,
                              }}
                            >
                              {u.username[0].toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.text,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              @{u.username}
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: C.sub,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {u.email || "—"}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: C.accent,
                              fontFamily: "monospace",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(displayPassword);
                              const el = e.target;
                              const originalText = el.textContent;
                              el.textContent = "Copied!";
                              setTimeout(() => {
                                el.textContent = originalText;
                              }, 1000);
                            }}
                            title={displayPassword}
                          >
                            {displayPassword}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: C.green,
                            }}
                          >
                            {usd(u.balance || 0)}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.blue,
                            }}
                          >
                            {binaryCount}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color:
                                binaryWins >= binaryLosses ? C.green : C.red,
                            }}
                          >
                            {wl}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: scC,
                            }}
                          >
                            {sc}
                          </span>
                          <span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 9px",
                                borderRadius: 20,
                                ...(isBan
                                  ? { background: C.red + "15", color: C.red }
                                  : {
                                      background: C.green + "15",
                                      color: C.green,
                                    }),
                              }}
                            >
                              {isBan ? "Banned" : "Active"}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "withdrawals" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                    💸 Withdrawal Requests
                  </div>
                  <button
                    onClick={() => {
                      fetchWithdrawals();
                      fetchUsers();
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      border: `1px solid ${C.border}`,
                      background: C.card,
                      fontSize: 11,
                      cursor: "pointer",
                      color: C.sub,
                    }}
                  >
                    ↻ Refresh
                  </button>
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>
                  Review and process user withdrawal requests
                </div>
              </div>

              {safeWithdrawals.length === 0 ? (
                <div
                  style={{
                    background: C.card,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: "60px 20px",
                    textAlign: "center",
                    color: C.sub,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
                  <div>No withdrawal requests yet</div>
                </div>
              ) : (
                safeWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${
                        w.status === "pending" 
                          ? C.gold 
                          : w.status === "approved" 
                            ? C.green 
                            : C.red
                      }`,
                      padding: "12px",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background:
                              w.status === "pending"
                                ? C.gold + "15"
                                : w.status === "approved"
                                  ? C.green + "15"
                                  : C.red + "15",
                            color:
                              w.status === "pending"
                                ? C.gold
                                : w.status === "approved"
                                  ? C.green
                                  : C.red,
                          }}
                        >
                          {w.status ? w.status.toUpperCase() : "PENDING"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.sub }}>
                        {new Date(w.date).toLocaleString()}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.sub,
                            marginBottom: 2,
                          }}
                        >
                          User
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.text,
                          }}
                        >
                          @{w.username}
                        </div>
                        <div style={{ fontSize: 11, color: C.sub }}>
                          {w.userEmail}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.sub,
                            marginBottom: 2,
                          }}
                        >
                          Amount
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: C.red,
                          }}
                        >
                          {usd(w.amount)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: C.bg,
                        borderRadius: 10,
                        padding: "12px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.text,
                          marginBottom: 8,
                        }}
                      >
                        💳 Card Details
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          fontSize: 11,
                        }}
                      >
                        <div>
                          <span style={{ color: C.sub }}>Card Number:</span>{" "}
                          <strong style={{ color: C.text }}>
                            {w.cardNumber || w.cardLast4}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>Card Name:</span>{" "}
                          <strong style={{ color: C.text }}>
                            {w.cardName || "—"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>Expiry:</span>{" "}
                          <strong style={{ color: C.text }}>
                            {w.cardExpiry || "—"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>CVV:</span>{" "}
                          <strong
                            style={{ color: C.text, fontFamily: "monospace" }}
                          >
                            {w.cvv || "—"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: C.sub }}>
                            Transaction Password:
                          </span>{" "}
                          <strong
                            style={{ color: C.accent, fontFamily: "monospace" }}
                          >
                            {w.userPassword || "—"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {w.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() =>
                            handleWithdrawalAction(w.username, w.id, "approve")
                          }
                          disabled={processingWithdrawal === w.id}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: C.green,
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor:
                              processingWithdrawal === w.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: processingWithdrawal === w.id ? 0.6 : 1,
                          }}
                        >
                          {processingWithdrawal === w.id
                            ? "Processing..."
                            : "✅ Approve"}
                        </button>
                        <button
                          onClick={() =>
                            handleWithdrawalAction(w.username, w.id, "reject")
                          }
                          disabled={processingWithdrawal === w.id}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: C.red,
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor:
                              processingWithdrawal === w.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: processingWithdrawal === w.id ? 0.6 : 1,
                          }}
                        >
                          {processingWithdrawal === w.id
                            ? "Processing..."
                            : "❌ Reject"}
                        </button>
                      </div>
                    )}

                    {(w.status === "approved" || w.status === "rejected") && (
                      <div
                        style={{
                          fontSize: 11,
                          color: w.status === "approved" ? C.green : C.red,
                          marginTop: 6,
                        }}
                      >
                        {w.status === "approved" ? "✅ Approved" : "❌ Rejected"}{" "}
                        on {new Date(w.approvedAt || w.rejectedAt || w.date).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "binary" && (
            <TxTable rows={safeAllBinaryTrades} title="🎲 All Binary Trades" />
          )}
          {tab === "deposits" && (
            <TxTable rows={safeAllDeposits} title="💰 Deposits" />
          )}
          {tab === "withdraws" && (
            <TxTable rows={safeAllWithdraws} title="💸 Withdrawals" />
          )}
          {tab === "activity" && (
            <TxTable rows={safeAllTxns} title="📋 Complete Activity Log" />
          )}
        </div>
      </main>

      {selUser && (
        <UserDrawer
          username={selUser}
          usersState={usersState}
          setUsersState={setUsersState}
          banned={banned}
          changeScore={changeScore}
          disc={disc}
          rest={rest}
          del={del}
          onClose={() => setSelUser(null)}
        />
      )}
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  .ap-tr:hover { background:#f8fafc !important; }
  .ap-sidebar { display:flex !important; }
  .ap-sidebar-mob { display:flex !important; }
  .ap-hamburger { display:none !important; }
  .text-green { color: #22c55e; }
  .text-red { color: #ef4444; }
  
  .user-table-grid {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  @media(max-width:768px){
    .ap-sidebar { display:none !important; }
    .ap-hamburger { display:flex !important; }
    .ap-content { padding:14px !important; }
  }
`;