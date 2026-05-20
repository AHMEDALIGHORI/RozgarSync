'use client';

import { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPinned } from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, DEFAULT_ZOOM, ISLAMABAD_CENTER } from '@/lib/utils';
import type { MapMarker } from '@/types';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#111614' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#111614' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#737D78' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ABB1AE' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#737D78' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#282F2D' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#0F5E38' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#041A10' }],
    },
  ],
};

const pakistanBounds = {
  north: 37.1,
  south: 23.4,
  west: 60.8,
  east: 77.4,
};

export interface MapViewProps {
  markers?: MapMarker[];
  className?: string;
  height?: string | number;
  center?: { lat: number; lng: number };
  zoom?: number;
}

function isLikelyGoogleMapsKey(apiKey: string | undefined): apiKey is string {
  return Boolean(apiKey && /^AIza[0-9A-Za-z_-]+$/.test(apiKey));
}

function getMarkerPosition(marker: MapMarker) {
  const left =
    ((marker.position.longitude - pakistanBounds.west) /
      (pakistanBounds.east - pakistanBounds.west)) *
    100;
  const top =
    ((pakistanBounds.north - marker.position.latitude) /
      (pakistanBounds.north - pakistanBounds.south)) *
    100;

  return {
    left: `${Math.min(94, Math.max(6, left))}%`,
    top: `${Math.min(92, Math.max(8, top))}%`,
  };
}

function CoverageFallbackMap({
  className,
  height,
  message,
  markers,
}: {
  className?: string;
  height: string | number;
  message: string;
  markers: MapMarker[];
}) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-dark-700 bg-dark-900 overflow-hidden relative',
        className
      )}
      style={{ height }}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-950 to-brand-950/30" />
      <div className="absolute left-1/2 top-1/2 h-[72%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border border-brand-500/20 bg-brand-500/5 shadow-inner-glow" />

      {markers.map((marker) => (
        <div
          key={marker.id}
          className="absolute group"
          style={getMarkerPosition(marker)}
        >
          <div className="relative">
            <div className="h-4 w-4 rounded-full bg-brand-400 shadow-glow animate-pulse" />
            <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-400/30" />
            <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 min-w-36 -translate-x-1/2 rounded-lg border border-dark-700 bg-dark-950 px-3 py-2 opacity-0 shadow-glass transition-opacity group-hover:opacity-100">
              <p className="text-sm font-bold text-white">{marker.title}</p>
              {marker.subtitle && (
                <p className="text-xs text-dark-400">{marker.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="absolute left-4 top-4 max-w-sm rounded-xl border border-dark-700 bg-dark-950/80 p-3 backdrop-blur">
        <div className="mb-1 flex items-center gap-2 text-brand-300">
          <MapPinned className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Coverage map
          </span>
        </div>
        <p className="text-xs text-dark-300">{message}</p>
      </div>
    </div>
  );
}

function LoadedGoogleMap({
  apiKey,
  markers,
  className,
  height,
  center,
  zoom,
}: Required<Pick<MapViewProps, 'markers' | 'height' | 'center' | 'zoom'>> &
  Pick<MapViewProps, 'className'> & {
    apiKey: string;
  }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const memoizedCenter = useMemo(() => center, [center.lat, center.lng]);

  if (loadError) {
    return (
      <CoverageFallbackMap
        className={className}
        height={height}
        markers={markers}
        message="Google Maps could not load, so the local coverage map is active."
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          'w-full rounded-2xl border border-dark-700 bg-dark-900 flex items-center justify-center',
          className
        )}
        style={{ height }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-2xl overflow-hidden border border-dark-700 relative', className)}
      style={{ height }}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={memoizedCenter}
        zoom={zoom}
        options={mapOptions}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{
              lat: marker.position.latitude,
              lng: marker.position.longitude,
            }}
            title={marker.title}
            label={{
              text: marker.title.slice(0, 1),
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

export function MapView({
  markers = [],
  className,
  height = 500,
  center = ISLAMABAD_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!isLikelyGoogleMapsKey(apiKey)) {
    return (
      <CoverageFallbackMap
        className={className}
        height={height}
        markers={markers}
        message="Local coverage map active. Add a valid Google Maps browser API key to enable live Google tiles."
      />
    );
  }

  return (
    <LoadedGoogleMap
      apiKey={apiKey}
      markers={markers}
      className={className}
      height={height}
      center={center}
      zoom={zoom}
    />
  );
}
