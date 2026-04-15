const BASE_URL = "http://localhost:5000/api/users";

// 🔥 helper (better error handling)
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