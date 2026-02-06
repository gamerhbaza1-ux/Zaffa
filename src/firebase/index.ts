'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
  ) {
    // Return mock instances if config is not set to avoid app crash.
    // This is useful for environments where Firebase is not configured.
    console.warn("Firebase config is not set. Using mock services.");
    const mockApp = { name: 'mock', options: {}, automaticDataCollectionEnabled: false };
    const mockAuth = { app: mockApp };
    const mockFirestore = { app: mockApp };
    return {
        firebaseApp: mockApp as FirebaseApp,
        auth: mockAuth as any,
        firestore: mockFirestore as any,
    }
  }

  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export { useUser } from '@/hooks/use-user';
