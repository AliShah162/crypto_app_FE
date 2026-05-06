"use client";
import { useState, useEffect } from "react";
import { T, S, usd } from "../lib/store";
import { Input, PB, BHdr } from "../components/UI";
import { withdrawFunds, saveCardToBackend } from "../lib/api";
import { addUserNotification } from "../lib/notifications";
import { API_URL } from "../lib/config";

/* ── Binance Design Tokens ─────────────────────────────────── */
const B = {
  bg: "#0b0e11",
  surface: "#0f1217",
  card: "#161a21",
  card2: "#1c2130",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(240,185,11,0.3)",
  gold: "#f0b90b",
  goldDim: "rgba(240,185,11,0.4)",
  green: "#0ecb81",
  red: "#f6465d",
  blue: "#1890ff",
  text: "#eaecef",
  textMid: "#848e9c",
  textDim: "#474d57",
};

const TXN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; }
  .txn-page { font-family: 'IBM Plex Sans', sans-serif; background: ${B.bg}; color: ${B.text}; }
  .txn-card {
    background: ${B.card};
    border: 1px solid ${B.border};
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .txn-card:hover {
    border-color: ${B.borderHover};
  }
  .txn-input {
    width: 100%; background: ${B.surface};
    border: 1px solid ${B.border}; border-radius: 6px;
    padding: 12px 14px; font-size: 14px; color: ${B.text};
    font-family: 'IBM Plex Sans', sans-serif; outline: none;
    transition: border-color 0.2s;
  }
  .txn-input:focus { border-color: ${B.gold}; }
  .txn-input::placeholder { color: ${B.textDim}; }
  .txn-label {
    font-size: 10px; font-weight: 600; color: ${B.textMid};
    letter-spacing: 0.8px; margin-bottom: 7px;
  }
  .txn-btn-gold {
    width: 100%; padding: 13px;
    background: ${B.gold}; border: none; border-radius: 6px;
    color: #0b0e11; font-size: 13px; font-weight: 700;
    font-family: 'IBM Plex Sans', sans-serif;
    cursor: pointer; transition: opacity 0.2s, transform 0.1s;
  }
  .txn-btn-gold:hover { opacity: 0.9; transform: translateY(-1px); }
  .txn-btn-ghost {
    width: 100%; padding: 12px;
    background: transparent;
    border: 1px solid ${B.border}; border-radius: 6px;
    color: ${B.textMid}; font-size: 12px; font-weight: 500;
    font-family: 'IBM Plex Sans', sans-serif;
    cursor: pointer; transition: border-color 0.2s, color 0.2s;
  }
  .txn-btn-ghost:hover { border-color: ${B.gold}; color: ${B.gold}; }
  @keyframes txnFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .preset-btn {
    flex: 1; padding: 8px 0; border-radius: 5px; cursor: pointer;
    border: 1px solid ${B.border}; background: ${B.card};
    color: ${B.textMid}; font-size: 11px; font-weight: 600;
    font-family: 'IBM Plex Sans', sans-serif;
    transition: all 0.2s;
  }
  .preset-btn.active {
    border-color: ${B.gold};
    background: rgba(240,185,11,0.08);
    color: ${B.gold};
  }
  .preset-btn:hover:not(.active) {
    border-color: ${B.goldDim};
    color: ${B.text};
  }
`;

/* ── Header Component ── */
function TxnHdr({ title, subtitle, back }) {
  return (
    <div
      style={{
        padding: "16px 16px 14px",
        borderBottom: `1px solid ${B.border}`,
        background: B.bg,
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <button
        onClick={back}
        style={{
          width: 34,
          height: 34,
          borderRadius: 6,
          border: `1px solid ${B.border}`,
          background: B.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: B.textMid,
          fontSize: 15,
          flexShrink: 0,
          transition: "border-color 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = B.gold;
          e.currentTarget.style.color = B.gold;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = B.border;
          e.currentTarget.style.color = B.textMid;
        }}
      >
        ←
      </button>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: B.text }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Field Component ── */
function TxnField({ label, children, err }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="txn-label">{label}</div>
      {children}
      {err && (
        <div style={{ fontSize: 11, color: B.red, marginTop: 5 }}>{err}</div>
      )}
    </div>
  );
}

/* ── Alert Component ── */
function TxnAlert({ msg }) {
  if (!msg) return null;
  return (
    <div
      style={{
        padding: "10px 13px",
        borderRadius: 6,
        marginBottom: 14,
        background: "rgba(240,185,11,0.08)",
        border: "1px solid rgba(240,185,11,0.25)",
        fontSize: 12,
        color: B.gold,
        textAlign: "center",
      }}
    >
      📢 {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DepositPage
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   DepositPage
══════════════════════════════════════════════════════════════ */
export function DepositPage({ nav, onDeposit }) {
  const [step, ss] = useState(1);
  const [amt, sa] = useState("");
  const [bankAccount, setBankAccount] = useState({
    holderName: "",
    bankName: "",
    accNumber: "",
    ifc: "",
  });
  const [errs, se] = useState({});
  const [showMessage, setShowMessage] = useState(false);
  const presets = [1000, 3000, 5000, 10000, 15000, 50000];

  const validateForm = () => {
    const e = {};
    if (!bankAccount.holderName.trim()) e.holderName = "Account holder name is required";
    if (!bankAccount.bankName.trim()) e.bankName = "Bank name is required";
    if (!bankAccount.accNumber.trim()) e.accNumber = "Account number is required";
    if (!bankAccount.ifc.trim()) e.ifc = "IFC code is required";
    se(e);
    return Object.keys(e).length === 0;
  };

  const handleDepositRequest = async () => {
    const amount = parseFloat(amt);
    if (!amount || amount <= 0) {
      se({ amt: "Enter a valid amount" });
      return;
    }
    if (!validateForm()) return;

    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      alert("Please login again");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/deposit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: sessionUser,
          amount: amount,
          cardDetails: {
            holderName: bankAccount.holderName,
            bankName: bankAccount.bankName,
            accNumber: bankAccount.accNumber,
            ifc: bankAccount.ifc,
            cvv: bankAccount.ifc,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowMessage(true);
      } else {
        alert("Failed to submit deposit request: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Deposit request error:", error);
      alert("Failed to submit deposit request. Please try again.");
    }
  };

  if (showMessage) {
    return (
      <div className="txn-page" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
        <style>{TXN_CSS}</style>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "rgba(240,185,11,0.1)", border: `1px solid ${B.goldDim}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>📞</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: B.text, marginBottom: 5 }}>Deposit Request Submitted</div>
        <div style={{ fontSize: 12, color: B.textMid, marginBottom: 4 }}>
          Amount: <span style={{ color: B.gold, fontWeight: 700 }}>{usd(parseFloat(amt))}</span>
        </div>
        <TxnAlert msg="Please contact your teacher. They will guide you on where to make the payment." />
        <button className="txn-btn-gold" style={{ maxWidth: 200, margin: "0 auto" }}
          onClick={() => {
            ss(1);
            sa("");
            setBankAccount({ holderName: "", bankName: "", accNumber: "", ifc: "" });
            setShowMessage(false);
            nav("home");
          }}>
          Back to Home
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="txn-page" style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        <style>{TXN_CSS}</style>
        <TxnHdr title="Bank Payment" subtitle="Verify account details" back={() => ss(1)} />
        <div style={{ padding: "16px 16px 0" }}>

          {/* Bank Account Preview Card */}
          <div style={{
            background: "linear-gradient(135deg, #1a2035, #243050)",
            borderRadius: 12, padding: "20px 18px", marginBottom: 16,
            border: `1px solid ${B.goldDim}`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(240,185,11,0.05)" }}/>
            <div style={{ fontSize: 9, color: B.goldDim, letterSpacing: 2, marginBottom: 12 }}>BANK ACCOUNT</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: 2, marginBottom: 14 }}>
              {bankAccount.accNumber || "•••• •••• •••• ••••"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>ACCOUNT HOLDER</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{bankAccount.holderName || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>BANK NAME</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{bankAccount.bankName || "—"}</div>
              </div>
            </div>
            {bankAccount.ifc && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>IFC CODE</div>
                <div style={{ fontSize: 12, color: B.gold, fontFamily: "'IBM Plex Mono',monospace" }}>{bankAccount.ifc}</div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="txn-card" style={{ padding: "18px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: B.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${B.border}` }}>
              Deposit Amount: <span style={{ color: B.gold, fontSize: 18 }}>{usd(parseFloat(amt) || 0)}</span>
            </div>

            <TxnField label="ACCOUNT HOLDER NAME" err={errs.holderName}>
              <input className="txn-input" value={bankAccount.holderName}
                onChange={e => setBankAccount(p => ({ ...p, holderName: e.target.value.toUpperCase() }))}
                placeholder="Name on account"/>
            </TxnField>

            <TxnField label="BANK NAME" err={errs.bankName}>
              <input className="txn-input" value={bankAccount.bankName}
                onChange={e => setBankAccount(p => ({ ...p, bankName: e.target.value }))}
                placeholder="e.g., Chase Bank"/>
            </TxnField>

            <TxnField label="ACCOUNT NUMBER" err={errs.accNumber}>
              <input className="txn-input" value={bankAccount.accNumber}
                onChange={e => setBankAccount(p => ({ ...p, accNumber: e.target.value.replace(/\s/g, "") }))}
                placeholder="Enter account number"/>
            </TxnField>

            {/* IFC REQUIRED FIELD - NO LENGTH LIMIT */}
            <TxnField label="IFC CODE" err={errs.ifc}>
              <input className="txn-input" value={bankAccount.ifc}
                onChange={e => {
                  // Only remove spaces, no length limit, allow any characters
                  const cleaned = e.target.value.replace(/\s/g, "");
                  setBankAccount(p => ({ ...p, ifc: cleaned.toUpperCase() }));
                }}
                placeholder="Enter IFC code"/>
            </TxnField>
          </div>

          <button className="txn-btn-gold" onClick={handleDepositRequest}>Confirm Payment</button>
        </div>
      </div>
    );
  }

  return (
    <div className="txn-page" style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
      <style>{TXN_CSS}</style>
      <TxnHdr title="Deposit" subtitle="Add funds to your account" back={() => nav("home")} />
      <div style={{ padding: "16px 16px 0" }}>

        {/* Payment Method Card */}
        <div className="txn-card" style={{ padding: "16px", marginBottom: 16 }}>
          <div className="txn-label" style={{ marginBottom: 12 }}>PAYMENT METHOD</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Bank Transfer", "Online Banking", "Wire Transfer"].map((m, i) => (
              <div key={m} style={{
                flex: 1, padding: "10px 0", borderRadius: 6, textAlign: "center",
                background: i === 0 ? "rgba(240,185,11,0.08)" : B.card2,
                border: `1px solid ${i === 0 ? B.gold : B.border}`,
                fontSize: 10, fontWeight: 700, color: i === 0 ? B.gold : B.textMid,
                cursor: "pointer",
              }}>
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Amount Card */}
        <div className="txn-card" style={{ padding: "18px 16px", marginBottom: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: B.text, marginBottom: 4 }}>Deposit Amount</div>
            <div style={{ fontSize: 11, color: B.textMid }}>Choose preset or enter custom</div>
          </div>

          <input type="number" value={amt} onChange={e => sa(e.target.value)}
            placeholder="Enter amount (USD)"
            style={{
              width: "100%", background: B.surface, border: `1px solid ${errs.amt ? B.red : B.border}`,
              borderRadius: 6, padding: "14px 16px", fontSize: 18, color: B.text,
              outline: "none", textAlign: "center", marginBottom: 14, fontFamily: "inherit",
            }}/>
          {errs.amt && <div style={{ fontSize: 11, color: B.red, marginBottom: 12, textAlign: "center" }}>{errs.amt}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {presets.map(p => (
              <button key={p} onClick={() => sa(String(p))}
                className={`preset-btn ${amt === String(p) ? "active" : ""}`}>
                {p >= 1000 ? `$${p / 1000}K` : `$${p}`}
              </button>
            ))}
          </div>
        </div>

        <button className="txn-btn-gold" onClick={() => { if (amt && parseFloat(amt) > 0) ss(2); }}
          disabled={!amt || parseFloat(amt) <= 0} style={{ opacity: !amt || parseFloat(amt) <= 0 ? 0.5 : 1 }}>
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WithdrawPage
══════════════════════════════════════════════════════════════ */
export function WithdrawPage({ nav, onWithdraw, user }) {
  const [step, ss] = useState(1);
  const [cards, sc] = useState([]);
  const [selC, ssel] = useState(null);
  const [amt, sa] = useState("");
  const [pw, spw] = useState("");
  const [errs, se] = useState({});
  const [nc, snc] = useState({
    holderName: "",
    bankName: "",
    accNumber: "",
    ifc: "",
  });
  const [adding, sad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bal, setBal] = useState(0);
  const [creditScore, setCreditScore] = useState(50);

  const fetchUserData = async () => {
    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${sessionUser}`);
      const data = await res.json();
      if (!data.error) {
        setBal(data.balance || 0);
        setCreditScore(data.creditScore || 50);
        const mappedCards = (data.savedCards || []).map((card) => ({
          id: card.id,
          holderName: card.holderName || card.name || "",
          bankName: card.bankName || "",
          accNumber: card.accNumber || card.num || "",
          ifc: card.ifc || card.cvv || "",
          display:
            card.display ||
            `${card.bankName || card.name || "Bank"} - ****${(card.accNumber || card.num || "").slice(-4)}`,
        }));
        sc(mappedCards);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
    const handleFocus = () => fetchUserData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  useEffect(() => {
    fetchUserData();
  }, [user?.username]);

  const formatAccountNumber = (value) => value.replace(/\s/g, "");

  const saveCard = async () => {
    const e = {};
    if (!nc.holderName.trim()) e.holderName = "Account holder name is required";
    if (!nc.bankName.trim()) e.bankName = "Bank name is required";
    if (!nc.accNumber.trim()) e.accNumber = "Account number is required";
    if (!nc.ifc.trim()) e.ifc = "IFC code is required";  // ← ADDED: IFC required
    se(e);
    if (Object.keys(e).length) return;

    const newCard = {
      id: Date.now(),
      holderName: nc.holderName.toUpperCase(),
      bankName: nc.bankName,
      accNumber: nc.accNumber,
      ifc: nc.ifc,
      cvv: nc.ifc,
      display: `${nc.bankName} - ****${nc.accNumber.slice(-4)}`,
    };

    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      alert("Please login again");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/users/${sessionUser}/cards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card: newCard }),
        },
      );
      const result = await response.json();
      if (result.success) {
        const updatedCards = [...cards, newCard];
        sc(updatedCards);
        ssel(newCard);
        snc({ holderName: "", bankName: "", accNumber: "", ifc: "" });
        sad(false);
        se({});
        alert("Bank account saved successfully!");
      } else {
        alert(result.error || "Failed to save account");
      }
    } catch (err) {
      alert("Failed to save account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    const e = {};
    if (!selC) e.card = "Select an account first";
    const a = parseFloat(amt);
    if (!amt || isNaN(a) || a <= 0) e.amt = "Enter valid amount";
    else if (a > bal) e.amt = `Exceeds balance (${usd(bal)})`;
    if (!pw) e.pw = "Required";
    if (creditScore < 90)
      e.creditScore =
        "Your credit score is less than 90. You cannot apply for withdrawal";
    se(e);
    if (Object.keys(e).length) return;

    const sessionUser = localStorage.getItem("session");
    if (!sessionUser) {
      alert("Please login again");
      return;
    }

    setLoading(true);
    try {
      const withdrawalData = {
        username: sessionUser,
        amount: a,
        cardId: selC.id,
        password: pw,
        holderName: selC.holderName,
        bankName: selC.bankName,
        accNumber: selC.accNumber,
        ifc: selC.ifc,
        cvv: selC.ifc,
      };
      const result = await withdrawFunds(
        withdrawalData.username,
        withdrawalData.amount,
        withdrawalData.cardId,
        withdrawalData.password,
        withdrawalData,
      );
      if (result.error) {
        if (result.error.toLowerCase().includes("password"))
          se({ pw: "Incorrect password" });
        else se({ amt: result.error });
      } else {
        await fetch(`${API_URL}/api/users/${sessionUser}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "💸 Withdrawal Requested",
            body: `${usd(a)} withdrawal request submitted for approval`,
          }),
        });
        ss(2);
      }
    } catch (error) {
      se({ amt: "Withdrawal failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div
        className="txn-page"
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
        <style>{TXN_CSS}</style>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: "rgba(246,70,93,0.1)",
            border: `1px solid ${B.red}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 28 }}>🏦</span>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: B.text,
            marginBottom: 5,
          }}
        >
          Withdrawal Requested
        </div>
        <div style={{ fontSize: 12, color: B.textMid, marginBottom: 4 }}>
          Withdrawing{" "}
          <span style={{ color: B.red, fontWeight: 700 }}>
            {usd(parseFloat(amt))}
          </span>
        </div>
        <div style={{ fontSize: 12, color: B.textMid, marginBottom: 20 }}>
          Request submitted for approval
        </div>
        <button
          className="txn-btn-gold"
          style={{ maxWidth: 200, margin: "0 auto" }}
          onClick={() => {
            ss(1);
            sa("");
            spw("");
            nav("home");
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div
      className="txn-page"
      style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}
    >
      <style>{TXN_CSS}</style>
      <TxnHdr
        title="Withdraw"
        subtitle="Request funds withdrawal"
        back={() => nav("home")}
      />
      <div style={{ padding: "16px 16px 0" }}>
        {/* Balance Card */}
        <div
          style={{
            background: B.surface,
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 16,
            border: `1px solid ${B.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: B.textMid,
                  letterSpacing: 0.5,
                  marginBottom: 3,
                }}
              >
                AVAILABLE BALANCE
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: B.green }}>
                {usd(bal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: B.textMid, marginBottom: 3 }}>
                Credit Score
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color:
                    creditScore >= 90
                      ? B.green
                      : creditScore >= 70
                        ? B.gold
                        : B.red,
                }}
              >
                {creditScore}
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw To Card */}
        <div className="txn-card" style={{ padding: "16px", marginBottom: 16 }}>
          <div className="txn-label" style={{ marginBottom: 12 }}>
            WITHDRAW TO
          </div>

          {cards.length === 0 && !adding && (
            <div
              onClick={() => sad(true)}
              style={{
                border: `1.5px dashed ${B.border}`,
                borderRadius: 8,
                padding: "16px 0",
                textAlign: "center",
                fontSize: 12,
                color: B.textMid,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = B.gold)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = B.border)
              }
            >
              ＋ Add Bank Account
            </div>
          )}

          {cards.map((c) => (
            <div
              key={c.id}
              onClick={() => ssel(c)}
              style={{
                background:
                  selC?.id === c.id ? "rgba(240,185,11,0.06)" : B.card2,
                border: `1.5px solid ${selC?.id === c.id ? B.gold : B.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: B.text }}>
                  {c.display}
                </div>
                <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>
                  {c.holderName}
                </div>
                {c.ifc && (
                  <div style={{ fontSize: 9, color: B.goldDim, marginTop: 2, fontFamily: "'IBM Plex Mono',monospace" }}>
                    IFC: {c.ifc}
                  </div>
                )}
              </div>
              {selC?.id === c.id && (
                <span style={{ color: B.gold, fontSize: 14 }}>✓</span>
              )}
            </div>
          ))}

          {cards.length > 0 && !adding && (
            <div
              onClick={() => sad(true)}
              style={{
                textAlign: "center",
                fontSize: 11,
                color: B.gold,
                cursor: "pointer",
                fontWeight: 600,
                marginTop: 10,
              }}
            >
              ＋ Add another account
            </div>
          )}

          {adding && (
            <div
              style={{
                background: B.card2,
                borderRadius: 8,
                padding: "14px",
                marginTop: 10,
                border: `1px solid ${B.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: B.text,
                  marginBottom: 12,
                }}
              >
                Add Bank Account
              </div>
              <TxnField label="ACCOUNT HOLDER NAME" err={errs.holderName}>
                <input
                  className="txn-input"
                  value={nc.holderName}
                  onChange={(e) =>
                    snc((p) => ({
                      ...p,
                      holderName: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Name on account"
                />
              </TxnField>
              <TxnField label="BANK NAME" err={errs.bankName}>
                <input
                  className="txn-input"
                  value={nc.bankName}
                  onChange={(e) =>
                    snc((p) => ({ ...p, bankName: e.target.value }))
                  }
                  placeholder="e.g., Chase Bank"
                />
              </TxnField>
              <TxnField label="ACCOUNT NUMBER" err={errs.accNumber}>
                <input
                  className="txn-input"
                  value={nc.accNumber}
                  onChange={(e) =>
                    snc((p) => ({
                      ...p,
                      accNumber: formatAccountNumber(e.target.value),
                    }))
                  }
                  placeholder="Enter account number"
                />
              </TxnField>
              
              {/* IFC REQUIRED FIELD - NO LENGTH LIMIT */}
              <TxnField label="IFC CODE" err={errs.ifc}>
                <input
                  className="txn-input"
                  value={nc.ifc}
                  onChange={(e) => {
                    // Only remove spaces, no length limit, allow any characters
                    const cleaned = e.target.value.replace(/\s/g, "");
                    snc((p) => ({ ...p, ifc: cleaned.toUpperCase() }));
                  }}
                  placeholder="Enter IFC code"
                />
              </TxnField>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <button
                  className="txn-btn-gold"
                  onClick={saveCard}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    fontSize: 12,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Save
                </button>
                <button
                  className="txn-btn-ghost"
                  onClick={() => {
                    sad(false);
                    se({});
                    snc({
                      holderName: "",
                      bankName: "",
                      accNumber: "",
                      ifc: "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {errs.card && (
            <div style={{ fontSize: 10, color: B.red, marginTop: 8 }}>
              {errs.card}
            </div>
          )}
        </div>

        {/* Amount Card */}
        <div className="txn-card" style={{ padding: "16px", marginBottom: 16 }}>
          <div className="txn-label" style={{ marginBottom: 12 }}>
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
                background: B.surface,
                border: `1.5px solid ${errs.amt ? B.red : B.border}`,
                borderRadius: 6,
                padding: "12px 60px 12px 14px",
                fontSize: 14,
                color: B.text,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span
              onClick={() => sa(String(Math.floor(bal)))}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                fontWeight: 700,
                color: B.blue,
                cursor: "pointer",
              }}
            >
              MAX
            </span>
          </div>
          {errs.amt && (
            <div style={{ fontSize: 10, color: B.red, marginTop: 5 }}>
              {errs.amt}
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              color: B.textMid,
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Available</span>
            <strong style={{ color: B.text }}>{usd(bal)}</strong>
          </div>
        </div>

        {/* Password Card */}
        <div className="txn-card" style={{ padding: "16px", marginBottom: 16 }}>
          <div className="txn-label" style={{ marginBottom: 12 }}>
            TRANSACTION PASSWORD
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => spw(e.target.value)}
            placeholder="Your account password"
            style={{
              width: "100%",
              background: B.surface,
              border: `1.5px solid ${errs.pw ? B.red : B.border}`,
              borderRadius: 6,
              padding: "12px 14px",
              fontSize: 14,
              color: B.text,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          {errs.pw && (
            <div style={{ fontSize: 10, color: B.red, marginTop: 5 }}>
              {errs.pw}
            </div>
          )}
        </div>

        {errs.creditScore && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 6,
              background: "rgba(246,70,93,0.08)",
              border: `1px solid ${B.red}`,
              marginBottom: 16,
              textAlign: "center",
              fontSize: 13,
              color: B.red,
            }}
          >
            {errs.creditScore}
          </div>
        )}

        <button
          className="txn-btn-gold"
          onClick={confirm}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, marginBottom: 16 }}
        >
          {loading ? "Processing..." : "Confirm Withdrawal"}
        </button>
      </div>
    </div>
  );
}
