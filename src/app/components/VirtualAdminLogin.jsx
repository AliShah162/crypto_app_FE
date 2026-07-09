"use client";
import { useState } from "react";
import { API_URL } from "../lib/config";

export default function VirtualAdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [refKey, setRefKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !refKey.trim()) {
      setError("Please enter both username and reference key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/api/users/virtual-admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          refKey: refKey.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ✅ Try to parse response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        if (response.status === 408 || response.status === 504) {
          setError("⏳ Server is busy. Please try again.");
        } else {
          setError("📶 Server error. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        // Store session ID for this tab
        if (data.sessionId) {
          localStorage.setItem("admin_session_id", data.sessionId);
        }
        
        // ✅ Store virtual admin data
        localStorage.setItem("virtualAdmin", JSON.stringify(data.admin));
        localStorage.setItem("tabRole", "virtual_admin");
        
        // ✅ Dispatch event for App.jsx
        window.dispatchEvent(new CustomEvent("virtualAdminLogin", { 
          detail: data.admin 
        }));
        
        // ✅ Call the onLogin callback
        onLogin(data.admin);
      } else {
        // Handle different error types
        switch (data.error) {
          case "ADMIN_BANNED":
            setError(`🚫 Your admin access has been revoked.\nReason: ${data.reason || "No reason provided"}`);
            break;
            
          case "ADMIN_KICKED":
            const remaining = Math.ceil(data.timeRemaining || 5);
            setError(`⏳ Your session was recently terminated. Please wait ${remaining} seconds and try again.`);
            break;
            
          case "SESSION_INVALID":
          case "SESSION_REVOKED":
            setError("Your session has expired. Please login again.");
            break;
            
          default:
            setError(data.message || data.error || "Invalid credentials. Please try again.");
        }
      }
    } catch (err) {
      console.error("Virtual admin login error:", err);
      
      if (err.name === 'AbortError') {
        setError("⏳ Request timed out. Please check your connection.");
      } else if (err.message?.includes("NetworkError") || err.message?.includes("Failed to fetch")) {
        setError("📶 Network error. Please check your internet connection.");
      } else {
        setError("Network error. Please try again.");
      }
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
          placeholder="Username (e.g., vadmin1)"
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
            background: loading ? "#4b6080" : "linear-gradient(135deg,#00e5b0,#3b82f6)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
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