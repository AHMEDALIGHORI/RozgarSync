'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoNegotiate, setAutoNegotiate] = useState(true);
  const [sosEnabled, setSosEnabled] = useState(true);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-brand-500' : 'bg-dark-700'}`}
    >
      <motion.div
        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
        animate={{ left: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400 mb-8">Configure your RozgarSync experience</p>

        <div className="space-y-6">
          {/* General */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
            <h2 className="font-display font-bold text-white mb-4">General</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-white text-sm">Language</p><p className="text-xs text-dark-400">App display language</p></div>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-dark-800 text-white text-sm rounded-lg px-3 py-2 border border-dark-700">
                  <option value="en">English</option>
                  <option value="ur">اردو (Urdu)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white text-sm">Dark Mode</p><p className="text-xs text-dark-400">Always use dark theme</p></div>
                <Toggle value={darkMode} onChange={setDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white text-sm">Notifications</p><p className="text-xs text-dark-400">Push notifications for gig matches</p></div>
                <Toggle value={notifications} onChange={setNotifications} />
              </div>
            </div>
          </div>

          {/* AI Agents */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
            <h2 className="font-display font-bold text-white mb-4">AI Agent Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-white text-sm">Auto-Negotiate Wages</p><p className="text-xs text-dark-400">FairWageNegotiator will auto-send counter-offers</p></div>
                <Toggle value={autoNegotiate} onChange={setAutoNegotiate} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white text-sm">SOS Emergency Protocol</p><p className="text-xs text-dark-400">SafetyGuardian emergency contacts enabled</p></div>
                <Toggle value={sosEnabled} onChange={setSosEnabled} />
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
            <h2 className="font-display font-bold text-white mb-4">Account</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-dark-800 rounded-xl text-sm text-dark-300 hover:text-white transition-colors">Export My Data</button>
              <button className="w-full text-left px-4 py-3 bg-dark-800 rounded-xl text-sm text-dark-300 hover:text-white transition-colors">Privacy Policy</button>
              <button className="w-full text-left px-4 py-3 bg-red-500/10 rounded-xl text-sm text-red-400 hover:text-red-300 transition-colors">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
