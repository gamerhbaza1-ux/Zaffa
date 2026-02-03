
'use client';

import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Sparkles, Users } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { useState } from 'react';
import { InviteDialog } from './invite-dialog';
import { Button } from './ui/button';

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

function InvitePartnerCard() {
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
    return (
        <>
            <Card className="border-2 border-dashed bg-transparent shadow-none">
                <CardContent className="p-6 text-center">
                     <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-xl mb-1">
                        بتخططوا سوا؟
                    </CardTitle>
                    <CardDescription className="mb-4">
                        ابعت دعوة لشريكك عشان تبدأوا تخططوا لبيتكم الجديد مع بعض.
                    </CardDescription>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                        ندعي شريك
                    </Button>
                </CardContent>
            </Card>
            <InviteDialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen} />
        </>
    );
}

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

    if (isHouseholdLoading) {
        return <PartnerSkeleton />;
    }

    if (!household) {
        // This case is handled by the page, which will run the automatic setup.
        // But as a fallback, we can show the skeleton.
        return <PartnerSkeleton />;
    }
    
    // If user is alone in the household, show invite card
    if (household.memberIds.length < 2) {
        return <InvitePartnerCard />;
    }

    // If there is a partner, but their profile is still loading
    if (isPartnerLoading) {
        return <PartnerSkeleton />;
    }
    
    // If partner profile is loaded, show it
    if (partnerProfile) {
        return <PartnerCard partner={partnerProfile} />;
    }
    
    // Fallback case, e.g., partner exists but profile fetch failed for some reason
    return <InvitePartnerCard />;
}
