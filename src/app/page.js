"use client";
import { useState, useEffect, useCallback, useRef, startTransition } from "react";
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

  useEffect(() => {
    S.hydrate();
    const current = S.get();

    if (current) {
      const username = current.username?.toLowerCase();
      const isBanned = (S.banned || []).some(
        (b) => b.toLowerCase() === username,
      );

      if (!isBanned) {
        const tabRole =
          sessionStorage.getItem("tabRole") || current.role || "user";

        startTransition(() => {
          setUser({ ...current });
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

    const checkSession = () => {
      const current = S.get();
      const bannedList = S.banned || [];

      if (!current) {
        if (scr === "app") {
          startTransition(() => {
            setUser(null);
            ss("login");
            sp("home");
            ssb(null);
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
        });
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

    // ✅ FIXED: remove JSON.stringify
    if (typeof window !== "undefined") {
      localStorage.setItem("session", username);
    }

    setUser(userObj);

    if (u.role === "admin") {
      sessionStorage.setItem("tabRole", "admin");
      ss("admin");
    } else {
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
    const newBalance = (u.balance || 0) + amt;
    const newTxns = [
      { type: "Deposit", coin: "USD", usd: amt, date: new Date().toISOString().slice(0, 10), up: true },
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
      { type: "Withdraw", coin: "USD", usd: amt, date: new Date().toISOString().slice(0, 10), up: false },
      ...(u.transactions || []),
    ];
    S.updateUser(u.username, { balance: newBalance, transactions: newTxns });
    re();
    addN("Withdrawal Requested", `${usd(amt)} being processed`);
  };

  const onTrade = (tradeInfo) => {
    re();
    if (tradeInfo) {
      addN(
        `${tradeInfo.action} Successful ✅`,
        `${tradeInfo.action === "Buy" ? "Purchased" : "Sold"} ${f2(tradeInfo.qty || 0, 4)} ${tradeInfo.coin} for ${usd(tradeInfo.cost || 0)}`,
      );
    }
  };

  const isFloat = ["news", "deposit", "withdraw", "about", "trade"].includes(page);
  const u = user;

  const renderContent = () => {
    if (page === "profile" && sub) {
      const bk = () => ssb(null);
      const uu = S.get() || user;
      switch (sub) {
        case "sec":
          return <SecSub back={bk} />;
        case "card":
          return <CardSub back={bk} user={uu} re={re} />;
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
        return <ProfilePage nav={nav} user={u} onLogout={logout} onSub={ssb} re={re} />;
      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
}