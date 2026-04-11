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
  banned: new Set(),

  _hydrated: false,

  hydrate() {
    if (this._hydrated) return;

    const users = loadLS("users", {});
    const session = loadLS("session", null);
    const banned = loadLS("banned", []);

    this.users = users || {};
    this.session = session;
    this.banned = new Set(banned || []);

    this._hydrated = true;
  },

  get: () => {
    S.hydrate();
    return S.session ? S.users[S.session] : null;
  },

  setSession(user) {
    S.hydrate();
    S.session = user;
    saveLS("session", user);
  },

  addUser(username, data) {
    S.hydrate();
    S.users[username] = data;
    saveLS("users", S.users);
  },

  // ✅ FIXED DELETE (MAIN BUG FIX)
  deleteUser(username) {
    S.hydrate();

    // rebuild clean object (IMPORTANT FIX)
    const updated = {};

    for (const key in S.users) {
      if (key !== username) {
        updated[key] = S.users[key];
      }
    }

    S.users = updated;

    // remove session if same user
    if (S.session === username) {
      S.session = null;
      saveLS("session", null);
    }

    // remove from banned
    const newBanned = new Set(S.banned);
    newBanned.delete(username);
    S.banned = newBanned;
    saveLS("banned", Array.from(newBanned));

    // persist users
    saveLS("users", S.users);
  },

  banUser(username) {
    S.hydrate();
    S.banned.add(username);
    saveLS("banned", Array.from(S.banned));
  },
};

// ───── AUTO INIT ─────
if (typeof window !== "undefined" && !S._hydrated) {
  S.hydrate();
}

// ───── PRICE ENGINE ─────
const BASES = {
  BTC: 71320,
  ETH: 2251,
  LINK: 9.19,
  SOL: 148,
  XMR: 0.004,
  MATIC: 0.89,
};

export const PE = {
  p: { ...BASES },
  h: {},
  cb: [],

  tick() {
    for (const id in this.p) {
      this.p[id] = Math.max(
        0.001,
        this.p[id] * (1 + (Math.random() - 0.499) * 0.0009),
      );

      if (!this.h[id]) this.h[id] = [];

      const v = this.p[id];

      this.h[id].push({
        t: Date.now(),
        o: v * (1 + (Math.random() - 0.5) * 0.0003),
        h: v * (1 + Math.random() * 0.0007),
        l: v * (1 - Math.random() * 0.0007),
        c: v,
      });

      if (this.h[id].length > 120) this.h[id].shift();
    }

    this.cb.forEach((f) => f({ ...this.p }));
  },

  init() {
    for (const id in this.p) {
      this.h[id] = [];
      let v = this.p[id];

      for (let i = 0; i < 80; i++) {
        v = Math.max(0.001, v * (1 + (Math.random() - 0.499) * 0.0013));

        const o = v * (1 + (Math.random() - 0.5) * 0.0004);

        this.h[id].push({
          t: Date.now() - (80 - i) * 3000,
          o,
          h: Math.max(o, v) * (1 + Math.random() * 0.0008),
          l: Math.min(o, v) * (1 - Math.random() * 0.0008),
          c: v,
        });
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
];

// ───── NEWS ─────
export const NEWS = [
  {
    src: "WSJ",
    cl: "#ef4444",
    ts: "2026-04-08 16:22",
    ttl: "Stock Market Today",
    body: "Markets reacted sharply...",
  },
  {
    src: "CNBC",
    cl: "#3b82f6",
    ts: "2026-04-08 16:18",
    ttl: "Dow futures jump",
    body: "A rally sparked...",
  },
  {
    src: "BBG",
    cl: "#a78bfa",
    ts: "2026-04-08 15:44",
    ttl: "Bitcoin surges",
    body: "ETF inflows...",
  },
  {
    src: "MktW",
    cl: "#00e5b0",
    ts: "2026-04-08 15:10",
    ttl: "Ceasefire mirage",
    body: "Analysts warn...",
  },
];

// ───── THEME ─────
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

// ───── FORMATTERS ─────
export const f2 = (n, d = 2) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })
    : "0.00";

export const usd = (n) => "$" + f2(n);
