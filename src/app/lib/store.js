"use client";

// ═══════════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════════

export const ADMIN_USER = "admin";
export const ADMIN_PASS = "CoinAdmin@2026";

// ───── Safe LocalStorage Helpers ─────
function loadLS(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ───── CORE STATE ─────
export const S = {
  users: {},
  session: null,
  banned: [],
  _hydrated: false,
  
  _ensureBaseKeys() {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem("users")) {
      localStorage.setItem("users", JSON.stringify({}));
    }

    if (!localStorage.getItem("banned")) {
      localStorage.setItem("banned", JSON.stringify([]));
    }

    if (!localStorage.getItem("session")) {
      localStorage.setItem("session", JSON.stringify(null));
    }
  },

  hydrate() {
    if (this._hydrated) return;

    const users = loadLS("users", {});
    const banned = loadLS("banned", []);
    const rawSession = loadLS("session", null);

    this.users = users && typeof users === "object" ? users : {};
    this.banned = Array.isArray(banned) ? banned : [];

    if (typeof rawSession === "string" && rawSession.trim()) {
      this.session = rawSession.toLowerCase().trim();
    } else if (rawSession && typeof rawSession === "object" && rawSession.username) {
      this.session = rawSession.username.toLowerCase().trim();
      saveLS("session", this.session);
    } else {
      this.session = null;
      saveLS("session", null);
    }

    if (!this.users || typeof this.users !== "object") {
  this.users = {};
  localStorage.setItem("users", JSON.stringify(this.users));
}

    for (const u of Object.values(this.users)) {
      u.creditScore = Math.max(0, Math.min(100, Number(u.creditScore ?? 50)));
    }

    if (this.session && this.banned.includes(this.session)) {
      this.session = null;
      saveLS("session", null);
    }

    this._hydrated = true;
    this._ensureBaseKeys();
  },

  get() {
    this.hydrate();
    return this.session ? (this.users[this.session] || null) : null;
  },

  setSession(user) {
    this.hydrate();

    if (!user) {
      this.session = null;
      saveLS("session", null);
      return;
    }

    const username =
      typeof user === "string"
        ? user.toLowerCase().trim()
        : user.username?.toLowerCase().trim();

    if (!username) return;

    this.session = username;
    saveLS("session", username);
  },

  logout() {
    this.session = null;
    saveLS("session", null);
  },

  addUser(username, data) {
    this.hydrate();
    const u = username.toLowerCase().trim();

    if (this.users[u]) return { error: "User already exists" };

    for (const user of Object.values(this.users)) {
      if (user.email && user.email === data.email?.toLowerCase()) {
        return { error: "Email already exists" };
      }
    }

    this.users[u] = {
      username: u,
      email: data.email?.toLowerCase() || "",
      password: data.password || "",
      fullName: data.fullName || "",
      phone: data.phone || "",
      dob: data.dob || "",
      country: data.country || "",
      balance: 0,
      creditScore: 50,
      transactions: [],
      holdings: {},
      savedCards: [],
    };

    saveLS("users", this.users);
    return this.users[u];
  },

  updateUser(username, data) {
    this.hydrate();
    const u = username.toLowerCase().trim();
    if (!this.users[u]) return null;

    this.users[u] = { ...this.users[u], ...data };
    saveLS("users", this.users);
    return this.users[u];
  },

  // Force save user data directly to localStorage
  forceSaveUser(username, userData) {
    if (typeof window === "undefined") return null;
    this.hydrate();
    const u = username.toLowerCase().trim();
    
    if (!userData && !this.users[u]) return null;
    
    this.users[u] = userData || { ...this.users[u] };
    saveLS("users", this.users);
    
    // Also trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent("storage", {
      key: "users",
      newValue: JSON.stringify(this.users)
    }));
    
    return this.users[u];
  },

  deleteUser(username) {
    this.hydrate();
    const u = username.toLowerCase().trim();
    const updated = {};
    for (const key in this.users) {
      if (key !== u) updated[key] = this.users[key];
    }
    this.users = updated;

    if (this.session === u) {
      this.session = null;
      saveLS("session", null);
    }

    this.banned = this.banned.filter((x) => x !== u);
    saveLS("users", this.users);
    saveLS("banned", this.banned);
  },

  banUser(username) {
    this.hydrate();
    const u = username.toLowerCase().trim();
    if (!this.banned.includes(u)) this.banned.push(u);

    if (this.session === u) {
      this.session = null;
      saveLS("session", null);
    }

    saveLS("banned", this.banned);
  },

  setCreditScore(username, value) {
    this.hydrate();
    const u = username.toLowerCase().trim();
    if (!this.users[u]) return;

    this.users[u].creditScore = Math.max(0, Math.min(100, Number(value) || 50));
    saveLS("users", this.users);
  },
};

// ───── PRICE ENGINE ─────
const BASES = {
  BTC: 71320, ETH: 2251, LINK: 9.19, SOL: 148,
  XMR: 0.004, MATIC: 0.89, BNB: 612,
  XRP: 0.62, ADA: 0.45, DOGE: 0.18, BTG: 455.7,
};

export const PE = {
  p: { ...BASES },
  h: {},
  cb: [],

  _candle(open, close, t) {
    const lo = Math.min(open, close) * (1 - Math.random() * 0.003);
    const hi = Math.max(open, close) * (1 + Math.random() * 0.003);
    return { t, o: open, h: hi, l: lo, c: close };
  },

  tick() {
    for (const id in this.p) {
      if (!this.h[id]) this.h[id] = [];
      const prev =
        this.h[id].length > 0
          ? this.h[id][this.h[id].length - 1].c
          : this.p[id];

      const close = prev * (1 + (Math.random() - 0.499) * 0.0009);
      this.p[id] = close;

      this.h[id].push(this._candle(prev, close, Date.now()));
      if (this.h[id].length > 120) this.h[id].shift();
    }

    this.cb.forEach((f) => f({ ...this.p }));
  },

  init() {
    for (const id in this.p) {
      this.h[id] = [];
      let v = this.p[id];
      for (let i = 0; i < 80; i++) {
        const open = v;
        v = v * (1 + (Math.random() - 0.499) * 0.0013);
        this.h[id].push(this._candle(open, v, Date.now() - (80 - i) * 1500));
      }
    }
    setInterval(() => this.tick(), 1500);
  },

  on(f) {
    this.cb.push(f);
    return () => {
      this.cb = this.cb.filter((x) => x !== f);
    };
  },
};

PE.init();

// ───── COINS ─────
export const COINS = [
  { id: "BTC", name: "Bitcoin", sym: "₿", cl: "#f59e0b", bg: "#78350f" },
  { id: "ETH", name: "Ethereum", sym: "Ξ", cl: "#818cf8", bg: "#312e81" },
  { id: "LINK", name: "Chainlink", sym: "⬡", cl: "#60a5fa", bg: "#1e3a5f" },
  { id: "SOL", name: "Solana", sym: "◎", cl: "#34d399", bg: "#064e3b" },
  { id: "XMR", name: "Monero", sym: "◈", cl: "#fb923c", bg: "#431407" },
  { id: "MATIC", name: "Polygon", sym: "⬟", cl: "#a78bfa", bg: "#2e1065" },
  { id: "BNB", name: "Binance Coin", sym: "🟡", cl: "#f3ba2f", bg: "#3a2a05" },
  { id: "XRP", name: "XRP", sym: "✕", cl: "#94a3b8", bg: "#1e293b" },
  { id: "ADA", name: "Cardano", sym: "₳", cl: "#3b82f6", bg: "#172554" },
  { id: "DOGE", name: "Dogecoin", sym: "Ð", cl: "#eab308", bg: "#422006" },
  { id: "BTG", name: "Bitcoin Gold", sym: "Ƀ", cl: "#f59e0b", bg: "#451a03" },
];

export const NEWS = [
  { src: "WSJ", cl: "#ef4444", ts: "2026-04-08 16:22", ttl: "Stock Market Today", body: "Markets reacted sharply..." },
  { src: "CNBC", cl: "#3b82f6", ts: "2026-04-08 16:18", ttl: "Dow futures jump", body: "A rally sparked..." },
  { src: "BBG", cl: "#a78bfa", ts: "2026-04-08 15:44", ttl: "Bitcoin surges", body: "ETF inflows..." },
  { src: "MktW", cl: "#00e5b0", ts: "2026-04-08 15:10", ttl: "Market update", body: "Analysts warn..." },
];

export const T = {
  bg: "#07090f",
  card: "#0f1623",
  card2: "#162033",
  acc: "#00e5b0",
  blue: "#3b82f6",
  gold: "#f59e0b",
  red: "#ef4444",
  green: "#10b981",
  text: "#f1f5f9",
  dim: "#4b6080",
  line: "#1a2540",
};

export const f2 = (n, d = 2) =>
  typeof n === "number" ? n.toFixed(d) : "0.00";

export const usd = (n) => "$" + f2(n);

// ───── PENDING TRADES (admin-approval system) ─────
export const PT = {
  _key: "pending_trades",

  getAll() {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(this._key) || "[]"); } catch { return []; }
  },

  add(trade) {
    const list = this.getAll();
    const entry = { ...trade, id: Date.now() + Math.random(), status: "pending", createdAt: new Date().toISOString() };
    list.unshift(entry);
    localStorage.setItem(this._key, JSON.stringify(list));
    return entry;
  },

  approve(id) {
    const list = this.getAll().map(t => t.id === id ? { ...t, status: "approved", resolvedAt: new Date().toISOString() } : t);
    localStorage.setItem(this._key, JSON.stringify(list));
    return list.find(t => t.id === id);
  },

  reject(id) {
    const list = this.getAll().map(t => t.id === id ? { ...t, status: "rejected", resolvedAt: new Date().toISOString() } : t);
    localStorage.setItem(this._key, JSON.stringify(list));
    return list.find(t => t.id === id);
  },

  forUser(username) {
    return this.getAll().filter(t => t.username === username?.toLowerCase());
  },

  pendingCount() {
    return this.getAll().filter(t => t.status === "pending").length;
  },
};