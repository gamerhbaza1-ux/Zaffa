
'use client';

import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Sparkles } from 'lucide-react';
import { UserProfile } from '@/lib/types';

const PartnerCard = ({ partner }: { partner: UserProfile }) => {
    const partnerRoleLabel = partner.role === 'bride' ? 'عروستك' : 'عريسك';
    const PartnerIcon = partner.role === 'bride' ? Heart : Sparkles;
    
    return (
        <Card className="shadow-sm border-0 rounded-xl bg-accent/50">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                   <AvatarImage src={''} alt={partner.firstName} />
                   <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {partner.firstName?.charAt(0)}{partner.lastName?.charAt(0)}
                   </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-accent-foreground">{partnerRoleLabel}</p>
                    <p className="font-bold text-lg text-foreground">{partner.firstName} {partner.lastName}</p>
                </div>
                <PartnerIcon className="h-6 w-6 text-primary mr-auto opacity-70" />
            </CardContent>
        </Card>
    );
};

const PartnerSkeleton = () => (
     <Card className="shadow-sm border-0 rounded-xl bg-accent/50">
        <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-[150px]" />
            </div>
        </CardContent>
    </Card>
);


export function PartnerDisplay() {
    const { household, partnerProfile, isPartnerLoading, isHouseholdLoading } = useUser();

    if (isHouseholdLoading || !household) {
        return null; // Wait for household to load
    }
    
    // Don't render if it's a single-person household
    if (household.memberIds.length < 2) {
        return null;
    }

    if (isPartnerLoading) {
        return <PartnerSkeleton />;
    }
    
    if (partnerProfile) {
        return <PartnerCard partner={partnerProfile} />;
    }

    return null;
}
