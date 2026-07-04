"use client";
import { useState } from "react";
import { API_URL } from "../lib/config";

export default function VirtualAdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [refKey, setRefKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // VirtualAdminLogin.jsx - Already has this, but ensure it's handling the new error codes

const handleLogin = async () => {
  if (!username.trim() || !refKey.trim()) {
    setError("Please enter both username and reference key");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const response = await fetch(`${API_URL}/api/users/virtual-admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        refKey: refKey.trim(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      // ✅ Store this tab's own sessionId so it's tracked as a distinct
      // session (and so this specific tab can be targeted for kick/logout)
      if (data.sessionId) {
        localStorage.setItem("admin_session_id", data.sessionId);
      }
      onLogin(data.admin);
    } else {
      // Handle different error types
      if (data.error === "ADMIN_BANNED") {
        setError(`🚫 Your admin access has been revoked.\nReason: ${data.reason || "No reason provided"}`);
      } else if (data.error === "ADMIN_KICKED") {
        setError(`⏳ Your session was recently terminated. Please wait ${Math.ceil(data.timeRemaining || 5)} seconds and try again.`);
      } else {
        setError(data.error || "Invalid credentials");
      }
    }
  } catch (err) {
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        width: 385,
        background: "#0f1623",
        borderRadius: 42,
        padding: 32,
        boxShadow: "0 0 0 1px #1a2540"
      }}>
        <button onClick={onBack} style={{
          background: "none",
          border: "none",
          color: "#4b6080",
          fontSize: 20,
          cursor: "pointer",
          marginBottom: 20
        }}>←</button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>
            Virtual Admin Login
          </div>
          <div style={{ fontSize: 12, color: "#4b6080", marginTop: 4 }}>
            Enter your credentials
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#f87171",
            whiteSpace: "pre-wrap"
          }}>
            ⚠ {error}
          </div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${error ? "#ef4444" : "#1a2540"}`,
            background: "#162033",
            color: "#f1f5f9",
            fontSize: 14,
            outline: "none",
            marginBottom: 12
          }}
        />

        <input
          type="text"
          value={refKey}
          onChange={(e) => setRefKey(e.target.value)}
          placeholder="Reference Key (e.g., aB9xK2mPq7)"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${error ? "#ef4444" : "#1a2540"}`,
            background: "#162033",
            color: "#f1f5f9",
            fontSize: 14,
            outline: "none",
            marginBottom: 16
          }}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 13,
            border: "none",
            background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Logging in..." : "Access Admin Panel"}
        </button>

        <div style={{
          marginTop: 16,
          textAlign: "center",
          fontSize: 10,
          color: "#4b6080"
        }}>
          Contact your master admin for credentials
        </div>
      </div>
    </div>
  );
}