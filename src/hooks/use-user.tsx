'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth, useFirestore } from '@/firebase/provider';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, collection, query, where } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { UserProfile, Household, Invitation } from '@/lib/types';

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  household: Household | null;
  isHouseholdLoading: boolean;
  partnerProfile: UserProfile | null;
  isPartnerLoading: boolean;
  invitations: Invitation[] | null;
  isLoadingInvitations: boolean;
}

export function useUser(): UserHookResult {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // 1. Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  // 2. Get User Profile from user.uid
  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // 3. Get Household from userProfile.householdId
  const householdRef = useMemo(() => {
    if (!userProfile?.householdId || !firestore) return null;
    return doc(firestore, 'households', userProfile.householdId);
  }, [userProfile]);
  const { data: household, isLoading: isHouseholdLoading } = useDoc<Household>(householdRef);

  // 4. Get Partner Profile from household.memberIds
  const partnerId = useMemo(() => {
    if (!user || !household) return null;
    return household.memberIds.find(id => id !== user.uid);
  }, [user, household]);
  
  const partnerProfileRef = useMemo(() => {
    if (!partnerId || !firestore) return null;
    return doc(firestore, 'users', partnerId);
  }, [partnerId, firestore]);
  const { data: partnerProfile, isLoading: isPartnerLoading } = useDoc<UserProfile>(partnerProfileRef);

  // 5. Get Invitations from user.email
  const invitationsQuery = useMemo(() => {
    if (!user?.email || !firestore) return null;
    return query(
      collection(firestore, 'invitations'),
      where('inviteeEmail', '==', user.email),
      where('status', '==', 'pending')
    );
  }, [user, firestore]);
  const { data: invitations, isLoading: isLoadingInvitations } = useCollection<Invitation>(invitationsQuery);
  
  const finalIsPartnerLoading = partnerId ? isPartnerLoading : false;

  return {
    user,
    isUserLoading,
    userProfile,
    isProfileLoading,
    household,
    isHouseholdLoading,
    partnerProfile: partnerProfile,
    isPartnerLoading: finalIsPartnerLoading,
    invitations,
    isLoadingInvitations,
  };
};
