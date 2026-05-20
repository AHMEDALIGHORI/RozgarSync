'use client';

import { motion } from 'framer-motion';

const services = [
  { name: 'Plumbing', icon: '🔧', workers: 2340, avgRate: 'PKR 2,000', demand: 'High' },
  { name: 'Electrical', icon: '⚡', workers: 1890, avgRate: 'PKR 2,500', demand: 'High' },
  { name: 'AC Repair', icon: '❄️', workers: 980, avgRate: 'PKR 3,000', demand: 'Very High' },
  { name: 'Carpentry', icon: '🪚', workers: 1200, avgRate: 'PKR 2,200', demand: 'Medium' },
  { name: 'Painting', icon: '🎨', workers: 890, avgRate: 'PKR 1,500', demand: 'Medium' },
  { name: 'Tailoring', icon: '🧵', workers: 3100, avgRate: 'PKR 1,200', demand: 'High' },
  { name: 'Cleaning', icon: '🧹', workers: 2100, avgRate: 'PKR 1,200', demand: 'High' },
  { name: 'Driving', icon: '🚗', workers: 4500, avgRate: 'PKR 3,500', demand: 'Very High' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Service Categories</h1>
        <p className="text-dark-400 mb-8">AI-managed gig categories across Pakistan</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-brand-500/30 transition-all hover:shadow-glow cursor-pointer"
            >
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-display font-bold text-white text-lg">{s.name}</h3>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-dark-400">Workers</span><span className="text-white font-mono">{s.workers.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Avg Rate</span><span className="text-white font-mono">{s.avgRate}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Demand</span><span className={`font-medium ${s.demand === 'Very High' ? 'text-red-400' : s.demand === 'High' ? 'text-amber-400' : 'text-emerald-400'}`}>{s.demand}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
