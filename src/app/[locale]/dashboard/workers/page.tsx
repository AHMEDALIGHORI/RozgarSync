'use client';

import { motion } from 'framer-motion';

const workers = [
  { name: 'Ali Hassan', skill: 'Electrician', rating: 4.8, jobs: 156, city: 'Lahore', status: 'available' },
  { name: 'Muhammad Bilal', skill: 'Plumber', rating: 4.6, jobs: 89, city: 'Karachi', status: 'on_job' },
  { name: 'Usman Ahmed', skill: 'AC Repair', rating: 4.5, jobs: 45, city: 'Islamabad', status: 'available' },
  { name: 'Fatima Noor', skill: 'Tailor', rating: 4.9, jobs: 234, city: 'Lahore', status: 'available' },
  { name: 'Hamza Sheikh', skill: 'Carpenter', rating: 4.3, jobs: 67, city: 'Faisalabad', status: 'offline' },
  { name: 'Zainab Malik', skill: 'Cleaner', rating: 4.7, jobs: 112, city: 'Rawalpindi', status: 'available' },
];

export default function WorkersPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Worker Network</h1>
        <p className="text-dark-400 mb-8">Verified workers across Pakistan</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-brand-500/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-xl">
                  {w.skill === 'Tailor' || w.skill === 'Cleaner' ? '👩' : '👨'}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{w.name}</h3>
                  <p className="text-sm text-dark-400">{w.skill} • {w.city}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-300">⭐ {w.rating} • {w.jobs} jobs</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  w.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' :
                  w.status === 'on_job' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-dark-800 text-dark-500'
                }`}>
                  {w.status === 'available' ? '● Available' : w.status === 'on_job' ? '● On Job' : '● Offline'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
