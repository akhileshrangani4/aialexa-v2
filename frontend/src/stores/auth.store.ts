import { create } from 'zustand';
import { auth } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

// Helper function to remove cookie
const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Helper function to get cookie
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await auth.login(email, password);
    const { user, token } = response.data;
    
    // Set token in both localStorage and cookie
    localStorage.setItem('token', token);
    setCookie('token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await auth.register(email, password, name);
    const { user, token } = response.data;
    
    // Set token in both localStorage and cookie
    localStorage.setItem('token', token);
    setCookie('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    removeCookie('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // Check both localStorage and cookie for token
      const token = localStorage.getItem('token') || getCookie('token');
      
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Ensure both are in sync
      if (!getCookie('token')) {
        setCookie('token', token);
      }
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', token);
      }

      const response = await auth.me();
      set({ 
        user: response.data, 
        token, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      localStorage.removeItem('token');
      removeCookie('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },
}));
