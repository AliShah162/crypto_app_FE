"use client";
import { useState } from "react";
import { T } from "../lib/store";

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

export function NotifPanel({ notifs, onClose, onDelete, onMarkRead }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }} onClick={onClose} />
      <div style={{ 
        background: T.card, 
        borderRadius: "20px 20px 0 0", 
        maxHeight: "60%", 
        display: "flex", 
        flexDirection: "column",
        border: `1px solid ${T.line}`,
      }}>
        {/* Sticky Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "16px 16px 13px",
          borderBottom: `1px solid ${T.line}`,
          background: T.card,
          position: "sticky",
          top: 0,
          zIndex: 11,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Notifications</span>
          <div style={{ display: "flex", gap: 8 }}>
            {notifs.length > 0 && onDelete && (
              <button 
                onClick={() => {
                  if (confirm("Clear all notifications?")) {
                    notifs.forEach(n => onDelete(n.id));
                  }
                }}
                style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: T.red, cursor: "pointer" }}
              >
                Clear All
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.dim, fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
        </div>

        {/* Scrollable Notifications List */}
        <div style={{ 
          overflowY: "auto", 
          padding: "0 16px 26px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {notifs.length === 0 ? (
            <div style={{ textAlign: "center", color: T.dim, fontSize: 12, padding: "40px 0" }}>
              🔔 No notifications yet
            </div>
          ) : (
            notifs.slice().reverse().map((n, idx) => (
              <div 
                key={n.id || idx} 
                style={{ 
                  background: n.read ? T.card2 : "rgba(0,229,176,0.1)", 
                  borderRadius: 11, 
                  padding: "12px 14px", 
                  marginTop: 8, 
                  border: `1px solid ${n.read ? T.line : T.acc}`,
                  position: "relative"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4, paddingRight: 30 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 12, color: n.read ? T.dim : T.acc, lineHeight: 1.4 }}>
                  {n.body}
                </div>
                <div style={{ fontSize: 10, color: T.dim, marginTop: 6 }}>
                  {n.time || new Date(n.date).toLocaleTimeString()}
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(n.id)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(239,68,68,0.15)",
                      border: "none",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 10,
                      color: T.red,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
