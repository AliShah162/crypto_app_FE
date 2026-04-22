"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { T, S, PE, usd, f2 } from "./lib/store";
import AdminPanel from "./components/AdminPanel";
import { WelcomeScreen, SignupScreen, LoginScreen } from "./components/Auth";
import { NotifPanel } from "./components/UI";
import {
  HomePage,
  NewsPage,
  MarketPage,
  HistoryPage,
  ProfilePage,
  AboutPage,
} from "./pages/AppPages";
import TradePage from "./pages/TradePage";
import { DepositPage, WithdrawPage } from "./pages/TransactionPages";
import {
  SecSub,
  CardSub,
  NotifSub,
  LangSub,
  TermsSub,
  EditSub,
} from "./pages/ProfileSubs";

function usePX() {
  const [p, sp] = useState({ ...PE.p });
  useEffect(() => PE.on(sp), []);
  return p;
}

const NAV = [
  {
    id: "home",
    l: "Home",
    d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  },
  { id: "market", l: "Market", d: "M18 20V10M12 20V4M6 20v-6" },
  {
    id: "history",
    l: "History",
    d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6v-4m0-4h.01",
  },
  {
    id: "profile",
    l: "Profile",
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

export default function App() {
  const [scr, ss] = useState("loading");
  const [user, setUser] = useState(null);
  const [page, sp] = useState("home");
  const [sub, ssb] = useState(null);
  const [nPanel, snp] = useState(false);
  const [notifs, sn] = useState([]);
  const [, tick] = useState(0);
  const px = usePX();

  // ✅ FIX: session restore reads role from a separate key so two tabs don't bleed
  useEffect(() => {
    S.hydrate();
    const current = S.get();

    if (current) {
      const username = current.username?.toLowerCase();
      const isBanned = (S.banned || []).some(
        (b) => b.toLowerCase() === username,
      );

      if (!isBanned) {
        // ✅ Read role from a tab-isolated sessionStorage key (not localStorage)
        // so each browser tab tracks its own role independently
        const tabRole =
          sessionStorage.getItem("tabRole") || current.role || "user";

        setUser({ ...current });
        ss(tabRole === "admin" ? "admin" : "app");
        return;
      }
    }

    ss("welcome");
  }, []);

  useEffect(() => {
    if (scr === "loading") return;

    const checkSession = () => {
      const current = S.get();
      const bannedList = S.banned || [];

      if (!current) {
        if (scr === "app") {
          setUser(null);
          ss("login");
          sp("home");
          ssb(null);
        }
        return;
      }

      const username = current.username?.toLowerCase();
      const isBanned = bannedList.some((b) => b.toLowerCase() === username);

      if (isBanned) {
        S.setSession(null);
        setUser(null);
        ss("login");
        sp("home");
        ssb(null);
        return;
      }

      if (scr === "app") {
        setUser((prev) => {
          const fresh = S.get();
          if (!fresh) return prev;
          if (JSON.stringify(prev) !== JSON.stringify(fresh)) {
            return { ...fresh };
          }
          return prev;
        });
      }
    };

    window.addEventListener("storage", checkSession);
    window.addEventListener("focus", checkSession);
    const interval = setInterval(checkSession, 1000);

    return () => {
      window.removeEventListener("storage", checkSession);
      window.removeEventListener("focus", checkSession);
      clearInterval(interval);
    };
  }, [scr]);

  const re = useCallback(() => {
    const u = S.get();
    if (u) setUser({ ...u });
    tick((n) => n + 1);
  }, []);

  const auth = (u) => {
    if (!u) return;

    const username = u.username.toLowerCase().trim();

    const userObj = {
      username,
      email: u.email || "",
      fullName: u.fullName || username,
      role: u.role || "user",
      balance: u.balance || 0,
      transactions: u.transactions || [],
      holdings: u.holdings || {},
      savedCards: u.savedCards || [],
      creditScore: u.creditScore ?? 50,
      phone: u.phone || "",
      dob: u.dob || "",
      country: u.country?.trim() || "—",
      loggedInAt: Date.now(),
    };

    if (!S.users[username]) {
      S.users[username] = userObj;
      if (typeof window !== "undefined") {
        localStorage.setItem("users", JSON.stringify(S.users));
      }
    } else {
      S.updateUser(username, userObj);
    }

    S.session = username;
    if (typeof window !== "undefined") {
      localStorage.setItem("session", JSON.stringify(username));
    }

    setUser(userObj);

    if (u.role === "admin") {
      // ✅ Store role in sessionStorage (tab-scoped) so other tabs aren't affected
      sessionStorage.setItem("tabRole", "admin");
      ss("admin");
    } else {
      // ✅ Clear any leftover admin role from this tab
      sessionStorage.setItem("tabRole", "user");
      ss("app");
      sp("home");
      ssb(null);
    }
  };

  const adm = () => {
    sessionStorage.setItem("tabRole", "admin");
    ss("admin");
  };

  const logout = () => {
    S.setSession(null);
    sessionStorage.removeItem("tabRole");
    setUser(null);
    ss("welcome");
    sp("home");
    ssb(null);
  };

  const nav = (p) => {
    ssb(null);
    sp(p);
  };

  const addN = (title, body) =>
    sn((n) => [...n, { title, body, time: new Date().toLocaleTimeString() }]);

  const onDep = (amt) => {
    const u = S.get();
    if (!u) return;
    u.balance = (u.balance || 0) + amt;
    u.transactions = u.transactions || [];
    u.transactions.unshift({
      type: "Deposit",
      coin: "USD",
      usd: amt,
      date: new Date().toISOString().slice(0, 10),
      up: true,
    });
    localStorage.setItem("users", JSON.stringify(S.users));
    re();
    addN("Deposit Successful", `${usd(amt)} added to your balance`);
  };

  const onWith = (amt) => {
    const u = S.get();
    if (!u) return;
    u.balance = Math.max(0, (u.balance || 0) - amt);
    u.transactions = u.transactions || [];
    u.transactions.unshift({
      type: "Withdraw",
      coin: "USD",
      usd: amt,
      date: new Date().toISOString().slice(0, 10),
      up: false,
    });
    localStorage.setItem("users", JSON.stringify(S.users));
    re();
    addN("Withdrawal Requested", `${usd(amt)} being processed`);
  };

  const onTrade = (tradeInfo) => {
    re();
    if (tradeInfo) {
      // tradeInfo passed directly from TradePage so we don't miss it
      addN(
        `${tradeInfo.action} Successful ✅`,
        `${tradeInfo.action === "Buy" ? "Purchased" : "Sold"} ${f2(tradeInfo.qty || 0, 4)} ${tradeInfo.coin} for ${usd(tradeInfo.cost || 0)}`,
      );
    } else {
      const u = S.get();
      if (u?.transactions?.length) {
        const tx = u.transactions[0];
        addN(
          `${tx.type} Successful ✅`,
          `${tx.type === "Buy" ? "Purchased" : "Sold"} ${f2(tx.amount || 0, 4)} ${tx.coin} @ ${usd(tx.price || 0)}`,
        );
      }
    }
  };

  const onCardDeposit = (amt) => onDep(amt);

  const isFloat = ["news", "deposit", "withdraw", "about", "trade"].includes(
    page,
  );
  const u = user;

  const renderContent = () => {
    if (page === "profile" && sub) {
      const bk = () => ssb(null);
      const uu = S.get() || user;
      switch (sub) {
        case "sec":
          return <SecSub back={bk} />;
        case "card":
          return (
            <CardSub
              back={bk}
              user={uu}
              re={re}
              onCardDeposit={onCardDeposit}
            />
          );
        case "notif":
          return <NotifSub back={bk} />;
        case "lang":
          return <LangSub back={bk} />;
        case "terms":
          return <TermsSub back={bk} />;
        case "edit":
          return <EditSub back={bk} user={uu} re={re} />;
        default:
          break;
      }
    }
    switch (page) {
      case "home":
        return <HomePage nav={nav} px={px} user={u} />;
      case "trade":
        return <TradePage nav={nav} px={px} onTrade={onTrade} />;
      case "news":
        return <NewsPage nav={nav} />;
      case "deposit":
        return <DepositPage nav={nav} onDeposit={onDep} />;
      case "withdraw":
        return <WithdrawPage nav={nav} onWithdraw={onWith} user={u} />;
      case "about":
        return <AboutPage nav={nav} />;
      case "market":
        return <MarketPage px={px} nav={nav} />;
      case "history":
        return <HistoryPage user={u} />;
      case "profile":
        return (
          <ProfilePage
            nav={nav}
            user={u}
            onLogout={logout}
            onSub={ssb}
            re={re}
          />
        );
      default:
        return null;
    }
  };

  if (scr === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#030508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Sora','Segoe UI',sans-serif",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900, color: "#00e5b0" }}>
          Coin<span style={{ color: "#3b82f6" }}>Base</span>
        </div>
      </div>
    );
  }

  if (scr === "admin") {
    return (
      <div
        style={{
          minHeight: "100vh",
          fontFamily: "'Sora','Segoe UI',sans-serif",
        }}
      >
        <AdminPanel
          onBack={() => {
            sessionStorage.removeItem("tabRole");
            ss("welcome");
            setUser(null);
            S.setSession(null);
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Sora','Segoe UI',sans-serif",
      }}
    >
      <div
        className="pw"
        style={{
          width: 385,
          minHeight: 760,
          maxHeight: 820,
          background: T.bg,
          borderRadius: 42,
          boxShadow: "0 0 0 1px #1a2540,0 36px 90px rgba(0,0,0,0.9)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {scr === "welcome" && <WelcomeScreen go={ss} />}
        {scr === "signup" && <SignupScreen go={ss} onAuth={auth} />}
        {scr === "login" && <LoginScreen go={ss} onAuth={auth} onAdmin={adm} />}

        {scr === "app" && (
          <>
            {!isFloat && !sub && (
              <div
                style={{
                  padding: "15px 15px 7px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 900,
                    background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  CoinBase
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    onClick={() => snp(true)}
                    style={{
                      width: 34,
                      height: 34,
                      background: T.card,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${T.line}`,
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.dim}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {notifs.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: T.red,
                        }}
                      />
                    )}
                  </div>
                  <div
                    onClick={() => nav("profile")}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {(u?.fullName || u?.username || "U")[0].toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            <div
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {renderContent()}
            </div>

            {!isFloat && !sub && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 70,
                  background: T.card,
                  borderTop: `1px solid ${T.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "0 6px 4px",
                  boxShadow: "0 -4px 16px rgba(0,0,0,0.5)",
                }}
              >
                {NAV.slice(0, 2).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => nav(t.id)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      paddingTop: 7,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={page === t.id ? T.acc : T.dim}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={t.d} />
                    </svg>
                    <span
                      style={{
                        fontSize: 9,
                        color: page === t.id ? T.acc : T.dim,
                        fontWeight: page === t.id ? 800 : 500,
                      }}
                    >
                      {t.l}
                    </span>
                  </button>
                ))}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <div
                    onClick={() => nav("trade")}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 16px rgba(0,229,176,0.32)",
                      cursor: "pointer",
                      marginTop: -17,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      color: page === "trade" ? T.acc : T.dim,
                      fontWeight: 500,
                    }}
                  >
                    Trade
                  </span>
                </div>
                {NAV.slice(2).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => nav(t.id)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      paddingTop: 7,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={page === t.id ? T.acc : T.dim}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={t.d} />
                    </svg>
                    <span
                      style={{
                        fontSize: 9,
                        color: page === t.id ? T.acc : T.dim,
                        fontWeight: page === t.id ? 800 : 500,
                      }}
                    >
                      {t.l}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {nPanel && (
              <NotifPanel notifs={notifs} onClose={() => snp(false)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}