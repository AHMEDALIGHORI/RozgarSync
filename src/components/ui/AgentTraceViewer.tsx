// @ts-nocheck
﻿// @ts-nocheck
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { AgentDecisionLog } from '@/types';

import clsx from 'clsx';
import { format } from 'date-fns';

export type ExtendedAgentDecisionLog = AgentDecisionLog & {
  classificationData?: any;
  reasoning?: { en: string; ur: string };
};

interface AgentTraceViewerProps {
  logs: ExtendedAgentDecisionLog[];
  className?: string;
}

export function AgentTraceViewer({ logs, className }: AgentTraceViewerProps) {
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  // Sort logs oldest first for the chain visualization
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className={clsx('bg-dark-900 border border-dark-800 rounded-xl overflow-hidden', className)}>
      <div className="bg-dark-800 px-4 py-3 border-b border-dark-700 flex items-center justify-between">
        <h3 className="font-mono text-sm font-semibold text-brand-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          Agent Audit Trace Viewer
        </h3>
        <span className="text-xs text-dark-400 font-mono">{logs.length} operations</span>
      </div>

      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto font-mono text-sm">
        <AnimatePresence>
          {sortedLogs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-dark-500 py-8"
            >
              Listening for agent events...
            </motion.div>
          )}

          {sortedLogs.map((log, index) => {
            const isExpanded = expandedTraceId === log.traceChainHash;
            const isHighConfidence = log.confidence >= 0.8;
            const isLowConfidence = log.confidence < 0.6;

            return (
              <motion.div
                key={log.traceChainHash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-6"
              >
                {/* Visual trace line connecting nodes */}
                {index !== sortedLogs.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-[-16px] w-0.5 bg-dark-700" />
                )}
                
                {/* Node indicator */}
                <div className={clsx(
                  "absolute left-0.5 top-1.5 w-3 h-3 rounded-full border-2",
                  isHighConfidence ? "bg-brand-500 border-brand-900" :
                  isLowConfidence ? "bg-amber-500 border-amber-900" :
                  "bg-blue-500 border-blue-900"
                )} />

                <div 
                  className={clsx(
                    "border rounded-lg overflow-hidden transition-colors cursor-pointer",
                    isExpanded ? "border-brand-500/50 bg-dark-800/50" : "border-dark-700 hover:border-dark-600 bg-dark-800/20"
                  )}
                  onClick={() => setExpandedTraceId(isExpanded ? null : log.traceChainHash)}
                >
                  <div className="p-3 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-dark-100">{log.decisionType}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-300">
                          {log.agentVersion}
                        </span>
                      </div>
                      <span className="text-xs text-dark-400">
                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={clsx(
                          "text-xs font-bold",
                          isHighConfidence ? "text-brand-400" :
                          isLowConfidence ? "text-amber-400" :
                          "text-blue-400"
                        )}>
                          {(log.confidence * 100).toFixed(1)}% Conf
                        </span>
                        <span className="text-xs text-dark-500">{log.latencyMs}ms</span>
                      </div>
                      <svg
                        className={clsx("w-5 h-5 text-dark-400 transition-transform", isExpanded && "rotate-180")}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 border-t border-dark-700/50 text-xs space-y-3">
                          
                          <div>
                            <span className="text-dark-400 block mb-1">Reasoning:</span>
                            <p className="text-dark-200 whitespace-pre-wrap font-sans">
                              {log.reasoning?.en || log.rationale}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-dark-900/50 p-2 rounded">
                              <span className="text-dark-400 block mb-1">Trace Chain Hash:</span>
                              <span className="text-brand-300 break-all text-[10px]">
                                {log.traceChainHash}
                              </span>
                            </div>
                            {log.parentTraceId && (
                              <div className="bg-dark-900/50 p-2 rounded">
                                <span className="text-dark-400 block mb-1">Parent Hash:</span>
                                <span className="text-blue-300 break-all text-[10px]">
                                  {log.parentTraceId}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="bg-dark-900/50 p-2 rounded overflow-x-auto">
                            <span className="text-dark-400 block mb-1">Decision Data:</span>
                            <pre className="text-dark-300 text-[10px]">
                              {JSON.stringify(log.classificationData, null, 2)}
                            </pre>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

