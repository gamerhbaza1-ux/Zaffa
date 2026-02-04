'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Simple context for providing the service instances
interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseServices | undefined>(undefined);

interface FirebaseProviderProps extends FirebaseServices {
  children: ReactNode;
}

// Simple provider that just passes down the services.
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// Hook to access the services. Components should prefer the more specific hooks below.
export const useFirebaseServices = (): FirebaseServices => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  return context;
};

// Specific hooks for convenience and to maintain API compatibility.
export const useAuth = (): Auth => {
  return useFirebaseServices().auth;
};

export const useFirestore = (): Firestore => {
  return useFirebaseServices().firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  return useFirebaseServices().firebaseApp;
};
