'use client';

import { motion } from 'framer-motion';
import { Briefcase, MapPinned, Users } from 'lucide-react';

import { MapView } from '@/components/map/MapView';
import { PAKISTAN_CENTER } from '@/lib/utils';
import type { MapMarker } from '@/types';

const cities = [
  { name: 'Lahore', lat: 31.5204, lng: 74.3587, workers: 8500, gigs: 342 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, workers: 12400, gigs: 567 },
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479, workers: 4200, gigs: 189 },
  { name: 'Faisalabad', lat: 31.4504, lng: 73.135, workers: 3100, gigs: 156 },
  { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169, workers: 2800, gigs: 134 },
  { name: 'Multan', lat: 30.1575, lng: 71.5249, workers: 2100, gigs: 98 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249, workers: 1800, gigs: 87 },
  { name: 'Quetta', lat: 30.1798, lng: 66.975, workers: 900, gigs: 43 },
];

const markers: MapMarker[] = cities.map((city) => ({
  id: city.name.toLowerCase(),
  title: city.name,
  subtitle: `${city.workers.toLocaleString()} workers`,
  type: 'worker',
  position: {
    latitude: city.lat,
    longitude: city.lng,
  },
}));

const totals = cities.reduce(
  (acc, city) => ({
    workers: acc.workers + city.workers,
    gigs: acc.gigs + city.gigs,
  }),
  { workers: 0, gigs: 0 }
);

export default function MapPage() {
  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Worker Coverage Map
            </h1>
            <p className="text-dark-400">
              Live service coverage and active gig demand across Pakistan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 min-w-36">
              <div className="flex items-center gap-2 text-dark-400 text-xs">
                <Users className="w-4 h-4" />
                Workers
              </div>
              <p className="text-xl font-display font-bold text-white">
                {totals.workers.toLocaleString()}
              </p>
            </div>
            <div className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 min-w-36">
              <div className="flex items-center gap-2 text-dark-400 text-xs">
                <Briefcase className="w-4 h-4" />
                Active Gigs
              </div>
              <p className="text-xl font-display font-bold text-white">
                {totals.gigs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <MapView
            markers={markers}
            center={PAKISTAN_CENTER}
            zoom={5}
            height={560}
            className="shadow-glass"
          />

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <MapPinned className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-display font-bold text-white">
                City Coverage
              </h2>
            </div>
            <div className="space-y-3">
              {cities.map((city, index) => (
                <motion.div
                  key={city.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-xl border border-dark-800 bg-dark-950/50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-white">
                        {city.name}
                      </h3>
                      <p className="text-xs text-dark-400">
                        {city.workers.toLocaleString()} workers
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                      {city.gigs} gigs
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
