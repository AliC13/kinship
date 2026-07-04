import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();

    // Keep auth state in sync across tabs, token refreshes, and OAuth redirects.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setIsAuthenticated(!!session?.user);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        // Kept for compatibility with components that still reference these -
        // Supabase has no separate "app public settings" or "not registered" concepts.
        isLoadingPublicSettings: false,
        authError: null,
        authChecked,
        logout,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
