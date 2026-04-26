// src/lib/db.js - Database operations (MongoDB first, localStorage as cache)
// No "use client" needed - this is a utility file

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://crypto-backend-production-11dc.up.railway.app";

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

// Helper function for API calls
async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}/api/users${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      // Don't log 404 errors as they're normal for user checks
      if (res.status !== 404) {
        console.error(`API Error (${endpoint}):`, data);
      }
      return { error: data.error || "Something went wrong" };
    }
    
    return data;
  } catch (err) {
    console.error(`Network Error (${endpoint}):`, err);
    return { error: "Network error - server may be offline" };
  }
}

// ──────────────────────────────────────────────
// USER OPERATIONS
// ──────────────────────────────────────────────

// Get a single user (from DB, fallback to cache)
export async function getUser(username, forceFresh = false) {
  if (!username) return { error: "Username required" };
  
  const cleanUsername = username.toLowerCase().trim();
  // ✅ Skip API call for admin user - return mock data immediately
  if (cleanUsername === "admin") {
    console.log("👑 Admin user - returning local data");
    return {
      username: "admin",
      role: "admin",
      balance: 0,
      creditScore: 100,
      transactions: [],
      holdings: {},
      savedCards: [],
      notifications: [],
    };
  }
  
  // Try cache first (unless forceFresh is true) - only in browser
  if (!forceFresh && isBrowser) {
    try {
      const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
      const cached = cache[cleanUsername];
      if (cached && cached._cachedAt && (Date.now() - cached._cachedAt) < 5000) {
        console.log(`📦 Using cached user: ${cleanUsername}`);
        return { ...cached, _fromCache: true };
      }
    } catch (e) {
      console.warn("Cache read error:", e);
    }
  }
  
  // Fetch from database
  console.log(`🌐 Fetching user from DB: ${cleanUsername}`);
  const user = await fetchAPI(`/${cleanUsername}`);
  
  // Update cache if successful - only in browser
  if (user && !user.error && isBrowser) {
    try {
      const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
      cache[cleanUsername] = { ...user, _cachedAt: Date.now() };
      localStorage.setItem("users_cache", JSON.stringify(cache));
    } catch (e) {
      console.warn("Cache write error:", e);
    }
  }
  
  return user;
}

// Update a user (DB first, then update cache)
export async function updateUser(username, updates) {
  if (!username) return { error: "Username required" };
  
  const cleanUsername = username.toLowerCase().trim();
  console.log(`💾 Updating user in DB: ${cleanUsername}`, updates);
  
  // Ensure balance is rounded to 2 decimal places
  if (updates.balance !== undefined && typeof updates.balance === "number") {
    updates.balance = Math.round(updates.balance * 100) / 100;
  }
  
  // Update database first
  const result = await fetchAPI(`/${cleanUsername}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  
  if (result.error) {
    console.error("Failed to update user in DB:", result.error);
    return result;
  }
  
  // Update cache - only in browser
  if (isBrowser) {
    try {
      const cache = JSON.parse(localStorage.getItem("users_cache") || "{}");
      cache[cleanUsername] = { ...result, _cachedAt: Date.now() };
      localStorage.setItem("users_cache", JSON.stringify(cache));
    } catch (e) {
      console.warn("Cache update error:", e);
    }
  }
  
  return { success: true, data: result };
}

// ──────────────────────────────────────────────
// BALANCE OPERATIONS (with floating point fix)
// ──────────────────────────────────────────────

// Helper to round to 2 decimal places
function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}

// Add balance to user
export async function addBalance(username, amount, reason = "credit") {
  const user = await getUser(username, true); // Force fresh from DB
  if (user.error) return user;
  
  const currentBalance = user.balance || 0;
  const newBalance = roundToCents(currentBalance + amount);
  
  console.log(`💰 Adding ${amount} to ${username}: ${currentBalance} → ${newBalance}`);
  
  return await updateUser(username, { balance: newBalance });
}

// Deduct balance from user
export async function deductBalance(username, amount, reason = "debit") {
  const user = await getUser(username, true); // Force fresh from DB
  if (user.error) return user;
  
  const currentBalance = user.balance || 0;
  
  if (currentBalance < amount) {
    return { error: `Insufficient balance. Available: $${currentBalance}` };
  }
  
  const newBalance = roundToCents(currentBalance - amount);
  
  console.log(`💰 Deducting ${amount} from ${username}: ${currentBalance} → ${newBalance}`);
  
  return await updateUser(username, { balance: newBalance });
}

// ──────────────────────────────────────────────
// NOTIFICATION OPERATIONS
// ──────────────────────────────────────────────

// Get user notifications from DB
export async function getUserNotifications(username) {
  const result = await fetchAPI(`/${username}/notifications`);
  if (result.error) return [];
  return Array.isArray(result) ? result : [];
}

// Mark notification as read
export async function markNotificationRead(username, notificationId) {
  return await fetchAPI(`/${username}/notifications/read`, {
    method: "POST",
    body: JSON.stringify({ notificationId }),
  });
}

// ──────────────────────────────────────────────
// BINARY TRADE OPERATIONS
// ──────────────────────────────────────────────

// Save a binary trade
export async function saveBinaryTradeToDB(username, tradeData) {
  return await fetchAPI(`/${username}/binary-trades`, {
    method: "POST",
    body: JSON.stringify(tradeData),
  });
}

// Get binary trades
export async function getBinaryTradesFromDB(username) {
  return await fetchAPI(`/${username}/binary-trades`);
}

// Get all users (admin only)
export async function getAllUsersFromDB(adminKey) {
  return await fetchAPI("/admin/all-with-plain-passwords", {
    headers: { "x-admin-key": adminKey },
  });
}

// ──────────────────────────────────────────────
// CACHE MANAGEMENT
// ──────────────────────────────────────────────

// Force refresh a user from database
export async function refreshUser(username) {
  return await getUser(username, true);
}

// Clear entire cache
export function clearUserCache() {
  if (isBrowser) {
    localStorage.removeItem("users_cache");
    console.log("🗑️ User cache cleared");
  }
}

// Get current balance (quick access)
export async function getBalance(username) {
  const user = await getUser(username);
  if (user.error) return 0;
  return user.balance || 0;
}