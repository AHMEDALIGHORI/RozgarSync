// ============================================
// Firebase v10 Modular SDK Configuration
// ============================================

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase — prevent duplicate initialization in HMR
function getFirebaseApp(): FirebaseApp {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }
  return initializeApp(firebaseConfig);
}

const app: FirebaseApp = getFirebaseApp();

// Auth instance
const auth: Auth = getAuth(app);

// Firestore instance
const db: Firestore = getFirestore(app);

// Storage instance
const storage: FirebaseStorage = getStorage(app);

// Connect to Emulators if in development environment
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  // Prevent re-connecting in Next.js fast refresh
  if (!(globalThis as any)._firebaseEmulatorsConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    (globalThis as any)._firebaseEmulatorsConnected = true;
    console.log("Connected to Firebase local emulators");
  }
}

// Analytics — only available in browser, initialized lazily
let analytics: Analytics | null = null;

async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analytics) return analytics;

  const supported = await isSupported();
  if (supported) {
    analytics = getAnalytics(app);
  }
  return analytics;
}

export { app, auth, db, storage, getFirebaseAnalytics };
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Analytics };
