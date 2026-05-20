export { app, auth, db, storage, getFirebaseAnalytics } from "./config";
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Analytics } from "./config";

export {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOut,
  resetPassword,
  onAuthChange,
} from "./auth";
export type { User, UserCredential } from "./auth";

export {
  collections,
  getDocument,
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToDocument,
  getPaginatedCollection,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "./firestore";
