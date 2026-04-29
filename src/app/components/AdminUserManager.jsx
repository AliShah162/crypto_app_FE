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

export default function AdminUserManager({ apiKey, onClose }) {
  const [admins, setAdmins] = useState([]);
  const [bannedAdmins, setBannedAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showBanned, setShowBanned] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/admin/all-admins`, {
        headers: { "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456" },
      });
      const data = await response.json();
      if (data.admins && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    }
  }, [apiKey]);

  const fetchBannedAdmins = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/admin/banned-admins`, {
        headers: { "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456" },
      });
      const data = await response.json();
      if (data.bannedAdmins && Array.isArray(data.bannedAdmins)) {
        setBannedAdmins(data.bannedAdmins);
      }
    } catch (error) {
      console.error("Failed to fetch banned admins:", error);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const kickAdmin = async (adminUsername) => {
    if (!confirm(`⚠️ Kick @${adminUsername}?\n\nThey will be logged out immediately but can log back in.`)) return;
    
    setActionLoading(`kick-${adminUsername}`);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/kick-admin`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456" 
        },
        body: JSON.stringify({ adminUsername }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        await fetchAdmins();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const banAdmin = async (adminUsername) => {
    const reason = prompt("Enter reason for banning this admin:", "Unauthorized access / Security concern");
    if (reason === null) return;
    
    if (!confirm(`⚠️ PERMANENTLY BAN @${adminUsername}?\n\nReason: ${reason || "No reason provided"}\n\nThis admin will NO LONGER be able to access the admin panel until unbanned.`)) return;
    
    setActionLoading(`ban-${adminUsername}`);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/ban-admin`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456" 
        },
        body: JSON.stringify({ adminUsername, banReason: reason }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        await fetchAdmins();
        await fetchBannedAdmins();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const unbanAdmin = async (adminUsername) => {
    if (!confirm(`✅ Unban @${adminUsername}?\n\nThis admin will be able to access the admin panel again.`)) return;
    
    setActionLoading(`unban-${adminUsername}`);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/unban-admin`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": apiKey || localStorage.getItem("adminApiKey") || "admin123456" 
        },
        body: JSON.stringify({ adminUsername }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        await fetchAdmins();
        await fetchBannedAdmins();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchBannedAdmins();
  }, [fetchAdmins, fetchBannedAdmins]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 15,
        borderBottom: `1px solid ${C.border}`,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            👥 Admin User Management
          </div>
          <div style={{ fontSize: 12, color: C.sub }}>
            Manage all admin users - kick, ban, or unban
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowBanned(false)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${!showBanned ? C.accent : C.border}`,
              background: !showBanned ? `${C.accent}15` : "transparent",
              color: !showBanned ? C.accent : C.sub,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Active Admins ({admins.length})
          </button>
          <button
            onClick={() => setShowBanned(true)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${showBanned ? C.red : C.border}`,
              background: showBanned ? `${C.red}15` : "transparent",
              color: showBanned ? C.red : C.sub,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Banned Admins ({bannedAdmins.length})
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>Loading...</div>
      ) : !showBanned ? (
        // ACTIVE ADMINS
        admins.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.sub }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div>No other admin users found</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>Only master admin exists</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {admins.map((admin) => (
              <div
                key={admin.username}
                style={{
                  background: C.card,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#fff",
                      }}>
                        {admin.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                          @{admin.username}
                        </div>
                        <div style={{ fontSize: 11, color: C.sub }}>{admin.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>
                      📅 Joined: {formatDate(admin.createdAt)}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => kickAdmin(admin.username)}
                      disabled={actionLoading === `kick-${admin.username}`}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${C.gold}`,
                        background: `${C.gold}10`,
                        color: C.gold,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        opacity: actionLoading ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === `kick-${admin.username}` ? "..." : "👢 Kick"}
                    </button>
                    <button
                      onClick={() => banAdmin(admin.username)}
                      disabled={actionLoading === `ban-${admin.username}`}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${C.red}`,
                        background: `${C.red}10`,
                        color: C.red,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        opacity: actionLoading ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === `ban-${admin.username}` ? "..." : "🚫 Ban Permanently"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // BANNED ADMINS
        bannedAdmins.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.sub }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div>No banned admin users</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bannedAdmins.map((admin) => (
              <div
                key={admin.username}
                style={{
                  background: `${C.red}08`,
                  borderRadius: 14,
                  border: `1px solid ${C.red}`,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
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
                      }}>
                        {admin.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                          @{admin.username}
                        </div>
                        <div style={{ fontSize: 11, color: C.sub }}>{admin.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>
                      🚫 Banned: {formatDate(admin.adminBannedAt)}
                    </div>
                    {admin.adminBanReason && (
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                        📝 Reason: {admin.adminBanReason}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => unbanAdmin(admin.username)}
                    disabled={actionLoading === `unban-${admin.username}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.green}`,
                      background: `${C.green}10`,
                      color: C.green,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading === `unban-${admin.username}` ? "..." : "✅ Unban"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <div style={{
        marginTop: 20,
        padding: "12px 16px",
        background: "#fef3c7",
        borderRadius: 10,
        fontSize: 12,
        color: "#92400e",
      }}>
        <strong>⚡ Admin Management Actions:</strong>
        <ul style={{ marginTop: 8, marginLeft: 20, paddingLeft: 0 }}>
          <li><strong>👢 Kick</strong> - Force logout immediately (admin can log back in)</li>
          <li><strong>🚫 Ban Permanently</strong> - Completely block from admin panel (cannot login until unbanned)</li>
          <li><strong>✅ Unban</strong> - Restore admin access for a banned user</li>
        </ul>
      </div>
    </div>
  );
}