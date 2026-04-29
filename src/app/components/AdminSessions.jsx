// components/AdminSessions.jsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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

export default function AdminSessions({ apiKey, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [banning, setBanning] = useState(null);
  const [unbanning, setUnbanning] = useState(null);
  const [showBanned, setShowBanned] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/admin/sessions`, {
        headers: {
          "x-admin-key":
            apiKey || localStorage.getItem("adminApiKey") || "admin123456",
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
      });
      const data = await response.json();
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch admin sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/admin/banned-users`, {
        headers: {
          "x-admin-key":
            apiKey || localStorage.getItem("adminApiKey") || "admin123456",
        },
      });
      const data = await response.json();
      if (data.bannedUsers && Array.isArray(data.bannedUsers)) {
        setBannedUsers(data.bannedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch banned users:", error);
    }
  }, [apiKey]);

  const revokeSession = async (sessionId) => {
    if (
      !confirm(
        "⚠️ Are you sure you want to revoke (kick) this admin session? The user will be logged out immediately.",
      )
    )
      return;

    setRevoking(sessionId);
    try {
      const response = await fetch(
        `${API_URL}/api/users/admin/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-key":
              apiKey || localStorage.getItem("adminApiKey") || "admin123456",
            "x-session-id": localStorage.getItem("admin_session_id") || "",
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        if (sessionId === currentSessionId) {
          alert("⚠️ You have kicked yourself! You will be logged out now.");
          localStorage.removeItem("adminApiKey");
          localStorage.removeItem("admin_session_id");
          window.location.href = "/";
          return;
        }
        await fetchSessions();
        alert("✅ Session revoked successfully");
      } else {
        alert(
          "❌ Failed to revoke session: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      alert("❌ Error revoking session");
    } finally {
      setRevoking(null);
    }
  };

  const banUser = async (sessionId, deviceInfo, username) => {
    if (
      !confirm(
        `⚠️ PERMANENTLY BAN this admin?\n\n${deviceInfo}\n\nThis admin will NO LONGER be able to access the admin panel until unbanned.`,
      )
    )
      return;

    setBanning(sessionId);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/ban-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key":
            apiKey || localStorage.getItem("adminApiKey") || "admin123456",
          "x-session-id": currentSessionId,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          username: username,
          banReason: "Banned by master admin",
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        if (sessionId === currentSessionId) {
          localStorage.removeItem("adminApiKey");
          localStorage.removeItem("admin_session_id");
          window.location.href = "/";
          return;
        }
        await fetchSessions();
        await fetchBannedUsers();
      } else {
        alert(`❌ Failed to ban user: ${data.error}`);
      }
    } catch (error) {
      alert("❌ Error banning user");
    } finally {
      setBanning(null);
    }
  };

  const unbanUser = async (username) => {
    if (
      !confirm(
        `✅ Unban @${username}? They will be able to access the admin panel again.`,
      )
    )
      return;

    setUnbanning(username);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/unban-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key":
            apiKey || localStorage.getItem("adminApiKey") || "admin123456",
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        await fetchBannedUsers();
        await fetchSessions();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert("❌ Error unbanning user");
    } finally {
      setUnbanning(null);
    }
  };

  const revokeAllOthers = async () => {
    if (!currentSessionId) {
      alert("Current session not identified");
      return;
    }

    console.log("🔴 Current Session ID:", currentSessionId);
    console.log("🔴 All sessions before revoke:", sessions);

    if (
      !confirm(
        "⚠️ WARNING: This will revoke ALL other admin sessions. All other admins will be logged out immediately. Continue?",
      )
    )
      return;

    setRevokingAll(true);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/revoke-others`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key":
            apiKey || localStorage.getItem("adminApiKey") || "admin123456",
          "x-session-id": currentSessionId,
        },
        body: JSON.stringify({ currentSessionId }),
      });
      const data = await response.json();
      console.log("🔴 Revoke response:", data);

      if (data.success) {
        await fetchSessions();
        alert(`✅ ${data.message}`);
      } else {
        alert(
          "❌ Failed to revoke sessions: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Revoke error:", error);
      alert("❌ Error revoking sessions");
    } finally {
      setRevokingAll(false);
    }
  };

  const cleanupSessions = async () => {
    if (
      !confirm(
        "🧹 Clean up old inactive sessions? (Sessions older than 1 hour will be removed)",
      )
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/api/users/admin/cleanup-sessions`,
        {
          method: "POST",
          headers: {
            "x-admin-key":
              apiKey || localStorage.getItem("adminApiKey") || "admin123456",
          },
        },
      );
      const data = await response.json();
      alert(
        `🧹 Cleaned up ${data.cleaned} old sessions.\n📊 ${data.remaining} active sessions remain.`,
      );
      await fetchSessions();
    } catch (error) {
      console.error("Cleanup error:", error);
      alert("❌ Error cleaning up sessions");
    }
  };

  const clearAllSessions = async () => {
    if (
      !confirm(
        "⚠️ DANGER: This will log out EVERYONE including you! All admin sessions will be terminated. Continue?",
      )
    )
      return;
    try {
      const response = await fetch(
        `${API_URL}/api/users/admin/clear-all-sessions`,
        {
          method: "POST",
          headers: {
            "x-admin-key":
              apiKey || localStorage.getItem("adminApiKey") || "admin123456",
          },
        },
      );
      const data = await response.json();
      alert(`✅ ${data.message}`);
      localStorage.removeItem("adminApiKey");
      localStorage.removeItem("admin_session_id");
      window.location.href = "/";
    } catch (error) {
      console.error("Clear all error:", error);
      alert("❌ Error clearing sessions");
    }
  };

  useEffect(() => {
    let sessionId = localStorage.getItem("admin_session_id");
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36);
      localStorage.setItem("admin_session_id", sessionId);
    }
    setCurrentSessionId(sessionId);
    fetchSessions();
    fetchBannedUsers();
    return () => {};
  }, [apiKey, fetchSessions, fetchBannedUsers]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const isCurrentSession = (sessionId) => sessionId === currentSessionId;

  return (
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
          onClick={() => setShowBanned(false)}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            border: "none",
            background: !showBanned ? C.accent : "transparent",
            color: !showBanned ? "#fff" : "#000000",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🖥️ Active Sessions ({sessions.length})
        </button>
        <button
          onClick={() => {
            setShowBanned(true);
            fetchBannedUsers();
          }}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            border: "none",
            background: showBanned ? C.accent : "transparent",
            color: showBanned ? "#fff" : "#000000",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🚫 Banned Admins ({bannedUsers.length})
        </button>
      </div>

      {/* Action Buttons Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={async () => {
            const response = await fetch(
              `${API_URL}/api/users/admin/sessions`,
              {
                headers: {
                  "x-admin-key":
                    localStorage.getItem("adminApiKey") || "admin123456",
                  "x-session-id":
                    localStorage.getItem("admin_session_id") || "",
                },
              },
            );
            const data = await response.json();
            console.log("All sessions:", data);
            alert(`📊 Found ${data.sessions?.length || 0} active sessions`);
          }}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: `1px solid ${C.blue}`,
            background: "transparent",
            fontSize: 11,
            cursor: "pointer",
            color: "#000000",
          }}
        >
          🔍 Check Sessions
        </button>

        <button
          onClick={cleanupSessions}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: `1px solid ${C.green}`,
            background: "transparent",
            fontSize: 11,
            cursor: "pointer",
            color: "#000000",
          }}
        >
          🧹 Cleanup Old Sessions
        </button>

        <button
          onClick={clearAllSessions}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: `1px solid ${C.red}`,
            background: "transparent",
            fontSize: 11,
            cursor: "pointer",
            color: "#000000",
          }}
        >
          🔴 Clear ALL Sessions
        </button>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
              color: "#000000",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {!showBanned ? (
        // ACTIVE SESSIONS VIEW
        <>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.sub }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <div>No active admin sessions found</div>
            </div>
          ) : (
            <>
              {/* Revoke All Button */}
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={revokeAllOthers}
                  disabled={revokingAll || sessions.length <= 1}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1.5px solid ${C.red}`,
                    background: `${C.red}10`,
                    color: C.red,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor:
                      revokingAll || sessions.length <= 1
                        ? "not-allowed"
                        : "pointer",
                    opacity: revokingAll || sessions.length <= 1 ? 0.5 : 1,
                  }}
                >
                  🔒 Revoke All Other Sessions
                </button>
              </div>

              {/* Sessions List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    style={{
                      background: isCurrentSession(session.sessionId)
                        ? `linear-gradient(135deg, ${C.accent}10, #3b82f610)`
                        : C.card,
                      borderRadius: 14,
                      border: `1px solid ${
                        isCurrentSession(session.sessionId) ? C.accent : C.border
                      }`,
                      padding: "16px 20px",
                      position: "relative",
                    }}
                  >
                    {isCurrentSession(session.sessionId) && (
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          right: 20,
                          background: C.accent,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 10px",
                          borderRadius: 20,
                        }}
                      >
                        CURRENT SESSION (YOU)
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {/* Device Info */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ fontSize: 24 }}>🖥️</span>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              {session.deviceInfo || "Unknown Device"}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                fontFamily: "monospace",
                              }}
                            >
                              User: {session.sessionUser || "admin"}
                            </div>
                          </div>
                        </div>

                        {/* IP Address */}
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: C.sub }}>
                            🌐 IP Address:
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: C.text,
                              marginLeft: 6,
                            }}
                          >
                            {session.ipAddress}
                          </span>
                        </div>

                        {/* Login & Last Active */}
                        <div
                          style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
                        >
                          <div>
                            <span style={{ fontSize: 11, color: C.sub }}>
                              🕐 Logged In:
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: C.text,
                                marginLeft: 6,
                              }}
                            >
                              {formatDate(session.loggedInAt)}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                marginLeft: 6,
                              }}
                            >
                              ({getTimeAgo(session.loggedInAt)})
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: C.sub }}>
                              ⚡ Last Active:
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: C.text,
                                marginLeft: 6,
                              }}
                            >
                              {formatDate(session.lastActiveAt)}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                marginLeft: 6,
                              }}
                            >
                              ({getTimeAgo(session.lastActiveAt)})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Kick and Ban */}
                      {!isCurrentSession(session.sessionId) && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => revokeSession(session.sessionId)}
                            disabled={revoking === session.sessionId}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: `1px solid ${C.gold}`,
                              background: `${C.gold}10`,
                              color: C.gold,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                revoking === session.sessionId
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: revoking === session.sessionId ? 0.6 : 1,
                            }}
                          >
                            {revoking === session.sessionId
                              ? "Revoking..."
                              : "👢 Kick"}
                          </button>
                          <button
                            onClick={() =>
                              banUser(
                                session.sessionId,
                                session.deviceInfo,
                                session.sessionUser || "admin",
                              )
                            }
                            disabled={banning === session.sessionId}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: `1px solid ${C.red}`,
                              background: `${C.red}10`,
                              color: C.red,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                banning === session.sessionId
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: banning === session.sessionId ? 0.6 : 1,
                            }}
                          >
                            {banning === session.sessionId
                              ? "Banning..."
                              : "🚫 Ban User"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                <div
                  key={user.username}
                  style={{
                    background: `${C.red}08`,
                    borderRadius: 14,
                    border: `1px solid ${C.red}`,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: C.red,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: C.text,
                            }}
                          >
                            @{user.username}
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>
                        🚫 Banned: {formatDate(user.adminBannedAt)}
                      </div>
                      {user.adminBanReason && (
                        <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                          📝 Reason: {user.adminBanReason}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>
                        Role was: Admin (demoted to User)
                      </div>
                    </div>

                    <button
                      onClick={() => unbanUser(user.username)}
                      disabled={unbanning === user.username}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${C.green}`,
                        background: `${C.green}10`,
                        color: C.green,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: unbanning === user.username ? "not-allowed" : "pointer",
                        opacity: unbanning === user.username ? 0.6 : 1,
                      }}
                    >
                      {unbanning === user.username ? "Unbanning..." : "✅ Unban"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer Note */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          background: "#fef3c7",
          borderRadius: 10,
          fontSize: 12,
          color: "#92400e",
        }}
      >
        <strong>⚡ Admin Management Actions:</strong>
        <ul style={{ marginTop: 8, marginLeft: 20, paddingLeft: 0 }}>
          <li><strong>👢 Kick</strong> - Force logout immediately (admin can log back in)</li>
          <li><strong>🚫 Ban User</strong> - Permanently block from admin panel (cannot login until unbanned)</li>
          <li><strong>✅ Unban</strong> - Restore admin access for a banned user</li>
          <li><strong>🔒 Revoke All Other Sessions</strong> - Logs out ALL other admins except you</li>
          <li><strong>🧹 Cleanup</strong> - Removes inactive sessions older than 1 hour</li>
          <li><strong>🔴 Clear ALL Sessions</strong> - Logs out EVERYONE including you (emergency)</li>
        </ul>
      </div>
    </div>
  );
}