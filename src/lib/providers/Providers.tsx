'use client';

// ============================================
// Composite Providers Wrapper
// ============================================

import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { AgentProvider } from './AgentProvider';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
}

/**
 * Composite provider that wraps the app with all required context providers.
 * Add new providers here as the app grows (theme, toast, query client, etc.).
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AgentProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AgentProvider>
  );
}
