// frontend/src/hooks/useUserData.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../lib/config';

// ============================================
// 1. FETCH USER DATA
// ============================================
export function useUser(username) {
  return useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      if (!username) return null;
      const response = await fetch(`${API_URL}/api/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!username && username !== 'admin',
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// ============================================
// 2. FETCH USER NOTIFICATIONS
// ============================================
export function useNotifications(username) {
  return useQuery({
    queryKey: ['notifications', username],
    queryFn: async () => {
      if (!username) return [];
      const response = await fetch(`${API_URL}/api/users/${username}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!username && username !== 'admin',
    staleTime: 15000, // 15 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: false,
  });
}

// ============================================
// 3. FETCH USER TRANSACTIONS
// ============================================
export function useTransactions(username) {
  return useQuery({
    queryKey: ['transactions', username],
    queryFn: async () => {
      if (!username) return [];
      const response = await fetch(`${API_URL}/api/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      return data.transactions || [];
    },
    enabled: !!username && username !== 'admin',
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// ============================================
// 4. FETCH USER KYC STATUS
// ============================================
export function useKYCStatus(username) {
  return useQuery({
    queryKey: ['kyc', username],
    queryFn: async () => {
      if (!username) return null;
      const response = await fetch(`${API_URL}/api/users/${username}/kyc-status`);
      if (!response.ok) throw new Error('Failed to fetch KYC status');
      return response.json();
    },
    enabled: !!username && username !== 'admin',
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// ============================================
// 5. FETCH USER BALANCE (lightweight)
// ============================================
export function useBalance(username) {
  return useQuery({
    queryKey: ['balance', username],
    queryFn: async () => {
      if (!username) return 0;
      const response = await fetch(`${API_URL}/api/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      return data.balance || 0;
    },
    enabled: !!username && username !== 'admin',
    staleTime: 15000, // 15 seconds
    gcTime: 60000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// ============================================
// 6. MUTATIONS - Update User
// ============================================
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username, updates }) => {
      const response = await fetch(`${API_URL}/api/users/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', variables.username] });
      queryClient.invalidateQueries({ queryKey: ['balance', variables.username] });
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.username] });
    },
  });
}

// ============================================
// 7. MUTATIONS - Mark Notification as Read
// ============================================
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username, notificationId }) => {
      const response = await fetch(`${API_URL}/api/users/${username}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.username] });
    },
  });
}

// ============================================
// 8. MUTATIONS - Delete Notification
// ============================================
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username, notificationId }) => {
      const response = await fetch(`${API_URL}/api/users/${username}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.username] });
    },
  });
}

// ============================================
// 9. MUTATIONS - Delete All Notifications
// ============================================
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username }) => {
      const response = await fetch(`${API_URL}/api/users/${username}/notifications/all`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete all notifications');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.username] });
    },
  });
}

// ============================================
// 10. PREFETCH - For faster navigation
// ============================================
export function prefetchUserData(queryClient, username) {
  if (!username) return;
  
  // Prefetch user data
  queryClient.prefetchQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });
  
  // Prefetch notifications
  queryClient.prefetchQuery({
    queryKey: ['notifications', username],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/${username}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });
}