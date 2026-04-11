"use client";
import { useState } from "react";
import { T, S, COINS, ADMIN_USER, ADMIN_PASS } from "../lib/store";
import { Input, PB, EyeBtn } from "./UI";

export function WelcomeScreen({ go }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "42px 22px 36px",
      }}
    >
      <style>{`
        @keyframes pb{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes fl{0%{transform:translateY(0)}100%{transform:translateY(-9px)}}
      `}</style>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 96,
            height: 96,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,rgba(0,229,176,0.18),rgba(59,130,246,0.18))",
              border: `1.5px solid ${T.acc}`,
              animation: "pb 2.6s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            ₿
          </div>
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: T.text,
            letterSpacing: "-1px",
            marginBottom: 7,
            textAlign: "center",
          }}
        >
          Coin
          <span
            style={{
              background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Base
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: T.dim,
            marginBottom: 30,
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 210,
          }}
        >
          Your trusted gateway to the global crypto economy
        </div>
        <div style={{ display: "flex", gap: 13, marginBottom: 28 }}>
          {COINS.slice(0, 4).map((c, i) => (
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
                border: `1px solid ${T.line}`,
                animation: `fl ${2.1 + i * 0.3}s ease-in-out infinite alternate`,
              }}
            >
              {c.sym}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <PB lbl="Create Account" onClick={() => go("signup")} />
        <PB lbl="Sign In" onClick={() => go("login")} ghost />
        <div
          style={{
            fontSize: 10,
            color: T.dim,
            textAlign: "center",
            marginTop: 2,
          }}
        >
          By continuing you agree to our{" "}
          <span style={{ color: T.acc }}>Terms</span> &{" "}
          <span style={{ color: T.acc }}>Privacy</span>
        </div>
      </div>
    </div>
  );
}

export function SignupScreen({ go, onAuth }) {
  const [step, ss] = useState(1);
  const [f, sf] = useState({
    user: "",
    email: "",
    pw: "",
    cpw: "",
    fn: "",
    ph: "",
    dob: "",
    co: "",
  });
  const [errs, se] = useState({});
  const [spw, ssp] = useState(false);
  const [scp, ssc] = useState(false);
  const sv = (k) => (v) => sf((p) => ({ ...p, [k]: v }));

  const v1 = () => {
    const e = {};
    if (!f.user.trim()) e.user = "Required";
    else if (f.user.length < 3) e.user = "Min 3 chars";
    else if (f.user.toLowerCase() === ADMIN_USER) e.user = "Reserved username";
    else if (S.users[f.user.toLowerCase()]) e.user = "Username taken ✗";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      e.email = "Valid email needed";
    if (f.pw.length < 6) e.pw = "Min 6 chars";
    if (f.pw !== f.cpw) e.cpw = "Don't match";
    se(e);
    return !Object.keys(e).length;
  };
  const v2 = () => {
    const e = {};
    if (!f.fn.trim()) e.fn = "Required";
    if (!/^\+?[\d\s\-]{7,15}$/.test(f.ph)) e.ph = "Valid phone";
    if (!f.dob) e.dob = "Required";
    if (!f.co.trim()) e.co = "Required";
    se(e);
    return !Object.keys(e).length;
  };
  const submit = () => {
    if (!v2()) return;
    const u = {
      username: f.user.toLowerCase(),
      email: f.email,
      password: f.pw,
      fullName: f.fn,
      phone: f.ph,
      dob: f.dob,
      country: f.co,
      balance: 0,
      transactions: [],
      holdings: {},
      savedCards: [],
    };
    S.addUser(f.user.toLowerCase(), u);
    S.setSession(f.user.toLowerCase());
    onAuth(u);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "20px 19px 0" }}>
        <button
          onClick={() => (step === 2 ? ss(1) : go("welcome"))}
          style={{
            background: "none",
            border: "none",
            color: T.text,
            fontSize: 20,
            cursor: "pointer",
            padding: 0,
            marginBottom: 16,
          }}
        >
          ←
        </button>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 21,
              fontWeight: 900,
              color: T.text,
              marginBottom: 3,
            }}
          >
            Create Account
          </div>
          <div style={{ fontSize: 11, color: T.dim }}>
            Step {step}/2 — {step === 1 ? "Credentials" : "Personal details"}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
            {[1, 2].map((n) => (
              <div
                key={n}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  background: n <= step ? T.acc : T.line,
                  transition: "background .3s",
                }}
              />
            ))}
          </div>
        </div>
        {step === 1 && (
          <>
            <Input
              label="USERNAME"
              val={f.user}
              set={sv("user")}
              ph="Unique username (min 3)"
              err={errs.user}
            />
            <Input
              label="EMAIL"
              type="email"
              val={f.email}
              set={sv("email")}
              ph="your@email.com"
              err={errs.email}
            />
            <Input
              label="PASSWORD"
              type={spw ? "text" : "password"}
              val={f.pw}
              set={sv("pw")}
              ph="Min 6 chars"
              err={errs.pw}
              right={<EyeBtn show={spw} tog={() => ssp((x) => !x)} />}
            />
            <Input
              label="CONFIRM PASSWORD"
              type={scp ? "text" : "password"}
              val={f.cpw}
              set={sv("cpw")}
              ph="Repeat password"
              err={errs.cpw}
              right={<EyeBtn show={scp} tog={() => ssc((x) => !x)} />}
            />
            <div style={{ marginBottom: 14 }}>
              <PB
                lbl="Continue →"
                onClick={() => {
                  if (v1()) {
                    se({});
                    ss(2);
                  }
                }}
              />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <Input
              label="FULL NAME"
              val={f.fn}
              set={sv("fn")}
              ph="Legal name"
              err={errs.fn}
            />
            <Input
              label="PHONE"
              type="tel"
              val={f.ph}
              set={sv("ph")}
              ph="+1 234 567 8900"
              err={errs.ph}
            />
            <Input
              label="DATE OF BIRTH"
              type="date"
              val={f.dob}
              set={sv("dob")}
              err={errs.dob}
            />
            <Input
              label="COUNTRY"
              val={f.co}
              set={sv("co")}
              ph="e.g. United States"
              err={errs.co}
            />
            <div style={{ marginBottom: 14 }}>
              <PB lbl="Create My Account 🎉" onClick={submit} />
            </div>
          </>
        )}
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: T.dim,
            paddingBottom: 22,
          }}
        >
          Have an account?{" "}
          <span
            onClick={() => go("login")}
            style={{ color: T.acc, cursor: "pointer", fontWeight: 700 }}
          >
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoginScreen({ go, onAuth, onAdmin }) {
  const [f, sf] = useState({ user: "", pw: "" });
  const [errs, se] = useState({});
  const [sp, ssp] = useState(false);

  const go2 = () => {
    const e = {};
    if (!f.user.trim()) e.user = "Required";
    if (!f.pw) e.pw = "Required";
    if (Object.keys(e).length) {
      se(e);
      return;
    }
    if (f.user.toLowerCase() === ADMIN_USER && f.pw === ADMIN_PASS) {
      onAdmin();
      return;
    }
    const u = S.users[f.user.toLowerCase()];
    if (!u) {
      se({ user: "No account found" });
      return;
    }
    if (u.password !== f.pw) {
      se({ pw: "Incorrect password" });
      return;
    }
    if (S.banned.has(f.user.toLowerCase())) {
      se({ user: "Account suspended. Contact support." });
      return;
    }
    S.session = f.user.toLowerCase();
    onAuth(u);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 19px",
      }}
    >
      <button
        onClick={() => go("welcome")}
        style={{
          background: "none",
          border: "none",
          color: T.text,
          fontSize: 20,
          cursor: "pointer",
          padding: 0,
          marginBottom: 24,
          alignSelf: "flex-start",
        }}
      >
        ←
      </button>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 25,
            fontWeight: 900,
            color: T.text,
            marginBottom: 4,
          }}
        >
          Welcome Back 👋
        </div>
        <div style={{ fontSize: 12, color: T.dim }}>
          Sign in to your CoinBase account
        </div>
      </div>
      <Input
        label="USERNAME"
        val={f.user}
        set={(v) => sf((p) => ({ ...p, user: v }))}
        ph="Your username"
        err={errs.user}
      />
      <Input
        label="PASSWORD"
        type={sp ? "text" : "password"}
        val={f.pw}
        set={(v) => sf((p) => ({ ...p, pw: v }))}
        ph="Your password"
        err={errs.pw}
        right={<EyeBtn show={sp} tog={() => ssp((x) => !x)} />}
      />
      <div style={{ textAlign: "right", marginBottom: 17, marginTop: -5 }}>
        <span
          style={{
            fontSize: 10,
            color: T.acc,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Forgot password?
        </span>
      </div>
      <PB lbl="Sign In" onClick={go2} />
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: T.dim,
          marginTop: 17,
        }}
      >
        No account?{" "}
        <span
          onClick={() => go("signup")}
          style={{ color: T.acc, cursor: "pointer", fontWeight: 700 }}
        >
          Create one
        </span>
      </div>
    </div>
  );
}
