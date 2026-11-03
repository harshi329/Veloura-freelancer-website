import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, NotificationItem } from '../../shared/types.js';

export interface ToastMessage {
  id: string;
  title: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  notifications: NotificationItem[];
  toasts: ToastMessage[];
  showToast: (title: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  apiFetch: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
  setSession: (token: string, user: UserProfile) => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toggleBookmark: (projectId: string) => Promise<boolean>;
  isBookmarked: (projectId: string) => boolean;
  switchRole: (targetRole?: 'client' | 'freelancer') => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('veloura_token');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const apiFetch = useCallback(
    async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      const activeToken = token || localStorage.getItem('veloura_token');
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }

      const res = await fetch(path, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
      }
      return data as T;
    },
    [token]
  );

  const setSession = useCallback((newToken: string, newUser: UserProfile) => {
    try {
      localStorage.setItem('veloura_token', newToken);
    } catch {}
    setToken(newToken);
    setUser(newUser);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const activeToken = token || localStorage.getItem('veloura_token');
    if (!activeToken) {
      setNotifications([]);
      return;
    }
    try {
      const data = await apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
      setNotifications(data.notifications || []);
    } catch {
      // Ignore silent notification polling error
    }
  }, [apiFetch, token]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: UserProfile; token?: string }>('/api/auth/me');
      if (data.token) {
        try {
          localStorage.setItem('veloura_token', data.token);
        } catch {}
        setToken(data.token);
      }
      setUser(data.user);
      await refreshNotifications();
    } catch {
      try {
        localStorage.removeItem('veloura_token');
      } catch {}
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, refreshNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }, [apiFetch]);

  const isBookmarked = useCallback(
    (projectId: string): boolean => {
      return Boolean(user?.savedProjects?.includes(String(projectId)));
    },
    [user]
  );

  const toggleBookmark = useCallback(
    async (projectId: string): Promise<boolean> => {
      if (!user) {
        showToast('Sign in to save briefs to your workspace bookmarks.', 'info');
        return false;
      }
      try {
        const res = await apiFetch<{ bookmarked: boolean; savedProjects: string[] }>(
          `/api/projects/${projectId}/bookmark`,
          { method: 'POST' }
        );
        setUser((prev) => (prev ? { ...prev, savedProjects: res.savedProjects } : prev));
        showToast(
          res.bookmarked ? 'Brief saved to your bookmarks.' : 'Brief removed from bookmarks.',
          'success'
        );
        return res.bookmarked;
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update bookmark', 'error');
        return false;
      }
    },
    [apiFetch, showToast, user]
  );

  const switchRole = useCallback(
    async (targetRole?: 'client' | 'freelancer'): Promise<void> => {
      try {
        const res = await apiFetch<{
          success: boolean;
          message: string;
          user: UserProfile;
          token?: string;
        }>('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: targetRole }),
        });

        if (res.token) {
          try {
            localStorage.setItem('veloura_token', res.token);
          } catch {}
          setToken(res.token);
        }
        setUser(res.user);
        showToast(
          res.message ||
            `Switched to ${res.user.role === 'client' ? 'Client' : 'Freelancer'} Workspace`,
          'success'
        );
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to switch workspace mode', 'error');
      }
    },
    [apiFetch, showToast]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('veloura_token');
    } catch {}
    setToken(null);
    setUser(null);
    setNotifications([]);
    showToast('Signed out of Veloura.', 'info');
  }, [apiFetch, showToast]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        loading,
        notifications,
        toasts,
        showToast,
        dismissToast,
        apiFetch,
        setSession,
        refreshUser,
        refreshNotifications,
        markAllNotificationsRead,
        toggleBookmark,
        isBookmarked,
        switchRole,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
