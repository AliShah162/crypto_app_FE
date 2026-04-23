"use client";
import { useState } from "react";
import { T, S, COINS, ADMIN_USER, ADMIN_PASS } from "../lib/store";
import { Input, PB } from "./UI";
import { registerUser, loginUser } from "../lib/api";

/* ================= COUNTRIES LIST ================= */
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba",
  "Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro",
  "Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand",
  "Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan",
  "Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain",
  "Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan",
  "Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","UAE","United Kingdom",
  "United States","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen",
  "Zambia","Zimbabwe",
];

/* ================= BACK BUTTON ================= */

export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg, rgba(0,229,176,0.12), rgba(59,130,246,0.12))",
        color: "#f1f5f9", fontSize: 18, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18, boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      ←
    </button>
  );
}

/* ================= ERROR BOX ================= */

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
      borderRadius: 10, padding: "10px 14px", marginBottom: 14,
      fontSize: 13, color: "#f87171", fontWeight: 600,
    }}>
      ⚠ {msg}
    </div>
  );
}

/* ================= AGE CHECK ================= */
function isAtLeast18(dobString) {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const today = new Date();
  const age18 = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return today >= age18;
}

/* ================= COUNTRY SELECT ================= */
function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      <label style={{
        fontSize: 11, color: T.dim, fontWeight: 700,
        marginBottom: 6, display: "block", letterSpacing: "0.06em",
      }}>
        COUNTRY
      </label>

      {/* Trigger button */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", padding: "12px 14px",
          borderRadius: 12,
          background: open ? "#1a2540" : T.card2,
          border: `1px solid ${open ? T.acc : T.line}`,
          color: value ? T.text : T.dim,
          fontSize: 13, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "border 0.2s, background 0.2s",
          boxShadow: open ? `0 0 0 2px rgba(0,229,176,0.15)` : "none",
          boxSizing: "border-box",
        }}
      >
        <span>{value || "Select Country"}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: "#0f1623", border: `1px solid ${T.line}`,
          borderRadius: 12, marginTop: 4,
          boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}>
          {/* Search box inside dropdown */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.line}` }}>
            <input
              autoFocus
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px",
                borderRadius: 8, border: `1px solid ${T.line}`,
                background: T.card, color: T.text,
                fontSize: 12, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 200, overflowY: "auto", scrollbarWidth: "none" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 12, color: T.dim }}>
                No results
              </div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c}
                  onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                  style={{
                    padding: "10px 14px", fontSize: 13,
                    color: c === value ? T.acc : T.text,
                    background: c === value ? "rgba(0,229,176,0.07)" : "transparent",
                    cursor: "pointer",
                    borderLeft: c === value ? `3px solid ${T.acc}` : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (c !== value) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (c !== value) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {c}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= WELCOME ================= */

export function WelcomeScreen({ go }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 42 }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
      }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: T.text }}>
          Coin<span style={{ color: T.acc }}>Base</span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 30 }}>
          Your trusted gateway to crypto
        </div>
        <div style={{ display: "flex", gap: 13 }}>
          {COINS.slice(0, 4).map((c) => (
            <div key={c.id} style={{
              width: 40, height: 40, borderRadius: "50%", background: c.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, color: c.cl,
            }}>
              {c.sym}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <PB lbl="Create Account" onClick={() => go("signup")} />
        <PB lbl="Sign In" onClick={() => go("login")} ghost />
      </div>
    </div>
  );
}

/* ================= SIGNUP ================= */

export function SignupScreen({ go, onAuth }) {
  const [step, ss] = useState(1);
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState(""); // ✅ inline field-level error (email duplicate)
  const [loading, setLoading] = useState(false);
  const [f, sf] = useState({
    user: "", email: "", pw: "", cpw: "",
    fn: "", ph: "", dob: "", co: "",
  });
  const sv = (k) => (v) => sf((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr("");
    setFieldErr("");
    const username = f.user.toLowerCase().trim();

    if (!f.dob) return setErr("Date of birth is required.");
    if (!isAtLeast18(f.dob))
      return setErr("You must be at least 18 years old to use this app.");
    if (!f.co) return setErr("Please select your country.");

    setLoading(true);
    try {
      const res = await registerUser({
        username,
        email: f.email.toLowerCase(),
        password: f.pw,
        fullName: f.fn,
        phone: f.ph,
        dob: f.dob,
        country: f.co,
      });

      if (!res || res.error) {
        const msg = res?.error || "Registration failed. Please try again.";

        // ✅ If it's an email duplicate error, go back to step 1 and show it inline
        if (msg.toLowerCase().includes("email")) {
          ss(1);
          setFieldErr(msg);
          return;
        }

        setErr(msg);
        return;
      }

      onAuth({
        username: res.username,
        email: res.email,
        fullName: res.fullName || f.fn || "",
        role: res.role || "user",
        phone: res.phone || f.ph || "",
        dob: res.dob || f.dob || "",
        country: res.country || f.co || "",
        loggedInAt: Date.now(),
      });
    } catch (e) {
      setErr("Network error. Please check your connection.");
      console.error("SIGNUP ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
      <BackButton onClick={() => { go("welcome"); setErr(""); setFieldErr(""); }} />

      {step === 1 && (
        <>
          <ErrorBox msg={fieldErr || err} />
          <Input label="USERNAME" val={f.user} set={sv("user")} />

          {/* Email with inline error below the field */}
          <div style={{ marginBottom: fieldErr ? 4 : 0 }}>
            <Input label="EMAIL" val={f.email} set={(v) => { sv("email")(v); setFieldErr(""); }} />
          </div>
          {fieldErr && (
            <div style={{
              fontSize: 11, color: "#f87171", fontWeight: 600,
              marginTop: -8, marginBottom: 12, paddingLeft: 2,
            }}>
              ⚠ {fieldErr}
            </div>
          )}

          <Input label="PASSWORD" type="password" val={f.pw} set={sv("pw")} />
          <Input label="CONFIRM PASSWORD" type="password" val={f.cpw} set={sv("cpw")} />
          <PB
            lbl="Continue →"
            onClick={() => {
              setErr(""); setFieldErr("");
              const username = f.user.toLowerCase().trim();

              if (!username) return setErr("Username is required.");
              if (!/^[a-z0-9._]+$/.test(username))
                return setErr("Username can only contain letters, numbers, dots, or underscores.");
              if (!f.email) return setErr("Email is required.");
              if (!f.pw) return setErr("Password is required.");
              if (f.pw !== f.cpw) return setErr("Passwords do not match.");
              if (f.pw.length < 6) return setErr("Password must be at least 6 characters.");
              ss(2);
            }}
          />
        </>
      )}

      {step === 2 && (
        <>
          <ErrorBox msg={err} />
          <Input label="FULL NAME" val={f.fn} set={sv("fn")} />
          <Input label="PHONE" val={f.ph} set={sv("ph")} />
          <Input label="DOB" type="date" val={f.dob} set={sv("dob")} />

          {/* ✅ New styled country selector with search */}
          <CountrySelect value={f.co} onChange={sv("co")} />

          <PB lbl={loading ? "Creating…" : "Create Account 🎉"} onClick={submit} />
        </>
      )}
    </div>
  );
}

/* ================= LOGIN ================= */

export function LoginScreen({ go, onAuth, onAdmin }) {
  const [f, sf] = useState({ user: "", pw: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go2 = async () => {
    setErr("");
    const cleanUser = f.user.toLowerCase().trim();

    if (!cleanUser) return setErr("Please enter your username.");
    if (!f.pw) return setErr("Please enter your password.");

    // ── ADMIN ──
    if (cleanUser === ADMIN_USER && f.pw === ADMIN_PASS) {
      const adminSession = {
        username: "admin",
        email: "admin@coinbase.com",
        fullName: "Administrator",
        role: "admin",
        loggedInAt: Date.now(),
      };

      if (!S.users["admin"]) {
        S.users["admin"] = {
          username: "admin", email: "admin@coinbase.com",
          fullName: "Administrator", role: "admin",
          balance: 0, creditScore: 100,
          transactions: [], holdings: {}, savedCards: [],
        };
        if (typeof window !== "undefined") {
saveLS("users", S.users);        }
      }

      onAuth(adminSession);
      onAdmin?.();
      return;
    }

    if (S.banned?.includes(cleanUser)) {
      return setErr("Your account has been banned.");
    }

    if (cleanUser === ADMIN_USER && f.pw !== ADMIN_PASS) {
      return setErr("Incorrect admin password.");
    }

    // ── Check if admin has overridden this user's password in localStorage ──
    // Admin panel saves the new password to localStorage under user.password and
    // user.adminPassword. If either exists, we must validate against it FIRST
    // before the backend (which still has the old password).
    try {
const localUsers = loadLS("users", {});
      const localUser  = localUsers[cleanUser];
      if (localUser) {
        // Prefer adminPassword (set by admin panel); fall back to password field
        const overridePw = localUser.adminPassword ?? localUser.password ?? null;
        if (overridePw !== null) {
          // An override exists — validate locally, skip backend password check
          if (f.pw !== overridePw) {
            return setErr("Incorrect password. Please try again.");
          }
          // Password matches — proceed to backend only for user data, not auth
          setLoading(true);
          try {
            const res = await loginUser({ username: cleanUser, password: overridePw });
            // Even if backend rejects (old pw mismatch), we trust local override
            const userData = (!res || res.error) ? localUser : res;
            onAuth({
              username: userData.username || cleanUser,
              email: userData.email || localUser.email || "",
              fullName: userData.fullName || localUser.fullName || "",
              role: userData.role || localUser.role || "user",
              phone: userData.phone || localUser.phone || "",
              dob: userData.dob || localUser.dob || "",
              country: userData.country || localUser.country || "",
              loggedInAt: Date.now(),
            });
          } catch {
            // Backend unreachable — still allow login with local data
            onAuth({
              username: localUser.username || cleanUser,
              email: localUser.email || "",
              fullName: localUser.fullName || "",
              role: localUser.role || "user",
              phone: localUser.phone || "",
              dob: localUser.dob || "",
              country: localUser.country || "",
              loggedInAt: Date.now(),
            });
          } finally {
            setLoading(false);
          }
          return;
        }
      }
    } catch {
      // localStorage unavailable — fall through to normal backend login
    }

    // ── Normal backend login (no local override) ──
    setLoading(true);
    try {
      const res = await loginUser({ username: cleanUser, password: f.pw });

      if (!res) return setErr("No response from server. Please try again.");
      if (res.error) {
        const msg = typeof res.error === "string" ? res.error : "";
        if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no user"))
          return setErr("Account not found. Please check your username.");
        if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("invalid"))
          return setErr("Incorrect password. Please try again.");
        return setErr(msg || "Login failed. Please check your credentials.");
      }

      onAuth({
        username: res.username,
        email: res.email,
        fullName: res.fullName || "",
        role: res.role || "user",
        phone: res.phone || "",
        dob: res.dob || "",
        country: res.country || "",
        loggedInAt: Date.now(),
      });
    } catch (e) {
      setErr("Network error. Please check your connection.");
      console.error("LOGIN ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      justifyContent: "center", padding: 22,
    }}>
      <BackButton onClick={() => { go("welcome"); setErr(""); }} />

      <div style={{ fontSize: 25, fontWeight: 900, color: T.text, marginBottom: 24 }}>
        Welcome Back 👋
      </div>

      <ErrorBox msg={err} />
      <Input
        label="USERNAME" val={f.user} placeholder="Enter your username"
        set={(v) => sf((p) => ({ ...p, user: v }))}
      />
      <Input
        label="PASSWORD" type="password" placeholder="Enter your password"
        val={f.pw} set={(v) => sf((p) => ({ ...p, pw: v }))}
      />

      <PB lbl={loading ? "Signing in…" : "Sign In"} onClick={go2} />
    </div>
  );
}