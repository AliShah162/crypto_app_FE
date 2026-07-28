// frontend/src/hooks/useAdminUsers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../lib/config';

// ============================================
// FETCH ADMIN USERS (with pagination)
// ============================================
export function useAdminUsers(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['adminUsers', page],
    queryFn: async () => {
      const adminKey = localStorage.getItem("adminApiKey") || "7b97a4b8-f7e8-4470-9102-2533045a16dd";
      const response = await fetch(
        `${API_URL}/api/users/admin/all-with-plain-passwords?page=${page}&limit=${limit}`,
        { headers: { "x-admin-key": adminKey } }
      );
      if (!response.ok) throw new Error('Failed to fetch admin users');
      return response.json();
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    retry: 2,
  });
}

// ============================================
// FETCH ALL DEPOSITS (Admin)
// ============================================
export function useAdminDeposits() {
  return useQuery({
    queryKey: ['adminDeposits'],
    queryFn: async () => {
      const adminKey = localStorage.getItem("adminApiKey") || "7b97a4b8-f7e8-4470-9102-2533045a16dd";
      const response = await fetch(
        `${API_URL}/api/users/admin/all-deposits`,
        { headers: { "x-admin-key": adminKey } }
      );
      if (!response.ok) throw new Error('Failed to fetch deposits');
      return response.json();
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ============================================
// FETCH ALL WITHDRAWALS (Admin)
// ============================================
export function useAdminWithdrawals() {
  return useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: async () => {
      const adminKey = localStorage.getItem("adminApiKey") || "7b97a4b8-f7e8-4470-9102-2533045a16dd";
      const response = await fetch(
        `${API_URL}/api/users/admin/all-withdrawals`,
        { headers: { "x-admin-key": adminKey } }
      );
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      return response.json();
    },
    staleTime: 30000,
    gcTime: 120000,
  });
}

// ============================================
// MUTATION - Approve/Reject Deposit
// ============================================
export function useApproveDeposit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username, requestId, action }) => {
      const adminKey = localStorage.getItem("adminApiKey") || "7b97a4b8-f7e8-4470-9102-2533045a16dd";
      const response = await fetch(
        `${API_URL}/api/users/admin/approve-deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey,
          },
          body: JSON.stringify({ username, requestId, action }),
        }
      );
      if (!response.ok) throw new Error('Failed to process deposit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDeposits'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

// ============================================
// MUTATION - Approve/Reject Withdrawal
// ============================================
export function useApproveWithdrawal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username, requestId, action }) => {
      const adminKey = localStorage.getItem("adminApiKey") || "7b97a4b8-f7e8-4470-9102-2533045a16dd";
      const response = await fetch(
        `${API_URL}/api/users/admin/approve-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey,
          },
          body: JSON.stringify({ username, requestId, action }),
        }
      );
      if (!response.ok) throw new Error('Failed to process withdrawal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}