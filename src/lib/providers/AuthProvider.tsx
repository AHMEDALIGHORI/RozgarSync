'use client';

// ============================================
// Firebase Authentication Context Provider
// ============================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { onAuthChange, signOut as firebaseSignOut, type User } from '@/lib/firebase';

// --- Auth Context Type ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider ---
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SSR guard — Firebase auth only runs in the browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((firebaseUser) => {
      try {
        setUser(firebaseUser);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Authentication error occurred'
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await firebaseSignOut();
      setUser(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign out failed'
      );
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- useAuth Hook ---
/**
 * Access the authentication context.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
