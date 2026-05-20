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
import { onAuthChange, signOut as firebaseSignOut } from '@/lib/firebase';

const LOCAL_AUTH_KEY = 'rozgarsync_auth_user';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// --- Auth Context Type ---
interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
  signInLocalUser: (profile: { email: string; displayName?: string }) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider ---
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const readLocalUser = useCallback((): AuthenticatedUser | null => {
    if (typeof window === 'undefined') return null;

    try {
      const rawUser = window.localStorage.getItem(LOCAL_AUTH_KEY);
      if (!rawUser) return null;
      const parsedUser = JSON.parse(rawUser) as AuthenticatedUser;
      return parsedUser?.uid && parsedUser?.email ? parsedUser : null;
    } catch {
      window.localStorage.removeItem(LOCAL_AUTH_KEY);
      return null;
    }
  }, []);

  const persistLocalUser = useCallback((nextUser: AuthenticatedUser) => {
    window.localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setError(null);
  }, []);

  useEffect(() => {
    // SSR guard — Firebase auth only runs in the browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((firebaseUser) => {
      try {
        setUser(firebaseUser ?? readLocalUser());
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
  }, [readLocalUser]);

  const signInLocalUser = useCallback(
    ({ email, displayName }: { email: string; displayName?: string }) => {
      const trimmedEmail = email.trim().toLowerCase();
      const safeId = trimmedEmail.replace(/[^a-z0-9]+/gi, '-');

      persistLocalUser({
        uid: `local-${safeId}`,
        email: trimmedEmail,
        displayName: displayName?.trim() || trimmedEmail.split('@')[0] || 'Worker',
        photoURL: null,
      });
    },
    [persistLocalUser]
  );

  const signOut = useCallback(async () => {
    try {
      setError(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_AUTH_KEY);
      }
      await firebaseSignOut();
      setUser(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign out failed'
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInLocalUser, signOut }}
    >
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
