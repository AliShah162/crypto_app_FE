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
import { API_URL } from "./lib/config";
import VirtualAdminLogin from "./components/VirtualAdminLogin";

// ─── Global styles injected once ───────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Sora', 'Segoe UI', sans-serif;
    background: #030508;
    color: #f1f5f9;
    overflow: hidden;
  }

  /* scrollbars */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 4px; }

  /* responsive nav sidebar collapse */
  @media (max-width: 900px) {
    .desktop-sidebar { display: none !important; }
    .bottom-nav       { display: flex   !important; }
    .main-content     { padding-left: 0 !important; padding-bottom: 70px !important; }
  }
  @media (min-width: 901px) {
    .bottom-nav { display: none !important; }
  }

  /* auth screens responsive */
  @media (max-width: 540px) {
    .auth-card { width: 100% !important; border-radius: 0 !important; min-height: 100vh !important; }
  }
`;

function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("app-global-styles")) return;
  const s = document.createElement("style");
  s.id = "app-global-styles";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

function initLocalStorage() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("banned")) localStorage.setItem("banned", JSON.stringify([]));
  if (!localStorage.getItem("admin_notifs")) localStorage.setItem("admin_notifs", JSON.stringify([]));
  if (localStorage.getItem("users")) {
    localStorage.removeItem("users");
  }
}

function usePX() {
  const [p, sp] = useState({ ...PE.p });
  useEffect(() => PE.on(sp), []);
  return p;
}

const NAV = [
  { id: "home",    l: "Home",    d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" },
  { id: "market",  l: "Market",  d: "M18 20V10M12 20V4M6 20v-6" },
  { id: "trade",   l: "Trade",   d: "M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" },
  { id: "history", l: "History", d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6v-4m0-4h.01" },
  { id: "profile", l: "Profile", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

// ─── Sidebar Nav Item ────────────────────────────────────────────────────────
function SideNavItem({ item, active, onClick }) {
  const isActive = active === item.id;
  return (
    <button
      onClick={() => onClick(item.id)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderRadius: 14,
        border: "none",
        background: isActive ? "rgba(0,229,176,0.13)" : "transparent",
        color: isActive ? "#00e5b0" : "#4b6080",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
        textAlign: "left",
      }}
    >
      {/* Active indicator bar */}
      <div style={{
        width: 3,
        height: 18,
        borderRadius: 3,
        background: isActive ? "#00e5b0" : "transparent",
        marginRight: 4,
        flexShrink: 0,
        transition: "background 0.15s",
      }} />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={item.d} />
      </svg>
      <span>{item.l}</span>
    </button>
  );
}

// ─── Desktop Sidebar ─────────────────────────────────────────────────────────
function DesktopSidebar({ page, nav, user, unreadCount, onNotif, onLogout }) {
  return (
    <div
      className="desktop-sidebar"
      style={{
        width: 220,
        minWidth: 220,
        height: "100vh",
        background: T.card,
        borderRight: `1px solid ${T.line}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{
        fontSize: 22,
        fontWeight: 900,
        background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: 32,
        paddingLeft: 6,
        letterSpacing: -0.5,
      }}>
        CoinBase
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {NAV.map((item) => (
          <SideNavItem key={item.id} item={item} active={page} onClick={nav} />
        ))}
      </div>

      {/* Bottom user card */}
      {user && (
        <div style={{
          borderTop: `1px solid ${T.line}`,
          paddingTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {/* Notification button */}
          <button
            onClick={onNotif}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 14,
              border: "none",
              background: "transparent",
              color: T.dim,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              position: "relative",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <div style={{
                marginLeft: "auto",
                minWidth: 18, height: 18,
                borderRadius: 9,
                background: T.red,
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>

          {/* User row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${T.line}`,
          }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0,
            }}>
              {(user?.fullName || user?.username || "U")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{ fontSize: 10, color: T.acc, fontWeight: 600 }}>
                {usd(user?.balance || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Nav (mobile fallback) ────────────────────────────────────────────
function BottomNav({ page, nav }) {
  return (
    <div
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: T.card,
        borderTop: `1px solid ${T.line}`,
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px 2px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
        zIndex: 100,
      }}
    >
      {NAV.slice(0, 2).map((t) => (
        <button key={t.id} onClick={() => nav(t.id)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 6,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={page === t.id ? T.acc : T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.d} />
          </svg>
          <span style={{ fontSize: 9, color: page === t.id ? T.acc : T.dim, fontWeight: page === t.id ? 800 : 500 }}>{t.l}</span>
        </button>
      ))}

      {/* Center trade button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <div onClick={() => nav("trade")} style={{
          width: 46, height: 46, borderRadius: "50%",
          background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,229,176,0.32)",
          cursor: "pointer", marginTop: -14,
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
          </svg>
        </div>
        <span style={{ fontSize: 9, color: page === "trade" ? T.acc : T.dim, fontWeight: 500 }}>Trade</span>
      </div>

      {NAV.slice(3).map((t) => (
        <button key={t.id} onClick={() => nav(t.id)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 6,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={page === t.id ? T.acc : T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.d} />
          </svg>
          <span style={{ fontSize: 9, color: page === t.id ? T.acc : T.dim, fontWeight: page === t.id ? 800 : 500 }}>{t.l}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Top Bar (desktop only, shown in app) ────────────────────────────────────
function TopBar({ page, user, unreadCount, onNotif }) {
  const pageTitles = {
    home: "Dashboard", market: "Markets", trade: "Trade", history: "History",
    profile: "Profile", news: "News", deposit: "Deposit", withdraw: "Withdraw", about: "About",
  };
  return (
    <div style={{
      height: 60,
      borderBottom: `1px solid ${T.line}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      background: T.bg,
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
        {pageTitles[page] || ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Balance pill */}
        {user && (
          <div style={{
            padding: "6px 14px",
            borderRadius: 20,
            background: "rgba(0,229,176,0.1)",
            border: "1px solid rgba(0,229,176,0.2)",
            fontSize: 13,
            fontWeight: 700,
            color: T.acc,
          }}>
            {usd(user?.balance || 0)}
          </div>
        )}
        {/* Notif bell */}
        <div onClick={onNotif} style={{
          width: 36, height: 36,
          background: T.card,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${T.line}`,
          cursor: "pointer",
          position: "relative",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <div style={{
              position: "absolute", top: -2, right: -2,
              minWidth: 16, height: 16, borderRadius: 8,
              background: T.red, color: "#fff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App Component ──────────────────────────────────────────────────────
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
  const [virtualAdmin, setVirtualAdmin] = useState(null);

  useEffect(() => { injectGlobalStyles(); }, []);

  const fetchNotificationsFromDB = useCallback(async () => {
    const sessionUser = localStorage.getItem("session");
    if (!sessionUser || sessionUser === "admin") return [];
    try {
      const response = await fetch(`${API_URL}/api/users/${sessionUser}/notifications`);
      const data = await response.json();
      if (Array.isArray(data)) { sn(data); return data; }
    } catch (err) {
      console.error("Failed to fetch notifications from DB:", err);
    }
    return [];
  }, []);

  useEffect(() => {
    initLocalStorage();
    if (typeof window !== "undefined") {
      try {
        const cachedUsers = JSON.parse(localStorage.getItem("users_cache") || "{}");
        const sessionUser = localStorage.getItem("session");
        if (sessionUser && cachedUsers[sessionUser]) {
          const userData = cachedUsers[sessionUser];
          const bannedList = JSON.parse(localStorage.getItem("banned") || "[]");
          const isBanned = bannedList.some((b) => b.toLowerCase() === sessionUser.toLowerCase());
          if (!isBanned) {
            const tabRole = localStorage.getItem("tabRole") || userData.role || "user";
            startTransition(() => {
              setUser({ ...userData });
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
    startTransition(() => { ss("welcome"); });
  }, [fetchNotificationsFromDB]);

  useEffect(() => {
    if (scr === "loading" || scr === "admin") return;
    const checkSession = async () => {
      if (typeof window === "undefined") return;
      const sessionUser = localStorage.getItem("session");
      if (!sessionUser) {
        if (scr === "app") {
          startTransition(() => { setUser(null); ss("login"); sp("home"); ssb(null); sn([]); });
        }
        return;
      }
      const bannedList = JSON.parse(localStorage.getItem("banned") || "[]");
      const isBanned = bannedList.some((b) => b.toLowerCase() === sessionUser.toLowerCase());
      if (isBanned) {
        localStorage.removeItem("session");
        localStorage.removeItem("tabRole");
        startTransition(() => { setUser(null); ss("login"); sp("home"); ssb(null); sn([]); });
        return;
      }
      if (scr === "app" && sessionUser && sessionUser !== "admin") {
        try {
          const freshUser = await getUser(sessionUser, true);
          if (freshUser && freshUser.error === "User not found") {
            localStorage.removeItem("session");
            localStorage.removeItem("tabRole");
            startTransition(() => { setUser(null); ss("login"); sp("home"); ssb(null); sn([]); });
            return;
          }
          if (freshUser && !freshUser.error) {
            const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
            const cachedUser = cache[sessionUser] || {};
            const updatedUser = {
              ...cachedUser, ...freshUser,
              balance: freshUser.balance ?? cachedUser.balance,
              transactions: freshUser.transactions || cachedUser.transactions,
              creditScore: freshUser.creditScore ?? cachedUser.creditScore,
            };
            cache[sessionUser] = { ...updatedUser, _cachedAt: Date.now() };
            localStorage.setItem("users_cache", JSON.stringify(cache));
            setUser(updatedUser);
            fetchNotificationsFromDB();
          }
        } catch (err) {
          console.error("Failed to fetch fresh user data:", err);
        }
      }
    };
    window.addEventListener("storage", checkSession);
    window.addEventListener("focus", checkSession);
    const interval = setInterval(checkSession, 30000);
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
        const freshUser = await fetch(`${API_URL}/api/users/${sessionUser}`).then((r) => r.json());
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

  useEffect(() => {
    const savedVA = localStorage.getItem("virtualAdmin");
    if (savedVA) setVirtualAdmin(JSON.parse(savedVA));
    const handleVALogin = (e) => setVirtualAdmin(e.detail);
    window.addEventListener("virtualAdminLogin", handleVALogin);
    return () => window.removeEventListener("virtualAdminLogin", handleVALogin);
  }, []);

  const auth = async (u) => {
    if (!u) return;
    const username = u.username.toLowerCase().trim();
    try {
      const dbUser = await getUser(username, true);
      if (dbUser && !dbUser.error) {
        const userObj = {
          username: dbUser.username,
          email: dbUser.email || u.email || "",
          fullName: dbUser.fullName || u.fullName || username,
          role: dbUser.role || u.role || "user",
          phone: dbUser.phone || u.phone || "",
          country: dbUser.country || u.country || "—",
          creditScore: dbUser.creditScore ?? 50,
          isBanned: dbUser.isBanned ?? false,
          balance: dbUser.balance ?? 0,
          transactions: dbUser.transactions || [],
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
        const notifResponse = await fetch(`${API_URL}/api/users/${username}/notifications`);
        const notifData = await notifResponse.json();
        sn(Array.isArray(notifData) ? notifData : []);
      } else {
        const userObj = {
          username, email: u.email || "", fullName: u.fullName || username,
          role: u.role || "user", phone: u.phone || "", country: u.country || "—",
          balance: 0, creditScore: 50, transactions: [], savedCards: [], loggedInAt: Date.now(),
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

  const adm = () => { localStorage.setItem("tabRole", "admin"); ss("admin"); };

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

  const nav = (p, c) => {
    ssb(null);
    sp(p);
    if (p === "trade" && c) ssCoin(c);
  };

  const addN = async (title, body) => {
    if (!user?.username) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${user.username}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, type: "general" }),
      });
      if (response.ok) await fetchNotificationsFromDB();
    } catch (e) {
      console.error("Failed to save notification:", e);
    }
  };

  const onDep = (amt) => {
    const sessionUser = typeof window !== "undefined" ? localStorage.getItem("session") : null;
    if (!sessionUser) return;
    const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
    const currentUser = cache[sessionUser];
    if (!currentUser) return;
    currentUser.balance = (currentUser.balance || 0) + amt;
    currentUser.transactions = [
      { type: "Deposit", coin: "USD", usd: amt, date: new Date().toISOString().slice(0, 10), up: true },
      ...(currentUser.transactions || []),
    ];
    cache[sessionUser] = { ...currentUser, _cachedAt: Date.now() };
    localStorage.setItem("users_cache", JSON.stringify(cache));
    re();
    addN("Deposit Successful", `${usd(amt)} added to your balance`);
  };

  const onWith = (amt) => {
    const sessionUser = typeof window !== "undefined" ? localStorage.getItem("session") : null;
    if (!sessionUser) return;
    const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
    const currentUser = cache[sessionUser];
    if (!currentUser) return;
    currentUser.balance = Math.max(0, (currentUser.balance || 0) - amt);
    currentUser.transactions = [
      { type: "Withdraw", coin: "USD", usd: amt, date: new Date().toISOString().slice(0, 10), up: false },
      ...(currentUser.transactions || []),
    ];
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
        addN(`🎉 Binary Trade WIN!`, `You won ${usd(profitAmount)} on ${tradeInfo.coin} (${tradeInfo.tradeDetails?.duration}s ${tradeInfo.tradeDetails?.orderType?.toUpperCase()})`);
      } else {
        addN(`💔 Binary Trade LOSS`, `You lost ${usd(tradeInfo.amount)} on ${tradeInfo.coin}`);
      }
    }
  };

  const onCardDeposit = (amt) => onDep(amt);
  const u = user;
  const unreadCount = notifs.filter((n) => !n.read).length;

  // ── renderContent ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (page === "profile" && sub) {
      const bk = () => ssb(null);
      const sessionUser = typeof window !== "undefined" ? localStorage.getItem("session") : null;
      const cache = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("users_cache") || "{}") : {};
      const uu = (sessionUser && cache[sessionUser]) || user;
      switch (sub) {
        case "binaryhistory": return <BinaryHistorySub back={bk} user={uu} re={re} />;
        case "sec": return <SecSub back={bk} />;
        case "card": return <CardSub back={bk} user={uu} re={re} onCardDeposit={onCardDeposit} />;
        case "notif": return <NotifSub back={bk} userNotifs={notifs} onMarkRead={() => fetchNotificationsFromDB()} />;
        case "lang": return <LangSub back={bk} />;
        case "terms": return <TermsSub back={bk} />;
        case "edit": return <EditSub back={bk} user={uu} re={re} />;
        default: break;
      }
    }
    switch (page) {
      case "home":    return <HomePage nav={nav} px={px} user={u} />;
      case "trade":   return <TradePage nav={nav} px={px} onTrade={onTrade} coin={coin} />;
      case "news":    return <NewsPage nav={nav} />;
      case "deposit": return <DepositPage nav={nav} onDeposit={onDep} />;
      case "withdraw":return <WithdrawPage nav={nav} onWithdraw={onWith} user={u} />;
      case "about":   return <AboutPage nav={nav} />;
      case "market":  return <MarketPage px={px} nav={nav} />;
      case "history": return <HistoryPage user={u} onBack={() => nav("home")} />;
      case "profile": return <ProfilePage nav={nav} user={u} onLogout={logout} onSub={ssb} re={re} />;
      default: return null;
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (scr === "loading") {
    return (
      <div style={{
        minHeight: "100vh", background: "#030508",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Sora','Segoe UI',sans-serif",
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#00e5b0" }}>
          Coin<span style={{ color: "#3b82f6" }}>Base</span>
        </div>
      </div>
    );
  }

  // ── Virtual Admin ────────────────────────────────────────────────────────
  if (virtualAdmin) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "'Sora','Segoe UI',sans-serif" }}>
        <AdminPanel
          virtualAdminRefKey={virtualAdmin.refKey}
          virtualAdminName={virtualAdmin.adminName}
          onBack={() => {
            localStorage.removeItem("virtualAdmin");
            localStorage.removeItem("tabRole");
            setVirtualAdmin(null);
            ss("welcome");
            setUser(null);
          }}
        />
      </div>
    );
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  if (scr === "admin") {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "'Sora','Segoe UI',sans-serif" }}>
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

  // ── Auth screens (welcome / signup / login) ──────────────────────────────
  if (scr === "welcome" || scr === "signup" || scr === "login") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#030508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Sora','Segoe UI',sans-serif",
        padding: 20,
      }}>
        {/* Decorative background grid */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(0,229,176,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,229,176,0.03) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        {/* Left panel — only visible on large screens */}
        <div style={{
          display: "none",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 60px",
          maxWidth: 480,
          flex: 1,
        }}
          className="auth-left-panel"
        >
          <style>{`@media(min-width:900px){.auth-left-panel{display:flex!important}}`}</style>

          <div style={{
            fontSize: 36, fontWeight: 900,
            background: "linear-gradient(135deg,#00e5b0,#3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 16,
          }}>
            CoinBase
          </div>
          <div style={{ fontSize: 16, color: T.dim, lineHeight: 1.7, maxWidth: 360 }}>
            Trade crypto assets with confidence. Real-time prices, binary options, portfolio tracking — all in one place.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
            {["Live Prices", "Binary Options", "Instant Deposits", "Portfolio Tracking", "Secure"].map((f) => (
              <div key={f} style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid rgba(0,229,176,0.2)",
                background: "rgba(0,229,176,0.06)",
                fontSize: 12,
                fontWeight: 600,
                color: T.acc,
              }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div
          className="auth-card"
          style={{
            width: 400,
            minHeight: 500,
            background: T.card,
            borderRadius: 32,
            boxShadow: "0 0 0 1px #1a2540, 0 40px 100px rgba(0,0,0,0.8)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {scr === "welcome" && <WelcomeScreen go={ss} />}
          {scr === "signup" && <SignupScreen go={ss} onAuth={auth} />}
          {scr === "login" && <LoginScreen go={ss} onAuth={auth} onAdmin={adm} />}
        </div>
      </div>
    );
  }

  // ── Main App (authenticated) ─────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh",
      background: T.bg,
      display: "flex",
      fontFamily: "'Sora','Segoe UI',sans-serif",
      overflow: "hidden",
    }}>
      {/* Desktop Sidebar */}
      <DesktopSidebar
        page={page}
        nav={nav}
        user={u}
        unreadCount={unreadCount}
        onNotif={() => snp(true)}
        onLogout={logout}
      />

      {/* Main area */}
      <div
        className="main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <TopBar
          page={page}
          user={u}
          unreadCount={unreadCount}
          onNotif={() => snp(true)}
        />

        {/* Page content */}
        <div style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {renderContent()}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav page={page} nav={nav} />

      {/* Notification Panel */}
      {nPanel && (
        <NotifPanel
          notifs={notifs}
          onClose={() => snp(false)}
          onDelete={async (notifId) => {
            if (user?.username) {
              try {
                await fetch(`${API_URL}/api/users/${user.username}/notifications/${notifId}`, { method: "DELETE" });
                await fetchNotificationsFromDB();
              } catch (e) {
                console.error("Failed to delete notification:", e);
              }
            }
          }}
          onDeleteAll={async () => {
            if (user?.username) {
              try {
                const response = await fetch(`${API_URL}/api/users/${user.username}/notifications/all`, { method: "DELETE" });
                const data = await response.json();
                if (data.success) sn([]);
              } catch (e) {
                console.error("Failed to delete all notifications:", e);
              }
            }
          }}
        />
      )}
    </div>
  );
}