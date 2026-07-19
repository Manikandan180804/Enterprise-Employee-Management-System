import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';
import { setAccessToken, clearAccessToken } from '../api/axios';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isHrManager: () => boolean;
  isEmployee: () => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt silent refresh on mount
  useEffect(() => {
    const init = async () => {
      try {
        const refreshRes = await authApi.refresh();
        const { accessToken } = refreshRes.data.data;
        setAccessToken(accessToken);
        const meRes = await authApi.me();
        // /auth/me returns a full Employee object; map it to the User shape
        const emp = meRes.data.data;
        setUser({
          id:             emp.id,
          employeeId:     emp.id,       // UUID used for navigation
          email:          emp.email,
          firstName:      emp.firstName,
          lastName:       emp.lastName,
          role:           emp.role,
          profileImageUrl: emp.profileImageUrl,
          department:     emp.department?.name,
          designation:    emp.designation,
        });
      } catch {
        // Not authenticated — stay on login page
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { accessToken, user: userData } = res.data.data;
    setAccessToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
  }, []);

  const isSuperAdmin = useCallback(() => user?.role === 'SUPER_ADMIN', [user]);
  const isHrManager = useCallback(() => user?.role === 'HR_MANAGER', [user]);
  const isEmployee = useCallback(() => user?.role === 'EMPLOYEE', [user]);
  const hasRole = useCallback((...roles: string[]) => !!user && roles.includes(user.role), [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      isSuperAdmin,
      isHrManager,
      isEmployee,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
