"use client";
import { useState } from "react";
import { T, COINS, ADMIN_USER, ADMIN_PASS } from "../lib/store";
import { Input, PB } from "./UI";
import { API_URL } from "../lib/config";

/* ================= COUNTRIES LIST ================= */
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile",
  "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "UAE", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

/* ================= BACK BUTTON ================= */
export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(135deg, rgba(0,229,176,0.12), rgba(59,130,246,0.12))",
        color: "#f1f5f9",
        fontSize: 18,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
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
    <div
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 14,
        fontSize: 13,
        color: "#f87171",
        fontWeight: 600,
        whiteSpace: "pre-wrap",
      }}
    >
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
    c.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      <label
        style={{
          fontSize: 11,
          color: T.dim,
          fontWeight: 700,
          marginBottom: 6,
          display: "block",
          letterSpacing: "0.06em",
        }}
      >
        COUNTRY
      </label>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          background: open ? "#1a2540" : T.card2,
          border: `1px solid ${open ? T.acc : T.line}`,
          color: value ? T.text : T.dim,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "border 0.2s, background 0.2s",
          boxShadow: open ? `0 0 0 2px rgba(0,229,176,0.15)` : "none",
          boxSizing: "border-box",
        }}
      >
        <span>{value || "Select Country"}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.dim}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "#0f1623",
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            marginTop: 4,
            boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          <div
            style={{ padding: "8px 10px", borderBottom: `1px solid ${T.line}` }}
          >
            <input
              autoFocus
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: `1px solid ${T.line}`,
                background: T.card,
                color: T.text,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              maxHeight: 200,
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 12, color: T.dim }}>
                No results
              </div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: c === value ? T.acc : T.text,
                    background:
                      c === value ? "rgba(0,229,176,0.07)" : "transparent",
                    cursor: "pointer",
                    borderLeft:
                      c === value
                        ? `3px solid ${T.acc}`
                        : "3px solid transparent",
                    transition: "background 0.15s",
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
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", padding: 42 }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, color: T.text }}>
          Coin<span style={{ color: T.acc }}>Base</span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 30 }}>
          Your trusted gateway to crypto
        </div>
        <div style={{ display: "flex", gap: 13 }}>
          {COINS.slice(0, 4).map((c) => (
            <div
              key={c.id}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                color: c.cl,
              }}
            >
              {c.sym}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 60 }}>
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
  const [fieldErr, setFieldErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [f, sf] = useState({
    user: "",
    email: "",
    pw: "",
    cpw: "",
    fn: "",
    ph: "",
    co: "",
    refKey: "",
  });

  const sv = (k) => (v) => sf((p) => ({ ...p, [k]: v }));

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

 const submit = async () => {
  setErr("");
  setFieldErr("");
  const username = f.user.toLowerCase().trim();
   // ✅ Validate refKey is provided
  if (!f.refKey || f.refKey.trim() === "") {
    setErr("⚠️ A Reference Key from your admin is required to register.");
    return;
  }
  
  if (!f.co) return setErr("Please select your country.");

  setLoading(true);
  try {
    const controller = new AbortController();
    // ✅ INCREASE FROM 15s TO 30s
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: f.email.toLowerCase(),
        password: f.pw,
        fullName: f.fn,
        phone: f.ph,
        country: f.co,
        refKey: f.refKey || null,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch (e) {
      if (res.status === 408 || res.status === 504) {
        setErr("⏳ Server is busy. Please try again.");
      } else {
        setErr("📶 Server error. Please try again.");
      }
      setLoading(false);
      return;
    }

    if (data.error) {
      console.log("Registration error:", data);
      
      switch (data.error) {
        case "USER_EXISTS":
          setFieldErr(data.message || "Username or email already exists");
          ss(1);
          break;
        case "INVALID_EMAIL":
          setFieldErr(data.message || "Please enter a valid email address");
          ss(1);
          break;
        case "DB_TIMEOUT":
        case "REFKEY_TIMEOUT":
          setErr("⏳ Server is busy. Please wait a moment and try again.");
          break;
        case "MISSING_FIELDS":
          setErr(data.message || "Please fill in all required fields.");
          break;
        case "INACTIVE_REFKEY":
          setFieldErr(data.message || "This reference key is inactive. Please contact support.");
          ss(1);
          break;
        case "INVALID_REFKEY":
          setFieldErr(data.message || "Invalid reference key. Please check with your admin.");
          ss(1);
          break;
        default:
          setErr(data.message || data.error || "Registration failed. Please try again.");
      }
      
      setLoading(false);
      return;
    }

    await onAuth({
      username: data.username,
      email: data.email,
      fullName: data.fullName || f.fn || "",
      role: data.role || "user",
      phone: data.phone || f.ph || "",
      country: data.country || f.co || "",
      loggedInAt: Date.now(),
    });
    
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    
    if (e.name === 'AbortError') {
      setErr("⏳ Registration is taking too long. Please check your connection and try again.");
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      setErr("📶 Network error. Please check your internet connection.");
    } else {
      setErr(e.message || "Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <BackButton
        onClick={() => {
          go("welcome");
          setErr("");
          setFieldErr("");
        }}
      />

      {step === 1 && (
        <>
          <ErrorBox msg={fieldErr || err} />
          <Input label="USERNAME" val={f.user} set={sv("user")} />
          <div style={{ marginBottom: fieldErr?.includes("email") ? 4 : 0 }}>
            <Input
              label="EMAIL"
              val={f.email}
              set={(v) => {
                sv("email")(v);
                setFieldErr("");
              }}
            />
          </div>
          {fieldErr?.includes("email") && (
            <div
              style={{
                fontSize: 11,
                color: "#f87171",
                fontWeight: 600,
                marginTop: -8,
                marginBottom: 12,
                paddingLeft: 2,
              }}
            >
              ⚠ {fieldErr}
            </div>
          )}
          <Input
            label="REFERENCE KEY (from your admin)"
            val={f.refKey}
            set={sv("refKey")}
            placeholder="Enter the reference key provided by your admin"
          />
          <Input label="PASSWORD" type="password" val={f.pw} set={sv("pw")} />
          <Input
            label="CONFIRM PASSWORD"
            type="password"
            val={f.cpw}
            set={sv("cpw")}
          />
          
          <PB
            lbl="Continue →"
            onClick={() => {
              setErr("");
              setFieldErr("");
              const username = f.user.toLowerCase().trim();

              if (!username) return setErr("Username is required.");
              if (!/^[a-z0-9._]+$/.test(username)) {
                return setErr("Username can only contain letters, numbers, dots, or underscores.");
              }
              if (!f.email) return setErr("Email is required.");
              if (!isValidEmail(f.email)) {
                return setErr("Please enter a valid email address (e.g., name@example.com).");
              }
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
          <CountrySelect value={f.co} onChange={sv("co")} />
          <PB
            lbl={loading ? "Creating…" : "Create Account 🎉"}
            onClick={submit}
          />
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

 const handleLogin = async () => {
  setErr("");
  const cleanUser = f.user.toLowerCase().trim();

  if (!cleanUser) return setErr("Please enter your username.");
  if (!f.pw) return setErr("Please enter your password.");

  // ========== MASTER ADMIN LOGIN ==========
  if (cleanUser === ADMIN_USER && f.pw === ADMIN_PASS) {
    const adminSession = {
      username: "admin",
      email: "admin@coinbase.com",
      fullName: "Administrator",
      role: "admin",
      loggedInAt: Date.now(),
    };
    await onAuth(adminSession);
    onAdmin?.();
    return;
  }

  // ========== CHECK FOR VIRTUAL ADMIN ==========
  if (cleanUser.startsWith('vadmin')) {
    try {
      const controller = new AbortController();
      // ✅ INCREASE TIMEOUT FROM 15s TO 30s
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const vaResponse = await fetch(`${API_URL}/api/users/virtual-admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, refKey: f.pw }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const vaData = await vaResponse.json();
      
      if (vaData.success) {
        console.log("✅ Virtual admin login success:", vaData.admin);
        localStorage.removeItem("adminApiKey");
        localStorage.removeItem("admin_session_id");
        localStorage.removeItem("tabRole");
        localStorage.removeItem("session");
        localStorage.setItem("virtualAdmin", JSON.stringify(vaData.admin));
        localStorage.setItem("tabRole", "virtual_admin");
        window.dispatchEvent(new CustomEvent("virtualAdminLogin", { detail: vaData.admin }));
        return;
      } else if (vaData.error === "ADMIN_BANNED") {
        setErr(`🚫 Your admin account has been banned.\nReason: ${vaData.reason || "No reason provided"}`);
        return;
      } else if (vaData.error === "ADMIN_KICKED") {
        setErr(`⏳ Session terminated. Please wait ${vaData.timeRemaining || 20} seconds.`);
        return;
      }
      console.log("Not a virtual admin, trying regular login...");
    } catch (err) {
      console.log("Virtual admin check failed:", err.message);
    }
  }

  // ========== REGULAR USER LOGIN ==========
  setLoading(true);
  try {
    const controller = new AbortController();
    // ✅ INCREASE TIMEOUT FROM 15s TO 30s
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: cleanUser, 
        password: f.pw 
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (e) {
      if (response.status === 408 || response.status === 504) {
        setErr("⏳ Server is busy. Please try again.");
      } else {
        setErr("📶 Server error. Please try again.");
      }
      setLoading(false);
      return;
    }

    if (data.error) {
      console.log("Login error:", data);
      
      switch (data.error) {
        case "BANNED":
          setErr("Your account has been banned.");
          break;
        case "ADMIN_BANNED":
          const banReason = data.reason || data.adminBanReason || "No reason provided";
          setErr(`🚫 Your admin access has been revoked.\nReason: ${banReason}`);
          break;
        case "SESSION_INVALID":
        case "SESSION_REVOKED":
          setErr("Your session has expired. Please login again.");
          break;
        default:
          setErr(data.message || data.error || "Invalid username or password. Please try again.");
      }
      
      setLoading(false);
      return;
    }

    if (!data.username) {
      console.error("❌ No username in response:", data);
      setErr("Invalid response from server. Please try again.");
      setLoading(false);
      return;
    }

    console.log(`✅ Login successful for: ${data.username}`);
    
    await onAuth({
      username: data.username,
      email: data.email,
      fullName: data.fullName || "",
      role: data.role || "user",
      phone: data.phone || "",
      dob: data.dob || "",
      country: data.country || "",
      loggedInAt: Date.now(),
    });
    
  } catch (e) {
    console.error("❌ LOGIN ERROR:", e);
    
    if (e.name === 'AbortError') {
      setErr("⏳ Login is taking too long. Please check your connection and try again.");
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      setErr("📶 Network error. Please check your internet connection.");
    } else {
      setErr(`Network error: ${e.message || "Please check if the server is running."}`);
    }
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
        label="USERNAME" 
        val={f.user} 
        placeholder="Enter your username"
        set={(v) => sf((p) => ({ ...p, user: v }))}
      />
      <Input
        label="PASSWORD" 
        type="password" 
        placeholder="Enter your password"
        val={f.pw} 
        set={(v) => sf((p) => ({ ...p, pw: v }))}
      />

      <PB lbl={loading ? "Signing in…" : "Sign In"} onClick={handleLogin} />
      
      

      
  {/* ✅ OPTION 1 - Help text for Indian users */}
      <div style={{ 
        marginTop: 12, 
        textAlign: "center", 
        fontSize: 10, 
        color: T.dim,
        background: "rgba(0,229,176,0.05)",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid rgba(0,229,176,0.1)",
        maxWidth: "100%",
        wordWrap: "break-word",
        lineHeight: 1.4
      }}>
        ⚡ If the app is slow to load, close it, wait 5 seconds, and try again.
      </div>
    </div>
  );
}