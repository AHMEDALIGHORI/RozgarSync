// ============================================
// RozgarSync Application Constants
// ============================================

import type { ServiceCategory } from '@/types';

// --- App Identity ---
export const APP_NAME = 'RozgarSync';
export const APP_NAME_URDU = 'روزگار سنک';
export const APP_DESCRIPTION =
  "AI Service Orchestrator for Pakistan's informal gig workers — connecting skilled workers with clients through intelligent matching.";
export const APP_DESCRIPTION_URDU =
  'پاکستان کے غیر رسمی مزدوروں کے لیے AI سروس آرکیسٹریٹر — ذہین ملاپ کے ذریعے ہنرمند کاریگروں اور صارفین کو جوڑنا۔';

// --- Map Configuration ---
export const PAKISTAN_CENTER = { lat: 30.3753, lng: 69.3451 } as const;
export const ISLAMABAD_CENTER = { lat: 33.6844, lng: 73.0479 } as const;
export const DEFAULT_ZOOM = 6;
export const CITY_ZOOM = 12;

// --- Service Categories ---
export interface CategoryConfig {
  id: ServiceCategory;
  nameEn: string;
  nameUr: string;
  icon: string; // lucide-react icon name
}

export const SERVICE_CATEGORIES: CategoryConfig[] = [
  { id: 'plumbing', nameEn: 'Plumbing', nameUr: 'پلمبنگ', icon: 'Wrench' },
  { id: 'electrical', nameEn: 'Electrical', nameUr: 'بجلی', icon: 'Zap' },
  { id: 'carpentry', nameEn: 'Carpentry', nameUr: 'بڑھئی', icon: 'Hammer' },
  { id: 'painting', nameEn: 'Painting', nameUr: 'پینٹنگ', icon: 'Paintbrush' },
  { id: 'cleaning', nameEn: 'Cleaning', nameUr: 'صفائی', icon: 'Sparkles' },
  { id: 'moving', nameEn: 'Moving', nameUr: 'منتقلی', icon: 'Truck' },
  { id: 'tailoring', nameEn: 'Tailoring', nameUr: 'درزی', icon: 'Scissors' },
  { id: 'cooking', nameEn: 'Cooking', nameUr: 'باورچی', icon: 'ChefHat' },
  { id: 'driving', nameEn: 'Driving', nameUr: 'ڈرائیونگ', icon: 'Car' },
  { id: 'tutoring', nameEn: 'Tutoring', nameUr: 'ٹیوشن', icon: 'GraduationCap' },
  { id: 'beauty', nameEn: 'Beauty', nameUr: 'بیوٹی', icon: 'Heart' },
  { id: 'gardening', nameEn: 'Gardening', nameUr: 'باغبانی', icon: 'Flower2' },
  { id: 'ac_repair', nameEn: 'AC Repair', nameUr: 'اے سی مرمت', icon: 'Thermometer' },
  { id: 'mobile_repair', nameEn: 'Mobile Repair', nameUr: 'موبائل مرمت', icon: 'Smartphone' },
  { id: 'other', nameEn: 'Other', nameUr: 'دیگر', icon: 'MoreHorizontal' },
];

// --- Pakistan Cities ---
export interface CityConfig {
  nameEn: string;
  nameUr: string;
  lat: number;
  lng: number;
}

export const PAKISTAN_CITIES: CityConfig[] = [
  { nameEn: 'Karachi', nameUr: 'کراچی', lat: 24.8607, lng: 67.0011 },
  { nameEn: 'Lahore', nameUr: 'لاہور', lat: 31.5204, lng: 74.3587 },
  { nameEn: 'Islamabad', nameUr: 'اسلام آباد', lat: 33.6844, lng: 73.0479 },
  { nameEn: 'Rawalpindi', nameUr: 'راولپنڈی', lat: 33.5651, lng: 73.0169 },
  { nameEn: 'Faisalabad', nameUr: 'فیصل آباد', lat: 31.4504, lng: 73.135 },
  { nameEn: 'Multan', nameUr: 'ملتان', lat: 30.1575, lng: 71.5249 },
  { nameEn: 'Peshawar', nameUr: 'پشاور', lat: 34.0151, lng: 71.5249 },
  { nameEn: 'Quetta', nameUr: 'کوئٹہ', lat: 30.1798, lng: 66.975 },
  { nameEn: 'Sialkot', nameUr: 'سیالکوٹ', lat: 32.4945, lng: 74.5229 },
  { nameEn: 'Gujranwala', nameUr: 'گوجرانوالہ', lat: 32.1617, lng: 74.1883 },
  { nameEn: 'Hyderabad', nameUr: 'حیدرآباد', lat: 25.396, lng: 68.3578 },
  { nameEn: 'Bahawalpur', nameUr: 'بہاولپور', lat: 29.3956, lng: 71.6836 },
];

// --- Pagination ---
export const DEFAULT_PAGE_SIZE = 12;

// --- Rating ---
export const MAX_RATING = 5;
export const MIN_RATING = 1;
