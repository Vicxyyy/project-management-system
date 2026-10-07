import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { apiClient } from '../lib/apiClient';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: (message?: string) => Promise<void>;
  expiredMessage: string | null;
  clearExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        const res = await apiClient.get<{ data: { user: User } }>('/auth/me');
        setUser(res.data.user);
      }
    } catch (e: any) {
      if (e.message === 'UNAUTHORIZED') {
        await SecureStore.deleteItemAsync('jwt_token');
        setExpiredMessage('Your session has expired. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  const login = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync('jwt_token', newToken);
    setUser(newUser);
  };

  const logout = async (message?: string) => {
    await SecureStore.deleteItemAsync('jwt_token');
    setUser(null);
    if (message) setExpiredMessage(message);
    try {
      await apiClient.post('/auth/logout', {});
    } catch (e) {}
  };

  const clearExpiredMessage = () => setExpiredMessage(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, expiredMessage, clearExpiredMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
