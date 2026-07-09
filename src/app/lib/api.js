import { API_URL } from "../lib/config";

const BASE_URL = `${API_URL}/api/users`;

// ================= HELPER: Fetch with retry =================
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}` };
        }
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.log(`🔄 Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function handleRes(res) {
  try {
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || data.message || "Something went wrong" };
    }
    return data;
  } catch (err) {
    return { error: "Server returned invalid response" };
  }
}

// ================= REGISTER =================
export async function registerUser(data) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Register error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= LOGIN =================
export async function loginUser(data) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Login error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= GET SINGLE USER FROM DB =================
export async function getUserFromDB(username) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/${username}`, {
      method: "GET",
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Get user error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= GET ALL USERS =================
export async function getAllUsers() {
  try {
    const res = await fetchWithRetry(`${BASE_URL}`, {
      method: "GET",
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Get all users error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= GET ALL USERS WITH PLAIN PASSWORDS (ADMIN ONLY) =================
export async function getAllUsersWithPlainPasswords(adminKey) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/admin/all-with-plain-passwords`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Get all users admin error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= ADMIN UPDATE PASSWORD =================
export async function adminUpdatePassword(username, newPassword, adminKey) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/admin/update-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ username, newPassword }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Admin update password error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= WITHDRAW FUNDS =================
export async function withdrawFunds(username, amount, cardId, password, bankDetails = {}) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username, 
        amount, 
        cardId, 
        password,
        holderName: bankDetails.holderName,
        bankName: bankDetails.bankName,
        accNumber: bankDetails.accNumber,
        cvv: bankDetails.cvv,
      }),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Withdraw error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= GET ALL WITHDRAWAL REQUESTS (ADMIN ONLY) =================
export async function getAllWithdrawals(adminKey) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/admin/all-withdrawals`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Get withdrawals error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= ADMIN APPROVE WITHDRAWAL =================
export const approveWithdrawal = async (username, requestId, action, adminKey, sessionId = null) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    };
    
    if (sessionId) {
      headers["x-session-id"] = sessionId;
    }
    
    const res = await fetchWithRetry(`${API_URL}/api/users/admin/approve-withdrawal`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ username, requestId, action }),
    });
    
    return await res.json();
  } catch (err) {
    console.error("Approve withdrawal error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
};

// ================= SAVE CARD TO BACKEND =================
export async function saveCardToBackend(username, card) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/save-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, card }),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Save card error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= UPDATE USER (PATCH) =================
export async function updateUserInDB(username, data) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/${username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Update user error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= BAN / UNBAN =================
export async function banUserInDB(username, banned) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, banned }),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Ban user error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= DELETE USER =================
export async function deleteUserFromDB(username) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/${username}`, {
      method: "DELETE",
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Delete user error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= SAVE BINARY TRADE =================
export async function saveBinaryTrade(username, trade) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/${username}/binary-trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Save binary trade error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}

// ================= GET BINARY TRADES =================
export async function getBinaryTrades(username) {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/${username}/binary-trades`, {
      method: "GET",
    });
    return await handleRes(res);
  } catch (err) {
    console.error("Get binary trades error:", err);
    return { error: err.message || "Network error. Please try again." };
  }
}