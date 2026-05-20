'use client';

import { motion } from 'framer-motion';

const bookings = [
  { id: 'GIG-2847', service: 'Plumbing', client: 'Kareem Shah', date: '2026-05-20', time: '2:00 PM', amount: 'PKR 2,500', status: 'confirmed' },
  { id: 'GIG-2848', service: 'Electrical', client: 'Amina Bibi', date: '2026-05-20', time: '4:30 PM', amount: 'PKR 3,000', status: 'in_progress' },
  { id: 'GIG-2849', service: 'AC Repair', client: 'Hassan Raza', date: '2026-05-21', time: '10:00 AM', amount: 'PKR 4,500', status: 'pending' },
  { id: 'GIG-2850', service: 'Painting', client: 'Sana Fatima', date: '2026-05-21', time: '1:00 PM', amount: 'PKR 1,800', status: 'confirmed' },
  { id: 'GIG-2846', service: 'Carpentry', client: 'Bilal Qureshi', date: '2026-05-19', time: '11:00 AM', amount: 'PKR 3,200', status: 'completed' },
];

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Bookings</h1>
        <p className="text-dark-400 mb-8">Gig bookings managed by AI agents</p>

        <div className="space-y-3">
          {bookings.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="flex items-center gap-4">
                <div className="text-xs font-mono text-dark-500">{b.id}</div>
                <div>
                  <h3 className="font-display font-bold text-white">{b.service}</h3>
                  <p className="text-sm text-dark-400">{b.client} • {b.date} at {b.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white font-mono font-bold">{b.amount}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  b.status === 'confirmed' ? 'bg-brand-500/10 text-brand-400' :
                  b.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-dark-800 text-dark-400'
                }`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
