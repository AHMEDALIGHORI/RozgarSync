// @ts-nocheck
﻿// @ts-nocheck
'use client';

// ============================================
// MapView Component (Google Maps)
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { cn, ISLAMABAD_CENTER, DEFAULT_ZOOM } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import type { MapMarker } from '@/types';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// --- Dark Mode Map Styles ---
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
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
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#1A3D2C' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6EE7B7' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#282F2D' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#414946' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8F9793' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#0F5E38' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#0A3F26' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#041A10' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#346D51' }],
    },
  ],
};

export interface MapViewProps {
  markers?: MapMarker[];
  className?: string;
  height?: string | number;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function MapView({
  markers = [],
  className,
  height = 500,
  center = ISLAMABAD_CENTER,
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  const t = useTranslations('common');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Use useMemo to prevent unnecessary re-renders of the center object
  const memoizedCenter = useMemo(() => center, [center.lat, center.lng]);

  if (loadError) {
    return (
      <div className={cn("w-full rounded-2xl border border-dark-700 bg-dark-900 flex flex-col items-center justify-center p-6 text-center", className)} style={{ height }}>
        <p className="text-red-400 mb-4">{t('error')}</p>
        <Button variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => window.location.reload()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn("w-full rounded-2xl border border-dark-700 bg-dark-900 flex items-center justify-center", className)} style={{ height }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl overflow-hidden border border-dark-700 relative", className)} style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={memoizedCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Child components, such as markers, info windows, etc. */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.position.latitude, lng: marker.position.longitude }}
            title={marker.title}
            // Custom icon based on type could be added here
          />
        ))}
      </GoogleMap>
    </div>
  );
}

