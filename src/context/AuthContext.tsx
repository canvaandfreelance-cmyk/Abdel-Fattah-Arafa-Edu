// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider, signInWithPopup, signOut } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  idToken: string | null;
  isLoading: boolean;
  isDbConnected: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncDataToCloud: (payload: any) => Promise<boolean>;
  fetchDataFromCloud: () => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  idToken: null,
  isLoading: true,
  isDbConnected: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
  syncDataToCloud: async () => false,
  fetchDataFromCloud: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        try {
          const token = await user.getIdToken();
          setCurrentUser(user);
          setIdToken(token);

          // Verify with backend
          await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setIsDbConnected(true);
        } catch (error) {
          console.error('Error establishing authenticated session:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setIdToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        const token = await result.user.getIdToken();
        setCurrentUser(result.user);
        setIdToken(token);

        await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIdToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const syncDataToCloud = async (payload: any): Promise<boolean> => {
    if (!currentUser || !idToken) return false;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error('syncDataToCloud error:', err);
      return false;
    }
  };

  const fetchDataFromCloud = async (): Promise<any | null> => {
    if (!currentUser || !idToken) return null;
    try {
      const res = await fetch('/api/data', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('fetchDataFromCloud error:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        idToken,
        isLoading,
        isDbConnected,
        loginWithGoogle,
        logout,
        syncDataToCloud,
        fetchDataFromCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
