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

// ========== GET VADMIN NUMBER ==========
const getVadminNumber = (sessionUser) => {
  if (!sessionUser) return null;

  // If it's master_admin, show "MASTER"
  if (sessionUser === "master_admin") {
    return "MASTER";
  }

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
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [banning, setBanning] = useState(null);
  const [unbanning, setUnbanning] = useState(null);
  const [showBanned, setShowBanned] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [editName, setEditName] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);

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

    console.log("🔵 Fetching banned virtual admins with key:", adminKey);

    const response = await fetch(`${API_URL}/api/users/admin/banned-virtual-admins`, {
      headers: { "x-admin-key": adminKey },
    });

    console.log("🔵 Response status:", response.status);

    const data = await response.json();
    console.log("🔵 Response data:", data);

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

 // In AdminSessions.jsx - update revokeSession:

const revokeSession = async (sessionId) => {
  if (
    !confirm(
      "⚠️ Are you sure you want to revoke (kick) this admin session? The user will be logged out immediately.",
    )
  )
    return;

  setRevoking(sessionId);
  try {
    // Find the session to get the username
    const sessionToRevoke = sessions.find(s => s.sessionId === sessionId);
    const username = sessionToRevoke?.sessionUser;

    const response = await fetch(
      `${API_URL}/api/users/admin/sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: {
          "x-admin-key":
            apiKey || localStorage.getItem("adminApiKey") || "admin123456",
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
      }
    );
    const data = await response.json();
    if (data.success) {
      // ✅ If this was a virtual admin, mark them as kicked
      if (username && username.startsWith("vadmin")) {
        const kickResponse = await fetch(
          `${API_URL}/api/users/admin/kick-virtual-admin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456",
            },
            body: JSON.stringify({ username }),
          }
        );
        const kickData = await kickResponse.json();
        if (!kickData.success) {
          console.warn("⚠️ Failed to mark virtual admin as kicked:", kickData.error);
        }
      }

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

 // ================= KICK VIRTUAL ADMIN =================
const kickVirtualAdmin = async (username, sessionId) => {
  if (
    !confirm(
      `⚠️ Kick virtual admin @${username}?\n\nThey will be logged out immediately but can log back in.`,
    )
  )
    return;

  setRevoking(sessionId || username);
  try {
    const adminKey =
      apiKey || localStorage.getItem("adminApiKey") || "admin123456";

    // ✅ 1. Remove their sessions first (this logs them out)
    const userSessions = sessions.filter(
      (s) => s.sessionUser === username && s.isActive !== false
    );

    for (const session of userSessions) {
      await fetch(`${API_URL}/api/users/admin/sessions/${session.sessionId}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
      });
    }

    // ✅ 2. Record the kick (but DON'T deactivate the account)
    const response = await fetch(
      `${API_URL}/api/users/admin/kick-virtual-admin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ username }),
      }
    );

    const data = await response.json();
    if (data.success) {
      alert(`✅ Virtual admin @${username} has been kicked out!`);
      await fetchSessions();
      await fetchBannedUsers();
    } else {
      alert(`❌ Failed: ${data.error}`);
    }
  } catch (error) {
    alert(`❌ Error: ${error.message}`);
  } finally {
    setRevoking(null);
  }
};

 // In AdminSessions.jsx - replace the kickAllUserSessions function:

const kickAllUserSessions = async (username) => {
  if (
    !confirm(
      `⚠️ Kick ALL active sessions for @${username}?\n\nThis will log them out from ALL devices immediately.`,
    )
  )
    return;

  setRevoking(username);
  try {
    const adminKey =
      apiKey || localStorage.getItem("adminApiKey") || "admin123456";

    // Get all active sessions for this user
    const userSessions = sessions.filter(
      (s) => s.sessionUser === username && s.isActive !== false,
    );

    if (userSessions.length === 0) {
      alert(`No active sessions found for @${username}`);
      setRevoking(null);
      return;
    }

    // Revoke each session one by one
    let revokedCount = 0;
    for (const session of userSessions) {
      const response = await fetch(
        `${API_URL}/api/users/admin/sessions/${session.sessionId}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-key": adminKey,
            "x-session-id": localStorage.getItem("admin_session_id") || "",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        revokedCount++;
      }
    }

    // ✅ CRITICAL: If this is a virtual admin, mark them as kicked
    if (username && username.startsWith("vadmin")) {
      const kickResponse = await fetch(
        `${API_URL}/api/users/admin/kick-virtual-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({ username }),
        }
      );
      const kickData = await kickResponse.json();
      if (!kickData.success) {
        console.warn("⚠️ Failed to mark virtual admin as kicked:", kickData.error);
      } else {
        console.log(`✅ Virtual admin @${username} marked as kicked`);
      }
    }

    alert(`✅ Successfully kicked ${revokedCount} session(s) for @${username}`);
    await fetchSessions();

    // If current user is kicked, redirect to login
    if (username === "master_admin") {
      alert("⚠️ You have kicked yourself! You will be logged out now.");
      localStorage.removeItem("adminApiKey");
      localStorage.removeItem("admin_session_id");
      window.location.href = "/";
      return;
    }
  } catch (error) {
    console.error("Error kicking all sessions:", error);
    alert("❌ Error kicking sessions");
  } finally {
    setRevoking(null);
  }
};

// ================= BAN VIRTUAL ADMIN =================
const banVirtualAdmin = async (username, sessionId) => {
  const reason = prompt(
    "Enter reason for banning this virtual admin:",
    "Unauthorized access / Security concern",
  );
  if (reason === null) return;

  if (
    !confirm(
      `⚠️ PERMANENTLY BAN virtual admin @${username}?\n\nReason: ${reason || "No reason provided"}\n\nThis admin will NO LONGER be able to access the admin panel until unbanned.`,
    )
  )
    return;

  setBanning(sessionId || username);
  try {
    const adminKey =
      apiKey || localStorage.getItem("adminApiKey") || "admin123456";

    // ✅ 1. First, immediately REMOVE ALL their sessions
    const userSessions = sessions.filter(
      (s) => s.sessionUser === username && s.isActive !== false
    );

    let removedCount = 0;
    for (const session of userSessions) {
      const response = await fetch(
        `${API_URL}/api/users/admin/sessions/${session.sessionId}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-key": adminKey,
            "x-session-id": localStorage.getItem("admin_session_id") || "",
          },
        }
      );
      if (response.ok) {
        removedCount++;
      }
    }

    // ✅ 2. Then ban the virtual admin in the database
    const response = await fetch(
      `${API_URL}/api/users/admin/ban-virtual-admin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
        body: JSON.stringify({
          username,
          banReason: reason,
          sessionId: sessionId,
        }),
      }
    );

    const data = await response.json();
    if (data.success) {
      alert(`✅ Virtual admin @${username} has been BANNED!`);
      alert(`✅ ${removedCount} active sessions removed!`);
      // ✅ Force refresh sessions and banned list
      await fetchSessions();
      await fetchBannedUsers();
      // ✅ Switch to banned tab to show the banned user
      setShowBanned(true);
    } else {
      alert(`❌ Failed: ${data.error}`);
    }
  } catch (error) {
    console.error("❌ Ban error:", error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    setBanning(null);
  }
};

 // ================= UNBAN VIRTUAL ADMIN =================
const unbanVirtualAdmin = async (username) => {
  if (
    !confirm(
      `✅ Unban virtual admin @${username}?\n\nThey will be able to access the admin panel again.`,
    )
  )
    return;

  setUnbanning(username);
  try {
    const adminKey =
      apiKey || localStorage.getItem("adminApiKey") || "admin123456";
    
    // ✅ CORRECT ENDPOINT for virtual admin
    const response = await fetch(
      `${API_URL}/api/users/admin/unban-virtual-admin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ username }),
      }
    );

    console.log("🔵 Unban response status:", response.status);
    const data = await response.json();
    console.log("🔵 Unban response data:", data);

    if (data.success) {
      alert(`✅ Virtual admin @${username} has been UNBANNED!`);
      await fetchSessions();
      await fetchBannedUsers();
    } else {
      alert(`❌ Failed: ${data.error}`);
    }
  } catch (error) {
    console.error("❌ Unban error:", error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    setUnbanning(null);
  }
};

// AdminSessions.jsx - Update the changeVirtualAdminPassword function

const changeVirtualAdminPassword = async (username) => {
  // Show prompt with two fields
  const newPassword = prompt(
    `Enter new password for virtual admin @${username}:\n(Password must be at least 6 characters)`,
  );
  if (!newPassword) return;

  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  // Second prompt for custom refKey
  const newRefKey = prompt(
    `Enter new Reference Key for @${username}:\n(Minimum 4 characters, letters and numbers only)\n\nLeave empty to auto-generate.`,
  );
  
  // Validate refKey if provided
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
      `Change password for virtual admin @${username} to "${newPassword}"?\n${
        newRefKey ? `New RefKey: "${newRefKey}"` : "RefKey will be auto-generated"
      }`,
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
          username: username,
          newPassword: newPassword,
          customRefKey: newRefKey || null, // Pass custom refKey or null
        }),
      },
    );

    const data = await response.json();
    if (data.success) {
      alert(
        `✅ Password for virtual admin @${username} updated successfully!\n\n` +
        `New Password: ${data.newPassword}\n` +
        `New Reference Key: ${data.newRefKey}\n` +
        `Users Migrated: ${data.usersUpdated || 0}\n\n` +
        `⚠️ IMPORTANT: The admin must use "${data.newPassword}" as their password to login.\n` +
        `All users under this admin have been migrated to the new refKey.`
      );
      await fetchSessions();
      await fetchBannedUsers();
    } else {
      alert(`❌ Failed: ${data.error}`);
    }
  } catch (error) {
    alert(`❌ Error: ${error.message}`);
  }
};
  // ================= USE EFFECTS =================
  useEffect(() => {
    // ✅ Just read whatever real session ID already exists. Never invent one
    // here — a client-generated ID (Date.now() + random) was never registered
    // with the backend, and writing it into the shared "admin_session_id" key
    // clobbers the real session AdminPanel registered, so the next background
    // fetch/poll gets SESSION_INVALID and force-logs the master admin out.
    // The real registration flow lives in AdminPanel.jsx; this component should
    // only ever read the id, never create or overwrite it.
    const sessionId = localStorage.getItem("admin_session_id");
    setCurrentSessionId(sessionId || null);
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
  // ================= GET DISPLAY NAME =================
  const getDisplayName = (session) => {
    // ✅ Check if customName exists and is not empty
    if (session.customName && session.customName.trim() !== "") {
      return session.customName;
    }

    // ✅ If it's master_admin, show "Master Admin"
    if (session.sessionUser === "master_admin") {
      return "Master Admin 🛡️";
    }

    // ✅ If it's a virtual admin, show their username
    if (session.sessionUser && session.sessionUser.startsWith("vadmin")) {
      return session.sessionUser;
    }

    // Fallback to device info
    return session.deviceInfo || "Unknown Device";
  };

  const renameSession = async (sessionId) => {
    if (!editName.trim()) {
      alert("Please enter a name");
      return;
    }

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
          body: JSON.stringify({
            sessionId: sessionId,
            customName: editName.trim(),
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // ✅ Force refresh immediately
        await fetchSessions();

        // ✅ Clear editing state
        setEditingSessionId(null);
        setEditName("");

        // ✅ Show success message
        alert("✅ Session renamed successfully!");
      } else {
        alert("❌ Failed to rename: " + data.error);
      }
    } catch (error) {
      console.error("🔴 Rename error:", error);
      alert("❌ Error renaming session");
    } finally {
      setRenaming(null);
    }
  };

  // ================= RENAME SESSIONS BY IP =================
const renameSessionsByIP = async (ipAddress) => {
  if (!editName.trim()) {
    alert("Please enter a name");
    return;
  }

  // ✅ Get the session user from the editing session
  const currentSession = sessions.find(s => s.sessionId === editingSessionId);
  if (!currentSession) {
    alert("Session not found");
    return;
  }

  // ✅ Count ONLY active sessions for THIS user with this IP
  const sessionsToRename = sessions.filter(
    (s) => s.sessionUser === currentSession.sessionUser && 
           s.ipAddress === ipAddress && 
           s.isActive !== false
  );

  if (sessionsToRename.length === 1) {
    // Only one session, just rename it directly
    await renameSession(editingSessionId);
    return;
  }

  // Multiple sessions for this user - ask user
  if (
    !confirm(
      `📱 Found ${sessionsToRename.length} active sessions for @${currentSession.sessionUser} from IP (${ipAddress}).\n\n` +
        `Do you want to rename ALL of them to "${editName.trim()}"?\n\n` +
        `Click "OK" to rename all, or "Cancel" to rename just this one.`,
    )
  ) {
    // User chose to rename only this one
    await renameSession(editingSessionId);
    return;
  }

  // User wants to rename all
  try {
    setRenaming(ipAddress);
    const adminKey =
      apiKey || localStorage.getItem("adminApiKey") || "admin123456";

    const response = await fetch(
      `${API_URL}/api/users/admin/rename-sessions-by-ip`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          "x-session-id": localStorage.getItem("admin_session_id") || "",
        },
        body: JSON.stringify({
          ipAddress: ipAddress,
          customName: editName.trim(),
        }),
      }
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
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    style={{
                      background: isCurrentSession(session.sessionId)
                        ? `linear-gradient(135deg, ${C.accent}10, #3b82f610)`
                        : C.card,
                      borderRadius: 14,
                      border: `1px solid ${
                        isCurrentSession(session.sessionId)
                          ? C.accent
                          : C.border
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
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: C.text,
                                }}
                              >
                                {getDisplayName(session)}
                              </span>
                              {getVadminNumber(session.sessionUser) && (
                                <span
                                  style={{
                                    background:
                                      session.sessionUser === "master_admin"
                                        ? "rgba(255, 215, 0, 0.2)" // Gold for master
                                        : C.accent + "20",
                                    color:
                                      session.sessionUser === "master_admin"
                                        ? "#ffd700" // Gold for master
                                        : C.accent,
                                    padding: "1px 10px",
                                    borderRadius: 12,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    border: `1px solid ${
                                      session.sessionUser === "master_admin"
                                        ? "rgba(255, 215, 0, 0.3)"
                                        : C.accent + "30"
                                    }`,
                                  }}
                                >
                                  {session.sessionUser === "master_admin"
                                    ? "👑 MASTER"
                                    : `Vadmin ${getVadminNumber(session.sessionUser)}`}
                                </span>
                              )}
                              {session.customName && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    color: C.accent,
                                    background: `${C.accent}20`,
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                  }}
                                >
                                  ✏️ Custom
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.sub,
                                fontFamily: "monospace",
                              }}
                            >
                              {session.sessionUser
                                ? `User: ${session.sessionUser}`
                                : "User: admin"}
                              {session.customName && session.deviceInfo && (
                                <span style={{ marginLeft: 8, color: "#888" }}>
                                  (Device: {session.deviceInfo})
                                </span>
                              )}
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
                          {sessions.filter(
                            (s) =>
                              s.sessionUser === session.sessionUser &&
                              s.isActive !== false,
                          ).length > 1 && (
                            <span
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                background: C.gold,
                                color: "#fff",
                                fontSize: 9,
                                borderRadius: "50%",
                                width: 18,
                                height: 18,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                              }}
                            >
                              {
                                sessions.filter(
                                  (s) =>
                                    s.sessionUser === session.sessionUser &&
                                    s.isActive !== false,
                                ).length
                              }
                            </span>
                          )}
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

                      {!isCurrentSession(session.sessionId) && (
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          {/* Rename button */}
                          {editingSessionId === session.sessionId ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Enter name..."
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  border: `1px solid ${C.accent}`,
                                  background: "#fff",
                                  color: C.text,
                                  fontSize: 12,
                                  width: 120,
                                  outline: "none",
                                }}
                                autoFocus
                                onKeyPress={(e) =>
                                  e.key === "Enter" &&
                                  renameSessionsByIP(session.ipAddress)
                                }
                              />
                              <button
                                onClick={() =>
                                  renameSessionsByIP(session.ipAddress)
                                }
                                disabled={
                                  renaming === session.sessionId ||
                                  renaming === session.ipAddress
                                }
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: C.green,
                                  color: "#fff",
                                  fontSize: 11,
                                  cursor:
                                    renaming === session.sessionId ||
                                    renaming === session.ipAddress
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    renaming === session.sessionId ||
                                    renaming === session.ipAddress
                                      ? 0.6
                                      : 1,
                                }}
                              >
                                {renaming === session.sessionId ||
                                renaming === session.ipAddress
                                  ? "⏳"
                                  : "Save"}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSessionId(null);
                                  setEditName("");
                                }}
                                style={{
                                  padding: "4px 10px",
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
                            <button
  onClick={() => {
    setEditingSessionId(session.sessionId);
    setEditName(session.customName || "");
  }}
  style={{
    padding: "6px 14px",
    borderRadius: 8,
    border: `1px solid ${C.accent}`,
    background: `${C.accent}10`,
    color: C.accent,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  ✏️ Rename
</button>
                          )}

                          {/* Kick button - Now kicks ALL sessions for this user */}
                          <button
                            onClick={() => {
                              const isVirtual =
                                session.sessionUser &&
                                session.sessionUser !== "master_admin" &&
                                session.sessionUser.startsWith("vadmin");

                              // Kick ALL sessions for this user
                              kickAllUserSessions(session.sessionUser);
                            }}
                            disabled={
                              revoking === session.sessionId ||
                              revoking === session.sessionUser
                            }
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: `1px solid ${C.gold}`,
                              background: `${C.gold}10`,
                              color: C.gold,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                revoking === session.sessionId ||
                                revoking === session.sessionUser
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                revoking === session.sessionId ||
                                revoking === session.sessionUser
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {revoking === session.sessionId ||
                            revoking === session.sessionUser
                              ? "Kicking..."
                              : "👢 Kick All"}
                          </button>

                          {/* Change Password button */}
                          <button
                            onClick={() =>
                              changeVirtualAdminPassword(session.sessionUser)
                            }
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
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

                          {/* Ban button */}
                          <button
                            onClick={() => {
                              const isVirtual =
                                session.sessionUser &&
                                session.sessionUser !== "master_admin" &&
                                session.sessionUser.startsWith("vadmin");
                              if (isVirtual) {
                                banVirtualAdmin(
                                  session.sessionUser,
                                  session.sessionId,
                                );
                              } else {
                                banUser(
                                  session.sessionId,
                                  session.deviceInfo,
                                  session.sessionUser || "admin",
                                );
                              }
                            }}
                            disabled={
                              banning === session.sessionId ||
                              banning === session.sessionUser
                            }
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: `1px solid ${C.red}`,
                              background: `${C.red}10`,
                              color: C.red,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                banning === session.sessionId ||
                                banning === session.sessionUser
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                banning === session.sessionId ||
                                banning === session.sessionUser
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {banning === session.sessionId ||
                            banning === session.sessionUser
                              ? "Banning..."
                              : "🚫 Ban"}
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
              {user.isVirtualAdmin && (
                <span style={{ marginLeft: 8, color: C.accent, fontSize: 11 }}>
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
          🚫 Banned: {formatDate(user.bannedAt || user.adminBannedAt)}
        </div>
        {user.banReason && (
          <div
            style={{ fontSize: 11, color: C.sub, marginTop: 2 }}
          >
            📝 Reason: {user.banReason}
          </div>
        )}
        <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>
          {user.isVirtualAdmin ? "Virtual Admin" : "Role was: Admin (demoted to User)"}
        </div>
      </div>

      <button
      onClick={() => {
        // ✅ Check if it's a virtual admin
        if (user.isVirtualAdmin || user.username.startsWith('vadmin')) {
          unbanVirtualAdmin(user.username);  // ← Call this for virtual admins
        } else {
          unbanUser(user.username);          // ← Call this for regular admins
        }
      }}
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
          <li>
            <strong>👢 Kick</strong> - Force logout immediately (admin can log
            back in)
          </li>
          <li>
            <strong>🚫 Ban User</strong> - Permanently block from admin panel
            (cannot login until unbanned)
          </li>
          <li>
            <strong>✅ Unban</strong> - Restore admin access for a banned user
          </li>
          <li>
            <strong>🔒 Revoke All Other Sessions</strong> - Logs out ALL other
            admins except you
          </li>
          <li>
            <strong>🧹 Cleanup</strong> - Removes inactive sessions older than 1
            hour
          </li>
          <li>
            <strong>🔴 Clear ALL Sessions</strong> - Logs out EVERYONE including
            you (emergency)
          </li>
        </ul>
      </div>
    </div>
  );
}