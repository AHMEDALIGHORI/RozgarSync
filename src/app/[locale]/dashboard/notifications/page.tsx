'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const notifications = [
  { id: 1, type: 'match', title: 'New Gig Match', text: 'OpportunityMatcher found 3 plumbing gigs near you in Lahore', time: '2 min ago', read: false },
  { id: 2, type: 'wage', title: 'Fair Wage Alert', text: 'FairWageNegotiator flagged a below-market offer — counter-offer sent', time: '15 min ago', read: false },
  { id: 3, type: 'safety', title: 'Safety Cleared', text: 'SafetyGuardian verified employer ID for GIG-2847', time: '1 hour ago', read: true },
  { id: 4, type: 'payment', title: 'Payment Received', text: 'PKR 2,500 released from escrow to your wallet', time: '3 hours ago', read: true },
  { id: 5, type: 'skill', title: 'Course Recommended', text: 'UpskillingCoach suggests "Advanced Wiring" — potential 30% income boost', time: '1 day ago', read: true },
];

const icons: Record<string, string> = { match: '🎯', wage: '⚖️', safety: '🛡️', payment: '💰', skill: '📚' };

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Notifications</h1>
            <p className="text-dark-400">AI agent activity feed</p>
          </div>
          <button onClick={() => setItems(items.map(n => ({ ...n, read: true })))} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
            Mark all read
          </button>
        </div>

        <div className="space-y-2">
          {items.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl p-4 flex items-start gap-4 transition-colors cursor-pointer ${
                n.read ? 'bg-dark-900 border border-dark-800' : 'bg-dark-900 border border-brand-500/30'
              }`}
              onClick={() => setItems(items.map(item => item.id === n.id ? { ...item, read: true } : item))}
            >
              <div className="text-2xl mt-0.5">{icons[n.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-white text-sm">{n.title}</h3>
                  <span className="text-xs text-dark-500">{n.time}</span>
                </div>
                <p className="text-sm text-dark-400 mt-1">{n.text}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 shrink-0" />}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
