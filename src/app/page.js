"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from "react";
import { T, S, PE, usd, f2 } from "./lib/store";
import AdminPanel from "./components/AdminPanel";
import { WelcomeScreen, SignupScreen, LoginScreen } from "./components/Auth";
import { NotifPanel } from "./components/UI";
import { getUserNotifications, addUserNotification } from "./lib/notifications";
import { getUserFromDB } from "./lib/api";
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
  BinaryHistorySub,
} from "./pages/ProfileSubs";

function initLocalStorage() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify({}));
  }

  if (!localStorage.getItem("session")) {
    localStorage.setItem("session", JSON.stringify(null));
  }

  if (!localStorage.getItem("banned")) {
    localStorage.setItem("banned", JSON.stringify([]));
  }

  if (!localStorage.getItem("admin_notifs")) {
    localStorage.setItem("admin_notifs", JSON.stringify([]));
  }
}

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
  const [coin, ssCoin] = useState("BTC");
  const [nPanel, snp] = useState(false);
  const [notifs, sn] = useState([]);
  const [, tick] = useState(0);
  const px = usePX();

  useEffect(() => {
    initLocalStorage();
    S.hydrate();
    const current = S.get();

    if (current) {
      const username = current.username?.toLowerCase();
      const isBanned = (S.banned || []).some(
        (b) => b.toLowerCase() === username,
      );

      if (!isBanned) {
        const tabRole = localStorage.getItem("tabRole") || current.role || "user";

        startTransition(() => {
          setUser({ ...current });
          if (typeof window !== "undefined") {
            try {
              const allNotifs = JSON.parse(
                localStorage.getItem("user_notifications") || "{}",
              );
              const userNotifs = allNotifs[username] || [];
              sn(userNotifs);
            } catch {
              sn([]);
            }
          }
          ss(tabRole === "admin" ? "admin" : "app");
        });
        return;
      }
    }

    startTransition(() => {
      ss("welcome");
    });
  }, []);

  useEffect(() => {
    if (scr === "loading") return;

    const checkSession = async () => {
      const current = S.get();
      const bannedList = S.banned || [];

      if (!current) {
        if (scr === "app") {
          startTransition(() => {
            setUser(null);
            ss("login");
            sp("home");
            ssb(null);
            sn([]);
          });
        }
        return;
      }

      const username = current.username?.toLowerCase();
      const isBanned = bannedList.some((b) => b.toLowerCase() === username);

      if (isBanned) {
        S.setSession(null);
        startTransition(() => {
          setUser(null);
          ss("login");
          sp("home");
          ssb(null);
          sn([]);
        });
        return;
      }

      if (scr === "app") {
        // ✅ FETCH FRESH DATA FROM DATABASE every time
        try {
          const freshUser = await getUserFromDB(username);
          
          // ✅ CHECK IF USER WAS DELETED (404 error means user no longer exists)
          if (freshUser && freshUser.error && freshUser.error === "User not found") {
            // User was deleted by admin - force logout
            console.log("User account deleted, logging out...");
            S.setSession(null);
            localStorage.removeItem("session");
            localStorage.removeItem("tabRole");
            localStorage.removeItem("lastNotifUser");
            
            startTransition(() => {
              setUser(null);
              ss("login");
              sp("home");
              ssb(null);
              sn([]);
            });
            return;
          }
          
          if (freshUser && !freshUser.error) {
            // Update localStorage with fresh data
            S.users[username] = { ...S.users[username], ...freshUser };
            localStorage.setItem("users", JSON.stringify(S.users));
            
            setUser((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(freshUser)) {
                return { ...freshUser };
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Failed to fetch fresh user data:", err);
        }
      }
    };

    window.addEventListener("storage", checkSession);
    window.addEventListener("focus", checkSession);
    const interval = setInterval(checkSession, 3000);

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

    S.hydrate();
    const existingLocal = S.users[username] || {};

    const userObj = {
      username,
      email: u.email || existingLocal.email || "",
      fullName: u.fullName || existingLocal.fullName || username,
      role: u.role || existingLocal.role || "user",
      phone: u.phone || existingLocal.phone || "",
      dob: u.dob || existingLocal.dob || "",
      country: u.country?.trim() || existingLocal.country || "—",
      password: existingLocal.password || u.password || "",
      adminPassword: existingLocal.adminPassword || "",
      creditScore: u.creditScore ?? existingLocal.creditScore ?? 50,
      isBanned: u.isBanned ?? existingLocal.isBanned ?? false,

      balance: existingLocal.balance ?? u.balance ?? 0,
      transactions:
        existingLocal.transactions?.length > 0
          ? existingLocal.transactions
          : u.transactions || [],
      holdings:
        Object.keys(existingLocal.holdings || {}).length > 0
          ? existingLocal.holdings
          : u.holdings || {},
      savedCards:
        existingLocal.savedCards?.length > 0
          ? existingLocal.savedCards
          : u.savedCards || [],

      loggedInAt: Date.now(),
    };

    S.users[username] = { ...existingLocal, ...userObj };
    if (typeof window !== "undefined") {
      localStorage.setItem("users", JSON.stringify(S.users));
    }

    S.session = username;
    if (typeof window !== "undefined") {
      localStorage.setItem("session", JSON.stringify(username));
    }

    setUser(S.users[username]);

    if (typeof window !== "undefined") {
      try {
        const allNotifs = JSON.parse(
          localStorage.getItem("user_notifications") || "{}",
        );
        const userNotifs = allNotifs[username] || [];
        sn(userNotifs);
        localStorage.setItem("lastNotifUser", username);
      } catch {
        sn([]);
      }
    } else {
      sn([]);
    }

    if (u.role === "admin") {
      localStorage.setItem("tabRole", "admin");
      ss("admin");
    } else {
      localStorage.setItem("tabRole", "user");
      ss("app");
      sp("home");
      ssb(null);
    }
  };

  const adm = () => {
    localStorage.setItem("tabRole", "admin");
    ss("admin");
  };

  const logout = () => {
    S.setSession(null);
    localStorage.removeItem("tabRole");
    localStorage.removeItem("lastNotifUser");
    localStorage.removeItem("session");
    setUser(null);
    ss("welcome");
    sp("home");
    ssb(null);
    sn([]);
  };

  const nav = (p, coin) => {
    ssb(null);
    sp(p);
    if (p === "trade" && coin) {
      ssCoin(coin);
    }
  };

  const addN = (title, body) => {
    const newNotif = {
      title,
      body,
      time: new Date().toLocaleTimeString(),
      id: Date.now() + Math.random(),
    };

    if (user?.username) {
      try {
        const allNotifs = JSON.parse(
          localStorage.getItem("user_notifications") || "{}",
        );
        const userNotifs = allNotifs[user.username] || [];
        const updated = [newNotif, ...userNotifs].slice(0, 50);
        allNotifs[user.username] = updated;
        localStorage.setItem("user_notifications", JSON.stringify(allNotifs));
      } catch (e) {
        console.error("Failed to save notification:", e);
      }
    }

    sn((prev) => [newNotif, ...prev]);
  };

  const onDep = (amt) => {
    const u = S.get();
    if (!u) return;
    const newBalance = (u.balance || 0) + amt;
    const newTxns = [
      {
        type: "Deposit",
        coin: "USD",
        usd: amt,
        date: new Date().toISOString().slice(0, 10),
        up: true,
      },
      ...(u.transactions || []),
    ];
    S.updateUser(u.username, { balance: newBalance, transactions: newTxns });
    re();
    addN("Deposit Successful", `${usd(amt)} added to your balance`);
  };

  const onWith = (amt) => {
    const u = S.get();
    if (!u) return;
    const newBalance = Math.max(0, (u.balance || 0) - amt);
    const newTxns = [
      {
        type: "Withdraw",
        coin: "USD",
        usd: amt,
        date: new Date().toISOString().slice(0, 10),
        up: false,
      },
      ...(u.transactions || []),
    ];
    S.updateUser(u.username, { balance: newBalance, transactions: newTxns });
    re();
    addN("Withdrawal Requested", `${usd(amt)} being processed`);
  };

  const onTrade = (tradeInfo) => {
    re();
    if (tradeInfo && tradeInfo.action === "Binary Trade") {
      const isWin = tradeInfo.result === "WIN";
      const profitAmount = Math.abs(tradeInfo.profit);

      if (isWin) {
        addN(
          `🎉 Binary Trade WIN!`,
          `You won ${usd(profitAmount)} on ${tradeInfo.coin} (${tradeInfo.tradeDetails?.duration}s ${tradeInfo.tradeDetails?.orderType?.toUpperCase()})`,
        );
      } else {
        addN(
          `💔 Binary Trade LOSS`,
          `You lost ${usd(tradeInfo.amount)} on ${tradeInfo.coin}`,
        );
      }
    } else if (tradeInfo && tradeInfo.action) {
      if (tradeInfo.action === "Buy" || tradeInfo.action === "Sell") {
        addN(
          `${tradeInfo.action} Successful ✅`,
          `${tradeInfo.action === "Buy" ? "Purchased" : "Sold"} ${f2(tradeInfo.qty || 0, 4)} ${tradeInfo.coin} for ${usd(tradeInfo.cost || 0)}`,
        );
      }
    } else {
      const u = S.get();
      if (u?.transactions?.length) {
        const latestTx = u.transactions[0];
        if (latestTx.isBinaryTrade) {
          addN(
            latestTx.up ? "🎉 Binary Trade WIN!" : "💔 Binary Trade LOSS",
            latestTx.up
              ? `You won ${usd(latestTx.tradeResult?.profit || 0)} on ${latestTx.coin}`
              : `You lost ${usd(latestTx.amount)} on ${latestTx.coin}`,
          );
        } else if (latestTx.type === "Buy" || latestTx.type === "Sell") {
          addN(
            `${latestTx.type} Successful ✅`,
            `${latestTx.type === "Buy" ? "Purchased" : "Sold"} ${f2(latestTx.amount || 0, 4)} ${latestTx.coin} for ${usd(latestTx.usd || 0)}`,
          );
        }
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
        case "binaryhistory":
          return <BinaryHistorySub back={bk} user={uu} re={re} />;
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
        return <TradePage nav={nav} px={px} onTrade={onTrade} coin={coin} />;
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
            localStorage.removeItem("tabRole");
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
                    {notifs.filter(n => !n.read).length > 0 && (
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
              <NotifPanel
                notifs={notifs}
                onClose={() => snp(false)}
                onDelete={(notifId) => {
                  if (user?.username) {
                    try {
                      const allNotifs = JSON.parse(
                        localStorage.getItem("user_notifications") || "{}",
                      );
                      const userNotifs = allNotifs[user.username] || [];
                      const updated = userNotifs.filter(
                        (n) => n.id !== notifId,
                      );
                      allNotifs[user.username] = updated;
                      localStorage.setItem(
                        "user_notifications",
                        JSON.stringify(allNotifs),
                      );
                    } catch (e) {
                      console.error("Failed to delete notification:", e);
                    }
                  }
                  sn((prev) => prev.filter((n) => n.id !== notifId));
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}