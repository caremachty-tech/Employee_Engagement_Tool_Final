import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMe, login as loginApi } from './utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data.user);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasPagePermission = (page) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions[page];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPagePermission }}>
      {children}
    </AuthContext.Provider>
  );
};
