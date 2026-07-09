// components/AdminSessions.jsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../lib/config";

const C = {
  bg: "#f0f2f5",
  card: "#ffffff",
  text: "#1e293b",
  sub: "#64748b",
  border: "#e2e8f0",
  green: "#22c55e",
  red: "#ef4444",
  accent: "#6366f1",
  gold: "#f59e0b",
  blue: "#3b82f6",
};

const getVadminNumber = (sessionUser) => {
  if (!sessionUser) return null;
  if (sessionUser === "master_admin") return "MASTER";
  const vadminMap = {
    vadmin1: "1",
    vadmin2: "2",
    vadmin3: "3",
    vadmin4: "4",
    vadmin5: "5",
  };
  return vadminMap[sessionUser] || null;
};

export default function AdminSessions({ apiKey, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [allVirtualAdmins, setAllVirtualAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [banning, setBanning] = useState(null);
  const [unbanning, setUnbanning] = useState(null);
  const [showBanned, setShowBanned] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [editName, setEditName] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [expandedAdmins, setExpandedAdmins] = useState({});

  const toggleExpand = (username) => {
    setExpandedAdmins((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  // ========== FETCH ALL VIRTUAL ADMINS ==========
  const fetchAllVirtualAdmins = useCallback(async () => {
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/all-virtual-admins`, {
        headers: { "x-admin-key": adminKey },
      });
      const data = await response.json();
      if (data.success && data.virtualAdmins) {
        setAllVirtualAdmins(data.virtualAdmins);
      }
    } catch (error) {
      console.error("Failed to fetch all virtual admins:", error);
    }
  }, [apiKey]);

  // AdminSessions.jsx - REPLACE this entire function

const fetchSessions = useCallback(async () => {
  try {
    const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
    const response = await fetch(`${API_URL}/api/users/admin/sessions`, {
      headers: {
        "x-admin-key": adminKey,
        "x-session-id": localStorage.getItem("admin_session_id") || "",
      },
    });
    const data = await response.json();
    
    console.log("📊 Raw sessions data:", data);
    
    if (data.sessions && Array.isArray(data.sessions)) {
      // ✅ ONLY keep sessions that are ACTIVE (isActive !== false)
      const activeSessions = data.sessions.filter(s => s.isActive !== false);
      setSessions(activeSessions);
      console.log(`📊 Fetched ${activeSessions.length} active sessions`);
      
      // ✅ Log each session for debugging
      activeSessions.forEach(s => {
        console.log(`  - ${s.sessionUser}: ${s.deviceInfo} (${s.ipAddress}) - Active: ${s.isActive}`);
      });
    } else {
      setSessions([]);
    }
  } catch (error) {
    console.error("Failed to fetch admin sessions:", error);
    setSessions([]);
  } finally {
    setLoading(false);
  }
}, [apiKey]);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/banned-virtual-admins`, {
        headers: { "x-admin-key": adminKey },
      });
      const data = await response.json();
      if (data.bannedVirtualAdmins && Array.isArray(data.bannedVirtualAdmins)) {
        setBannedUsers(data.bannedVirtualAdmins);
      } else {
        setBannedUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch banned users:", error);
      setBannedUsers([]);
    }
  }, [apiKey]);

  // ================= RENAME SINGLE SESSION =================
  const renameSingleSession = useCallback(async (sessionId, customName) => {
    try {
      setRenaming(sessionId);
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/rename-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
        body: JSON.stringify({ sessionId, customName }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchSessions();
        setEditingSessionId(null);
        setEditName("");
        alert("✅ Session renamed successfully!");
      } else {
        alert("❌ Failed to rename: " + data.error);
      }
    } catch (error) {
      alert("❌ Error renaming session");
    } finally {
      setRenaming(null);
    }
  }, [apiKey, fetchSessions]);

  // ================= RENAME ALL SESSIONS BY IP AND USER =================
  const renameAllSessionsByIPAndUser = useCallback(async (sessionId, customName) => {
    const sessionToRename = sessions.find((s) => s.sessionId === sessionId);
    if (!sessionToRename) {
      alert("❌ Session not found");
      return;
    }

    const ipAddress = sessionToRename.ipAddress;
    const sessionUser = sessionToRename.sessionUser;

    const sessionsToRename = sessions.filter(
      (s) => s.ipAddress === ipAddress && s.sessionUser === sessionUser && s.isActive !== false
    );

    if (sessionsToRename.length === 1) {
      await renameSingleSession(sessionId, customName);
      return;
    }

    if (!confirm(`📱 Found ${sessionsToRename.length} active sessions for @${sessionUser} from IP (${ipAddress}).\n\nDo you want to rename ALL of them to "${customName}"?`)) {
      await renameSingleSession(sessionId, customName);
      return;
    }

    setRenaming(sessionId);
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/rename-sessions-by-user-and-ip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
        body: JSON.stringify({ ipAddress, sessionUser, customName }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Renamed ${data.renamedCount} sessions successfully!`);
        await fetchSessions();
        setEditingSessionId(null);
        setEditName("");
      } else {
        alert("❌ Failed to rename sessions: " + data.error);
      }
    } catch (error) {
      alert("❌ Error renaming sessions");
    } finally {
      setRenaming(null);
    }
  }, [sessions, apiKey, fetchSessions, renameSingleSession]);

  // ================= CHANGE VIRTUAL ADMIN PASSWORD =================
  const changeVirtualAdminPassword = useCallback(async (username) => {
    const newPassword = prompt(`Enter new password for @${username}:\n(Min 6 characters)`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const newRefKey = prompt(
      `Enter new Reference Key for @${username}:\n(Min 4 characters, letters/numbers only)\nLeave empty to auto-generate.`
    );

    if (newRefKey !== null && newRefKey !== "") {
      if (newRefKey.length < 4) {
        alert("Reference Key must be at least 4 characters");
        return;
      }
      if (!/^[a-zA-Z0-9]+$/.test(newRefKey)) {
        alert("Reference Key can only contain letters and numbers");
        return;
      }
    }

    if (!confirm(`Change password for @${username}?`)) return;

    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/change-virtual-admin-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ username, newPassword, customRefKey: newRefKey || null }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Password updated!\n\nNew Password: ${data.newPassword}\nNew RefKey: ${data.newRefKey}\nUsers Migrated: ${data.usersUpdated || 0}`);
        await fetchAllVirtualAdmins();
        await fetchSessions();
        await fetchBannedUsers();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  }, [apiKey, fetchAllVirtualAdmins, fetchSessions, fetchBannedUsers]);

  // ================= BAN VIRTUAL ADMIN =================
  const banVirtualAdmin = useCallback(async (username) => {
    const reason = prompt(`Enter reason for banning @${username}:`, "Unauthorized access");
    if (reason === null) return;
    if (!confirm(`⚠️ PERMANENTLY BAN @${username}?`)) return;

    setBanning(username);
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/ban-virtual-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ username, banReason: reason }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ @${username} has been BANNED!`);
        await fetchAllVirtualAdmins();
        await fetchSessions();
        await fetchBannedUsers();
        setShowBanned(true);
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setBanning(null);
    }
  }, [apiKey, fetchAllVirtualAdmins, fetchSessions, fetchBannedUsers]);

  // ================= UNBAN VIRTUAL ADMIN =================
  const unbanVirtualAdmin = useCallback(async (username) => {
    if (!confirm(`✅ Unban @${username}?`)) return;
    setUnbanning(username);
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/unban-virtual-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ @${username} has been UNBANNED!`);
        await fetchAllVirtualAdmins();
        await fetchSessions();
        await fetchBannedUsers();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setUnbanning(null);
    }
  }, [apiKey, fetchAllVirtualAdmins, fetchSessions, fetchBannedUsers]);

  // ================= REVOKE SINGLE SESSION =================
  const revokeSession = useCallback(async (sessionId, username) => {
    if (!confirm(`⚠️ Revoke session for @${username}?`)) return;
    setRevoking(sessionId);
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
      });
      const data = await response.json();
      if (data.success) {
        if (sessionId === currentSessionId) {
          alert("⚠️ You kicked yourself! Logging out.");
          localStorage.removeItem("adminApiKey");
          localStorage.removeItem("admin_session_id");
          window.location.href = "/";
          return;
        }
        // ✅ REFRESH sessions immediately after revoke
        await fetchSessions();
        alert("✅ Session revoked");
      } else {
        alert("❌ Failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("❌ Error revoking session");
    } finally {
      setRevoking(null);
    }
  }, [apiKey, currentSessionId, fetchSessions]);

  // ================= REVOKE ALL SESSIONS FOR ADMIN =================
  const revokeAllSessionsForAdmin = useCallback(async (username) => {
    if (!confirm(`⚠️ Revoke ALL sessions for @${username}?`)) return;
    setRevoking(username);
    try {
      const userSessions = sessions.filter((s) => s.sessionUser === username && s.isActive !== false);
      let revokedCount = 0;
      for (const session of userSessions) {
        const response = await fetch(`${API_URL}/api/users/admin/sessions/${session.sessionId}`, {
          method: "DELETE",
          headers: {
            "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456",
            "x-session-id": localStorage.getItem("admin_session_id") || "",
          },
        });
        const data = await response.json();
        if (data.success) revokedCount++;
      }
      if (revokedCount > 0) {
        alert(`✅ Revoked ${revokedCount} session(s)`);
        await fetchSessions();
      } else {
        alert(`ℹ️ No active sessions found`);
      }
    } catch (error) {
      alert("❌ Error revoking sessions");
    } finally {
      setRevoking(null);
    }
  }, [sessions, apiKey, fetchSessions]);

  // ================= GLOBAL ACTIONS =================
  const cleanupSessions = useCallback(async () => {
    if (!confirm("🧹 Clean up old inactive sessions?")) return;
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      const response = await fetch(`${API_URL}/api/users/admin/cleanup-sessions`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      const data = await response.json();
      alert(`🧹 Cleaned up ${data.cleaned} old sessions.\n📊 ${data.remaining} active sessions remain.`);
      await fetchSessions();
    } catch (error) {
      alert("❌ Error cleaning up sessions");
    }
  }, [apiKey, fetchSessions]);

  const clearAllSessions = useCallback(async () => {
    if (!confirm("⚠️ DANGER: This will log out EVERYONE including you!")) return;
    try {
      const adminKey = apiKey || localStorage.getItem("adminApiKey") || "admin123456";
      await fetch(`${API_URL}/api/users/admin/clear-all-sessions`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      localStorage.removeItem("adminApiKey");
      localStorage.removeItem("admin_session_id");
      window.location.href = "/";
    } catch (error) {
      alert("❌ Error clearing sessions");
    }
  }, [apiKey]);

  // AdminSessions.jsx - REPLACE this function

const getActiveSessionsCount = (username) => {
  // ✅ Debug log
  console.log(`🔍 Counting sessions for ${username}:`, sessions);
  
  // ✅ Only count sessions that are ACTIVE
  const count = sessions.filter(
    (s) => s.sessionUser === username && s.isActive !== false
  ).length;
  
  console.log(`📊 ${username} has ${count} active sessions`);
  return count;
};

  // ================= USE EFFECT =================
  useEffect(() => {
    const sessionId = localStorage.getItem("admin_session_id");
    setCurrentSessionId(sessionId || null);
    fetchAllVirtualAdmins();
    fetchSessions();
    fetchBannedUsers();

    // ✅ Refresh sessions more frequently (every 5 seconds)
    const refreshInterval = setInterval(() => {
      fetchSessions();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [apiKey, fetchAllVirtualAdmins, fetchSessions, fetchBannedUsers]);

  // ========== HELPERS ==========
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isCurrentSession = (sessionId) => sessionId === currentSessionId;

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => setShowBanned(false)} style={{
          padding: "6px 16px", borderRadius: 20, border: "none",
          background: !showBanned ? C.accent : "transparent",
          color: !showBanned ? "#fff" : "#000000", cursor: "pointer", fontWeight: 600,
        }}>
          👥 All Virtual Admins ({allVirtualAdmins.length})
        </button>
        <button onClick={() => setShowBanned(true)} style={{
          padding: "6px 16px", borderRadius: 20, border: "none",
          background: showBanned ? C.accent : "transparent",
          color: showBanned ? "#fff" : "#000000", cursor: "pointer", fontWeight: 600,
        }}>
          🚫 Banned ({bannedUsers.length})
        </button>
        <button onClick={cleanupSessions} style={{
          padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.green}`,
          background: "transparent", fontSize: 11, cursor: "pointer", color: "#000000",
        }}>
          🧹 Cleanup Old Sessions
        </button>
        <button onClick={clearAllSessions} style={{
          padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.red}`,
          background: "transparent", fontSize: 11, cursor: "pointer", color: "#000000",
        }}>
          🔴 Clear ALL Sessions
        </button>
        <button onClick={() => { fetchAllVirtualAdmins(); fetchSessions(); }} style={{
          padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
          background: "transparent", color: "#000000", cursor: "pointer", fontWeight: 500, fontSize: 11,
        }}>
          ↻ Refresh
        </button>
        {onClose && (
          <button onClick={onClose} style={{
            padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
            background: "transparent", cursor: "pointer", fontSize: 16, color: "#000000",
          }}>✕</button>
        )}
      </div>

      {!showBanned ? (
        <>
          {loading && allVirtualAdmins.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>Loading virtual admins...</div>
          ) : allVirtualAdmins.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.sub }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <div>No virtual admins found</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {allVirtualAdmins.map((admin) => {
                const username = admin.username;
                const isBanned = admin.isBanned || false;
                const activeCount = getActiveSessionsCount(username);
                const isExpanded = expandedAdmins[username] || false;
                const vadminNumber = getVadminNumber(username);
                const activeSessions = sessions.filter(
                  (s) => s.sessionUser === username && s.isActive !== false
                );

                return (
                  <div key={username} style={{
                    background: isBanned ? `${C.red}08` : C.card,
                    borderRadius: 14,
                    border: `2px solid ${isBanned ? C.red : activeCount > 0 ? C.green : C.border}`,
                    overflow: "hidden",
                  }}>
                    {/* ADMIN HEADER */}
                    <div onClick={() => toggleExpand(username)} style={{
                      padding: "16px 20px", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: isBanned ? C.red : activeCount > 0 ? "linear-gradient(135deg,#6366f1,#3b82f6)" : C.border,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {isBanned ? "🚫" : `#${vadminNumber}`}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: isBanned ? C.red : C.text, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            @{username}
                            {isBanned && <span style={{ fontSize: 10, background: C.red, color: "#fff", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>BANNED</span>}
                            {!isBanned && activeCount === 0 && <span style={{ fontSize: 10, background: C.sub, color: "#fff", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>OFFLINE</span>}
                            {!isBanned && activeCount > 0 && <span style={{ fontSize: 10, background: C.green, color: "#fff", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{activeCount} ACTIVE</span>}
                          </div>
                          <div style={{ fontSize: 12, color: C.sub }}>
                            {admin.adminName || username} · RefKey: <span style={{ fontFamily: "monospace" }}>{admin.refKey}</span>
                            {admin.customName && ` · ${admin.customName}`}
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            Created: {formatDate(admin.createdAt)}
                            {admin.lastLogin && <span> · Last Login: {formatDate(admin.lastLogin)}</span>}
                            {activeCount > 1 && <span style={{ color: C.accent, fontWeight: 600 }}> · {activeCount} tabs open</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: C.sub, background: C.bg, padding: "4px 12px", borderRadius: 20 }}>
                          {activeCount} 📱
                        </span>
                        <span style={{ fontSize: 18, color: C.sub, transition: "transform 0.3s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* EXPANDED VIEW */}
                    {isExpanded && !isBanned && (
                      <div style={{ padding: "0 20px 20px 20px", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                        {/* Active Sessions */}
                        {activeSessions.length > 0 ? (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>
                              🖥️ Active Sessions ({activeSessions.length})
                            </div>
                            {activeSessions.map((session) => {
                              const isEditing = editingSessionId === session.sessionId;
                              return (
                                <div key={session.sessionId} style={{
                                  background: C.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 8,
                                  border: `1px solid ${isCurrentSession(session.sessionId) ? C.accent : C.border}`,
                                  position: "relative",
                                }}>
                                  {isCurrentSession(session.sessionId) && (
                                    <div style={{ position: "absolute", top: -6, right: 10, background: C.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                                      Current
                                    </div>
                                  )}

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      {isEditing ? (
                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Enter custom name..." style={{
                                              padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.accent}`,
                                              background: "#fff", color: C.text, fontSize: 12, width: 150, outline: "none",
                                            }}
                                            autoFocus
                                            onKeyPress={(e) => { if (e.key === "Enter") renameAllSessionsByIPAndUser(session.sessionId, editName.trim()); }}
                                          />
                                          <button onClick={() => renameAllSessionsByIPAndUser(session.sessionId, editName.trim())}
                                            disabled={renaming === session.sessionId} style={{
                                              padding: "3px 10px", borderRadius: 6, border: "none", background: C.green,
                                              color: "#fff", fontSize: 11, cursor: renaming === session.sessionId ? "not-allowed" : "pointer",
                                              opacity: renaming === session.sessionId ? 0.6 : 1,
                                            }}>
                                            {renaming === session.sessionId ? "..." : "Save"}
                                          </button>
                                          <button onClick={() => { setEditingSessionId(null); setEditName(""); }} style={{
                                            padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
                                            background: "transparent", color: C.sub, fontSize: 11, cursor: "pointer",
                                          }}>Cancel</button>
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                                          {session.customName || session.deviceInfo || "Unknown Device"}
                                          {session.customName && <span style={{ marginLeft: 8, fontSize: 10, color: C.accent, background: `${C.accent}15`, padding: "2px 8px", borderRadius: 10 }}>✏️ Custom</span>}
                                        </div>
                                      )}
                                      <div style={{ fontSize: 11, color: C.sub }}>🌐 {session.ipAddress}</div>
                                      <div style={{ fontSize: 10, color: C.sub }}>🕐 {formatDate(session.loggedInAt)}</div>
                                    </div>

                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                      {!isEditing && !isCurrentSession(session.sessionId) && (
                                        <>
                                          <button onClick={() => { setEditingSessionId(session.sessionId); setEditName(session.customName || ""); }} style={{
                                            padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.accent}`,
                                            background: `${C.accent}10`, color: C.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
                                          }}>✏️ Rename</button>
                                          <button onClick={() => revokeSession(session.sessionId, username)}
                                            disabled={revoking === session.sessionId} style={{
                                              padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.gold}`,
                                              background: `${C.gold}10`, color: C.gold, fontSize: 11, fontWeight: 600,
                                              cursor: revoking === session.sessionId ? "not-allowed" : "pointer",
                                              opacity: revoking === session.sessionId ? 0.6 : 1,
                                            }}>
                                            {revoking === session.sessionId ? "..." : "👢 Kick"}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 8, textAlign: "center", fontSize: 12, color: C.sub }}>
                            No active sessions - Admin is offline
                          </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                          <button onClick={() => changeVirtualAdminPassword(username)} style={{
                            padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.blue}`,
                            background: `${C.blue}10`, color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}>🔑 Change Password</button>

                          {activeSessions.length > 0 && (
                            <button onClick={() => revokeAllSessionsForAdmin(username)}
                              disabled={revoking === username} style={{
                                padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.gold}`,
                                background: `${C.gold}10`, color: C.gold, fontSize: 12, fontWeight: 600,
                                cursor: revoking === username ? "not-allowed" : "pointer",
                                opacity: revoking === username ? 0.6 : 1,
                              }}>
                              {revoking === username ? "..." : "👢 Kick All Sessions"}
                            </button>
                          )}

                          <button onClick={() => banVirtualAdmin(username)}
                            disabled={banning === username} style={{
                              padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.red}`,
                              background: `${C.red}10`, color: C.red, fontSize: 12, fontWeight: 600,
                              cursor: banning === username ? "not-allowed" : "pointer",
                              opacity: banning === username ? 0.6 : 1,
                            }}>
                            {banning === username ? "..." : "🚫 Ban Permanently"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // BANNED ADMINS VIEW
        <>
          {bannedUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.sub }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div>No banned admin users</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bannedUsers.map((user) => (
                <div key={user.username} style={{
                  background: `${C.red}08`, borderRadius: 14, border: `1px solid ${C.red}`, padding: "16px 20px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", background: C.red,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18, fontWeight: 700, color: "#fff",
                        }}>{user.username?.[0]?.toUpperCase() || "?"}</div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                            @{user.username}
                            {user.isVirtualAdmin && <span style={{ marginLeft: 8, color: C.accent, fontSize: 11 }}>🛡️ Virtual Admin</span>}
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>{user.email || user.adminEmail || "Virtual Admin"}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>🚫 Banned: {formatDate(user.bannedAt || user.adminBannedAt)}</div>
                      {user.banReason && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>📝 Reason: {user.banReason}</div>}
                    </div>
                    <button onClick={() => unbanVirtualAdmin(user.username)} disabled={unbanning === user.username} style={{
                      padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.green}`,
                      background: `${C.green}10`, color: C.green, fontSize: 12, fontWeight: 600,
                      cursor: unbanning === user.username ? "not-allowed" : "pointer",
                      opacity: unbanning === user.username ? 0.6 : 1,
                    }}>
                      {unbanning === user.username ? "Unbanning..." : "✅ Unban"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 20, padding: "12px 16px", background: "#fef3c7", borderRadius: 10, fontSize: 12, color: "#92400e" }}>
        <strong>⚡ Admin Management Actions:</strong>
        <ul style={{ marginTop: 8, marginLeft: 20, paddingLeft: 0 }}>
          <li><strong>Click on any admin</strong> to expand and see their sessions</li>
          <li><strong>✏️ Rename</strong> - Custom name for a specific session</li>
          <li><strong>🔑 Change Password</strong> - Update password and refKey for ANY virtual admin</li>
          <li><strong>👢 Kick All Sessions</strong> - Force logout all sessions for this admin</li>
          <li><strong>🚫 Ban Permanently</strong> - Completely block from admin panel</li>
          <li><strong>✅ Unban</strong> - Restore admin access for a banned user</li>
          <li style={{ marginTop: 8, color: C.accent }}><strong>Master Admin Actions:</strong></li>
          <li><strong>🧹 Cleanup Old Sessions</strong> - Remove inactive sessions older than 1 hour</li>
          <li><strong>🔴 Clear ALL Sessions</strong> - Emergency: Log out EVERYONE</li>
        </ul>
      </div>
    </div>
  );
}