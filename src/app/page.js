"use client";
import { useState, useEffect, useCallback } from "react";
import { T, S, PE, usd, f2 } from "./lib/store";
import AdminPanel from "./components/AdminPanel";
import { WelcomeScreen, SignupScreen, LoginScreen } from "./components/Auth";
import { NotifPanel } from "./components/UI";
import { HomePage, NewsPage, MarketPage, HistoryPage, ProfilePage, AboutPage } from "./pages/AppPages";
import TradePage from "./pages/TradePage";
import { DepositPage, WithdrawPage } from "./pages/TransactionPages";
import { SecSub, CardSub, NotifSub, LangSub, TermsSub, EditSub } from "./pages/ProfileSubs";

function usePX() {
  const [p, sp] = useState({ ...PE.p });
  useEffect(() => PE.on(sp), []);
  return p;
}

const NAV = [
  { id: "home",    l: "Home",    d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" },
  { id: "market",  l: "Market",  d: "M18 20V10M12 20V4M6 20v-6" },
  { id: "history", l: "History", d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6v-4m0-4h.01" },
  { id: "profile", l: "Profile", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

export default function App() {
  const [scr,  ss]  = useState("welcome");
  const [user, su]  = useState(null);
  const [page, sp]  = useState("home");
  const [sub,  ssb] = useState(null);
  const [nPanel, snp] = useState(false);
  const [notifs, sn]  = useState([]);
  const [, tick]      = useState(0);
  const px = usePX();

  const re = useCallback(() => {
    const u = S.get();
    if (u) su({ ...u });
    tick((n) => n + 1);
  }, []);

  const auth   = (u) => { su({ ...u }); ss("app"); sp("home"); ssb(null); };
  const adm    = ()  => ss("admin");
  const logout = ()  => { S.session = null; su(null); ss("welcome"); sp("home"); ssb(null); };
  const nav    = (p) => { ssb(null); sp(p); };
  const addN   = (title, body) => sn((n) => [...n, { title, body, time: new Date().toLocaleTimeString() }]);

  const onDep = (amt) => {
    const u = S.get(); if (!u) return;
    u.balance = (u.balance || 0) + amt;
    u.transactions = u.transactions || [];
    u.transactions.unshift({ type: "Deposit", coin: "USD", usd: amt, date: new Date().toISOString().slice(0, 10), up: true });
    re(); addN("Deposit Successful", `${usd(amt)} added to your balance`);
  };

  const onWith = (amt) => {
    const u = S.get(); if (!u) return;
    u.balance = Math.max(0, (u.balance || 0) - amt);
    u.transactions = u.transactions || [];
    u.transactions.unshift({ type: "Withdraw", coin: "USD", usd: amt, date: new Date().toISOString().slice(0, 10), up: false });
    re(); addN("Withdrawal Requested", `${usd(amt)} being processed`);
  };

  const onTrade = () => {
    re();
    const u = S.get();
    if (u?.transactions?.length) {
      const tx = u.transactions[0];
      addN(`${tx.type} Filled`, `${tx.type} ${f2(tx.amount || 0, 4)} ${tx.coin} @ ${usd(tx.price || 0)}`);
    }
  };

  const isFloat = ["news", "deposit", "withdraw", "about", "trade"].includes(page);
 const u = S.get() || user || null;

  const renderContent = () => {
    if (page === "profile" && sub) {
      const bk = () => ssb(null);
      const uu = S.get() || user;
      switch (sub) {
        case "sec":   return <SecSub   back={bk} />;
        case "card":  return <CardSub  back={bk} user={uu} re={re} />;
        case "notif": return <NotifSub back={bk} />;
        case "lang":  return <LangSub  back={bk} />;
        case "terms": return <TermsSub back={bk} />;
        case "edit":  return <EditSub  back={bk} user={uu} re={re} />;
        default: break;
      }
    }
    switch (page) {
      case "home":     return <HomePage     nav={nav} px={px} user={u} />;
      case "trade":    return <TradePage    nav={nav} px={px} onTrade={onTrade} />;
      case "news":     return <NewsPage     nav={nav} />;
      case "deposit":  return <DepositPage  nav={nav} onDeposit={onDep} />;
      case "withdraw": return <WithdrawPage nav={nav} onWithdraw={onWith} user={u} />;
      case "about":    return <AboutPage    nav={nav} />;
      case "market":   return <MarketPage   px={px} nav={nav} />;
      case "history":  return <HistoryPage  user={u} />;
      case "profile":  return <ProfilePage  nav={nav} user={u} onLogout={logout} onSub={ssb} re={re} />;
      default: return null;
    }
  };

  // Admin — full page, no phone wrapper
  if (scr === "admin") {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "'Sora','Segoe UI',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box}button{font-family:inherit}`}</style>
        <AdminPanel onExit={() => ss("welcome")} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#020508", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Sora','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #2d4060; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(.4); }
        ::-webkit-scrollbar { display: none; }
        button { font-family: inherit; }
        @media(max-width:430px){ .pw{ width:100%!important; border-radius:0!important; min-height:100vh!important; max-height:none!important; } }
      `}</style>

      <div className="pw" style={{ width: 385, minHeight: 760, maxHeight: 820, background: T.bg, borderRadius: 42, boxShadow: "0 0 0 1px #1a2540,0 36px 90px rgba(0,0,0,0.9)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

        {scr === "welcome" && <WelcomeScreen go={ss} />}
        {scr === "signup"  && <SignupScreen  go={ss} onAuth={auth} />}
        {scr === "login"   && <LoginScreen   go={ss} onAuth={auth} onAdmin={adm} />}

        {scr === "app" && (
          <>
            {/* Top header */}
            {!isFloat && !sub && (
              <div style={{ padding: "15px 15px 7px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, background: "linear-gradient(135deg,#00e5b0,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CoinBase</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div onClick={() => snp(true)} style={{ width: 34, height: 34, background: T.card, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.line}`, cursor: "pointer", position: "relative" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                    {notifs.length > 0 && <div style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: T.red }} />}
                  </div>
                  <div onClick={() => nav("profile")} style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#00e5b0,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", cursor: "pointer" }}>
                    {((u?.fullName || u?.username) || "U")[0].toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {renderContent()}
            </div>

            {/* Bottom nav */}
            {!isFloat && !sub && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 70, background: T.card, borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 6px 4px", boxShadow: "0 -4px 16px rgba(0,0,0,0.5)" }}>
                {NAV.slice(0, 2).map((t) => (
                  <button key={t.id} onClick={() => nav(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingTop: 7 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={page === t.id ? T.acc : T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
                    <span style={{ fontSize: 9, color: page === t.id ? T.acc : T.dim, fontWeight: page === t.id ? 800 : 500 }}>{t.l}</span>
                  </button>
                ))}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div onClick={() => nav("trade")} style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#00e5b0,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,229,176,0.32)", cursor: "pointer", marginTop: -17 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" /></svg>
                  </div>
                  <span style={{ fontSize: 9, color: page === "trade" ? T.acc : T.dim, fontWeight: 500 }}>Trade</span>
                </div>
                {NAV.slice(2).map((t) => (
                  <button key={t.id} onClick={() => nav(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingTop: 7 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={page === t.id ? T.acc : T.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
                    <span style={{ fontSize: 9, color: page === t.id ? T.acc : T.dim, fontWeight: page === t.id ? 800 : 500 }}>{t.l}</span>
                  </button>
                ))}
              </div>
            )}

            {nPanel && <NotifPanel notifs={notifs} onClose={() => snp(false)} />}
          </>
        )}
      </div>
    </div>
  );
}
