"use client";
import { useState, useEffect } from "react";
import { T, S } from "../lib/store";
import { Input, PB, BHdr } from "../components/UI";

/* ── Shared Design Tokens ──────────────────────────────────── */
const B = {
  bg:      "#0b0e11",
  surface: "#0f1217",
  card:    "#161a21",
  card2:   "#1c2130",
  border:  "rgba(255,255,255,0.06)",
  borderHover: "rgba(240,185,11,0.3)",
  gold:    "#f0b90b",
  goldDim: "rgba(240,185,11,0.45)",
  green:   "#0ecb81",
  red:     "#f6465d",
  blue:    "#1890ff",
  text:    "#eaecef",
  textMid: "#848e9c",
  textDim: "#474d57",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');`;

const BASE_CSS = `
  ${FONTS}
  * { box-sizing: border-box; }
  .bn-page { font-family: 'IBM Plex Sans', sans-serif; background: ${B.bg}; }
  .bn-card {
    background: ${B.card};
    border: 1px solid ${B.border};
    border-radius: 8px;
  }
  .bn-input {
    width: 100%;
    background: ${B.surface};
    border: 1px solid ${B.border};
    border-radius: 6px;
    padding: 11px 14px;
    font-size: 13px;
    color: ${B.text};
    font-family: 'IBM Plex Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .bn-input:focus { border-color: ${B.gold}; }
  .bn-input::placeholder { color: ${B.textDim}; }
  .bn-btn-gold {
    width: 100%; padding: 13px;
    background: ${B.gold};
    border: none; border-radius: 6px;
    color: #0b0e11; font-size: 13px; font-weight: 700;
    font-family: 'IBM Plex Sans', sans-serif;
    cursor: pointer; letter-spacing: 0.3px;
    transition: opacity 0.2s, transform 0.1s;
  }
  .bn-btn-gold:hover { opacity: 0.9; transform: translateY(-1px); }
  .bn-btn-ghost {
    width: 100%; padding: 12px;
    background: transparent;
    border: 1px solid ${B.border}; border-radius: 6px;
    color: ${B.textMid}; font-size: 13px; font-weight: 500;
    font-family: 'IBM Plex Sans', sans-serif;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .bn-btn-ghost:hover { border-color: ${B.gold}; color: ${B.gold}; }
  @keyframes bnFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .bn-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid ${B.border};
  }
  .bn-row:last-child { border-bottom: none; }
  .bn-label {
    font-size: 10px; font-weight: 600; color: ${B.textMid};
    letter-spacing: 0.8px; margin-bottom: 7px;
  }
  .bn-tag-success { background: rgba(14,203,129,0.1); color: ${B.green}; padding: 3px 9px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .bn-tag-danger  { background: rgba(246,70,93,0.1);  color: ${B.red};   padding: 3px 9px; border-radius: 4px; font-size: 11px; font-weight: 600; }
`;

/* ── Shared page header ────────────────────────────────────── */
function BnHdr({ title, subtitle, back }) {
  return (
    <div style={{
      padding: "16px 16px 14px",
      borderBottom: `1px solid ${B.border}`,
      background: B.bg,
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <button onClick={back} style={{
        width: 34, height: 34, borderRadius: 6,
        border: `1px solid ${B.border}`, background: B.card,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: B.textMid, fontSize: 15, flexShrink: 0,
        transition: "border-color 0.2s, color 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = B.gold; e.currentTarget.style.color = B.gold; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMid; }}
      >←</button>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: B.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ── Field wrapper ─────────────────────────────────────────── */
function Field({ label, children, err }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="bn-label">{label}</div>
      {children}
      {err && <div style={{ fontSize: 11, color: B.red, marginTop: 5 }}>{err}</div>}
    </div>
  );
}

/* ── Alert banner ──────────────────────────────────────────── */
function Alert({ type, msg }) {
  if (!msg) return null;
  const isSuccess = type === "s";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 13px", borderRadius: 6, marginBottom: 14,
      background: isSuccess ? "rgba(14,203,129,0.08)" : "rgba(246,70,93,0.08)",
      border: `1px solid ${isSuccess ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
    }}>
      <span style={{ fontSize: 14 }}>{isSuccess ? "✓" : "✕"}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: isSuccess ? B.green : B.red }}>{msg}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SecSub — Security / Change Password
══════════════════════════════════════════════════════════════ */
export function SecSub({ back }) {
  const [f, sf] = useState({ c: "", n: "", cn: "" });
  const [msg, sm] = useState(null);

  const go = () => {
    const u = S.get();
    const validPw = u?.adminPassword ?? u?.password;
    if (f.c !== validPw) { sm({ t: "e", m: "Incorrect current password" }); return; }
    if (f.n.length < 6)  { sm({ t: "e", m: "Minimum 6 characters required" }); return; }
    if (f.n !== f.cn)    { sm({ t: "e", m: "Passwords do not match" }); return; }
    S.updateUser(u.username, { password: f.n, adminPassword: f.n });
    sm({ t: "s", m: "Password updated successfully" });
    sf({ c: "", n: "", cn: "" });
  };

  return (
    <div className="bn-page" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
      <style>{BASE_CSS}</style>
      <BnHdr title="Security" subtitle="Manage your account password" back={back}/>
      <div style={{ padding: "18px 16px" }}>

        {/* Security status banner */}
        <div style={{
          background: B.card2, borderRadius: 8, padding: "14px 16px",
          marginBottom: 18, border: `1px solid ${B.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(14,203,129,0.1)", border: "1px solid rgba(14,203,129,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>🔐</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: B.text }}>Account Security</div>
            <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>Use a strong password to protect your account</div>
          </div>
          <span className="bn-tag-success" style={{ marginLeft: "auto" }}>Active</span>
        </div>

        <div className="bn-card" style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${B.border}` }}>
            Change Password
          </div>

          <Field label="CURRENT PASSWORD">
            <input className="bn-input" type="password" value={f.c}
              onChange={e => sf(p => ({ ...p, c: e.target.value }))}
              placeholder="Enter current password"/>
          </Field>

          <Field label="NEW PASSWORD">
            <input className="bn-input" type="password" value={f.n}
              onChange={e => sf(p => ({ ...p, n: e.target.value }))}
              placeholder="Minimum 6 characters"/>
          </Field>

          <Field label="CONFIRM NEW PASSWORD">
            <input className="bn-input" type="password" value={f.cn}
              onChange={e => sf(p => ({ ...p, cn: e.target.value }))}
              placeholder="Repeat new password"/>
          </Field>

          <Alert type={msg?.t} msg={msg?.m}/>
          <button className="bn-btn-gold" onClick={go}>Update Password</button>
        </div>

        {/* Password tips */}
        <div style={{ marginTop: 14, padding: "13px 15px", background: B.card, borderRadius: 8, border: `1px solid ${B.border}` }}>
          <div style={{ fontSize: 10, color: B.textMid, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>TIPS FOR A STRONG PASSWORD</div>
          {["At least 8 characters long", "Include uppercase & lowercase letters", "Add numbers and special characters"].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
              <span style={{ color: B.green, fontSize: 11, marginTop: 1 }}>·</span>
              <span style={{ fontSize: 11, color: B.textMid }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CardSub — Bank Cards
══════════════════════════════════════════════════════════════ */
export function CardSub({ back, user, re }) {
  const [cards, sc] = useState(user?.savedCards || []);
  const [f, sf] = useState({ num: "", name: "", exp: "" });
  const [errs, se] = useState({});
  const [adding, setAdding] = useState(cards.length === 0);

  const add = () => {
    const e = {};
    if (f.num.replace(/\s/g, "").length < 12) e.num = "Enter a valid card number";
    if (!f.name.trim()) e.name = "Cardholder name is required";
    if (!/^\d{2}\/\d{2}$/.test(f.exp)) e.exp = "Format must be MM/YY";
    se(e);
    if (Object.keys(e).length) return;
    const c = { ...f, display: "**** **** **** " + f.num.replace(/\s/g, "").slice(-4), id: Date.now() };
    const up = [...cards, c];
    sc(up);
    const u = S.get();
    if (u) S.updateUser(u.username, { savedCards: up });
    re();
    sf({ num: "", name: "", exp: "" });
    se({});
    setAdding(false);
  };

  const rm = (id) => {
    const up = cards.filter(c => c.id !== id);
    sc(up);
    const u = S.get();
    if (u) S.updateUser(u.username, { savedCards: up });
    re();
  };

  // Card network detection
  const getNetwork = (num) => {
    const n = num.replace(/\s/g, "");
    if (n.startsWith("4")) return { name: "VISA", color: "#1a1f71" };
    if (/^5[1-5]/.test(n)) return { name: "MC", color: "#eb001b" };
    if (n.startsWith("3")) return { name: "AMEX", color: "#007bc1" };
    return { name: "CARD", color: B.gold };
  };

  return (
    <div className="bn-page" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", paddingBottom: 24 }}>
      <style>{BASE_CSS}</style>
      <BnHdr title="Payment Cards" subtitle={`${cards.length} card${cards.length !== 1 ? "s" : ""} saved`} back={back}/>
      <div style={{ padding: "16px 16px 0" }}>

        {/* Saved Cards */}
        {cards.map((c, i) => {
          const net = getNetwork(c.display);
          return (
            <div key={c.id} style={{
              background: "linear-gradient(135deg, #1a2035, #243050)",
              borderRadius: 12, padding: "18px 18px 16px",
              marginBottom: 12, position: "relative",
              border: "1px solid rgba(240,185,11,0.12)",
              animation: `bnFadeUp 0.3s ease ${i * 0.06}s both`,
            }}>
              {/* decorative dots */}
              <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120,
                borderRadius: "50%", background: "rgba(255,255,255,0.02)", transform: "translate(30%,-30%)" }}/>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2, fontWeight: 600 }}>
                  BANK CARD
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: B.gold }}>{net.name}</span>
                  <button onClick={() => rm(c.id)} style={{
                    background: "rgba(246,70,93,0.12)", border: "1px solid rgba(246,70,93,0.2)",
                    borderRadius: 5, padding: "3px 9px", fontSize: 10, color: B.red,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Remove</button>
                </div>
              </div>

              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 17, fontWeight: 600,
                color: "#fff", letterSpacing: 3, marginBottom: 16 }}>
                {c.display}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 2 }}>CARD HOLDER</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{c.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 2 }}>EXPIRES</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'IBM Plex Mono',monospace" }}>{c.exp}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Card */}
        {!adding && cards.length > 0 && (
          <button onClick={() => setAdding(true)} style={{
            width: "100%", padding: "13px",
            background: "transparent",
            border: `1px dashed ${B.border}`, borderRadius: 8,
            color: B.gold, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", marginBottom: 14,
            transition: "border-color 0.2s",
          }}>+ Add New Card</button>
        )}

        {adding && (
          <div className="bn-card" style={{ padding: "18px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 18,
              paddingBottom: 12, borderBottom: `1px solid ${B.border}` }}>
              Add New Card
            </div>

            <Field label="CARD NUMBER" err={errs.num}>
              <input className="bn-input" value={f.num}
                onChange={e => sf(p => ({ ...p, num: e.target.value }))}
                placeholder="1234 5678 9012 3456"/>
            </Field>
            <Field label="CARDHOLDER NAME" err={errs.name}>
              <input className="bn-input" value={f.name}
                onChange={e => sf(p => ({ ...p, name: e.target.value }))}
                placeholder="Name on card"/>
            </Field>
            <Field label="EXPIRY DATE" err={errs.exp}>
              <input className="bn-input" value={f.exp}
                onChange={e => sf(p => ({ ...p, exp: e.target.value }))}
                placeholder="MM/YY" style={{ width: "50%" }}/>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 4 }}>
              <button className="bn-btn-gold" onClick={add}>Save Card</button>
              <button className="bn-btn-ghost" onClick={() => { setAdding(false); se({}); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Info note */}
        <div style={{ padding: "11px 13px", background: B.card, borderRadius: 8,
          border: `1px solid ${B.border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: B.gold, fontSize: 13, marginTop: 1 }}>ℹ</span>
          <span style={{ fontSize: 11, color: B.textMid, lineHeight: 1.6 }}>
            Card details are encrypted and stored securely. We never share your payment information.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NotifSub — Notifications
══════════════════════════════════════════════════════════════ */
export function NotifSub({ back, userNotifs, onMarkRead }) {
  const [notifications, setNotifications] = useState(userNotifs || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      const sessionUser = localStorage.getItem("session");
      if (sessionUser) {
        try {
          const res = await fetch(`https://crypto-backend-production-11dc.up.railway.app/api/users/${sessionUser}/notifications`);
          const data = await res.json();
          if (Array.isArray(data)) setNotifications(data);
        } catch (err) { console.error(err); }
      }
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  const markAsRead = async (notifId) => {
    const sessionUser = localStorage.getItem("session");
    if (sessionUser) {
      try {
        await fetch(`https://crypto-backend-production-11dc.up.railway.app/api/users/${sessionUser}/notifications/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notifId }),
        });
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
        if (onMarkRead) onMarkRead();
      } catch (err) { console.error(err); }
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="bn-page" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", paddingBottom: 20 }}>
      <style>{BASE_CSS}</style>
      <BnHdr title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "All caught up"} back={back}/>

      <div style={{ padding: "14px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${B.border}`,
              borderTopColor: B.gold, borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 12, color: B.textMid }}>Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔔</div>
            <div style={{ fontSize: 13, color: B.textMid }}>No notifications yet</div>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <div key={notif.id}
              onClick={() => !notif.read && markAsRead(notif.id)}
              style={{
                background: notif.read ? B.card : "rgba(240,185,11,0.05)",
                borderRadius: 8, padding: "14px 15px", marginBottom: 9,
                border: `1px solid ${notif.read ? B.border : "rgba(240,185,11,0.2)"}`,
                cursor: notif.read ? "default" : "pointer",
                animation: `bnFadeUp 0.3s ease ${i * 0.05}s both`,
                position: "relative",
              }}>
              {!notif.read && (
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  width: 7, height: 7, borderRadius: "50%", background: B.gold,
                }}/>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: B.text, marginBottom: 5, paddingRight: 16 }}>
                {notif.title}
              </div>
              <div style={{ fontSize: 12, color: notif.read ? B.textMid : B.text, lineHeight: 1.55, marginBottom: 7 }}>
                {notif.body}
              </div>
              <div style={{ fontSize: 10, color: B.textDim }}>
                {new Date(notif.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LangSub — Language Selection
══════════════════════════════════════════════════════════════ */
export function LangSub({ back }) {
  const [sel, ss] = useState("English");
  const langs = [
    { l: "English",    flag: "🇺🇸" },
    { l: "Español",    flag: "🇪🇸" },
    { l: "Français",   flag: "🇫🇷" },
    { l: "Deutsch",    flag: "🇩🇪" },
    { l: "中文",        flag: "🇨🇳" },
    { l: "日本語",      flag: "🇯🇵" },
    { l: "العربية",    flag: "🇸🇦" },
    { l: "اردو",       flag: "🇵🇰" },
    { l: "हिंदी",      flag: "🇮🇳" },
    { l: "Português",  flag: "🇧🇷" },
  ];

  return (
    <div className="bn-page" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
      <style>{BASE_CSS}</style>
      <BnHdr title="Language" subtitle={`Selected: ${sel}`} back={back}/>
      <div style={{ padding: "16px 16px" }}>
        <div className="bn-card" style={{ padding: "4px 15px" }}>
          {langs.map((item, i) => (
            <div key={item.l} onClick={() => ss(item.l)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "13px 0",
              borderBottom: i < langs.length - 1 ? `1px solid ${B.border}` : "none",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{item.flag}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: sel === item.l ? 600 : 400,
                color: sel === item.l ? B.gold : B.text }}>
                {item.l}
              </span>
              {sel === item.l && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: B.gold, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, color: "#0b0e11", fontWeight: 700,
                }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TermsSub — Terms of Service
══════════════════════════════════════════════════════════════ */
export function TermsSub({ back }) {
  const sections = [
    { t: "1. Acceptance", b: "By using CoinBase you agree to these Terms of Service. Continued use of the platform constitutes your binding acceptance." },
    { t: "2. Risk Disclosure", b: "Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor. Only invest what you can afford to lose." },
    { t: "3. Account Security", b: "You are solely responsible for maintaining the confidentiality of your login credentials and all activity under your account." },
    { t: "4. Privacy Policy", b: "We handle your personal data per our Privacy Policy. Data is encrypted and never sold to third parties." },
    { t: "5. Account Termination", b: "CoinBase reserves the right to suspend or terminate accounts for violations of these terms without prior notice." },
  ];

  return (
    <div className="bn-page" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", paddingBottom: 20 }}>
      <style>{BASE_CSS}</style>
      <BnHdr title="Terms of Service" subtitle="Last updated Jan 2026" back={back}/>
      <div style={{ padding: "16px 16px" }}>

        {/* Header card */}
        <div style={{
          background: B.card2, borderRadius: 8, padding: "16px",
          marginBottom: 14, border: `1px solid ${B.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>📄</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: B.text }}>Coinbase AI-Quant</div>
            <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>Terms & Legal Agreements</div>
          </div>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="bn-card" style={{
            padding: "15px 16px", marginBottom: 9,
            animation: `bnFadeUp 0.3s ease ${i * 0.07}s both`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 5,
                background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: B.gold,
              }}>{i + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.text }}>{s.t}</div>
            </div>
            <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.75 }}>{s.b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EditSub — Edit Profile
══════════════════════════════════════════════════════════════ */
export function EditSub({ back, user, re }) {
  const [f, sf] = useState({ fn: user.fullName || "", ph: user.phone || "", co: user.country || "" });
  const [msg, sm] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const u = S.get();
    if (u) S.updateUser(u.username, { fullName: f.fn, phone: f.ph, country: f.co });
    try {
      const { updateUserInDB } = await import("../lib/api");
      if (u && typeof updateUserInDB === "function") {
        await updateUserInDB(u.username, { fullName: f.fn, phone: f.ph, country: f.co });
      }
    } catch (e) { console.error(e); }
    re();
    sm("Profile saved successfully");
    setSaving(false);
  };

  return (
    <div className="bn-page" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
      <style>{BASE_CSS}</style>
      <BnHdr title="Edit Profile" subtitle="Update your personal information" back={back}/>
      <div style={{ padding: "18px 16px" }}>

        {/* Avatar preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
          padding: "14px 16px", background: B.card, borderRadius: 8, border: `1px solid ${B.border}` }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: "linear-gradient(135deg,#1a2030,#243050)",
            border: `1.5px solid ${B.gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: B.gold,
          }}>
            {(f.fn || user.username || "U")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: B.text }}>{f.fn || user.username}</div>
            <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>@{user.username}</div>
          </div>
        </div>

        <div className="bn-card" style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 18,
            paddingBottom: 12, borderBottom: `1px solid ${B.border}` }}>
            Personal Information
          </div>

          <Field label="FULL NAME">
            <input className="bn-input" value={f.fn}
              onChange={e => sf(p => ({ ...p, fn: e.target.value }))}
              placeholder="Your full name"/>
          </Field>
          <Field label="PHONE NUMBER">
            <input className="bn-input" value={f.ph}
              onChange={e => sf(p => ({ ...p, ph: e.target.value }))}
              placeholder="+1 234 567 8900"/>
          </Field>
          <Field label="COUNTRY">
            <input className="bn-input" value={f.co}
              onChange={e => sf(p => ({ ...p, co: e.target.value }))}
              placeholder="Your country"/>
          </Field>

          {msg && <Alert type="s" msg={msg}/>}

          <button className="bn-btn-gold" onClick={save} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BinaryHistorySub
══════════════════════════════════════════════════════════════ */
export function BinaryHistorySub({ back, user, re }) {
  const [BinaryHistoryComponent, setBinaryHistoryComponent] = useState(null);

  useEffect(() => {
    import("../components/BinaryHistory").then(mod => {
      setBinaryHistoryComponent(() => mod.default);
    });
  }, []);

  if (!BinaryHistoryComponent) {
    return (
      <div className="bn-page" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{BASE_CSS}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${B.border}`,
            borderTopColor: B.gold, borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 12, color: B.textMid }}>Loading binary history...</div>
        </div>
      </div>
    );
  }

  return <BinaryHistoryComponent user={user} back={back}/>;
}