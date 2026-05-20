'use client';

import { motion } from 'framer-motion';

const reviews = [
  { worker: 'Ali Hassan', client: 'Ahmed Khan', rating: 5, text: 'Excellent plumbing work. Fixed the issue in 30 minutes!', date: '2 hours ago' },
  { worker: 'Fatima Noor', client: 'Sana Malik', rating: 5, text: 'Best tailor in Lahore. Perfect stitching as always.', date: '5 hours ago' },
  { worker: 'Muhammad Bilal', client: 'Kareem Shah', rating: 4, text: 'Good work, slightly delayed but quality was great.', date: '1 day ago' },
  { worker: 'Zainab Malik', client: 'Amina Bibi', rating: 5, text: 'Very professional cleaning service. Highly recommended!', date: '2 days ago' },
];

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Reviews</h1>
        <p className="text-dark-400 mb-8">Worker ratings verified by SafetyGuardian AI</p>

        <div className="space-y-4">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display font-bold text-white">{r.worker}</h3>
                  <p className="text-sm text-dark-400">by {r.client}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400">★</span>
                  ))}
                  <span className="text-sm text-dark-500 ml-1">{r.date}</span>
                </div>
              </div>
              <p className="text-dark-300 text-sm">{r.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
