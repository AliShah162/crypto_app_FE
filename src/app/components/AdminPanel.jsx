"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
import AdminUserManager from "./AdminUserManager";

import { API_URL } from "../lib/config";
import AdminSessions from "./AdminSessions";
const BASE_URL = API_URL;

/* ─── helpers ─── */
function loadLocalUsers() {
  if (typeof window === "undefined") return {};
  try {
    const m = JSON.parse(localStorage.getItem("users") || "{}");
    const o = {};
    for (const k in m) {
      if (k !== "admin" && m[k] && m[k].username && m[k].email) {
        o[k] = m[k];
      }
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
   SEND NOTIFICATION MODAL
══════════════════════════════════════════════════════ */
function SendNotificationModal({ username, userEmail, onClose, onSent }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSend = async () => {
    if (!title.trim()) {
      setMsg({ t: "e", m: "Title is required" });
      return;
    }

    setSending(true);
    setMsg(null);

    try {
      const adminKey = localStorage.getItem("adminApiKey");
      if (!adminKey) {
        setShowKeyInput(true);
        return;
      }
      const response = await fetch(
        `${BASE_URL}/api/users/admin/send-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            username,
            title: title.trim(),
            body: body.trim(),
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setMsg({ t: "s", m: "Notification sent successfully!" });
        setTimeout(() => {
          onSent?.();
          onClose();
        }, 1500);
      } else {
        setMsg({ t: "e", m: data.error || "Failed to send notification" });
      }
    } catch (err) {
      setMsg({ t: "e", m: "Network error. Try again." });
    } finally {
      setSending(false);
    }
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
        width: "min(450px, 90vw)",
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
          color: "black",
          marginBottom: 16,
        }}
      >
        📧 Send Notification to @{username}
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
          TITLE *
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Important Update"
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
          MESSAGE (Optional)
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your notification message here..."
          rows={4}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 9,
            fontSize: 13,
            color: C.text,
            outline: "none",
            background: "#f8fafc",
            fontFamily: "inherit",
            resize: "vertical",
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
          {msg.t === "s" ? "✅ " : "❌ "}
          {msg.m}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 9,
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? "Sending..." : "Send Notification"}
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
   FREEZE EDITOR (Admin can freeze/unfreeze user balance)
══════════════════════════════════════════════════════ */
function FreezeEditor({ username, usersState, setUsersState, onRefresh }) {
  const [mode, setMode] = useState("freeze");
  const [val, setVal] = useState("");
  const [msg, setMsg] = useState(null);
  const [freezeId, setFreezeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [frozenData, setFrozenData] = useState({
    frozenTotal: 0,
    frozenAmounts: [],
  });

  const u = usersState[username] || {};

  // Fetch frozen data
  const fetchFrozenData = async () => {
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${BASE_URL}/api/users/${username}/frozen`, {
        headers: { "x-admin-key": adminKey },
      });
      const data = await response.json();
      if (!data.error) {
        setFrozenData(data);
      }
    } catch (err) {
      console.error("Failed to fetch frozen data:", err);
    }
  };

  useEffect(() => {
    if (username) fetchFrozenData();
  }, [username, usersState]);

  const applyFreeze = async () => {
    const n = parseFloat(val);
    if (!val || isNaN(n) || n < 0) {
      setMsg({ t: "e", m: "Enter a valid positive number." });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";

      let response;
      if (mode === "freeze") {
        response = await fetch(`${BASE_URL}/api/users/admin/freeze-balance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            username,
            amount: n,
            action: "freeze",
            reason: "Admin freeze action",
          }),
        });
      } else {
        // Unfreeze
        response = await fetch(`${BASE_URL}/api/users/admin/freeze-balance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            username,
            amount: n,
            action: "unfreeze",
            ...(freezeId ? { freezeId } : {}),
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        setMsg({ t: "s", m: data.message });
        setVal("");
        setFreezeId(null);

        // Update local state
        const fresh = S.users[username] || usersState[username] || {};
        const updated = {
          ...fresh,
          balance:
            data.newBalance !== undefined ? data.newBalance : fresh.balance,
          frozenTotal: data.frozenTotal,
          frozenAmounts: data.frozenAmounts,
        };

        S.users[username] = updated;
        const ns = { ...usersState, [username]: updated };
        setUsersState(ns);
        saveUsers(ns);

        fetchFrozenData();
        if (onRefresh) onRefresh();
      } else {
        setMsg({ t: "e", m: data.error || "Operation failed" });
      }
    } catch (err) {
      setMsg({ t: "e", m: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const unfreezeSpecific = async (id, amount) => {
    setLoading(true);
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(
        `${BASE_URL}/api/users/admin/freeze-balance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            username,
            amount,
            action: "unfreeze",
            freezeId: id,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setMsg({ t: "s", m: data.message });

        const fresh = S.users[username] || usersState[username] || {};
        const updated = {
          ...fresh,
          balance:
            data.newBalance !== undefined ? data.newBalance : fresh.balance,
          frozenTotal: data.frozenTotal,
          frozenAmounts: data.frozenAmounts,
        };

        S.users[username] = updated;
        const ns = { ...usersState, [username]: updated };
        setUsersState(ns);
        saveUsers(ns);

        fetchFrozenData();
        if (onRefresh) onRefresh();
      } else {
        setMsg({ t: "e", m: data.error || "Unfreeze failed" });
      }
    } catch (err) {
      setMsg({ t: "e", m: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        marginTop: 14,
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
        ❄️ Freeze / Unfreeze User Balance
      </div>

      {/* Frozen Summary */}
      <div
        style={{
          background: "#f0f9ff",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#0284c7" }}>
          Total Frozen: {usd(frozenData.frozenTotal || 0)}
        </span>
        <span style={{ fontSize: 11, color: "#0284c7" }}>
          {frozenData.frozenAmounts?.length || 0} freeze record(s)
        </span>
      </div>

      {/* Freeze Records List */}
      {frozenData.frozenAmounts && frozenData.frozenAmounts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>
            Frozen Transactions:
          </div>
          {frozenData.frozenAmounts.map((freeze) => (
            <div
              key={freeze.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>
                  {usd(freeze.amount)}
                </span>
                <div style={{ fontSize: 10, color: C.sub }}>
                  {new Date(freeze.frozenAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => unfreezeSpecific(freeze.id, freeze.amount)}
                disabled={loading}
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: `1px solid ${C.blue}`,
                  background: C.blue + "15",
                  color: C.blue,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Unfreeze
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => {
            setMode("freeze");
            setMsg(null);
            setFreezeId(null);
          }}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 7,
            border: `1.5px solid ${mode === "freeze" ? C.blue : C.border}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            background: mode === "freeze" ? C.blue + "18" : "transparent",
            color: mode === "freeze" ? C.blue : C.sub,
          }}
        >
          ❄️ Freeze
        </button>
        <button
          onClick={() => {
            setMode("unfreeze");
            setMsg(null);
            setFreezeId(null);
          }}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 7,
            border: `1.5px solid ${mode === "unfreeze" ? C.green : C.border}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            background: mode === "unfreeze" ? C.green + "18" : "transparent",
            color: mode === "unfreeze" ? C.green : C.sub,
          }}
        >
          🔓 Unfreeze
        </button>
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
          onClick={applyFreeze}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: 9,
            border: "none",
            background: mode === "freeze" ? C.blue : C.green,
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? "Processing..."
            : mode === "freeze"
              ? "Freeze"
              : "Unfreeze"}
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: C.sub }}>
        Current Balance:{" "}
        <strong style={{ color: C.text }}>{usd(u.balance || 0)}</strong>
        {frozenData.frozenTotal > 0 && (
          <span style={{ marginLeft: 8 }}>
            | Frozen:{" "}
            <strong style={{ color: C.red }}>
              {usd(frozenData.frozenTotal)}
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
        setMsg({ t: "e", m: `User only holds ${held} ${coin}.` });
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
            step="0.01"
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
            {held} {coin}
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
   USER DETAIL DRAWER (COMPLETE with ALL TABS)
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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
    ["holdings", "❄️ Frozen"],
    ["cards", "💳 Cards"],
    ["info", "ℹ️ Info"],
  ];

  return (
    <>
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
        {/* Header */}
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
              flexShrink: 0,
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
            {username && username[0] ? username[0].toUpperCase() : "?"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
              @{username || "?"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              {u.email || "—"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            <button
              onClick={() => setShowNotificationModal(true)}
              style={{
                background: "rgba(99,102,241,0.2)",
                border: "1px solid #6366f1",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "#a5b4fc",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              📧 Send Notification
            </button>

            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                ...(isBan
                  ? { background: "rgba(239,68,68,0.2)", color: "#f87171" }
                  : { background: "rgba(34,197,94,0.2)", color: "#4ade80" }),
                textAlign: "center",
              }}
            >
              {isBan ? "BANNED" : "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
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
            <div style={{ fontSize: 13, fontWeight: 800, color: C.red }}>
              {usd(u.frozenTotal || 0)}
            </div>
            <div style={{ fontSize: 9, color: C.sub }}>Frozen</div>
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

        {/* Tab Navigation */}
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

        {/* Tab Content */}
        <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}>
          {/* Overview Tab */}
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
                    <span
                      style={{ fontSize: 12, color: C.sub, fontWeight: 400 }}
                    >
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
                    <div
                      style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}
                    >
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

          {/* Balance Tab */}
          {tab === "balance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <BalanceEditor
                username={username}
                usersState={usersState}
                setUsersState={setUsersState}
              />
              <FreezeEditor
                username={username}
                usersState={usersState}
                setUsersState={setUsersState}
                onRefresh={() => {
                  // Refresh user data after freeze/unfreeze
                  const refreshUser = async () => {
                    try {
                      const adminKey =
                        localStorage.getItem("adminApiKey") || "admin123456";
                      const response = await fetch(
                        `${BASE_URL}/api/users/admin/all-with-plain-passwords`,
                        {
                          headers: { "x-admin-key": adminKey },
                        },
                      );
                      const users = await response.json();
                      if (Array.isArray(users)) {
                        const userData = users.find(
                          (u) => u.username === username,
                        );
                        if (userData) {
                          const updated = {
                            ...usersState[username],
                            ...userData,
                          };
                          const ns = { ...usersState, [username]: updated };
                          setUsersState(ns);
                          S.users[username] = updated;
                          saveUsers(ns);
                        }
                      }
                    } catch (err) {
                      console.error("Failed to refresh user:", err);
                    }
                  };
                  refreshUser();
                }}
              />
              <ForceTradePanel
                username={username}
                usersState={usersState}
                setUsersState={setUsersState}
              />
            </div>
          )}

          {/* Binary Trades Tab */}
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
                              {tx.orderType === "up" ||
                              details.orderType === "up"
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
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* History Tab */}
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
                  No activity yet
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
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
                                🔧 Admin
                              </span>
                            )}
                            {tx.adminAdded && (
                              <span style={{ fontSize: 10, color: C.green }}>
                                💰 Admin
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: C.sub }}>
                              {tx.date?.split?.("T")?.[0] || tx.date || "—"}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            {tx.coin || "USD"}
                            {tx.amount
                              ? ` · ${f2(tx.amount, 4)} ${tx.coin}`
                              : ""}
                            {tx.price ? ` @ ${usd(tx.price)}` : ""}
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
                            {tx.up ? "+" : "-"}
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

          {/* Frozen Tab - Replaces Holdings */}
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
                  TOTAL FROZEN AMOUNT
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.red }}>
                  {usd(u.frozenTotal || 0)}
                </div>
              </div>

              {!u.frozenAmounts || u.frozenAmounts.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: C.sub,
                    padding: "40px 0",
                    fontSize: 13,
                  }}
                >
                  No frozen amounts. Admin can freeze balance from admin panel.
                </div>
              ) : (
                u.frozenAmounts.map((freeze) => (
                  <div
                    key={freeze.id}
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
                        background: "#fee2e2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        color: C.red,
                        flexShrink: 0,
                      }}
                    >
                      ❄️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.text,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <span>{usd(freeze.amount)}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: C.accent,
                          }}
                        >
                          @{freeze.username || username}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.sub }}>
                        {freeze.reason || "Frozen by admin"} ·{" "}
                        {new Date(freeze.frozenAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.red,
                        flexShrink: 0,
                      }}
                    >
                      ❄️
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Cards Tab */}
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
                  No saved bank accounts
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
                    BANK ACCOUNT
                  </div>

                  {/* Account Number */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#fff",
                      marginBottom: 14,
                      fontFamily: "monospace",
                      letterSpacing: 1,
                    }}
                  >
                    {c.accNumber || c.num || "••••••••"}
                  </div>

                  {/* Holder Name & Bank Name */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.4)",
                          marginBottom: 2,
                        }}
                      >
                        Account Holder
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 600,
                        }}
                      >
                        {c.holderName || c.name || "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.4)",
                          marginBottom: 2,
                        }}
                      >
                        Bank Name
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 600,
                        }}
                      >
                        {c.bankName || "—"}
                      </div>
                    </div>
                  </div>

                  {/* CVV */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.4)",
                          marginBottom: 2,
                        }}
                      >
                        CVV
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {c.cvv || "•••"}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "monospace",
                      }}
                    >
                      {c.display ||
                        `${c.bankName || "Bank"} - ${(c.accNumber || "").slice(-4) || "****"}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Tab */}
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
                ["Country", u.country || "—", "🌍"],
                ["Status", isBan ? "BANNED" : "ACTIVE", "🔒"],
                ["Credit Score", `${score}/100`, "⭐"],
                ["Cash Balance", usd(u.balance || 0), "💰"],
                ["Frozen Amount", usd(u.frozenTotal || 0), "❄️"],
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
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: C.text }}
                  >
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
      </div>

      {/* Password Editor Modal */}
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

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <>
          <div
            onClick={() => setShowNotificationModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1001,
            }}
          />
          <SendNotificationModal
            username={username}
            userEmail={u.email}
            onClose={() => setShowNotificationModal(false)}
            onSent={() => {}}
          />
        </>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN ADMIN PANEL
══════════════════════════════════════════════════════ */
export default function AdminPanel({ onBack, onExit }) {
  // Helper function to check if session is still valid (for kick/ban detection)
  const checkSessionAndHandleLogout = (response, data) => {
    // Check for 403 (Forbidden) or 401 (Unauthorized) status
    if (response.status === 403 || response.status === 401) {
      // Session was revoked (kicked)
      if (data.error === "SESSION_INVALID" || data.error === "Unauthorized") {
        alert(
          "⚠️ Your admin session has been revoked by the master admin. You will be logged out.",
        );
        localStorage.removeItem("adminApiKey");
        localStorage.removeItem("admin_session_id");
        window.location.href = "/";
        return true;
      }
      // Admin was banned
      if (data.error === "ADMIN_BANNED") {
        alert(
          `🚫 Your admin access has been revoked.\nReason: ${data.reason || "No reason provided"}\nContact the master admin.`,
        );
        localStorage.removeItem("adminApiKey");
        localStorage.removeItem("admin_session_id");
        window.location.href = "/";
        return true;
      }
    }
    return false;
  };
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
  const [allTrades, setAllTrades] = useState([]);
  const [processingTrade, setProcessingTrade] = useState(null);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifUser, setNotifUser] = useState(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifMsg, setNotifMsg] = useState(null);
  const [depositRequests, setDepositRequests] = useState([]);
  const [processingDeposit, setProcessingDeposit] = useState(null);
  // Add these with your other useState declarations
  const [showMasterPanel, setShowMasterPanel] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [masterAuthError, setMasterAuthError] = useState("");
  const [masterAuthenticated, setMasterAuthenticated] = useState(false);
  const [masterPanelTab, setMasterPanelTab] = useState("sessions");
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  // Time filters
  const [tradeTimeFilter, setTradeTimeFilter] = useState("all");
  const [withdrawTimeFilter, setWithdrawTimeFilter] = useState("all");

  // Add this function inside AdminPanel component
  const handleSecretClick = () => {
    clickCount.current++;

    if (clickTimer.current) clearTimeout(clickTimer.current);

    clickTimer.current = setTimeout(() => {
      if (clickCount.current >= 3) {
        setShowMasterPanel(true);
        setMasterPassword("");
        setMasterAuthError("");
        setMasterAuthenticated(false);
      }
      clickCount.current = 0;
    }, 500);
  };

  const verifyMasterPassword = () => {
    // You can change this password to anything you want
    const MASTER_PASSWORD = "YourSecretPassword123";

    if (masterPassword === MASTER_PASSWORD) {
      setMasterAuthenticated(true);
      setMasterAuthError("");
    } else {
      setMasterAuthError("❌ Incorrect password");
    }
  };

  const fetchWithdrawals = useCallback(async () => {
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const sessionId = localStorage.getItem("admin_session_id");
      const res = await fetch(`${BASE_URL}/api/users/admin/all-withdrawals`, {
        headers: {
          "x-admin-key": adminKey,
          "x-session-id": sessionId || "",
        },
      });
      const data = await res.json();

      // Check if session was invalidated
      if (checkSessionAndHandleLogout(res, data)) return;

      if (data && !data.error && Array.isArray(data)) {
        setWithdrawals(data);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      setWithdrawals([]);
    }
  }, []);

  const fetchAllTrades = useCallback(async () => {
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const users = await getAllUsersWithPlainPasswords(adminKey);
      if (Array.isArray(users)) {
        const allTradesList = [];
        for (const user of users) {
          const pendingTrades = user.pendingTrades || [];
          for (const trade of pendingTrades) {
            allTradesList.push({
              ...trade,
              username: user.username,
              userEmail: user.email,
              userFullName: user.fullName,
            });
          }
        }
        allTradesList.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime),
        );
        setAllTrades(allTradesList);
      }
    } catch (error) {
      console.error("Error fetching all trades:", error);
      setAllTrades([]);
    }
  }, []);

  const fetchDepositRequests = useCallback(async () => {
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";

      const response = await fetch(`${BASE_URL}/api/users/admin/all-deposits`, {
        headers: { "x-admin-key": adminKey },
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setDepositRequests(data);
      } else {
        setDepositRequests([]);
      }
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
      setDepositRequests([]);
    }
  }, []);

  const handleDepositAction = async (username, requestId, action) => {
    if (processingDeposit === requestId) return;
    setProcessingDeposit(requestId);
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(
        `${BASE_URL}/api/users/admin/approve-deposit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({ username, requestId, action }),
        },
      );
      const result = await response.json();
      if (result.success) {
        alert(`✅ Deposit ${action}d successfully!`);
        await fetchDepositRequests();
        await fetchUsers();
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setProcessingDeposit(null);
    }
  };

  const handleResolveTrade = async (username, tradeId, action) => {
    if (processingTrade === tradeId) return;
    setProcessingTrade(tradeId);
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(
        `${BASE_URL}/api/users/admin/resolve-trade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({ username, tradeId, action }),
        },
      );
      const result = await response.json();
      if (result.success) {
        alert(`✅ Trade ${action.toUpperCase()} successfully!`);
        await fetchAllTrades();
        await fetchUsers();
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setProcessingTrade(null);
    }
  };

  const handleSendNotification = async () => {
    if (!notifUser) return;
    if (!notifTitle.trim()) {
      setNotifMsg({ t: "e", m: "Title is required" });
      return;
    }

    setSendingNotif(true);
    setNotifMsg(null);

    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(
        `${BASE_URL}/api/users/admin/send-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            username: notifUser,
            title: notifTitle.trim(),
            body: notifBody.trim(),
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setNotifMsg({ t: "s", m: "Notification sent successfully!" });
        setTimeout(() => {
          setNotifUser(null);
          setNotifTitle("");
          setNotifBody("");
          setNotifMsg(null);
        }, 1500);
      } else {
        setNotifMsg({ t: "e", m: data.error || "Failed to send notification" });
      }
    } catch (err) {
      setNotifMsg({ t: "e", m: "Network error. Try again." });
    } finally {
      setSendingNotif(false);
    }
  };

  const handleWithdrawalAction = async (username, requestId, action) => {
    if (processingWithdrawal === requestId) return;
    setProcessingWithdrawal(requestId);
    try {
      const adminKey = localStorage.getItem("adminApiKey") || "admin123456";
      const result = await approveWithdrawal(
        username,
        requestId,
        action,
        adminKey,
      );

      if (result.success) {
        const withdrawal = withdrawals.find(
          (w) => w.id === requestId && w.username === username,
        );
        const amount = withdrawal?.amount || 0;

        // Send notification to user
        await fetch(`${BASE_URL}/api/users/${username}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:
              action === "approve"
                ? "✅ Withdrawal Approved"
                : "❌ Withdrawal Rejected",
            body: `Your withdrawal request for ${usd(amount)} has been ${action}d.`,
            type: "withdrawal",
          }),
        }).catch(() => {});

        alert(`✅ Withdrawal ${action}d successfully!`);
        await fetchWithdrawals();
        await fetchUsers();
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
      const sessionId = localStorage.getItem("admin_session_id");

      const response = await fetch(
        `${BASE_URL}/api/users/admin/all-with-plain-passwords`,
        {
          headers: {
            "x-admin-key": adminKey,
            "x-session-id": sessionId || "",
          },
        },
      );
      const data = await response.json();

      // CHECK IF SESSION WAS INVALIDATED (KICKED)
      if (checkSessionAndHandleLogout(response, data)) return;

      if (data.error) {
        console.error("Error fetching users:", data.error);
        setUsersState(loadLocalUsers());
      } else if (Array.isArray(data)) {
        const dbUsers = {};
        data.forEach((u) => {
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
        const cleanLocal = {};
        for (const [username, userData] of Object.entries(dbUsers)) {
          cleanLocal[username] = userData;
        }
        localStorage.setItem("users", JSON.stringify(cleanLocal));
        S.users = cleanLocal;
        setUsersState(cleanLocal);
        saveUsers(cleanLocal);
      } else {
        setUsersState(loadLocalUsers());
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
    fetchAllTrades();
    fetchDepositRequests();
  }, [fetchUsers, fetchWithdrawals, fetchAllTrades, fetchDepositRequests]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllTrades();
      fetchWithdrawals();
      fetchDepositRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAllTrades, fetchWithdrawals, fetchDepositRequests]);

  useEffect(() => {
    S.banned = banned;
  }, [banned]);


// ========== SESSION VALIDITY CHECK - ONLY DETECT WHEN EXPLICITLY REVOKED ==========
// ========== REVOCATION CHECK ==========
useEffect(() => {
  if (showMasterPanel) return;
  
  let revocationInterval = null;
  
  const checkForRevocation = async () => {
    const sessionId = localStorage.getItem("admin_session_id");
    const adminKey = localStorage.getItem("adminApiKey");
    
    if (!sessionId || !adminKey) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/users/admin/sessions`, {
        headers: {
          "x-admin-key": adminKey,
          "x-session-id": sessionId,
        },
      });
      const data = await response.json();
      
      if (data.sessions && Array.isArray(data.sessions)) {
        const currentSession = data.sessions.find(s => s.sessionId === sessionId);
        
        if (currentSession && currentSession.isActive === false) {
          alert("⚠️ Your admin session has been revoked by the master admin!");
          localStorage.removeItem("adminApiKey");
          localStorage.removeItem("admin_session_id");
          window.location.href = "/";
        }
      }
    } catch (err) {
      // Silent fail
    }
  };
  
  checkForRevocation();
  revocationInterval = setInterval(checkForRevocation, 5000);
  
  return () => {
    if (revocationInterval) clearInterval(revocationInterval);
  };
}, [showMasterPanel]);
  

// Register admin session when panel loads (for revoke functionality)
// ========== FORCE SESSION REGISTRATION (Fixes incognito) ==========
useEffect(() => {
  const registerSession = async () => {
    const adminKey = localStorage.getItem("adminApiKey");
    if (!adminKey) return;
    
    try {
      const response = await fetch(`${BASE_URL}/api/users/admin/register-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey: adminKey,
          userAgent: navigator.userAgent,
          adminUsername: localStorage.getItem("session") || "admin",
        }),
      });
      const data = await response.json();
      if (data.sessionId) {
        // Always use backend session ID
        localStorage.setItem("admin_session_id", data.sessionId);
        console.log("✅ Session registered:", data.sessionId);
      }
    } catch (err) {
      console.error("Session registration failed:", err);
    }
  };
  
  registerSession();
}, []);

  const users = Object.values(usersState);
  const totalBalance = users.reduce((a, u) => a + (u?.balance || 0), 0);
  const totalHoldings = users.reduce(
    (a, u) =>
      a +
      Object.entries(u?.holdings || {}).reduce(
        (s, [id, q]) => s + (q || 0) * (PE.p[id] || 0),
        0,
      ),
    0,
  );

  const allTxns = Array.isArray(users)
    ? users
        .flatMap((u) =>
          (u?.transactions || []).map((tx) => ({ ...tx, _user: u.username })),
        )
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        })
    : [];

  const allBinaryTrades =
    Array.isArray(allTxns) && Array.isArray(users)
      ? [
          ...allTxns.filter((t) => isBinaryTrade(t)),
          ...users.flatMap((u) =>
            (u?.binaryTrades || []).map((t) => ({ ...t, _user: u.username })),
          ),
        ].filter(
          (t, i, arr) =>
            arr.findIndex(
              (x) =>
                x._user === t._user && x.date === t.date && x.coin === t.coin,
            ) === i,
        )
      : [];

  const allDeposits = Array.isArray(allTxns)
    ? allTxns.filter((t) => t?.type === "Deposit")
    : [];
  const allWithdraws = Array.isArray(allTxns)
    ? allTxns.filter((t) => t?.type === "Withdraw")
    : [];

  const totalBinaryVolume = Array.isArray(allBinaryTrades)
    ? allBinaryTrades.reduce((s, t) => s + (t?.amount || 0), 0)
    : 0;

  const totalBinaryProfit = Array.isArray(allBinaryTrades)
    ? allBinaryTrades.reduce(
        (s, t) => s + (t?.profitAmount || t?.tradeDetails?.profit || 0),
        0,
      )
    : 0;

  const found = Array.isArray(users)
    ? users.filter(
        (u) =>
          u?.username?.toLowerCase().includes(q.toLowerCase()) ||
          (u?.email || "").toLowerCase().includes(q.toLowerCase()),
      )
    : [];

  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
  const safeFound = Array.isArray(found) ? found : [];
  const safeAllTxns = Array.isArray(allTxns) ? allTxns : [];
  const safeAllBinaryTrades = Array.isArray(allBinaryTrades)
    ? allBinaryTrades
    : [];
  const safeAllDeposits = Array.isArray(allDeposits) ? allDeposits : [];
  const safeAllWithdraws = Array.isArray(allWithdraws) ? allWithdraws : [];
  const safeAllTrades = Array.isArray(allTrades) ? allTrades : [];

  // Time filter function
  const filterByTime = (items, timeFilter) => {
    if (timeFilter === "all") return items;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return items.filter((item) => {
      const itemDate = new Date(item.startTime || item.date);
      if (timeFilter === "today") return itemDate >= today;
      if (timeFilter === "week") return itemDate >= weekAgo;
      if (timeFilter === "month") return itemDate >= monthAgo;
      return true;
    });
  };

  const filteredTrades = filterByTime(safeAllTrades, tradeTimeFilter);
  const filteredWithdrawals = filterByTime(safeWithdrawals, withdrawTimeFilter);

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
      if (S.users && S.users[username]) {
        delete S.users[username];
      }
      alert(`User ${username} deleted from local storage`);
    } catch (e) {
      console.error("Local deletion error:", e);
      alert("Failed to delete user from local storage");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/api/users/${username.toLowerCase()}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        console.log(`User ${username} deleted from database`);
      } else if (response.status === 404) {
        console.log(`User ${username} not found in database`);
      }
    } catch (e) {
      console.log("Network error during database delete:", e);
    }
    await fetchUsers();
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    {
      id: "pending_trades",
      label: "All Binary Trades",
      icon: "🎲",
      badge: safeAllTrades.filter((t) => t.status === "pending").length,
    },
    {
      id: "withdrawals",
      label: "All Withdrawals",
      icon: "💸",
      badge: safeWithdrawals.filter((w) => w.status === "pending").length,
    },
    { id: "send_notification", label: "Send Notification", icon: "📧" },
    { id: "binary", label: "Completed Trades", icon: "🏆" },
    { id: "deposits", label: "Deposits", icon: "💰" },
    { id: "activity", label: "All Activity", icon: "📋" },
    // Add to navItems array
    { id: "admin_users", label: "Admin Users", icon: "👥", badge: 0 },
  ];

  const getTradeStatusBadge = (status) => {
    const styles = {
      pending: { bg: C.gold + "15", color: C.gold, text: "⏳ PENDING" },
      won: { bg: C.green + "15", color: C.green, text: "✅ WON" },
      lost: { bg: C.red + "15", color: C.red, text: "❌ LOST" },
      frozen: { bg: C.blue + "15", color: C.blue, text: "⏸️ FROZEN" },
    };
    const s = styles[status] || styles.pending;
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          background: s.bg,
          color: s.color,
        }}
      >
        {s.text}
      </span>
    );
  };

  const getWithdrawalStatusBadge = (status) => {
    const styles = {
      pending: { bg: C.gold + "15", color: C.gold, text: "⏳ PENDING" },
      approved: { bg: C.green + "15", color: C.green, text: "✅ APPROVED" },
      rejected: { bg: C.red + "15", color: C.red, text: "❌ REJECTED" },
    };
    const s = styles[status] || styles.pending;
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          background: s.bg,
          color: s.color,
        }}
      >
        {s.text}
      </span>
    );
  };

  const NavBtn = ({ id, label, icon, badge }) => (
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
      {badge > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 20,
            background:
              tab === id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
            color: tab === id ? "#fff" : "rgba(255,255,255,0.4)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );

  const TimeFilterButtons = ({ currentFilter, onFilterChange }) => (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {[
        { id: "all", label: "All Time" },
        { id: "today", label: "Today" },
        { id: "week", label: "This Week" },
        { id: "month", label: "This Month" },
      ].map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          style={{
            padding: "5px 12px",
            borderRadius: 15,
            border: `1px solid ${currentFilter === filter.id ? C.accent : C.border}`,
            background:
              currentFilter === filter.id ? C.accent + "15" : "transparent",
            color: currentFilter === filter.id ? C.accent : C.sub,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );

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
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: C.text }}
                  >
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
                  {tx.up ? "+" : "-"}
                  {usd(tx.usd || 0)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

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

  if (loading && users.length === 0) {
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
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div style={{ fontSize: 14, color: C.sub }}>
            Loading admin panel...
          </div>
        </div>
      </div>
    );
  }

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
                fetchAllTrades();
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
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  .ap-sidebar { display:flex !important; }
  .ap-sidebar-mob { display:flex !important; }
  .ap-hamburger { display:none !important; }
  
  /* Custom Scrollbar */
  .custom-scroll::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scroll::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 10px;
  }
  
  .custom-scroll::-webkit-scrollbar-thumb {
    background: #6366f1;
    border-radius: 10px;
  }
  
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: #818cf8;
  }
  
  @media(max-width:768px){
    .ap-sidebar { display:none !important; }
    .ap-hamburger { display:flex !important; }
    .ap-content { padding:14px !important; }
    
    /* Mobile adjustments for scrollable containers */
    .custom-scroll {
      max-height: calc(100vh - 200px) !important;
    }
  }
`}</style>
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

      {/* Sidebar Desktop */}
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
            onClick={handleSecretClick}
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
              <NavBtn
                key={n.id}
                id={n.id}
                label={n.label}
                icon={n.icon}
                badge={n.badge || 0}
              />
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

      {/* Sidebar Mobile */}
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
              <NavBtn
                key={n.id}
                id={n.id}
                label={n.label}
                icon={n.icon}
                badge={n.badge || 0}
              />
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

      {/* Main Content */}
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
                background: C.card,
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.text}
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
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
              onClick={() => {
                fetchUsers();
                fetchWithdrawals();
                fetchAllTrades();
              }}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                background: "#fff",
                color: "#1a1a1a",
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
          {/* Dashboard Tab */}
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
                    label: "Total Frozen",
                    value: usd(
                      users.reduce((a, u) => a + (u?.frozenTotal || 0), 0),
                    ),
                    color: C.red,
                    icon: "❄️",
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
                    label: "Pending Trades",
                    value: safeAllTrades.filter((t) => t.status === "pending")
                      .length,
                    color: C.gold,
                    icon: "⏳",
                  },
                  {
                    label: "Pending Withdrawals",
                    value: safeWithdrawals.filter(
                      (w) => w?.status === "pending",
                    ).length,
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

              {/* Scrollable Recent Activity */}
              <div
                className="custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 350px)",
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                <TxTable rows={safeAllTxns.slice(0, 15)} />
              </div>
            </div>
          )}

          {/* Users Tab */}
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
                <div
                  className="custom-scroll"
                  style={{
                    maxHeight: "calc(100vh - 180px)",
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <div style={{ minWidth: "1000px" }}>
                    {/* Table Header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(100px, 1.5fr) minmax(150px, 2fr) minmax(120px, 1fr) minmax(80px, 0.8fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(50px, 0.5fr) minmax(80px, 0.8fr)",
                        padding: "11px 16px",
                        borderBottom: `1px solid ${C.border}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.sub,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        gap: "8px",
                        position: "sticky",
                        top: 0,
                        background: C.bg,
                        zIndex: 5,
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

                    {/* Table Rows */}
                    {safeFound.length === 0 && (
                      <div
                        style={{
                          padding: 40,
                          textAlign: "center",
                          color: C.sub,
                        }}
                      >
                        No users found
                      </div>
                    )}

                    {safeFound.map((u, i) => {
                      const isBan = banned.includes(u.username);
                      const userBinaryTrades = [
                        ...(u?.transactions || []).filter((t) =>
                          isBinaryTrade(t),
                        ),
                        ...(u?.binaryTrades || []),
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
                      const sc = u?.creditScore ?? 50;
                      const scC =
                        sc >= 70 ? C.green : sc >= 40 ? C.gold : C.red;
                      const displayPassword =
                        u?.password || u?.plainPassword || "No password set";

                      return (
                        <div
                          key={u.username}
                          onClick={() => setSelUser(u.username)}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(100px, 1.5fr) minmax(150px, 2fr) minmax(120px, 1fr) minmax(80px, 0.8fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(50px, 0.5fr) minmax(80px, 0.8fr)",
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
                          {/* Username with avatar */}
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

                          {/* Email */}
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

                          {/* Password (click to copy) */}
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

                          {/* Balance */}
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: C.green,
                            }}
                          >
                            {usd(u.balance || 0)}
                          </span>

                          {/* Binary Count */}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.blue,
                            }}
                          >
                            {binaryCount}
                          </span>

                          {/* Win/Loss */}
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

                          {/* Credit Score */}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: scC,
                            }}
                          >
                            {sc}
                          </span>

                          {/* Status Badge */}
                          <span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 9px",
                                borderRadius: 20,
                                background: isBan
                                  ? C.red + "15"
                                  : C.green + "15",
                                color: isBan ? C.red : C.green,
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

          {/* ALL BINARY TRADES TAB - WITH TIME FILTER */}
          {tab === "pending_trades" && (
            <div>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                    🎲 All Binary Trades
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                    Complete history of all binary trades with status
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => fetchAllTrades()}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.card,
                      fontSize: 11,
                      color: "#000000",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    ↻ Refresh
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          "⚠️ Are you sure? This will clear ALL completed trades (WON, LOST, FROZEN) while keeping PENDING trades. This action cannot be undone!",
                        )
                      ) {
                        try {
                          const adminKey =
                            localStorage.getItem("adminApiKey") ||
                            "admin123456";
                          const response = await fetch(
                            `${BASE_URL}/api/users/admin/clear-completed-trades`,
                            {
                              method: "DELETE",
                              headers: { "x-admin-key": adminKey },
                            },
                          );
                          const result = await response.json();
                          if (result.success) {
                            alert(`✅ ${result.message}`);
                            await fetchAllTrades();
                            await fetchUsers();
                          } else {
                            alert(`❌ Failed: ${result.error}`);
                          }
                        } catch (error) {
                          alert(`❌ Error: ${error.message}`);
                        }
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.red}`,
                      background: `${C.red}10`,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                      color: C.red,
                    }}
                  >
                    🗑 Clear Completed Trades
                  </button>
                </div>
              </div>

              <TimeFilterButtons
                currentFilter={tradeTimeFilter}
                onFilterChange={setTradeTimeFilter}
              />

              {/* Scrollable Trades List */}
              <div
                className="custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 220px)",
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                {filteredTrades.length === 0 ? (
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      padding: "40px 20px",
                      textAlign: "center",
                      color: C.sub,
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🎲</div>
                    <div style={{ fontSize: 13 }}>No binary trades found</div>
                  </div>
                ) : (
                  filteredTrades.map((trade, index) => (
                    <div
                      key={`${trade.id}-${index}`}
                      style={{
                        background: C.card,
                        borderRadius: 12,
                        marginBottom: 12,
                        border: `1px solid ${trade.status === "pending" ? C.gold : trade.status === "won" ? C.green : trade.status === "lost" ? C.red : C.blue}`,
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Header - Status Bar */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background:
                            trade.status === "pending"
                              ? `${C.gold}8`
                              : trade.status === "won"
                                ? `${C.green}8`
                                : trade.status === "lost"
                                  ? `${C.red}8`
                                  : `${C.blue}8`,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {getTradeStatusBadge(trade.status)}
                            <span
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                fontFamily: "monospace",
                                background: `${C.border}40`,
                                padding: "2px 6px",
                                borderRadius: 10,
                              }}
                            >
                              #{String(trade.id).slice(-6)}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: C.sub }}>
                            {new Date(trade.startTime).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "12px" }}>
                        {/* User Section - Compact */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                            paddingBottom: 8,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#6366f1,#3b82f6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {trade.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              @{trade.username}
                            </div>
                            <div style={{ fontSize: 10, color: C.sub }}>
                              {trade.userEmail}
                            </div>
                          </div>
                        </div>

                        {/* Trade Details - Compact Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Coin
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              {trade.coin}
                            </div>
                          </div>

                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Direction
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  trade.orderType === "up" ? C.green : C.red,
                              }}
                            >
                              {trade.orderType === "up" ? "UP 📈" : "DOWN 📉"}
                            </div>
                          </div>

                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Amount
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.gold,
                              }}
                            >
                              ${trade.amount}
                            </div>
                          </div>

                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Time / %
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: C.blue,
                              }}
                            >
                              {trade.timeSeconds}s / {trade.profitPercent}%
                            </div>
                          </div>
                        </div>

                        {/* Resolution Section (if resolved) - Compact */}
                        {trade.status !== "pending" && trade.result && (
                          <div
                            style={{
                              background:
                                trade.status === "won"
                                  ? `${C.green}8`
                                  : trade.status === "lost"
                                    ? `${C.red}8`
                                    : `${C.blue}8`,
                              borderRadius: 8,
                              padding: "8px 10px",
                              marginTop: 6,
                              fontSize: 11,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>
                                  {trade.status === "won"
                                    ? "🏆"
                                    : trade.status === "lost"
                                      ? "💔"
                                      : "⏸️"}
                                </span>
                                <span>
                                  <strong>Result:</strong>{" "}
                                  <span
                                    style={{
                                      color:
                                        trade.status === "won"
                                          ? C.green
                                          : trade.status === "lost"
                                            ? C.red
                                            : C.blue,
                                    }}
                                  >
                                    {trade.result}
                                  </span>
                                </span>
                              </div>
                              <span style={{ fontSize: 10, color: C.sub }}>
                                {new Date(trade.resolvedAt).toLocaleString()}
                              </span>
                            </div>
                            {trade.profitAmount > 0 && (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 11,
                                  color: C.green,
                                }}
                              >
                                +${trade.profitAmount.toFixed(2)} profit
                              </div>
                            )}
                          </div>
                        )}

                        {/* Resolution Buttons (for pending trades) - Compact */}
                        {trade.status === "pending" && (
                          <div
                            style={{
                              background: `${C.gold}6`,
                              borderRadius: 8,
                              padding: "10px",
                              marginTop: 6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.gold,
                                marginBottom: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>🎯</span> Resolution Options
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleResolveTrade(
                                    trade.username,
                                    trade.id,
                                    "win",
                                  )
                                }
                                disabled={processingTrade === trade.id}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: C.green,
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor:
                                    processingTrade === trade.id
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    processingTrade === trade.id ? 0.6 : 1,
                                }}
                              >
                                🎉 WIN (+$
                                {(
                                  (trade.amount * trade.profitPercent) /
                                  100
                                ).toFixed(2)}
                                )
                              </button>
                              <button
                                onClick={() =>
                                  handleResolveTrade(
                                    trade.username,
                                    trade.id,
                                    "loss",
                                  )
                                }
                                disabled={processingTrade === trade.id}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: C.red,
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor:
                                    processingTrade === trade.id
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    processingTrade === trade.id ? 0.6 : 1,
                                }}
                              >
                                💔 LOSS (-${trade.amount})
                              </button>
                              <button
                                onClick={() =>
                                  handleResolveTrade(
                                    trade.username,
                                    trade.id,
                                    "freeze",
                                  )
                                }
                                disabled={processingTrade === trade.id}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: C.gold,
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor:
                                    processingTrade === trade.id
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    processingTrade === trade.id ? 0.6 : 1,
                                }}
                              >
                                ⏸️ FREEZE
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ALL WITHDRAWALS TAB - WITH TIME FILTER */}
          {tab === "withdrawals" && (
            <div>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                    💸 All Withdrawal Requests
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                    Complete history of all withdrawal requests with status
                  </div>
                </div>
                <button
                  onClick={() => {
                    fetchUsers();
                    fetchWithdrawals();
                    fetchAllTrades();
                  }}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.border}`,
                    background: "#fff",
                    color: "#1a1a1a",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↻ Refresh
                </button>
              </div>

              <TimeFilterButtons
                currentFilter={withdrawTimeFilter}
                onFilterChange={setWithdrawTimeFilter}
              />

              {/* Scrollable Withdrawals List */}
              <div
                className="custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 220px)",
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                {filteredWithdrawals.length === 0 ? (
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      padding: "60px 20px",
                      textAlign: "center",
                      color: C.sub,
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
                    <div>No withdrawal requests found</div>
                  </div>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <div
                      key={w.id}
                      style={{
                        background: C.card,
                        borderRadius: 12,
                        marginBottom: 12,
                        border: `1px solid ${w?.status === "pending" ? C.gold : w?.status === "approved" ? C.green : C.red}`,
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background:
                            w?.status === "pending"
                              ? `${C.gold}8`
                              : w?.status === "approved"
                                ? `${C.green}8`
                                : `${C.red}8`,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {getWithdrawalStatusBadge(w.status)}
                            <span
                              style={{
                                fontSize: 11,
                                color: C.sub,
                                fontFamily: "monospace",
                              }}
                            >
                              ID: {String(w.id).slice(-8)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            {new Date(w.date).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "12px" }}>
                        {/* User Section */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                            paddingBottom: 8,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#6366f1,#3b82f6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {w.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
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
                        </div>

                        {/* Amount */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "8px 12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                marginBottom: 2,
                              }}
                            >
                              💰 Amount
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
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "8px 12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                marginBottom: 2,
                              }}
                            >
                              🏦 Bank Details
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: C.text,
                              }}
                            >
                              {w.bankName || w.cardName || "—"}
                            </div>
                          </div>
                        </div>

                        {/* Bank Account Details Section */}
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
                              color: C.blue,
                              marginBottom: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            🏦 Account Details
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 8,
                              fontSize: 11,
                            }}
                          >
                            <div>
                              <span style={{ color: C.sub }}>
                                Account Holder:
                              </span>{" "}
                              <strong style={{ color: C.text }}>
                                {w.holderName ||
                                  w.cardName ||
                                  w.userFullName ||
                                  "—"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: C.sub }}>Bank Name:</span>{" "}
                              <strong style={{ color: C.text }}>
                                {w.bankName || w.cardName || "—"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: C.sub }}>
                                Account Number:
                              </span>{" "}
                              <strong
                                style={{
                                  color: C.text,
                                  fontFamily: "monospace",
                                }}
                              >
                                {w.accNumber ||
                                  w.cardNumber ||
                                  w.cardLast4 ||
                                  "—"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: C.sub }}>CVV:</span>{" "}
                              <strong
                                style={{
                                  color: C.text,
                                  fontFamily: "monospace",
                                }}
                              >
                                {w.cvv ? "•••" : "—"}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons (Pending) */}
                        {w?.status === "pending" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                handleWithdrawalAction(
                                  w.username,
                                  w.id,
                                  "approve",
                                )
                              }
                              disabled={processingWithdrawal === w.id}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: C.green,
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor:
                                  processingWithdrawal === w.id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  processingWithdrawal === w.id ? 0.6 : 1,
                              }}
                            >
                              ✅ Approve Withdrawal
                            </button>
                            <button
                              onClick={() =>
                                handleWithdrawalAction(
                                  w.username,
                                  w.id,
                                  "reject",
                                )
                              }
                              disabled={processingWithdrawal === w.id}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: C.red,
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor:
                                  processingWithdrawal === w.id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  processingWithdrawal === w.id ? 0.6 : 1,
                              }}
                            >
                              ❌ Reject Withdrawal
                            </button>
                          </div>
                        )}

                        {/* Status Message for Resolved */}
                        {w?.status !== "pending" && (
                          <div
                            style={{
                              fontSize: 11,
                              color: w?.status === "approved" ? C.green : C.red,
                              marginTop: 8,
                              textAlign: "center",
                              padding: "6px",
                              background:
                                w?.status === "approved"
                                  ? `${C.green}10`
                                  : `${C.red}10`,
                              borderRadius: 6,
                            }}
                          >
                            {w?.status === "approved"
                              ? "✅ Approved"
                              : "❌ Rejected"}{" "}
                            on{" "}
                            {new Date(
                              w.approvedAt || w.rejectedAt || w.date,
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SEND NOTIFICATION TAB */}
          {tab === "send_notification" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#000000",
                    marginBottom: 8,
                  }}
                >
                  📧 Send Notification
                </div>
                <div style={{ fontSize: 13, color: "#000000" }}>
                  Send a custom notification to a specific user. They will see
                  it in their notification panel.
                </div>
              </div>

              <div
                style={{
                  background: "#1e1e2e",
                  borderRadius: 16,
                  border: "1px solid #2d2d3d",
                  padding: "28px",
                  maxWidth: 550,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* SELECT USER */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c0c0c0",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Select User *
                  </div>
                  <select
                    value={notifUser || ""}
                    onChange={(e) => setNotifUser(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #3a3a4a",
                      borderRadius: 10,
                      fontSize: 14,
                      color: "#ffffff",
                      background: "#252535",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#3a3a4a")}
                  >
                    <option value="" style={{ background: "#252535" }}>
                      -- Select a user --
                    </option>
                    {users.map((u) => (
                      <option
                        key={u.username}
                        value={u.username}
                        style={{ background: "#252535" }}
                      >
                        @{u.username} - {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TITLE */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c0c0c0",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Title *
                  </div>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g., Important Update"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #3a3a4a",
                      borderRadius: 10,
                      fontSize: 14,
                      color: "#ffffff",
                      background: "#252535",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#3a3a4a")}
                  />
                </div>

                {/* MESSAGE */}
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c0c0c0",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Message (Optional)
                  </div>
                  <textarea
                    value={notifBody}
                    onChange={(e) => setNotifBody(e.target.value)}
                    placeholder="Write your notification message here..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid #3a3a4a",
                      borderRadius: 10,
                      fontSize: 14,
                      color: "#ffffff",
                      background: "#252535",
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#3a3a4a")}
                  />
                </div>

                {/* MESSAGE STATUS */}
                {notifMsg && (
                  <div
                    style={{
                      marginBottom: 20,
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      background:
                        notifMsg.t === "s" ? "#10b98115" : "#ef444415",
                      border: `1px solid ${notifMsg.t === "s" ? "#10b98130" : "#ef444430"}`,
                      color: notifMsg.t === "s" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {notifMsg.t === "s" ? "✓ " : "✗ "}
                    {notifMsg.m}
                  </div>
                )}

                {/* SEND BUTTON */}
                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotif || !notifUser}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: !notifUser ? "#3a3a4a" : "#6366f1",
                    color: !notifUser ? "#888888" : "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      !notifUser || sendingNotif ? "not-allowed" : "pointer",
                    opacity: sendingNotif ? 0.7 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (notifUser && !sendingNotif)
                      e.target.style.background = "#7c3aed";
                  }}
                  onMouseLeave={(e) => {
                    if (notifUser && !sendingNotif)
                      e.target.style.background = "#6366f1";
                  }}
                >
                  {sendingNotif ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </div>
          )}

          {/* Completed Trades Tab (Legacy) */}
          {tab === "binary" && (
            <div>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                    🏆 Completed Binary Trades
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                    History of all resolved binary trades (WON, LOST, FROZEN)
                  </div>
                </div>
                <button
                  onClick={() => fetchAllTrades()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ↻ Refresh
                </button>
              </div>

              <div
                className="custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 180px)",
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                {safeAllBinaryTrades.length === 0 ? (
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      padding: "60px 20px",
                      textAlign: "center",
                      color: C.sub,
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                    <div style={{ fontSize: 13 }}>
                      No completed trades found
                    </div>
                  </div>
                ) : (
                  safeAllBinaryTrades.map((trade, index) => (
                    <div
                      key={index}
                      style={{
                        background: C.card,
                        borderRadius: 12,
                        marginBottom: 12,
                        border: `1px solid ${trade.status === "won" ? C.green : trade.status === "lost" ? C.red : C.blue}`,
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background:
                            trade.status === "won"
                              ? `${C.green}8`
                              : trade.status === "lost"
                                ? `${C.red}8`
                                : `${C.blue}8`,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {getTradeStatusBadge(trade.status)}
                            <span
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                fontFamily: "monospace",
                                background: `${C.border}40`,
                                padding: "2px 6px",
                                borderRadius: 10,
                              }}
                            >
                              #{String(trade.id).slice(-6)}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: C.sub }}>
                            {new Date(trade.date).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "12px" }}>
                        {/* User Section */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                            paddingBottom: 8,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#6366f1,#3b82f6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {trade._user?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              @{trade._user}
                            </div>
                          </div>
                        </div>

                        {/* Trade Details - Compact Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Coin
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              {trade.coin}
                            </div>
                          </div>

                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Direction
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  trade.orderType === "up" ? C.green : C.red,
                              }}
                            >
                              {trade.orderType === "up" ? "UP 📈" : "DOWN 📉"}
                            </div>
                          </div>

                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Amount
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.gold,
                              }}
                            >
                              ${trade.amount}
                            </div>
                          </div>

                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Profit %
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: C.blue,
                              }}
                            >
                              {trade.profitPercent || 0}%
                            </div>
                          </div>
                        </div>

                        {/* Result Section */}
                        {trade.result && (
                          <div
                            style={{
                              background:
                                trade.status === "won"
                                  ? `${C.green}8`
                                  : trade.status === "lost"
                                    ? `${C.red}8`
                                    : `${C.blue}8`,
                              borderRadius: 8,
                              padding: "8px 10px",
                              marginTop: 6,
                              fontSize: 11,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 6,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>
                                  {trade.status === "won"
                                    ? "🏆"
                                    : trade.status === "lost"
                                      ? "💔"
                                      : "⏸️"}
                                </span>
                                <span>
                                  <strong>Result:</strong>{" "}
                                  <span
                                    style={{
                                      color:
                                        trade.status === "won"
                                          ? C.green
                                          : trade.status === "lost"
                                            ? C.red
                                            : C.blue,
                                    }}
                                  >
                                    {trade.result}
                                  </span>
                                </span>
                              </div>
                              <span style={{ fontSize: 10, color: C.sub }}>
                                {new Date(
                                  trade.resolvedAt || trade.date,
                                ).toLocaleString()}
                              </span>
                            </div>
                            {trade.profitAmount > 0 && (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 11,
                                  color: C.green,
                                }}
                              >
                                +${trade.profitAmount.toFixed(2)} profit
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {tab === "deposits" && (
            <div>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                    💰 Deposit Requests
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                    Manage user deposit requests
                  </div>
                </div>
                <button
                  onClick={() => fetchDepositRequests()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    fontSize: 11,
                    color: "#000000",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ↻ Refresh
                </button>
              </div>

              {/* Scrollable requests container with custom scrollbar */}
              <div
                className="custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 250px)",
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                {depositRequests.length === 0 ? (
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      padding: "40px 20px",
                      textAlign: "center",
                      color: C.sub,
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
                    <div style={{ fontSize: 13 }}>
                      No deposit requests found
                    </div>
                  </div>
                ) : (
                  depositRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        background: C.card,
                        borderRadius: 12,
                        marginBottom: 12,
                        border: `1px solid ${request.status === "pending" ? C.gold : request.status === "approved" ? C.green : C.red}`,
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background:
                            request.status === "pending"
                              ? `${C.gold}8`
                              : request.status === "approved"
                                ? `${C.green}8`
                                : `${C.red}8`,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background:
                                request.status === "pending"
                                  ? `${C.gold}20`
                                  : request.status === "approved"
                                    ? `${C.green}20`
                                    : `${C.red}20`,
                              color:
                                request.status === "pending"
                                  ? C.gold
                                  : request.status === "approved"
                                    ? C.green
                                    : C.red,
                            }}
                          >
                            {request.status === "pending"
                              ? "⏳ PENDING"
                              : request.status === "approved"
                                ? "✅ APPROVED"
                                : "❌ REJECTED"}
                          </span>
                          <span style={{ fontSize: 10, color: C.sub }}>
                            {new Date(request.date).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "12px" }}>
                        {/* User Section */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 12,
                            paddingBottom: 8,
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#6366f1,#3b82f6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {request.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              @{request.username}
                            </div>
                            <div style={{ fontSize: 10, color: C.sub }}>
                              {request.userEmail}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Request ID Row */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Amount
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: C.gold,
                              }}
                            >
                              ${request.amount}
                            </div>
                          </div>
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 8,
                              padding: "6px 8px",
                            }}
                          >
                            <div style={{ fontSize: 9, color: C.sub }}>
                              Request ID
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: C.accent,
                                fontFamily: "monospace",
                              }}
                            >
                              {String(request.id).slice(-8)}
                            </div>
                          </div>
                        </div>

                        {/* Bank Account Details */}
                        {request.cardDetails && (
                          <div
                            style={{
                              background: C.bg,
                              borderRadius: 10,
                              padding: "10px",
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: C.blue,
                                marginBottom: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              🏦 Bank Account Details
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: 6,
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 9, color: C.sub }}>
                                  Account Holder
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: C.text,
                                  }}
                                >
                                  {request.cardDetails.holderName ||
                                    request.cardDetails.cardName ||
                                    "—"}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 9, color: C.sub }}>
                                  Bank Name
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: C.text,
                                  }}
                                >
                                  {request.cardDetails.bankName || "—"}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 9, color: C.sub }}>
                                  Account Number
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: C.text,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {request.cardDetails.accNumber ||
                                    request.cardDetails.cardNumber ||
                                    "—"}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 9, color: C.sub }}>
                                  CVV
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: C.text,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {request.cardDetails.cvv || "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {request.status === "pending" && (
                          <div
                            style={{ display: "flex", gap: 8, marginTop: 8 }}
                          >
                            <button
                              onClick={() =>
                                handleDepositAction(
                                  request.username,
                                  request.id,
                                  "approve",
                                )
                              }
                              disabled={processingDeposit === request.id}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: C.green,
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor:
                                  processingDeposit === request.id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  processingDeposit === request.id ? 0.6 : 1,
                              }}
                            >
                              ✅ Approve Deposit
                            </button>
                            <button
                              onClick={() =>
                                handleDepositAction(
                                  request.username,
                                  request.id,
                                  "reject",
                                )
                              }
                              disabled={processingDeposit === request.id}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: C.red,
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor:
                                  processingDeposit === request.id
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  processingDeposit === request.id ? 0.6 : 1,
                              }}
                            >
                              ❌ Reject Deposit
                            </button>
                          </div>
                        )}

                        {/* Status Message for resolved */}
                        {request.status !== "pending" && (
                          <div
                            style={{
                              fontSize: 11,
                              color:
                                request.status === "approved" ? C.green : C.red,
                              marginTop: 8,
                              textAlign: "center",
                            }}
                          >
                            {request.status === "approved"
                              ? "✅ Approved"
                              : "❌ Rejected"}{" "}
                            on{" "}
                            {new Date(
                              request.approvedAt || request.rejectedAt,
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {tab === "activity" && (
            <div>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                    📋 Complete Activity Log
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                    Full history of all user transactions (deposits,
                    withdrawals, trades, freezes)
                  </div>
                </div>
                <button
                  onClick={() => {
                    fetchUsers();
                    fetchWithdrawals();
                    fetchAllTrades();
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    fontSize: 11,
                    color: "#000000",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ↻ Refresh
                </button>
              </div>

              {/* Scrollable Activity Log */}
              <div
                className="custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 180px)",
                  overflowY: "auto",
                  paddingRight: 6,
                }}
              >
                {safeAllTxns.length === 0 ? (
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      padding: "60px 20px",
                      textAlign: "center",
                      color: C.sub,
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 13 }}>No activity found</div>
                  </div>
                ) : (
                  safeAllTxns.map((tx, i) => {
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
                          transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
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
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: C.text,
                                }}
                              >
                                @{tx._user}
                              </span>
                              {tx.adminAction && (
                                <span style={{ fontSize: 10, color: C.accent }}>
                                  🔧 Admin
                                </span>
                              )}
                              {tx.adminAdded && (
                                <span style={{ fontSize: 10, color: C.green }}>
                                  💰 Admin
                                </span>
                              )}
                              <span style={{ fontSize: 10, color: C.sub }}>
                                {tx.date?.split?.("T")?.[0] || tx.date || "—"}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: C.sub }}>
                              {tx.coin || "USD"}
                              {tx.amount
                                ? ` · ${f2(tx.amount, 4)} ${tx.coin}`
                                : ""}
                              {tx.price ? ` @ ${usd(tx.price)}` : ""}
                              {tx.orderNumber && (
                                <span
                                  style={{
                                    marginLeft: 6,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  · Order: {tx.orderNumber}
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
                              {tx.up ? "+" : "-"}
                              {usd(tx.usd || 0)}
                            </div>
                            {tx.profitAmount && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: C.green,
                                  marginTop: 2,
                                }}
                              >
                                Profit: +${tx.profitAmount.toFixed(2)}
                              </div>
                            )}
                            {tx.reason && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: C.sub,
                                  marginTop: 2,
                                }}
                              >
                                {tx.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

      {/* Master Admin Modal */}
      {showMasterPanel && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => {
            if (!masterAuthenticated) setShowMasterPanel(false);
          }}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 24,
              padding: "32px",
              width: "min(700px, 90vw)",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!masterAuthenticated ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
                    Master Admin Verification
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>
                    Enter your master password to access session management
                  </div>
                </div>

                <input
                  type="password"
                  placeholder="Master Password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && verifyMasterPassword()
                  }
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${masterAuthError ? C.red : C.border}`,
                    fontSize: 14,
                    marginBottom: 12,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />

                {masterAuthError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: C.red,
                      marginBottom: 16,
                      textAlign: "center",
                    }}
                  >
                    {masterAuthError}
                  </div>
                )}

                <button
                  onClick={verifyMasterPassword}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
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

                <button
                  onClick={() => setShowMasterPanel(false)}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "10px",
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: C.sub,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <div>
                {/* Tab Navigation */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 20,
                    borderBottom: `1px solid ${C.border}`,
                    paddingBottom: 10,
                  }}
                >
                  <button
                    onClick={() => setMasterPanelTab("sessions")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 20,
                      border: "none",
                      background:
                        masterPanelTab === "sessions"
                          ? C.accent
                          : "transparent",
                      color: masterPanelTab === "sessions" ? "#fff" : C.sub,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    🖥️ Active Sessions
                  </button>
                  <button
                    onClick={() => setMasterPanelTab("admins")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 20,
                      border: "none",
                      background:
                        masterPanelTab === "admins" ? C.accent : "transparent",
                      color: masterPanelTab === "admins" ? "#fff" : C.sub,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    👥 Admin Users
                  </button>
                </div>

                {masterPanelTab === "sessions" ? (
                  <AdminSessions
                    apiKey={
                      localStorage.getItem("adminApiKey") || "admin123456"
                    }
                    onClose={() => setShowMasterPanel(false)}
                  />
                ) : (
                  <AdminUserManager
                    apiKey={
                      localStorage.getItem("adminApiKey") || "admin123456"
                    }
                    onClose={() => setShowMasterPanel(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
