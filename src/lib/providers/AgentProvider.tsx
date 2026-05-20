'use client';

// ============================================================================
// RozgarSync — Agent React Provider
// ============================================================================
// Initializes the autonomous agent ecosystem on the client side and provides
// the event bus via React Context.
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AgentEventBus, createEventBus } from '../agents/core';
import {
  createOpportunityMatcher,
  createFairWageNegotiator,
  createSafetyGuardian,
  createFinancialProtector,
  createUpskillingCoach,
} from '../agents';

interface AgentContextValue {
  eventBus: AgentEventBus | null;
  isReady: boolean;
}

const AgentContext = createContext<AgentContextValue>({
  eventBus: null,
  isReady: false,
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const eventBusRef = useRef<AgentEventBus | null>(null);

  useEffect(() => {
    // Only initialize once
    if (eventBusRef.current) return;

    console.log('[AgentProvider] Initializing RozgarSync Agent Ecosystem...');
    const bus = createEventBus();
    eventBusRef.current = bus;

    // Initialize all 5 autonomous agents
    // They auto-subscribe to the event bus in their constructors
    const agents = [
      createOpportunityMatcher(bus),
      createFairWageNegotiator(bus),
      createSafetyGuardian(bus),
      createFinancialProtector(bus),
      createUpskillingCoach(bus),
    ];

    console.log(`[AgentProvider] ${agents.length} agents initialized successfully.`);
    setIsReady(true);

    return () => {
      console.log('[AgentProvider] Shutting down Agent Ecosystem...');
      agents.forEach((agent: any) => {
        if (typeof agent.shutdown === 'function') agent.shutdown();
      });
      if (typeof (bus as any).clear === 'function') {
        (bus as any).clear();
      }
      eventBusRef.current = null;
      setIsReady(false);
    };
  }, []);

  return (
    <AgentContext.Provider value={{ eventBus: eventBusRef.current, isReady }}>
      {children}
    </AgentContext.Provider>
  );
}

/**
 * Hook to access the Agent Event Bus from anywhere in the React app.
 */
export function useEventBus(): AgentEventBus {
  const context = useContext(AgentContext);
  if (!context || !context.eventBus) {
    throw new Error('useEventBus must be used within an AgentProvider');
  }
  return context.eventBus;
}
