"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from "react";
import { T, PE, usd, f2 } from "./lib/store";
import { getUser } from "./lib/db";
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
  BinaryHistorySub,
} from "./pages/ProfileSubs";

const API_URL = "https://crypto-backend-production-11dc.up.railway.app";

function initLocalStorage() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem("banned")) {
    localStorage.setItem("banned", JSON.stringify([]));
  }

  if (!localStorage.getItem("admin_notifs")) {
    localStorage.setItem("admin_notifs", JSON.stringify([]));
  }

  if (localStorage.getItem("users")) {
    localStorage.removeItem("users");
    console.log("🗑️ Removed old users key");
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

  // Fetch notifications from MongoDB
  const fetchNotificationsFromDB = useCallback(async () => {
  const sessionUser = localStorage.getItem("session");
  // ✅ Skip for admin user
  if (!sessionUser || sessionUser === "admin") return [];
  
  try {
    const response = await fetch(`${API_URL}/api/users/${sessionUser}/notifications`);
    const data = await response.json();
    if (Array.isArray(data)) {
      sn(data);
      // Update localStorage cache
      const allNotifs = JSON.parse(localStorage.getItem("user_notifications") || "{}");
      allNotifs[sessionUser] = data;
      localStorage.setItem("user_notifications", JSON.stringify(allNotifs));
      return data;
    }
  } catch (err) {
    console.error("Failed to fetch notifications from DB:", err);
  }
  return [];
}, []);

  useEffect(() => {
    initLocalStorage();

    if (typeof window !== "undefined") {
      try {
        const cachedUsers = JSON.parse(
          localStorage.getItem("users_cache") || "{}",
        );
        const sessionUser = localStorage.getItem("session");

        if (sessionUser && cachedUsers[sessionUser]) {
          const userData = cachedUsers[sessionUser];
          const bannedList = JSON.parse(localStorage.getItem("banned") || "[]");
          const isBanned = bannedList.some(
            (b) => b.toLowerCase() === sessionUser.toLowerCase(),
          );

          if (!isBanned) {
            const tabRole =
              localStorage.getItem("tabRole") || userData.role || "user";

            startTransition(() => {
              setUser({ ...userData });
              // Load notifications from MongoDB
              fetchNotificationsFromDB();
              ss(tabRole === "admin" ? "admin" : "app");
            });
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load user from cache:", e);
      }
    }

    startTransition(() => {
      ss("welcome");
    });
  }, [fetchNotificationsFromDB]);

  useEffect(() => {
    if (scr === "loading") return;
    if (scr === "admin") return;

    const checkSession = async () => {
      if (typeof window === "undefined") return;

      const sessionUser = localStorage.getItem("session");
      if (!sessionUser) {
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

      const bannedList = JSON.parse(localStorage.getItem("banned") || "[]");
      const isBanned = bannedList.some(
        (b) => b.toLowerCase() === sessionUser.toLowerCase(),
      );

      if (isBanned) {
        localStorage.removeItem("session");
        localStorage.removeItem("tabRole");
        startTransition(() => {
          setUser(null);
          ss("login");
          sp("home");
          ssb(null);
          sn([]);
        });
        return;
      }

      if (scr === "app" && sessionUser && sessionUser !== "admin") {
        try {
          const freshUser = await getUser(sessionUser, true);

          if (freshUser && freshUser.error === "User not found") {
            console.log("User not found in DB, logging out");
            localStorage.removeItem("session");
            localStorage.removeItem("tabRole");
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
            const cache = JSON.parse(
              localStorage.getItem("users_cache") || "{}",
            );
            const cachedUser = cache[sessionUser] || {};

            const updatedUser = {
              ...cachedUser,
              ...freshUser,
              balance: freshUser.balance ?? cachedUser.balance,
              transactions: freshUser.transactions || cachedUser.transactions,
              holdings: freshUser.holdings || cachedUser.holdings,
              creditScore: freshUser.creditScore ?? cachedUser.creditScore,
            };

            cache[sessionUser] = { ...updatedUser, _cachedAt: Date.now() };
            localStorage.setItem("users_cache", JSON.stringify(cache));
            setUser(updatedUser);
            
            // Refresh notifications
            fetchNotificationsFromDB();
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
  }, [scr, fetchNotificationsFromDB]);

  const re = useCallback(async () => {
    if (typeof window !== "undefined") {
      const sessionUser = localStorage.getItem("session");
      if (sessionUser) {
        const freshUser = await fetch(
          `${API_URL}/api/users/${sessionUser}`,
        ).then((r) => r.json());
        if (freshUser && !freshUser.error) {
          const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
          cache[sessionUser] = { ...freshUser, _cachedAt: Date.now() };
          localStorage.setItem("users_cache", JSON.stringify(cache));
          setUser(freshUser);
        }
      }
    }
    tick((n) => n + 1);
  }, []);

  const auth = async (u) => {
    if (!u) return;

    const username = u.username.toLowerCase().trim();

    console.log("🔐 Auth function called for:", username);

    try {
      const dbUser = await getUser(username, true);

      if (dbUser && !dbUser.error) {
        console.log("📡 User found in database, using DB data");

        const userObj = {
          username: dbUser.username,
          email: dbUser.email || u.email || "",
          fullName: dbUser.fullName || u.fullName || username,
          role: dbUser.role || u.role || "user",
          phone: dbUser.phone || u.phone || "",
          dob: dbUser.dob || u.dob || "",
          country: dbUser.country || u.country || "—",
          creditScore: dbUser.creditScore ?? 50,
          isBanned: dbUser.isBanned ?? false,
          balance: dbUser.balance ?? 0,
          transactions: dbUser.transactions || [],
          holdings: dbUser.holdings || {},
          savedCards: dbUser.savedCards || [],
          loggedInAt: Date.now(),
        };

        if (typeof window !== "undefined") {
          const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
          cache[username] = { ...userObj, _cachedAt: Date.now() };
          localStorage.setItem("users_cache", JSON.stringify(cache));
          localStorage.setItem("session", username);
        }

        setUser(userObj);
        
        // Load notifications from MongoDB
        const notifResponse = await fetch(`${API_URL}/api/users/${username}/notifications`);
        const notifData = await notifResponse.json();
        if (Array.isArray(notifData)) {
          sn(notifData);
          const allNotifs = JSON.parse(localStorage.getItem("user_notifications") || "{}");
          allNotifs[username] = notifData;
          localStorage.setItem("user_notifications", JSON.stringify(allNotifs));
          localStorage.setItem("lastNotifUser", username);
        } else {
          sn([]);
        }
      } else {
        console.log("🆕 New user, please sign up first");

        const userObj = {
          username,
          email: u.email || "",
          fullName: u.fullName || username,
          role: u.role || "user",
          phone: u.phone || "",
          dob: u.dob || "",
          country: u.country || "—",
          balance: 0,
          creditScore: 50,
          transactions: [],
          holdings: {},
          savedCards: [],
          loggedInAt: Date.now(),
        };

        if (typeof window !== "undefined") {
          const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
          cache[username] = { ...userObj, _cachedAt: Date.now() };
          localStorage.setItem("users_cache", JSON.stringify(cache));
          localStorage.setItem("session", username);
        }

        setUser(userObj);
        sn([]);
      }

      if (u.role === "admin" || username === "admin") {
        localStorage.setItem("tabRole", "admin");
        ss("admin");
      } else {
        localStorage.setItem("tabRole", "user");
        ss("app");
        sp("home");
        ssb(null);
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  const adm = () => {
    localStorage.setItem("tabRole", "admin");
    ss("admin");
  };

  const logout = () => {
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
      read: false,
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
    const sessionUser =
      typeof window !== "undefined" ? localStorage.getItem("session") : null;
    if (!sessionUser) return;

    const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
    const currentUser = cache[sessionUser];
    if (!currentUser) return;

    const newBalance = (currentUser.balance || 0) + amt;
    const newTxns = [
      {
        type: "Deposit",
        coin: "USD",
        usd: amt,
        date: new Date().toISOString().slice(0, 10),
        up: true,
      },
      ...(currentUser.transactions || []),
    ];

    currentUser.balance = newBalance;
    currentUser.transactions = newTxns;
    cache[sessionUser] = { ...currentUser, _cachedAt: Date.now() };
    localStorage.setItem("users_cache", JSON.stringify(cache));

    re();
    addN("Deposit Successful", `${usd(amt)} added to your balance`);
  };

  const onWith = (amt) => {
    const sessionUser =
      typeof window !== "undefined" ? localStorage.getItem("session") : null;
    if (!sessionUser) return;

    const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
    const currentUser = cache[sessionUser];
    if (!currentUser) return;

    const newBalance = Math.max(0, (currentUser.balance || 0) - amt);
    const newTxns = [
      {
        type: "Withdraw",
        coin: "USD",
        usd: amt,
        date: new Date().toISOString().slice(0, 10),
        up: false,
      },
      ...(currentUser.transactions || []),
    ];

    currentUser.balance = newBalance;
    currentUser.transactions = newTxns;
    cache[sessionUser] = { ...currentUser, _cachedAt: Date.now() };
    localStorage.setItem("users_cache", JSON.stringify(cache));

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
    }
  };

  const onCardDeposit = (amt) => onDep(amt);

  const isFloat = ["news", "deposit", "withdraw", "about", "trade"].includes(
    page,
  );
  const u = user;

  // Calculate unread count for notification bell
  const unreadCount = notifs.filter(n => !n.read).length;

  const renderContent = () => {
    if (page === "profile" && sub) {
      const bk = () => ssb(null);
      const sessionUser =
        typeof window !== "undefined" ? localStorage.getItem("session") : null;
      const cache =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("users_cache") || "{}")
          : {};
      const uu = (sessionUser && cache[sessionUser]) || user;

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
          return <NotifSub back={bk} userNotifs={notifs} onMarkRead={() => fetchNotificationsFromDB()} />;
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
                    
                    {/* Number badge instead of red dot */}
                    {unreadCount > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: -2,
                          right: -2,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 8,
                          background: T.red,
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 4px",
                        }}
                      >
                        {unreadCount > 4 ? "4+" : unreadCount}
                      </div>
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
                onDelete={async (notifId) => {
                  if (user?.username) {
                    try {
                      // Delete from MongoDB
                      await fetch(`${API_URL}/api/users/${user.username}/notifications/${notifId}`, {
                        method: "DELETE",
                      });
                      // Refresh notifications
                      const updated = await fetch(`${API_URL}/api/users/${user.username}/notifications`).then(r => r.json());
                      if (Array.isArray(updated)) {
                        sn(updated);
                        const allNotifs = JSON.parse(localStorage.getItem("user_notifications") || "{}");
                        allNotifs[user.username] = updated;
                        localStorage.setItem("user_notifications", JSON.stringify(allNotifs));
                      }
                    } catch (e) {
                      console.error("Failed to delete notification:", e);
                    }
                  }
                }}
                onMarkRead={async (notifId) => {
                  if (user?.username) {
                    try {
                      await fetch(`${API_URL}/api/users/${user.username}/notifications/read`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notificationId: notifId }),
                      });
                      // Refresh notifications
                      const updated = await fetch(`${API_URL}/api/users/${user.username}/notifications`).then(r => r.json());
                      if (Array.isArray(updated)) {
                        sn(updated);
                        const allNotifs = JSON.parse(localStorage.getItem("user_notifications") || "{}");
                        allNotifs[user.username] = updated;
                        localStorage.setItem("user_notifications", JSON.stringify(allNotifs));
                      }
                    } catch (e) {
                      console.error("Failed to mark notification read:", e);
                    }
                  }
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}