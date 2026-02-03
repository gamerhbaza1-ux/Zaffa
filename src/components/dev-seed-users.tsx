'use client';

import { useFirestore, useUser } from "@/firebase";
import { collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore";
import { useEffect, useState } from "react";

// THIS IS A TEMPORARY COMPONENT TO SEED THE DATABASE FOR DEVELOPMENT
// IT SHOULD BE REMOVED LATER

const TEST_HOUSEHOLD_ID = 'zaffa-dev-household';
const USER_A_EMAIL = 'mohammedsbastawy@gmail.com';
const USER_B_EMAIL = 'fatmasheara64@gmail.com';

export function DevSeedUsers() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSeeded, setIsSeeded] = useState(false);

    useEffect(() => {
        if (!firestore || !user || isSeeded) {
            return;
        }

        const currentUserEmail = user.email?.toLowerCase();
        if (currentUserEmail !== USER_A_EMAIL && currentUserEmail !== USER_B_EMAIL) {
            setIsSeeded(true); // Don't run for other users
            return;
        }

        const seed = async () => {
            console.log("DEV: Attempting to seed dev users...");
            try {
                // This logic is not transactional, but it's a dev-only tool.
                const usersRef = collection(firestore, "users");
                const userAQuery = query(usersRef, where("email", "==", USER_A_EMAIL));
                const userBQuery = query(usersRef, where("email", "==", USER_B_EMAIL));

                const [userASnap, userBSnap] = await Promise.all([getDocs(userAQuery), getDocs(userBQuery)]);
                
                const userADoc = userASnap.docs[0];
                const userBDoc = userBSnap.docs[0];

                if (!userADoc || !userBDoc) {
                    console.warn("DEV: Could not find one or both dev users to seed household.");
                    return;
                }

                // Check if they are already in the correct household
                const userAData = userADoc.data();
                const userBData = userBDoc.data();
                if (userAData.householdId === TEST_HOUSEHOLD_ID && userBData.householdId === TEST_HOUSEHOLD_ID) {
                    console.log("DEV: Users already in correct household.");
                    return;
                }
                
                await runTransaction(firestore, async (transaction) => {
                    const householdRef = doc(firestore, 'households', TEST_HOUSEHOLD_ID);

                    // Set/update the household, ensuring both members are present
                    transaction.set(householdRef, {
                        memberIds: [userADoc.id, userBDoc.id]
                    });

                    // Update both user profiles
                    transaction.update(userADoc.ref, { householdId: TEST_HOUSEHOLD_ID, role: 'groom' });
                    transaction.update(userBDoc.ref, { householdId: TEST_HOUSEHOLD_ID, role: 'bride' });
                });
                
                console.log("DEV: Successfully seeded dev users and household.");

            } catch (e) {
                console.error("DEV: Seeding failed:", e);
            } finally {
                setIsSeeded(true); // Only attempt once per session
            }
        };

        // Delay slightly to ensure user profile is likely settled
        setTimeout(seed, 1000);

    }, [firestore, user, isSeeded]);

    return null; // This component renders nothing.
}
