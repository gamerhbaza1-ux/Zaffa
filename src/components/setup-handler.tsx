'use client';

import { useUser } from '@/hooks/use-user';
import { HouseholdSetup } from './household-setup';
import { Skeleton } from './ui/skeleton';

export function SetupHandler({ children }: { children: React.ReactNode }) {
    const { userProfile, isProfileLoading, household, isHouseholdLoading } = useUser();

    if (isProfileLoading || isHouseholdLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    // userProfile is loaded, but has no householdId, or the household doc doesn't exist
    if (userProfile && !household) {
        return <HouseholdSetup />;
    }
    
    // household exists for the user
    if (household) {
        return <>{children}</>;
    }
    
    // Fallback, should not be reached if logic is correct
    return null;
}
