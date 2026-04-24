// lib/notifications.js
"use client";

const NOTIF_KEY = "user_notifications";
const MAX_NOTIFICATIONS = 50; // Limit to prevent storage bloat

// Get all notifications for a specific user
export function getUserNotifications(username) {
  if (typeof window === "undefined") return [];
  if (!username) return [];
  
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
    return all[username?.toLowerCase()] || [];
  } catch {
    return [];
  }
}

// Add a notification for a specific user
export function addUserNotification(username, title, body) {
  if (typeof window === "undefined") return;
  if (!username) return;
  
  const usernameLower = username.toLowerCase();
  
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
    const userNotifs = all[usernameLower] || [];
    
    const newNotif = {
      id: Date.now() + Math.random(),
      title,
      body,
      time: new Date().toLocaleTimeString(),
      date: new Date().toISOString(),
      read: false
    };
    
    // Add to beginning, limit to MAX_NOTIFICATIONS
    const updated = [newNotif, ...userNotifs].slice(0, MAX_NOTIFICATIONS);
    all[usernameLower] = updated;
    
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    
    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent("storage", {
      key: NOTIF_KEY,
      newValue: JSON.stringify(all)
    }));
    
    return newNotif;
  } catch (error) {
    console.error("Failed to save notification:", error);
  }
}

// Clear all notifications for a specific user
export function clearUserNotifications(username) {
  if (typeof window === "undefined") return;
  if (!username) return;
  
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
    all[username.toLowerCase()] = [];
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch (error) {
    console.error("Failed to clear notifications:", error);
  }
}

// Mark a notification as read
export function markNotificationRead(username, notifId) {
  if (typeof window === "undefined") return;
  if (!username || !notifId) return;
  
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
    const userNotifs = all[username.toLowerCase()] || [];
    
    const updated = userNotifs.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    );
    
    all[username.toLowerCase()] = updated;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch (error) {
    console.error("Failed to mark notification read:", error);
  }
}

// Delete a specific notification
export function deleteNotification(username, notifId) {
  if (typeof window === "undefined") return;
  if (!username || !notifId) return;
  
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
    const userNotifs = all[username.toLowerCase()] || [];
    
    const updated = userNotifs.filter(n => n.id !== notifId);
    all[username.toLowerCase()] = updated;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch (error) {
    console.error("Failed to delete notification:", error);
  }
}

// Get unread count for a user
export function getUnreadCount(username) {
  const notifs = getUserNotifications(username);
  return notifs.filter(n => !n.read).length;
}