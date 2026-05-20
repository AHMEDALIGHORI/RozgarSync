// @ts-nocheck
﻿// @ts-nocheck
'use client';

// ============================================
// ServiceCard Component
// ============================================

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Star, User as UserIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SERVICE_CATEGORIES } from '@/lib/utils';
import type { Service } from '@/types';

export interface ServiceCardProps {
  service: Partial<Service>;
  locale?: 'en' | 'ur';
}

export function ServiceCard({ service, locale = 'ur' }: ServiceCardProps) {
  const t = useTranslations('common');
  const tServices = useTranslations('services');

  const title = locale === 'ur' ? service.titleUrdu : service.title;
  
  const categoryConfig = SERVICE_CATEGORIES.find((c) => c.id === service.category);
  const categoryName = locale === 'ur' ? categoryConfig?.nameUr : categoryConfig?.nameEn;

  // Formatting price
  const priceDisplay = service.priceRange
    ? `${service.priceRange.min.toLocaleString()} - ${service.priceRange.max.toLocaleString()} ${t('pkr')}`
    : 'Price upon request';

  return (
    <Card variant="default" padding="none" hover className="flex flex-col h-full group">
      {/* Image Area */}
      <div className="relative h-48 w-full overflow-hidden bg-dark-800">
        {service.images?.[0] ? (
          <img
            src={service.images[0]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
            <span className="text-dark-500">No image available</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <Badge variant="success" className="backdrop-blur-md bg-brand-500/20">
            {categoryName || service.category}
          </Badge>
          {service.isFeatured && (
            <Badge variant="warning" className="backdrop-blur-md bg-amber-500/20">
              {tServices('featured')}
            </Badge>
          )}
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{service.workerRating?.toFixed(1) || '0.0'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-200">
            <MapPin className="w-3 h-3" />
            <span>{service.city}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg text-dark-50 mb-2 line-clamp-2">
          {title}
        </h3>
        
        <p className="text-brand-400 font-semibold mb-4">
          {priceDisplay}
          <span className="text-xs text-dark-400 font-normal ml-1">
            {service.priceRange?.unit ? `/${service.priceRange.unit}` : ''}
          </span>
        </p>

        <div className="mt-auto pt-4 border-t border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-dark-800 overflow-hidden border border-dark-700 shrink-0">
              {service.workerPhotoURL ? (
                <img src={service.workerPhotoURL} alt={service.workerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-dark-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark-200 truncate">
                {service.workerName}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="shrink-0 text-brand-400 hover:text-brand-300 hover:bg-brand-500/10">
            {tServices('bookNow')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

