"use client";
import { useState } from "react";
import { T, S } from "../lib/store";
import { Input, PB, BHdr } from "../components/UI";

export function SecSub({ back }) {
  const [f, sf] = useState({ c: "", n: "", cn: "" });
  const [msg, sm] = useState(null);
  const go = () => {
    const u = S.get();
    // Check adminPassword (admin-set override) first, fall back to regular password
    const validPw = u?.adminPassword ?? u?.password;
    if (f.c !== validPw) {
      sm({ t: "e", m: "Wrong current password" });
      return;
    }
    if (f.n.length < 6) {
      sm({ t: "e", m: "Min 6 chars" });
      return;
    }
    if (f.n !== f.cn) {
      sm({ t: "e", m: "Don't match" });
      return;
    }
    // Use S.updateUser so the change persists to localStorage properly
    S.updateUser(u.username, { password: f.n, adminPassword: f.n });
    sm({ t: "s", m: "Updated!" });
    sf({ c: "", n: "", cn: "" });
  };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BHdr title="Security" back={back} />
      <div style={{ padding: "15px" }}>
        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "15px",
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.text,
              marginBottom: 11,
            }}
          >
            Change Password
          </div>
          <Input
            label="CURRENT"
            type="password"
            val={f.c}
            set={(v) => sf((p) => ({ ...p, c: v }))}
            ph="Current password"
          />
          <Input
            label="NEW"
            type="password"
            val={f.n}
            set={(v) => sf((p) => ({ ...p, n: v }))}
            ph="Min 6 chars"
          />
          <Input
            label="CONFIRM"
            type="password"
            val={f.cn}
            set={(v) => sf((p) => ({ ...p, cn: v }))}
            ph="Repeat"
          />
          {msg && (
            <div
              style={{
                fontSize: 11,
                color: msg.t === "s" ? T.green : T.red,
                marginBottom: 9,
              }}
            >
              {msg.t === "s" ? "✅" : "❌"} {msg.m}
            </div>
          )}
          <PB lbl="Update" onClick={go} />
        </div>
      </div>
    </div>
  );
}

export function CardSub({ back, user, re }) {
  const [cards, sc] = useState(user?.savedCards || []);
  const [f, sf] = useState({ num: "", name: "", exp: "" });
  const [errs, se] = useState({});

  const add = () => {
    const e = {};
    if (f.num.replace(/\s/g, "").length < 12) e.num = "Valid number";
    if (!f.name.trim()) e.name = "Required";
    if (!/^\d{2}\/\d{2}$/.test(f.exp)) e.exp = "MM/YY";
    se(e);
    if (Object.keys(e).length) return;
    const c = {
      ...f,
      display: "**** **** **** " + f.num.replace(/\s/g, "").slice(-4),
      id: Date.now(),
    };
    const up = [...cards, c];
    sc(up);
    const u = S.get();
    if (u) S.updateUser(u.username, { savedCards: up });
    re();
    sf({ num: "", name: "", exp: "" });
    se({});
  };

  const rm = (id) => {
    const up = cards.filter((c) => c.id !== id);
    sc(up);
    const u = S.get();
    if (u) S.updateUser(u.username, { savedCards: up });
    re();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BHdr title="Bank Cards" back={back} />
      <div style={{ padding: "15px" }}>
        {cards.map((c) => (
          <div
            key={c.id}
            style={{
              background: "linear-gradient(135deg,#0c2340,#1a3a5c)",
              borderRadius: 15,
              padding: "15px",
              marginBottom: 9,
              border: `1px solid ${T.line}`,
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              BANK CARD
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 3,
                marginBottom: 7,
              }}
            >
              {c.display}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                {c.name}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                Exp: {c.exp}
              </span>
            </div>
            <button
              onClick={() => rm(c.id)}
              style={{
                position: "absolute",
                top: 11,
                right: 11,
                background: "rgba(239,68,68,0.14)",
                border: "none",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 9,
                color: T.red,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "15px",
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.text,
              marginBottom: 11,
            }}
          >
            Add Card
          </div>
          <Input
            label="CARD NUMBER"
            val={f.num}
            set={(v) => sf((p) => ({ ...p, num: v }))}
            ph="1234 5678 9012 3456"
            err={errs.num}
          />
          <Input
            label="NAME"
            val={f.name}
            set={(v) => sf((p) => ({ ...p, name: v }))}
            ph="Cardholder name"
            err={errs.name}
          />
          <Input
            label="EXPIRY (MM/YY)"
            val={f.exp}
            set={(v) => sf((p) => ({ ...p, exp: v }))}
            ph="12/28"
            err={errs.exp}
          />
          <PB lbl="Add Card" onClick={add} />
        </div>
      </div>
    </div>
  );
}

export function NotifSub({ back }) {
  const [p, sp] = useState({ tr: true, dep: true, news: false, sec: true });
  const items = [
    { k: "tr", l: "Trade Alerts", d: "Order fills" },
    { k: "dep", l: "Deposits & Withdrawals", d: "Confirmations" },
    { k: "news", l: "Market News", d: "Breaking news" },
    { k: "sec", l: "Security Alerts", d: "Login changes" },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BHdr title="Notifications" back={back} />
      <div style={{ padding: "15px" }}>
        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "4px 13px",
            border: `1px solid ${T.line}`,
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.k}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 0",
                borderBottom:
                  i < items.length - 1 ? `1px solid ${T.line}` : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {item.l}
                </div>
                <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>
                  {item.d}
                </div>
              </div>
              <div
                onClick={() => sp((q) => ({ ...q, [item.k]: !q[item.k] }))}
                style={{
                  width: 42,
                  height: 22,
                  borderRadius: 11,
                  background: p[item.k] ? T.acc : T.line,
                  cursor: "pointer",
                  position: "relative",
                  transition: "background .2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 2,
                    left: p[item.k] ? 22 : 2,
                    transition: "left .2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LangSub({ back }) {
  const [sel, ss] = useState("English");
  const langs = [
    "English",
    "Español",
    "Français",
    "Deutsch",
    "中文",
    "日本語",
    "العربية",
    "اردو",
    "हिंदी",
    "Português",
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BHdr title="Language" back={back} />
      <div style={{ padding: "15px" }}>
        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "4px 13px",
            border: `1px solid ${T.line}`,
          }}
        >
          {langs.map((l, i) => (
            <div
              key={l}
              onClick={() => ss(l)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 0",
                borderBottom:
                  i < langs.length - 1 ? `1px solid ${T.line}` : "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: sel === l ? 700 : 400,
                  color: sel === l ? T.acc : T.text,
                }}
              >
                {l}
              </span>
              {sel === l && (
                <span style={{ color: T.acc, fontSize: 14 }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TermsSub({ back }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BHdr title="Terms of Service" back={back} />
      <div style={{ padding: "15px" }}>
        {[
          {
            t: "1. Acceptance",
            b: "By using CoinBase you agree to these Terms.",
          },
          {
            t: "2. Risk Disclosure",
            b: "Crypto trading involves substantial risk. Only invest what you can afford to lose.",
          },
          {
            t: "3. Account Security",
            b: "You are responsible for maintaining confidentiality of your credentials.",
          },
          { t: "4. Privacy", b: "We handle your data per our Privacy Policy." },
          {
            t: "5. Termination",
            b: "CoinBase may suspend accounts for violations without notice.",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: T.card,
              borderRadius: 12,
              padding: "13px",
              marginBottom: 8,
              border: `1px solid ${T.line}`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: T.acc,
                marginBottom: 5,
              }}
            >
              {s.t}
            </div>
            <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.7 }}>
              {s.b}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditSub({ back, user, re }) {
  const [f, sf] = useState({
    fn: user.fullName || "",
    ph: user.phone || "",
    co: user.country || "",
  });
  const [msg, sm] = useState("");
  const save = async () => {
    const u = S.get();
    if (u) {
      S.updateUser(u.username, { fullName: f.fn, phone: f.ph, country: f.co });
    }
    // Sync to DB
    try {
      const { updateUserInDB } = await import("../lib/api");
      if (u && typeof updateUserInDB === "function") {
        await updateUserInDB(u.username, { fullName: f.fn, phone: f.ph, country: f.co });
      }
    } catch (e) {
      console.error("Failed to sync profile to DB:", e);
    }
    re();
    sm("Saved!");
  };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <BHdr title="Edit Profile" back={back} />
      <div style={{ padding: "15px" }}>
        <div
          style={{
            background: T.card,
            borderRadius: 15,
            padding: "15px",
            border: `1px solid ${T.line}`,
          }}
        >
          <Input
            label="FULL NAME"
            val={f.fn}
            set={(v) => sf((p) => ({ ...p, fn: v }))}
            ph="Your name"
          />
          <Input
            label="PHONE"
            val={f.ph}
            set={(v) => sf((p) => ({ ...p, ph: v }))}
            ph="+1 234 567 8900"
          />
          <Input
            label="COUNTRY"
            val={f.co}
            set={(v) => sf((p) => ({ ...p, co: v }))}
            ph="Your country"
          />
          {msg && (
            <div style={{ fontSize: 11, color: T.green, marginBottom: 9 }}>
              ✅ {msg}
            </div>
          )}
          <PB lbl="Save Changes" onClick={save} />
        </div>
      </div>
    </div>
  );
}