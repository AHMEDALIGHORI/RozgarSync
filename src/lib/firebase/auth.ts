// ============================================
// Firebase Authentication Helpers
// ============================================

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  const result = await signInWithPopup(auth, googleProvider);
  await createUserDocument(result.user);
  return result;
}

// Sign in with Email/Password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

// Register with Email/Password
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await createUserDocument(result.user, displayName);
  return result;
}

// Sign out
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

// Create/update user document in Firestore
async function createUserDocument(
  user: User,
  displayName?: string
): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName ?? user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      role: "worker",
      locale: "ur",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profile: {
        phone: "",
        city: "",
        skills: [],
        rating: 0,
        completedJobs: 0,
        isVerified: false,
      },
    });
  }
}

// Auth state observer
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
export type { User, UserCredential };
