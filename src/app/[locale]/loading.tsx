// ============================================
// Global Page Loading Skeleton
// Shows instantly while route chunks load
// ============================================

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated brand logo */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl gradient-brand-bg flex items-center justify-center shadow-glow animate-pulse">
            <span className="text-white font-bold text-xl">RS</span>
          </div>
          <div className="absolute inset-0 w-14 h-14 rounded-2xl border-2 border-brand-400/30 animate-ping" />
        </div>
        {/* Loading bar */}
        <div className="w-48 h-1 bg-dark-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
