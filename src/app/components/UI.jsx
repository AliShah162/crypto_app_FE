"use client";
import { useState } from "react";
import { T } from "../lib/store";
 const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  panel: {
    width: "min(90vw, 380px)",
    maxHeight: "80vh",
    background: T.card,
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    border: `1px solid ${T.line}`,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 18px",
    borderBottom: `1px solid ${T.line}`,
    fontSize: 16,
    fontWeight: 700,
    color: T.text,
    background: T.card2,
  },
  deleteAllBtn: {
    padding: "4px 12px",
    borderRadius: 20,
    border: `1px solid ${T.red}`,
    background: "transparent",
    color: T.red,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    color: T.dim,
    lineHeight: 1,
    padding: "0 4px",
  },
  list: {
  flex: 1,
  overflowY: "auto",
  padding: "8px 0",
  scrollbarWidth: "none", // For Firefox
  msOverflowStyle: "none", // For IE/Edge
  
},
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: T.dim,
    fontSize: 13,
  },
  notifItem: {
    padding: "14px 16px",
    borderBottom: `1px solid ${T.line}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    transition: "background 0.2s",
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: T.text,
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: T.dim,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  notifTime: {
    fontSize: 10,
    color: T.dim2 || "#6b7280",
  },
  notifActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-end",
  },
  markReadBtn: {
    padding: "3px 10px",
    borderRadius: 14,
    border: `1px solid ${T.acc}`,
    background: "transparent",
    color: T.acc,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    padding: "3px 10px",
    borderRadius: 14,
    border: `1px solid ${T.red}`,
    background: "transparent",
    color: T.red,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
export function Input({ label, type = "text", val, set, ph, err, right }) {
 
  const [foc, sf] = useState(false);
  return (
    <div style={{ marginBottom: 13 }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, letterSpacing: 1, marginBottom: 5 }}>
          {label}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={val}
          onChange={(e) => set(e.target.value)}
          placeholder={ph}
          style={{
            width: "100%", background: T.card2,
            border: `1.5px solid ${err ? T.red : foc ? T.acc : T.line}`,
            borderRadius: 11, padding: right ? "11px 44px 11px 12px" : "11px 12px",
            fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", transition: "border .2s",
          }}
          onFocus={() => sf(true)}
          onBlur={() => sf(false)}
        />
        {right && (
          <div style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
            {right}
          </div>
        )}
      </div>
      {err && <div style={{ fontSize: 11, color: T.red, marginTop: 3 }}>{err}</div>}
    </div>
  );
}

export function PB({ lbl, onClick, ghost, danger, dis, sm }) {
  return (
    <button
      onClick={onClick}
      disabled={dis}
      style={{
        width: "100%",
        border: ghost ? `1.5px solid ${danger ? T.red : T.acc}` : "none",
        borderRadius: sm ? 9 : 13,
        padding: sm ? "8px 0" : "13px 0",
        fontSize: sm ? 11 : 14,
        fontWeight: 800,
        cursor: dis ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        background: ghost
          ? danger ? "rgba(239,68,68,0.1)" : "transparent"
          : danger ? T.red : "linear-gradient(135deg,#00e5b0,#3b82f6)",
        color: ghost ? (danger ? T.red : T.acc) : "#fff",
        opacity: dis ? 0.5 : 1,
        boxShadow: ghost || dis ? "none" : "0 4px 14px rgba(0,229,176,0.22)",
      }}
    >
      {lbl}
    </button>
  );
}

export function BHdr({ title, back }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "15px 15px 10px", borderBottom: `1px solid ${T.line}`, flexShrink: 0,
    }}>
      <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", color: T.text, fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
      <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{title}</span>
      <div style={{ minWidth: 22 }} />
    </div>
  );
}

export function EyeBtn({ show, tog }) {
  return (
    <div onClick={tog}>
      {show
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      }
    </div>
  );
}

export function CoinIcon({ c, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, color: c.cl, flexShrink: 0 }}>
      {c.sym}
    </div>
  );
}

export function NotifPanel({ notifs, onClose, onDelete, onDeleteAll }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span>Notifications</span>
          <div style={{ display: "flex", gap: 8 }}>
            {notifs.length > 0 && onDeleteAll && (
              <button onClick={onDeleteAll} style={styles.deleteAllBtn}>
                Delete All
              </button>
            )}
            <button onClick={onClose} style={styles.closeBtn}>×</button>
          </div>
        </div>
        <div style={styles.list}>
          {notifs.length === 0 ? (
            <div style={styles.empty}>No notifications</div>
          ) : (
            notifs.map((n) => (
              <div key={n.id} style={styles.notifItem}>
                <div style={styles.notifContent}>
                  <div style={styles.notifTitle}>{n.title}</div>
                  <div style={styles.notifBody}>{n.body}</div>
                  <div style={styles.notifTime}>{n.time}</div>
                </div>
                <div style={styles.notifActions}>
                  <button onClick={() => onDelete(n.id)} style={styles.deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
