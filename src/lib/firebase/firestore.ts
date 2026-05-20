// ============================================
// Firestore Database Helpers
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

// Collection references
export const collections = {
  users: "users",
  services: "services",
  bookings: "bookings",
  reviews: "reviews",
  notifications: "notifications",
  aiJobs: "ai_jobs",
} as const;

type CollectionName = (typeof collections)[keyof typeof collections];

// Generic document fetcher
export async function getDocument<T extends DocumentData>(
  collectionName: CollectionName,
  docId: string
): Promise<(T & { id: string }) | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
}

// Generic collection fetcher with constraints
export async function getCollection<T extends DocumentData>(
  collectionName: CollectionName,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as (T & { id: string })[];
}

// Add document
export async function addDocument<T extends DocumentData>(
  collectionName: CollectionName,
  data: T
): Promise<DocumentReference> {
  const colRef = collection(db, collectionName);
  return addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Update document
export async function updateDocument(
  collectionName: CollectionName,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete document
export async function deleteDocument(
  collectionName: CollectionName,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return deleteDoc(docRef);
}

// Real-time listener for a collection
export function subscribeToCollection<T extends DocumentData>(
  collectionName: CollectionName,
  constraints: QueryConstraint[],
  callback: (docs: (T & { id: string })[]) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as (T & { id: string })[];
    callback(docs);
  });
}

// Real-time listener for a single document
export function subscribeToDocument<T extends DocumentData>(
  collectionName: CollectionName,
  docId: string,
  callback: (doc: (T & { id: string }) | null) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    callback({ id: docSnap.id, ...docSnap.data() } as T & { id: string });
  });
}

// Paginated query helper
export async function getPaginatedCollection<T extends DocumentData>(
  collectionName: CollectionName,
  constraints: QueryConstraint[],
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot
): Promise<{
  docs: (T & { id: string })[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> {
  const colRef = collection(db, collectionName);
  const paginationConstraints = lastDoc
    ? [...constraints, startAfter(lastDoc), limit(pageSize + 1)]
    : [...constraints, limit(pageSize + 1)];

  const q = query(colRef, ...paginationConstraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > pageSize;
  const docs = snapshot.docs.slice(0, pageSize).map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as (T & { id: string })[];

  const newLastDoc =
    docs.length > 0 ? snapshot.docs[docs.length - 1] ?? null : null;

  return { docs, lastDoc: newLastDoc, hasMore };
}

// Re-export commonly used Firestore utilities
export { where, orderBy, limit, serverTimestamp };
