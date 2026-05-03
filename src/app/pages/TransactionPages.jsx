"use client";
import { useState, useEffect } from "react";
import { T, S, usd } from "../lib/store";
import { Input, PB, BHdr } from "../components/UI";
import { withdrawFunds, saveCardToBackend } from "../lib/api";
import { addUserNotification } from "../lib/notifications";
import { API_URL } from "../lib/config";

export function DepositPage({ nav, onDeposit }) {
  const [step, ss] = useState(1);
  const [amt, sa] = useState("");
  const [bankAccount, setBankAccount] = useState({
    holderName: "",
    bankName: "",
    accNumber: "",
    ifc: "", // Changed from cvv to ifc
  });
  const [errs, se] = useState({});
  const [showMessage, setShowMessage] = useState(false);
  const presets = [1000, 3000, 5000, 10000, 15000, 50000];

  const validateForm = () => {
    const e = {};
    if (!bankAccount.holderName.trim())
      e.holderName = "Account holder name is required";
    if (!bankAccount.bankName.trim()) e.bankName = "Bank name is required";
    if (!bankAccount.accNumber.trim())
      e.accNumber = "Account number is required";
    // IFC is optional - no validation
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
            ifc: bankAccount.ifc, // Changed from cvv to ifc
            cvv: bankAccount.ifc, // Keep for backward compatibility
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowMessage(true);
      } else {
        alert(
          "Failed to submit deposit request: " +
            (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Deposit request error:", error);
      alert("Failed to submit deposit request. Please try again.");
    }
  };

  if (showMessage) {
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
        <div style={{ fontSize: 52, marginBottom: 11 }}>📞</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: T.text,
            marginBottom: 5,
          }}
        >
          Deposit Request Submitted
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 4 }}>
          Amount:{" "}
          <span style={{ color: T.gold, fontWeight: 700 }}>
            {usd(parseFloat(amt))}
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            color: T.acc,
            marginTop: 15,
            marginBottom: 20,
            padding: "15px",
            background: "rgba(0,229,176,0.1)",
            borderRadius: 12,
          }}
        >
          📢 Please contact your teacher. They will guide you on where to make
          the payment.
        </div>
        <PB
          lbl="Back to Home"
          onClick={() => {
            ss(1);
            sa("");
            setBankAccount({
              holderName: "",
              bankName: "",
              accNumber: "",
              ifc: "",
            });
            setShowMessage(false);
            nav("home");
          }}
        />
      </div>
    );
  }

  if (step === 2)
    return (
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        <BHdr title="Bank Payment" back={() => ss(1)} />
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
              BANK ACCOUNT
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "#fff",
                marginBottom: 11,
              }}
            >
              {bankAccount.accNumber || "•••• •••• •••• ••••"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {bankAccount.holderName || "ACCOUNT HOLDER"}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {bankAccount.bankName || "BANK NAME"}
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
              label="ACCOUNT HOLDER NAME"
              val={bankAccount.holderName}
              set={(v) =>
                setBankAccount((p) => ({ ...p, holderName: v.toUpperCase() }))
              }
              ph="Name on account"
              err={errs.holderName}
            />
            <Input
              label="BANK NAME"
              val={bankAccount.bankName}
              set={(v) => setBankAccount((p) => ({ ...p, bankName: v }))}
              ph="e.g., Chase Bank"
              err={errs.bankName}
            />
            <Input
              label="ACCOUNT NUMBER"
              val={bankAccount.accNumber}
              set={(v) =>
                setBankAccount((p) => ({
                  ...p,
                  accNumber: v.replace(/\s/g, ""),
                }))
              }
              ph="Enter account number"
              err={errs.accNumber}
            />
            
            {/* IFC (Optional) Field - Changed from CVV */}
            <Input
              label="IFC (Optional)"
              type="text"
              val={bankAccount.ifc}
              set={(v) => {
                // Allow only letters and numbers, max 4 characters
                const cleaned = v.replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
                setBankAccount((p) => ({ ...p, ifc: cleaned.toUpperCase() }));
              }}
              ph="Enter IFC code (optional)"
              err={errs.ifc}
            />
          </div>
          <PB
            lbl="Confirm Payment"
            onClick={() => {
              handleDepositRequest();
            }}
          />
        </div>
      </div>
    );

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 20,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
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
            {["Bank Transfer", "Online Banking", "Wire Transfer"].map(
              (m, i) => (
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
              ),
            )}
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
          {errs.amt && (
            <div style={{ fontSize: 11, color: T.red, marginTop: 8 }}>
              {errs.amt}
            </div>
          )}
        </div>
        <PB
          lbl="Continue to Payment →"
          onClick={() => {
            if (amt && parseFloat(amt) > 0) ss(2);
          }}
          dis={!amt || parseFloat(amt) <= 0}
        />
      </div>
    </div>
  );
}

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
    ifc: "", // Changed from cvv to ifc
  });
  const [adding, sad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bal, setBal] = useState(0);
  const [creditScore, setCreditScore] = useState(50);

  // Fetch user data function - can be called multiple times
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
          ifc: card.ifc || card.cvv || "", // Support both old and new field names
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

  // Fetch on mount and when page gets focus
  useEffect(() => {
    fetchUserData();
    
    const handleFocus = () => {
      console.log("Page focused, refreshing user data...");
      fetchUserData();
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Also refresh when the component mounts again (if user navigates)
  useEffect(() => {
    fetchUserData();
  }, [user?.username]);

  const formatAccountNumber = (value) => {
    return value.replace(/\s/g, "");
  };

  const saveCard = async () => {
    const e = {};
    if (!nc.holderName.trim()) e.holderName = "Account holder name is required";
    if (!nc.bankName.trim()) e.bankName = "Bank name is required";
    if (!nc.accNumber.trim()) e.accNumber = "Account number is required";
    // IFC is optional - no validation required
    se(e);
    if (Object.keys(e).length) return;

    const newCard = {
      id: Date.now(),
      holderName: nc.holderName.toUpperCase(),
      bankName: nc.bankName,
      accNumber: nc.accNumber,
      ifc: nc.ifc, // Use ifc field
      cvv: nc.ifc, // Keep for backward compatibility
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
      console.error("Error saving account:", err);
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
    
    if (creditScore < 90) {
      e.creditScore = "Your credit score is less than 90. You cannot apply for withdrawal";
    }

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
        cvv: selC.ifc, // Keep for backward compatibility
      };

      const result = await withdrawFunds(
        withdrawalData.username,
        withdrawalData.amount,
        withdrawalData.cardId,
        withdrawalData.password,
        withdrawalData,
      );

      if (result.error) {
        if (result.error.toLowerCase().includes("password")) {
          se({ pw: "Incorrect password" });
        } else {
          se({ amt: result.error });
        }
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
          Request submitted for approval
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
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 20,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>
        {`
        div::-webkit-scrollbar {
          display: none;
        }
      `}
      </style>
      <BHdr title="Withdraw" back={() => nav("home")} />
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
              ＋ Add Bank Account
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
                  {c.holderName}
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
              ＋ Add another account
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
                Add Bank Account
              </div>
              <Input
                label="ACCOUNT HOLDER NAME"
                val={nc.holderName}
                set={(v) => snc((p) => ({ ...p, holderName: v.toUpperCase() }))}
                ph="Name on account"
                err={errs.holderName}
              />
              <Input
                label="BANK NAME"
                val={nc.bankName}
                set={(v) => snc((p) => ({ ...p, bankName: v }))}
                ph="e.g., Chase Bank"
                err={errs.bankName}
              />
              <Input
                label="ACCOUNT NUMBER"
                val={nc.accNumber}
                set={(v) =>
                  snc((p) => ({ ...p, accNumber: formatAccountNumber(v) }))
                }
                ph="Enter account number"
                err={errs.accNumber}
              />
              
              {/* IFC (Optional) Field */}
              <Input
                label="IFC (Optional)"
                type="text"
                val={nc.ifc}
                set={(v) => {
                  // Allow only letters and numbers, max 4 characters
                  const cleaned = v.replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
                  snc((p) => ({ ...p, ifc: cleaned.toUpperCase() }));
                }}
                ph="Enter IFC code (optional)"
                err={errs.ifc}
              />
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <PB lbl="Save" onClick={saveCard} sm />
                <PB
                  lbl="Cancel"
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

        {errs.creditScore && (
          <div
            style={{
              fontSize: 13,
              color: T.red,
              marginBottom: 10,
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {errs.creditScore}
          </div>
        )}

        <PB
          lbl={loading ? "Processing..." : "Confirm Withdrawal"}
          onClick={confirm}
          dis={loading}
        />
      </div>
    </div>
  );
}
