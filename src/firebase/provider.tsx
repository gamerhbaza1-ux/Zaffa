'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { UserProfile, Household } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

interface ProfileState {
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

interface HouseholdState {
  household: Household | null;
  isHouseholdLoading: boolean;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  household: Household | null;
  isHouseholdLoading: boolean;
}

export interface FirebaseServicesAndUser extends Omit<FirebaseContextState, 'areServicesAvailable'> {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  household: Household | null;
  isHouseholdLoading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [profileState, setProfileState] = useState<ProfileState>({
    userProfile: null,
    isProfileLoading: true,
  });
  
  const [householdState, setHouseholdState] = useState<HouseholdState>({
    household: null,
    isHouseholdLoading: true,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: auth.currentUser, isUserLoading: true, userError: null });

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!userAuthState.user || !firestore) {
      setProfileState({ userProfile: null, isProfileLoading: false });
      return;
    }

    setProfileState(s => ({ ...s, isProfileLoading: true }));
    const profileDocRef = doc(firestore, 'users', userAuthState.user.uid);
    
    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfileState({ userProfile: docSnap.data() as UserProfile, isProfileLoading: false });
      } else {
        setProfileState({ userProfile: null, isProfileLoading: false });
      }
    }, (error) => {
       console.error("FirebaseProvider: profile snapshot error:", error);
       setProfileState({ userProfile: null, isProfileLoading: false });
    });

    return () => unsubscribe();
  }, [userAuthState.user, firestore]);
  
  useEffect(() => {
    if (!profileState.userProfile?.householdId || !firestore) {
      setHouseholdState({ household: null, isHouseholdLoading: false });
      return;
    }
    
    setHouseholdState(s => ({ ...s, isHouseholdLoading: true }));
    const householdDocRef = doc(firestore, 'households', profileState.userProfile.householdId);

    const unsubscribe = onSnapshot(householdDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setHouseholdState({ household: { id: docSnap.id, ...docSnap.data() } as Household, isHouseholdLoading: false });
      } else {
        setHouseholdState({ household: null, isHouseholdLoading: false });
      }
    }, (error) => {
      console.error("FirebaseProvider: household snapshot error:", error);
      setHouseholdState({ household: null, isHouseholdLoading: false });
    });

    return () => unsubscribe();
  }, [profileState.userProfile, firestore]);


  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      userProfile: profileState.userProfile,
      isProfileLoading: profileState.isProfileLoading,
      household: householdState.household,
      isHouseholdLoading: householdState.isHouseholdLoading,
    };
  }, [firebaseApp, firestore, auth, userAuthState, profileState, householdState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isProfileLoading: context.isProfileLoading,
    household: context.household,
    isHouseholdLoading: context.isHouseholdLoading,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, userProfile, isProfileLoading, household, isHouseholdLoading } = useFirebase();
  return { user, isUserLoading, userError, userProfile, isProfileLoading, household, isHouseholdLoading };
};
