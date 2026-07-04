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

// ========== GET VADMIN NUMBER ==========
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

// ========== GROUP SESSIONS BY USER ==========
const groupSessionsByUser = (sessions) => {
  const grouped = {};

  sessions.forEach((session) => {
    const user = session.sessionUser || "unknown";
    if (!grouped[user]) {
      grouped[user] = [];
    }
    grouped[user].push(session);
  });

  const sortedUsers = Object.keys(grouped).sort((a, b) => {
    if (a === "master_admin") return -1;
    if (b === "master_admin") return 1;
    const numA = parseInt(a.replace("vadmin", "")) || 999;
    const numB = parseInt(b.replace("vadmin", "")) || 999;
    return numA - numB;
  });

  const sortedGrouped = {};
  sortedUsers.forEach((user) => {
    sortedGrouped[user] = grouped[user];
  });

  return sortedGrouped;
};

export default function AdminSessions({ apiKey, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
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
      const adminKey =
        apiKey || localStorage.getItem("adminApiKey") || "admin123456";

      const response = await fetch(
        `${API_URL}/api/users/admin/banned-virtual-admins`,
        {
          headers: { "x-admin-key": adminKey },
        },
      );

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
  const renameSingleSession = useCallback(
    async (sessionId, customName) => {
      try {
        setRenaming(sessionId);
        const adminKey =
          apiKey || localStorage.getItem("adminApiKey") || "admin123456";

        const response = await fetch(
          `${API_URL}/api/users/admin/rename-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": adminKey,
              "x-session-id": localStorage.getItem("admin_session_id") || "",
            },
            body: JSON.stringify({ sessionId, customName }),
          },
        );

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
    },
    [apiKey, fetchSessions],
  );

  // ================= RENAME ALL SESSIONS WITH SAME IP =================
  const renameAllSessionsByIP = useCallback(
    async (sessionId, customName) => {
      // Find the session to get its IP and user
      const sessionToRename = sessions.find((s) => s.sessionId === sessionId);
      if (!sessionToRename) {
        alert("❌ Session not found");
        return;
      }

      const ipAddress = sessionToRename.ipAddress;
      const sessionUser = sessionToRename.sessionUser; // ✅ Get the user

      // ✅ Count ONLY sessions for THIS SPECIFIC USER with this IP
      const sessionsToRename = sessions.filter(
        (s) =>
          s.ipAddress === ipAddress &&
          s.sessionUser === sessionUser && // ✅ CRITICAL: Only same user
          s.isActive !== false,
      );

      // If only one session, rename it directly
      if (sessionsToRename.length === 1) {
        await renameSingleSession(sessionId, customName);
        return;
      }

      // Ask user if they want to rename all sessions from this IP for this user
      if (
        !confirm(
          `📱 Found ${sessionsToRename.length} active sessions for @${sessionUser} from IP (${ipAddress}).\n\n` +
            `Do you want to rename ALL of them to "${customName}"?\n\n` +
            `Click "OK" to rename all, or "Cancel" to rename just this one.`,
        )
      ) {
        // User chose to rename only this one
        await renameSingleSession(sessionId, customName);
        return;
      }

      // User wants to rename all
      setRenaming(sessionId);
      try {
        const adminKey =
          apiKey || localStorage.getItem("adminApiKey") || "admin123456";

        const response = await fetch(
          `${API_URL}/api/users/admin/rename-sessions-by-user-and-ip`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": adminKey,
              "x-session-id": localStorage.getItem("admin_session_id") || "",
            },
            body: JSON.stringify({
              ipAddress: ipAddress,
              sessionUser: sessionUser, // ✅ Send the user too
              customName: customName,
            }),
          },
        );

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
        console.error("🔴 Rename by IP error:", error);
        alert("❌ Error renaming sessions");
      } finally {
        setRenaming(null);
      }
    },
    [sessions, apiKey, fetchSessions, renameSingleSession],
  );

  // ================= HANDLE RENAME SAVE =================
  const handleRenameSave = useCallback(
    async (sessionId) => {
      if (!editName.trim()) {
        alert("Please enter a name");
        return;
      }
      await renameAllSessionsByIP(sessionId, editName.trim());
    },
    [editName, renameAllSessionsByIP],
  );

  // ================= REVOKE SINGLE SESSION =================
  const revokeSession = useCallback(
    async (sessionId, username) => {
      if (
        !confirm(
          `⚠️ Are you sure you want to revoke this session for @${username}?`,
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
    },
    [apiKey, currentSessionId, fetchSessions],
  );

  // ================= KICK ALL SESSIONS FOR USER =================
  const revokeAllSessionsForUser = useCallback(
    async (username) => {
      if (
        !confirm(
          `⚠️ Are you sure you want to revoke ALL sessions for @${username}?`,
        )
      )
        return;

      setRevoking(username);
      try {
        const userSessions = sessions.filter(
          (s) => s.sessionUser === username && s.isActive !== false,
        );

        let revokedCount = 0;
        for (const session of userSessions) {
          const response = await fetch(
            `${API_URL}/api/users/admin/sessions/${session.sessionId}`,
            {
              method: "DELETE",
              headers: {
                "x-admin-key":
                  apiKey ||
                  localStorage.getItem("adminApiKey") ||
                  "admin123456",
                "x-session-id": localStorage.getItem("admin_session_id") || "",
              },
            },
          );
          const data = await response.json();
          if (data.success) revokedCount++;
        }

        if (username && username.startsWith("vadmin")) {
          await fetch(`${API_URL}/api/users/admin/kick-virtual-admin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key":
                apiKey || localStorage.getItem("adminApiKey") || "admin123456",
            },
            body: JSON.stringify({ username }),
          });
        }

        if (username === "master_admin") {
          alert("⚠️ You have kicked yourself! You will be logged out now.");
          localStorage.removeItem("adminApiKey");
          localStorage.removeItem("admin_session_id");
          window.location.href = "/";
          return;
        }

        alert(
          `✅ Successfully revoked ${revokedCount} session(s) for @${username}`,
        );
        await fetchSessions();
      } catch (error) {
        alert("❌ Error revoking sessions");
      } finally {
        setRevoking(null);
      }
    },
    [sessions, apiKey, fetchSessions],
  );

  // ================= BAN USER =================
  const banUser = useCallback(
    async (username) => {
      const reason = prompt(
        `Enter reason for banning @${username}:`,
        "Unauthorized access",
      );
      if (reason === null) return;

      if (
        !confirm(
          `⚠️ PERMANENTLY BAN @${username}?\nReason: ${reason || "No reason provided"}`,
        )
      )
        return;

      setBanning(username);
      try {
        const adminKey =
          apiKey || localStorage.getItem("adminApiKey") || "admin123456";

        const userSessions = sessions.filter(
          (s) => s.sessionUser === username && s.isActive !== false,
        );
        for (const session of userSessions) {
          await fetch(
            `${API_URL}/api/users/admin/sessions/${session.sessionId}`,
            {
              method: "DELETE",
              headers: {
                "x-admin-key": adminKey,
                "x-session-id": localStorage.getItem("admin_session_id") || "",
              },
            },
          );
        }

        const response = await fetch(
          `${API_URL}/api/users/admin/ban-virtual-admin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": adminKey,
            },
            body: JSON.stringify({ username, banReason: reason }),
          },
        );

        const data = await response.json();
        if (data.success) {
          alert(`✅ @${username} has been BANNED!`);
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
    },
    [sessions, apiKey, fetchSessions, fetchBannedUsers],
  );

  // ================= UNBAN USER =================
  const unbanUser = useCallback(
    async (username) => {
      if (!confirm(`✅ Unban @${username}?`)) return;

      setUnbanning(username);
      try {
        const adminKey =
          apiKey || localStorage.getItem("adminApiKey") || "admin123456";
        const response = await fetch(
          `${API_URL}/api/users/admin/unban-virtual-admin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": adminKey,
            },
            body: JSON.stringify({ username }),
          },
        );

        const data = await response.json();
        if (data.success) {
          alert(`✅ @${username} has been UNBANNED!`);
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
    },
    [apiKey, fetchSessions, fetchBannedUsers],
  );

  // ================= CHANGE VIRTUAL ADMIN PASSWORD =================
  const changeVirtualAdminPassword = useCallback(
    async (username) => {
      const newPassword = prompt(
        `Enter new password for @${username}:\n(Min 6 characters)`,
      );
      if (!newPassword) return;
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }

      const newRefKey = prompt(
        `Enter new Reference Key for @${username}:\n(Min 4 characters, letters/numbers only)\nLeave empty to auto-generate.`,
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

      if (
        !confirm(
          `Change password for @${username}?\n${newRefKey ? `New RefKey: "${newRefKey}"` : "RefKey will be auto-generated"}`,
        )
      )
        return;

      try {
        const adminKey =
          apiKey || localStorage.getItem("adminApiKey") || "admin123456";
        const response = await fetch(
          `${API_URL}/api/users/admin/change-virtual-admin-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": adminKey,
            },
            body: JSON.stringify({
              username,
              newPassword,
              customRefKey: newRefKey || null,
            }),
          },
        );

        const data = await response.json();
        if (data.success) {
          alert(
            `✅ Password updated!\n\nNew Password: ${data.newPassword}\nNew RefKey: ${data.newRefKey}\nUsers Migrated: ${data.usersUpdated || 0}`,
          );
          await fetchSessions();
          await fetchBannedUsers();
        } else {
          alert(`❌ Failed: ${data.error}`);
        }
      } catch (error) {
        alert(`❌ Error: ${error.message}`);
      }
    },
    [apiKey, fetchSessions, fetchBannedUsers],
  );

  // ================= GET DISPLAY NAME =================
  const getDisplayName = useCallback((session) => {
    if (session.customName && session.customName.trim() !== "") {
      return session.customName;
    }
    if (session.sessionUser === "master_admin") {
      return "Master Admin 🛡️";
    }
    if (session.sessionUser && session.sessionUser.startsWith("vadmin")) {
      return `Virtual Admin #${getVadminNumber(session.sessionUser)}`;
    }
    return session.deviceInfo || "Unknown Device";
  }, []);

  // ================= USE EFFECT - Combined =================
  useEffect(() => {
    const sessionId = localStorage.getItem("admin_session_id");
    setCurrentSessionId(sessionId || null);

    // Initial fetch
    fetchSessions();
    fetchBannedUsers();

    // ✅ HEARTBEAT: Update session every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      const currentSessionId = localStorage.getItem("admin_session_id");
      if (currentSessionId) {
        try {
          await fetch(`${API_URL}/api/users/admin/session-heartbeat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key":
                apiKey || localStorage.getItem("adminApiKey") || "admin123456",
            },
            body: JSON.stringify({ sessionId: currentSessionId }),
          });
        } catch (error) {
          console.error("Heartbeat failed:", error);
        }
      }
    }, 30000); // Every 30 seconds

    // ✅ Refresh sessions every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchSessions();
    }, 60000); // Every 60 seconds

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(refreshInterval);
    };
  }, [apiKey, fetchSessions, fetchBannedUsers]);

  // ========== HELPERS ==========
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

  const groupedSessions = groupSessionsByUser(sessions);
  const adminUsernames = Object.keys(groupedSessions);

  const isCurrentSession = (sessionId) => sessionId === currentSessionId;

  // ✅ Get active sessions count for an admin
  const getActiveSessionsCount = (username) => {
    const userSessions = groupedSessions[username] || [];
    return userSessions.filter((s) => s.isActive !== false).length;
  };

  // ========== RENDER ==========
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
          🖥️ Active Admins ({adminUsernames.length})
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

      {/* Global Action Buttons */}
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
            if (!confirm("🧹 Clean up old inactive sessions?")) return;
            try {
              const response = await fetch(
                `${API_URL}/api/users/admin/cleanup-sessions`,
                {
                  method: "POST",
                  headers: {
                    "x-admin-key":
                      apiKey ||
                      localStorage.getItem("adminApiKey") ||
                      "admin123456",
                  },
                },
              );
              const data = await response.json();
              alert(
                `🧹 Cleaned up ${data.cleaned} old sessions.\n📊 ${data.remaining} active sessions remain.`,
              );
              await fetchSessions();
            } catch (error) {
              alert("❌ Error cleaning up sessions");
            }
          }}
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
          onClick={async () => {
            if (
              !confirm("⚠️ DANGER: This will log out EVERYONE including you!")
            )
              return;
            try {
              await fetch(`${API_URL}/api/users/admin/clear-all-sessions`, {
                method: "POST",
                headers: {
                  "x-admin-key":
                    apiKey ||
                    localStorage.getItem("adminApiKey") ||
                    "admin123456",
                },
              });
              localStorage.removeItem("adminApiKey");
              localStorage.removeItem("admin_session_id");
              window.location.href = "/";
            } catch (error) {
              alert("❌ Error clearing sessions");
            }
          }}
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
        <>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              Loading sessions...
            </div>
          ) : adminUsernames.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.sub }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <div>No active admin sessions found</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {adminUsernames.map((username) => {
                const userSessions = groupedSessions[username] || [];
                const activeSessions = userSessions.filter(
                  (s) => s.isActive !== false,
                );
                const activeCount = activeSessions.length;
                const isExpanded = expandedAdmins[username] || false;
                const isMasterAdmin = username === "master_admin";
                const isCurrentUser = activeSessions.some(
                  (s) => s.sessionId === currentSessionId,
                );
                const vadminNumber = getVadminNumber(username);
                const firstSession = activeSessions[0] || {};
                const isBanned = bannedUsers.some(
                  (b) => b.username === username,
                );

                const displayName = isMasterAdmin
                  ? "Master Admin 🛡️"
                  : `Virtual Admin #${vadminNumber}`;

                return (
                  <div
                    key={username}
                    style={{
                      background: isCurrentUser ? `${C.accent}10` : C.card,
                      borderRadius: 14,
                      border: `2px solid ${isBanned ? C.red : isCurrentUser ? C.accent : isMasterAdmin ? "#ffd700" : C.border}`,
                      overflow: "hidden",
                      boxShadow: isCurrentUser
                        ? "0 0 20px rgba(99,102,241,0.15)"
                        : "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* ADMIN HEADER */}
                    <div
                      onClick={() => toggleExpand(username)}
                      style={{
                        padding: "16px 20px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: isMasterAdmin
                          ? "rgba(255,215,0,0.05)"
                          : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: isBanned
                              ? C.red
                              : isMasterAdmin
                                ? "linear-gradient(135deg,#ffd700,#f59e0b)"
                                : "linear-gradient(135deg,#6366f1,#3b82f6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {isBanned
                            ? "🚫"
                            : isMasterAdmin
                              ? "👑"
                              : `#${vadminNumber}`}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: isBanned ? C.red : C.text,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {displayName}
                            {isBanned && (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: C.red,
                                  color: "#fff",
                                  padding: "2px 10px",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                BANNED
                              </span>
                            )}
                            {isCurrentUser && !isBanned && (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: C.accent,
                                  color: "#fff",
                                  padding: "2px 10px",
                                  borderRadius: 20,
                                  fontWeight: 600,
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: C.sub }}>
                            {activeCount} active session
                            {activeCount > 1 ? "s" : ""}
                            {firstSession.customName &&
                              ` · ${firstSession.customName}`}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: C.sub,
                            background: C.bg,
                            padding: "4px 12px",
                            borderRadius: 20,
                          }}
                        >
                          {activeCount} 📱
                        </span>
                        <span
                          style={{
                            fontSize: 18,
                            color: C.sub,
                            transition: "transform 0.3s",
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* EXPANDED SESSIONS LIST */}
                    {isExpanded && !isBanned && (
                      <div
                        style={{
                          padding: "0 20px 20px 20px",
                          borderTop: `1px solid ${C.border}`,
                          paddingTop: 16,
                        }}
                      >
                        {activeSessions.map((session) => {
                          const isEditing =
                            editingSessionId === session.sessionId;

                          return (
                            <div
                              key={session.sessionId}
                              style={{
                                background: C.bg,
                                borderRadius: 10,
                                padding: "12px 16px",
                                marginBottom: 8,
                                border: `1px solid ${isCurrentSession(session.sessionId) ? C.accent : C.border}`,
                                position: "relative",
                              }}
                            >
                              {isCurrentSession(session.sessionId) && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -6,
                                    right: 10,
                                    background: C.accent,
                                    color: "#fff",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: "2px 10px",
                                    borderRadius: 20,
                                  }}
                                >
                                  Current
                                </div>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 8,
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {isEditing ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 6,
                                        alignItems: "center",
                                      }}
                                    >
                                      <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) =>
                                          setEditName(e.target.value)
                                        }
                                        placeholder="Enter custom name..."
                                        style={{
                                          padding: "4px 8px",
                                          borderRadius: 6,
                                          border: `1px solid ${C.accent}`,
                                          background: "#fff",
                                          color: C.text,
                                          fontSize: 12,
                                          width: 150,
                                          outline: "none",
                                        }}
                                        autoFocus
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter") {
                                            handleRenameSave(session.sessionId);
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() =>
                                          handleRenameSave(session.sessionId)
                                        }
                                        disabled={
                                          renaming === session.sessionId
                                        }
                                        style={{
                                          padding: "3px 10px",
                                          borderRadius: 6,
                                          border: "none",
                                          background: C.green,
                                          color: "#fff",
                                          fontSize: 11,
                                          cursor:
                                            renaming === session.sessionId
                                              ? "not-allowed"
                                              : "pointer",
                                          opacity:
                                            renaming === session.sessionId
                                              ? 0.6
                                              : 1,
                                        }}
                                      >
                                        {renaming === session.sessionId
                                          ? "..."
                                          : "Save"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingSessionId(null);
                                          setEditName("");
                                        }}
                                        style={{
                                          padding: "3px 10px",
                                          borderRadius: 6,
                                          border: `1px solid ${C.border}`,
                                          background: "transparent",
                                          color: C.sub,
                                          fontSize: 11,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: C.text,
                                      }}
                                    >
                                      {session.customName ||
                                        session.deviceInfo ||
                                        "Unknown Device"}
                                      {session.customName && (
                                        <span
                                          style={{
                                            marginLeft: 8,
                                            fontSize: 10,
                                            color: C.accent,
                                            background: `${C.accent}15`,
                                            padding: "2px 8px",
                                            borderRadius: 10,
                                          }}
                                        >
                                          ✏️ Custom
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div style={{ fontSize: 11, color: C.sub }}>
                                    🌐 {session.ipAddress}
                                  </div>
                                  <div style={{ fontSize: 10, color: C.sub }}>
                                    🕐 Logged in:{" "}
                                    {formatDate(session.loggedInAt)} (
                                    {getTimeAgo(session.loggedInAt)})
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {!isCurrentSession(session.sessionId) && (
                                    <>
                                      {!isEditing && (
                                        <button
                                          onClick={() => {
                                            setEditingSessionId(
                                              session.sessionId,
                                            );
                                            setEditName(
                                              session.customName || "",
                                            );
                                          }}
                                          style={{
                                            padding: "4px 12px",
                                            borderRadius: 6,
                                            border: `1px solid ${C.accent}`,
                                            background: `${C.accent}10`,
                                            color: C.accent,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                          }}
                                        >
                                          ✏️ Rename
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          revokeSession(
                                            session.sessionId,
                                            username,
                                          )
                                        }
                                        disabled={
                                          revoking === session.sessionId
                                        }
                                        style={{
                                          padding: "4px 12px",
                                          borderRadius: 6,
                                          border: `1px solid ${C.gold}`,
                                          background: `${C.gold}10`,
                                          color: C.gold,
                                          fontSize: 11,
                                          fontWeight: 600,
                                          cursor:
                                            revoking === session.sessionId
                                              ? "not-allowed"
                                              : "pointer",
                                          opacity:
                                            revoking === session.sessionId
                                              ? 0.6
                                              : 1,
                                        }}
                                      >
                                        {revoking === session.sessionId
                                          ? "..."
                                          : "👢 Kick"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Admin-wide action buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 12,
                            flexWrap: "wrap",
                            paddingTop: 12,
                            borderTop: `1px solid ${C.border}`,
                          }}
                        >
                          {!isMasterAdmin && !isBanned && (
                            <>
                              <button
                                onClick={() =>
                                  revokeAllSessionsForUser(username)
                                }
                                disabled={revoking === username}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  border: `1px solid ${C.gold}`,
                                  background: `${C.gold}10`,
                                  color: C.gold,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor:
                                    revoking === username
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity: revoking === username ? 0.6 : 1,
                                }}
                              >
                                {revoking === username
                                  ? "..."
                                  : "👢 Kick All Sessions"}
                              </button>
                              <button
                                onClick={() =>
                                  changeVirtualAdminPassword(username)
                                }
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  border: `1px solid ${C.blue}`,
                                  background: `${C.blue}10`,
                                  color: C.blue,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                🔑 Change Password
                              </button>
                              <button
                                onClick={() => banUser(username)}
                                disabled={banning === username}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 6,
                                  border: `1px solid ${C.red}`,
                                  background: `${C.red}10`,
                                  color: C.red,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor:
                                    banning === username
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity: banning === username ? 0.6 : 1,
                                }}
                              >
                                {banning === username
                                  ? "..."
                                  : "🚫 Ban Permanently"}
                              </button>
                            </>
                          )}
                          {isMasterAdmin && !isBanned && (
                            <div
                              style={{
                                fontSize: 12,
                                color: C.sub,
                                padding: "6px 12px",
                                background: C.bg,
                                borderRadius: 6,
                              }}
                            >
                              👑 Master Admin actions are limited
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isBanned && (
                      <div
                        style={{
                          padding: "12px 20px",
                          background: `${C.red}10`,
                          borderTop: `1px solid ${C.red}`,
                          fontSize: 12,
                          color: C.red,
                          textAlign: "center",
                        }}
                      >
                        🚫 This admin has been banned. Click the Banned Admins
                        tab to unban.
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
                            {user.isVirtualAdmin && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  color: C.accent,
                                  fontSize: 11,
                                }}
                              >
                                🛡️ Virtual Admin
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            {user.email || user.adminEmail || "Virtual Admin"}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>
                        🚫 Banned:{" "}
                        {formatDate(user.bannedAt || user.adminBannedAt)}
                      </div>
                      {user.banReason && (
                        <div
                          style={{ fontSize: 11, color: C.sub, marginTop: 2 }}
                        >
                          📝 Reason: {user.banReason}
                        </div>
                      )}
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
                        cursor:
                          unbanning === user.username
                            ? "not-allowed"
                            : "pointer",
                        opacity: unbanning === user.username ? 0.6 : 1,
                      }}
                    >
                      {unbanning === user.username
                        ? "Unbanning..."
                        : "✅ Unban"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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
          <li>
            <strong>Click on any admin box</strong> to expand and see all their
            active sessions
          </li>
          <li>
            <strong>✏️ Rename</strong> - Custom name for a specific session
          </li>
          <li>
            <strong>👢 Kick</strong> - Force logout a specific session
          </li>
          <li>
            <strong>👢 Kick All Sessions</strong> - Force logout all sessions
            for this admin
          </li>
          <li>
            <strong>🔑 Change Password</strong> - Change password and refKey for
            virtual admin
          </li>
          <li>
            <strong>🚫 Ban Permanently</strong> - Completely block from admin
            panel
          </li>
          <li>
            <strong>✅ Unban</strong> - Restore admin access for a banned user
          </li>
        </ul>
      </div>
    </div>
  );
}
