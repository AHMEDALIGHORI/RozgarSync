'use client';

import { motion } from 'framer-motion';

const markers = [
  { name: 'Lahore', lat: '31.5204', lng: '74.3587', workers: 8500, gigs: 342 },
  { name: 'Karachi', lat: '24.8607', lng: '67.0011', workers: 12400, gigs: 567 },
  { name: 'Islamabad', lat: '33.6844', lng: '73.0479', workers: 4200, gigs: 189 },
  { name: 'Faisalabad', lat: '31.4504', lng: '73.1350', workers: 3100, gigs: 156 },
  { name: 'Rawalpindi', lat: '33.5651', lng: '73.0169', workers: 2800, gigs: 134 },
  { name: 'Multan', lat: '30.1575', lng: '71.5249', workers: 2100, gigs: 98 },
  { name: 'Peshawar', lat: '34.0151', lng: '71.5249', workers: 1800, gigs: 87 },
  { name: 'Quetta', lat: '30.1798', lng: '66.9750', workers: 900, gigs: 43 },
];

export default function MapPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Worker Coverage Map</h1>
        <p className="text-dark-400 mb-8">AI-tracked gig worker distribution across Pakistan</p>

        {/* Map visualization */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 mb-8">
          <div className="relative w-full h-80 bg-dark-800 rounded-xl overflow-hidden flex items-center justify-center">
            {/* Pakistan map outline using SVG */}
            <svg viewBox="0 0 400 400" className="w-full h-full opacity-20">
              <path d="M200,50 L280,80 L320,130 L350,200 L330,280 L280,340 L220,360 L160,340 L120,300 L80,250 L70,180 L90,120 L140,70 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-500" />
            </svg>
            {/* City markers */}
            {markers.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="absolute"
                style={{
                  left: `${20 + (i * 10) % 60}%`,
                  top: `${15 + (i * 12) % 65}%`,
                }}
              >
                <div className="relative group cursor-pointer">
                  <div className="w-4 h-4 bg-brand-500 rounded-full animate-pulse" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-dark-900 border border-dark-700 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <p className="text-white font-bold text-xs">{city.name}</p>
                    <p className="text-dark-400 text-xs">{city.workers.toLocaleString()} workers</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* City stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {markers.map((city, i) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-dark-900 border border-dark-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                <h3 className="font-display font-bold text-white">{city.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-dark-400">Workers</p>
                  <p className="text-white font-mono font-bold">{city.workers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-dark-400">Active Gigs</p>
                  <p className="text-white font-mono font-bold">{city.gigs}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
