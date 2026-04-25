const BASE_URL = "https://crypto-backend-production-11dc.up.railway.app/api/users";

async function handleRes(res) {
  const data = await res.json();

  if (!res.ok) {
    return { error: data.error || "Something went wrong" };
  }

  return data;
}

// ================= REGISTER =================
export async function registerUser(data) {
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= LOGIN =================
export async function loginUser(data) {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= GET SINGLE USER FROM DB =================
export async function getUserFromDB(username) {
  try {
    const res = await fetch(`${BASE_URL}/${username}`, {
      method: "GET",
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= GET ALL USERS =================
export async function getAllUsers() {
  try {
    const res = await fetch(`${BASE_URL}`, {
      method: "GET",
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= GET ALL USERS WITH PLAIN PASSWORDS (ADMIN ONLY) =================
export async function getAllUsersWithPlainPasswords(adminKey) {
  try {
    const res = await fetch(`${BASE_URL}/admin/all-with-plain-passwords`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= UPDATE USER PASSWORD (ADMIN ONLY) =================
export async function adminUpdatePassword(username, newPassword, adminKey) {
  try {
    const res = await fetch(`${BASE_URL}/admin/update-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({ username, newPassword }),
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= WITHDRAW FUNDS =================
export async function withdrawFunds(username, amount, cardId, password) {
  try {
    const res = await fetch(`${BASE_URL}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount, cardId, password }),
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= GET ALL WITHDRAWAL REQUESTS (ADMIN ONLY) =================
export async function getAllWithdrawals(adminKey) {
  try {
    const res = await fetch(`${BASE_URL}/admin/all-withdrawals`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= ADMIN APPROVE WITHDRAWAL =================
export async function approveWithdrawal(username, requestId, action, adminKey) {
  try {
    const res = await fetch(`${BASE_URL}/admin/approve-withdrawal`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({ username, requestId, action }),
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= SAVE CARD TO BACKEND =================
export async function saveCardToBackend(username, card) {
  try {
    const res = await fetch(`${BASE_URL}/save-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, card }),
    });
    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= UPDATE USER (PATCH) =================
export async function updateUserInDB(username, data) {
  try {
    const res = await fetch(`${BASE_URL}/${username}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= BAN / UNBAN =================
export async function banUserInDB(username, banned) {
  try {
    const res = await fetch(`${BASE_URL}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, banned }),
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= DELETE USER =================
export async function deleteUserFromDB(username) {
  try {
    const res = await fetch(`${BASE_URL}/${username}`, {
      method: "DELETE",
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= SAVE BINARY TRADE =================
export async function saveBinaryTrade(username, trade) {
  try {
    const res = await fetch(`${BASE_URL}/${username}/binary-trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}

// ================= GET BINARY TRADES =================
export async function getBinaryTrades(username) {
  try {
    const res = await fetch(`${BASE_URL}/${username}/binary-trades`, {
      method: "GET",
    });

    return await handleRes(res);
  } catch (err) {
    return { error: "Server not reachable" };
  }
}