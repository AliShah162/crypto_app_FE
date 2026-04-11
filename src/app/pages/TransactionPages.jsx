"use client";
import { useState } from "react";
import { T, S, usd } from "../lib/store";
import { Input, PB, BHdr } from "../components/UI";

export function DepositPage({ nav, onDeposit }) {
  const [step, ss] = useState(1);
  const [amt, sa] = useState("");
  const [card, sc] = useState({ num: "", name: "", exp: "", cvv: "" });
  const [errs, se] = useState({});
  const presets = [1000, 3000, 5000, 10000, 15000, 50000];

  const vc = () => {
    const e = {};
    if (card.num.replace(/\s/g, "").length < 12) e.num = "Valid card number";
    if (!card.name.trim()) e.name = "Required";
    if (!/^\d{2}\/\d{2}$/.test(card.exp)) e.exp = "MM/YY";
    if (card.cvv.length < 3) e.cvv = "Required";
    se(e);
    return !Object.keys(e).length;
  };

  if (step === 3)
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 11 }}>✅</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: T.text,
            marginBottom: 5,
          }}
        >
          Deposit Successful!
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 20 }}>
          <span style={{ color: T.acc, fontWeight: 700 }}>
            {usd(parseFloat(amt))}
          </span>{" "}
          added to balance
        </div>
        <PB
          lbl="Back to Home"
          onClick={() => {
            ss(1);
            sa("");
            sc({ num: "", name: "", exp: "", cvv: "" });
            nav("home");
          }}
        />
      </div>
    );

  if (step === 2)
    return (
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        <BHdr title="Card Payment" back={() => ss(1)} />
        <div style={{ padding: "13px 13px 0" }}>
          <div
            style={{
              background: "linear-gradient(135deg,#0c2340,#1a3a5c)",
              borderRadius: 16,
              padding: "17px 15px",
              marginBottom: 14,
              boxShadow: "0 5px 18px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: 2,
                marginBottom: 7,
              }}
            >
              PAYMENT CARD
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 3,
                marginBottom: 11,
              }}
            >
              {card.num || "•••• •••• •••• ••••"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {card.name || "CARDHOLDER"}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {card.exp || "MM/YY"}
              </span>
            </div>
          </div>
          <div
            style={{
              background: T.card,
              borderRadius: 13,
              padding: "14px 13px",
              marginBottom: 11,
              border: `1px solid ${T.line}`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.text,
                marginBottom: 2,
              }}
            >
              Deposit Amount
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: T.acc,
                marginBottom: 12,
              }}
            >
              {usd(parseFloat(amt) || 0)}
            </div>
            <Input
              label="CARD NUMBER"
              val={card.num}
              set={(v) => sc((p) => ({ ...p, num: v }))}
              ph="1234 5678 9012 3456"
              err={errs.num}
            />
            <Input
              label="CARDHOLDER NAME"
              val={card.name}
              set={(v) => sc((p) => ({ ...p, name: v.toUpperCase() }))}
              ph="NAME ON CARD"
              err={errs.name}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <Input
                label="EXPIRY"
                val={card.exp}
                set={(v) => sc((p) => ({ ...p, exp: v }))}
                ph="12/28"
                err={errs.exp}
              />
              <Input
                label="CVV"
                type="password"
                val={card.cvv}
                set={(v) => sc((p) => ({ ...p, cvv: v }))}
                ph="•••"
                err={errs.cvv}
              />
            </div>
          </div>
          <PB
            lbl="Confirm Payment"
            onClick={() => {
              if (vc()) {
                onDeposit(parseFloat(amt));
                ss(3);
              }
            }}
          />
        </div>
      </div>
    );

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
      <BHdr title="Deposit" back={() => nav("home")} />
      <div style={{ padding: "13px 13px 0" }}>
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 11,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 7,
            }}
          >
            PAYMENT METHOD
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {["Credit Card", "Debit Card", "UPI"].map((m, i) => (
              <div
                key={m}
                style={{
                  flex: 1,
                  background: i === 0 ? "rgba(0,229,176,0.09)" : T.card2,
                  border: `1.5px solid ${i === 0 ? T.acc : T.line}`,
                  borderRadius: 9,
                  padding: "7px 0",
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: i === 0 ? T.acc : T.dim,
                  cursor: "pointer",
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "15px 13px",
            marginBottom: 11,
            border: `1px solid ${T.line}`,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: T.text,
                marginBottom: 3,
              }}
            >
              Deposit Amount
            </div>
            <div style={{ fontSize: 11, color: T.dim }}>
              Choose preset or enter custom
            </div>
          </div>
          <input
            type="number"
            value={amt}
            onChange={(e) => sa(e.target.value)}
            placeholder="Enter amount (USD)"
            style={{
              width: "100%",
              background: T.card2,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "12px 13px",
              fontSize: 17,
              color: T.text,
              outline: "none",
              textAlign: "center",
              marginBottom: 11,
              fontFamily: "inherit",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 7,
            }}
          >
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => sa(String(p))}
                style={{
                  background:
                    amt === String(p) ? "rgba(0,229,176,0.09)" : T.card2,
                  border: `1.5px solid ${amt === String(p) ? T.acc : T.line}`,
                  borderRadius: 9,
                  padding: "8px 0",
                  fontSize: 11,
                  fontWeight: 600,
                  color: amt === String(p) ? T.acc : T.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {p >= 1000 ? `$${p / 1000}K` : p}
              </button>
            ))}
          </div>
        </div>
        <PB
          lbl="Continue to Payment →"
          onClick={() => {
            if (amt && parseInt(amt) > 0) ss(2);
          }}
          dis={!amt || parseInt(amt) <= 0}
        />
      </div>
    </div>
  );
}

export function WithdrawPage({ nav, onWithdraw, user }) {
  const [step, ss] = useState(1);
  const [cards, sc] = useState(user?.savedCards || []);
  const [selC, ssel] = useState(null);
  const [amt, sa] = useState("");
  const [pw, spw] = useState("");
  const [errs, se] = useState({});
  const [nc, snc] = useState({ num: "", name: "", exp: "" });
  const [adding, sad] = useState(false);
  const bal = S.get()?.balance || 0;

  const saveCard = () => {
    const e = {};
    if (nc.num.replace(/\s/g, "").length < 12) e.num = "Valid card number";
    if (!nc.name.trim()) e.name = "Required";
    if (!/^\d{2}\/\d{2}$/.test(nc.exp)) e.exp = "MM/YY";
    se(e);
    if (Object.keys(e).length) return;
    const c = {
      ...nc,
      display: "**** **** **** " + nc.num.replace(/\s/g, "").slice(-4),
      id: Date.now(),
    };
    const up = [...cards, c];
    sc(up);
    const u = S.get();
    if (u) u.savedCards = up;
    ssel(c);
    snc({ num: "", name: "", exp: "" });
    sad(false);
    se({});
  };

  const confirm = () => {
    const e = {};
    if (!selC) e.card = "Link a bank card first";
    const a = parseFloat(amt);
    if (!amt || isNaN(a) || a <= 0) e.amt = "Enter valid amount";
    else if (a > bal) e.amt = `Exceeds balance (${usd(bal)})`;
    if (!pw) e.pw = "Required";
    else {
      const u = S.get();
      if (u && pw !== u.password) e.pw = "Incorrect password";
    }
    se(e);
    if (Object.keys(e).length) return;
    onWithdraw(parseFloat(amt));
    ss(2);
  };

  if (step === 2)
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 30,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 11 }}>🏦</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: T.text,
            marginBottom: 5,
          }}
        >
          Withdrawal Requested
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>
          Withdrawing{" "}
          <span style={{ color: T.red, fontWeight: 700 }}>
            {usd(parseFloat(amt))}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 20 }}>
          Funds arrive in 1-3 business days
        </div>
        <PB
          lbl="Back to Home"
          onClick={() => {
            ss(1);
            sa("");
            spw("");
            nav("home");
          }}
        />
      </div>
    );

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
      <BHdr title="Withdraw" back={() => nav("home")} />
      <div style={{ padding: "13px 13px 0" }}>
        {/* Card section */}
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 11,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 9,
            }}
          >
            WITHDRAW TO
          </div>
          {cards.length === 0 && !adding && (
            <div
              onClick={() => sad(true)}
              style={{
                border: `1.5px dashed ${T.line}`,
                borderRadius: 10,
                padding: "11px 0",
                textAlign: "center",
                fontSize: 12,
                color: T.dim,
                cursor: "pointer",
              }}
            >
              ＋ Link a bank card
            </div>
          )}
          {cards.map((c) => (
            <div
              key={c.id}
              onClick={() => ssel(c)}
              style={{
                background:
                  selC?.id === c.id ? "rgba(0,229,176,0.07)" : T.card2,
                border: `1.5px solid ${selC?.id === c.id ? T.acc : T.line}`,
                borderRadius: 10,
                padding: "9px 12px",
                marginBottom: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                  {c.display}
                </div>
                <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>
                  {c.name}
                </div>
              </div>
              {selC?.id === c.id && (
                <span style={{ color: T.acc, fontSize: 14 }}>✓</span>
              )}
            </div>
          ))}
          {cards.length > 0 && !adding && (
            <div
              onClick={() => sad(true)}
              style={{
                textAlign: "center",
                fontSize: 11,
                color: T.acc,
                cursor: "pointer",
                fontWeight: 700,
                marginTop: 6,
              }}
            >
              ＋ Add another card
            </div>
          )}
          {adding && (
            <div
              style={{
                background: T.card2,
                borderRadius: 10,
                padding: "11px",
                marginTop: 6,
                border: `1px solid ${T.line}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.text,
                  marginBottom: 9,
                }}
              >
                Add Card
              </div>
              <Input
                label="CARD NUMBER"
                val={nc.num}
                set={(v) => snc((p) => ({ ...p, num: v }))}
                ph="1234 5678 9012 3456"
                err={errs.num}
              />
              <Input
                label="NAME"
                val={nc.name}
                set={(v) => snc((p) => ({ ...p, name: v }))}
                ph="Name on card"
                err={errs.name}
              />
              <Input
                label="EXPIRY (MM/YY)"
                val={nc.exp}
                set={(v) => snc((p) => ({ ...p, exp: v }))}
                ph="12/28"
                err={errs.exp}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <PB lbl="Save" onClick={saveCard} sm />
                <PB
                  lbl="Cancel"
                  onClick={() => {
                    sad(false);
                    se({});
                  }}
                  ghost
                  sm
                />
              </div>
            </div>
          )}
          {errs.card && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>
              {errs.card}
            </div>
          )}
        </div>
        {/* Amount */}
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 11,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 9,
            }}
          >
            AMOUNT
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={amt}
              onChange={(e) => sa(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: "100%",
                background: T.card2,
                border: `1.5px solid ${errs.amt ? T.red : T.line}`,
                borderRadius: 10,
                padding: "11px 60px 11px 12px",
                fontSize: 13,
                color: T.text,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span
              onClick={() => sa(String(Math.floor(bal)))}
              style={{
                position: "absolute",
                right: 11,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                fontWeight: 800,
                color: T.blue,
                cursor: "pointer",
              }}
            >
              MAX
            </span>
          </div>
          {errs.amt && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 3 }}>
              {errs.amt}
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              color: T.dim,
              marginTop: 6,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Available</span>
            <strong style={{ color: T.text }}>{usd(bal)}</strong>
          </div>
        </div>
        {/* Password */}
        <div
          style={{
            background: T.card,
            borderRadius: 13,
            padding: "13px",
            marginBottom: 16,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.dim,
              letterSpacing: 1,
              marginBottom: 9,
            }}
          >
            TRANSACTION PASSWORD
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => spw(e.target.value)}
            placeholder="Your account password"
            style={{
              width: "100%",
              background: T.card2,
              border: `1.5px solid ${errs.pw ? T.red : T.line}`,
              borderRadius: 10,
              padding: "11px 12px",
              fontSize: 13,
              color: T.text,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          {errs.pw && (
            <div style={{ fontSize: 10, color: T.red, marginTop: 3 }}>
              {errs.pw}
            </div>
          )}
        </div>
        <PB lbl="Confirm Withdrawal" onClick={confirm} />
      </div>
    </div>
  );
}
