'use client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ChecklistClient from '@/components/checklist/checklist-client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Home as HomeIcon, LogOut, UserPlus } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAuth } from 'firebase/auth';
import { InviteDialog } from '@/components/invite-dialog';
import { PartnerDisplay } from '@/components/partner-display';
import { InvitationNotification } from '@/components/invitation-notification';
import { SetupChoice } from '@/components/setup-choice';

function Header() {
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const auth = getAuth();

  const displayName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : user?.displayName;
  const email = userProfile?.email || user?.email;
  const fallback = userProfile 
    ? `${userProfile.firstName?.charAt(0)}${userProfile.lastName?.charAt(0)}` 
    : user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

  return (
      <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <HomeIcon className="text-primary" size={24} />
            </div>
            <h1 className="text-2xl font-bold font-headline text-foreground">
              زفة
            </h1>
          </div>
          <div>
            {!(isUserLoading || isProfileLoading) && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL ?? ''} alt={displayName ?? 'User'} />
                      <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => auth.signOut()}>
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
  );
}

export default function Home() {
  const { user, isUserLoading, userProfile, isProfileLoading, household, isHouseholdLoading } = useUser();
  const router = useRouter();
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  
  // If we're still figuring out auth state, or there is no user, show a loading screen.
  // This is the gatekeeper. It prevents rendering anything else for logged-out users
  // and allows the useEffect to redirect.
  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }
  
  // At this point, `user` is guaranteed to exist.
  // Now check for the profile.
  if (isProfileLoading || !userProfile) {
    return <div className="flex h-screen items-center justify-center">جاري تحميل حسابك...</div>;
  }

  // At this point, `userProfile` is guaranteed to exist.
  // If user has not completed setup, show the choice screen
  if (!userProfile.householdId) {
    return <SetupChoice />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <InvitationNotification />
      <main className="flex-1">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <Card className="overflow-hidden mb-8 shadow-md border-0 rounded-xl">
            {heroImage && (
              <div className="relative w-full h-48 md:h-64">
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 right-0 p-6 md:p-8 text-right">
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-headline tracking-tight">
                    بنبني مستقبلنا، حاجة حاجة
                  </h2>
                   <p className="mt-2 text-lg text-white/80 max-w-lg">
                    نخطط لكل تفصيلة في بيتنا الجديد بسهولة.
                  </p>
                </div>
              </div>
            )}
          </Card>
          
          <div className="mb-8 space-y-4">
            <PartnerDisplay />
            
            {isHouseholdLoading ? (
              <Card className="bg-primary-foreground border-2 border-dashed border-primary/20">
                 <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2 flex-grow">
                         <Skeleton className="h-5 w-48" />
                         <Skeleton className="h-4 w-full max-w-md" />
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>
                 </CardContent>
              </Card>
            ) : household && household.memberIds.length < 2 ? (
               <Card className="bg-primary-foreground border-2 border-dashed border-primary/20">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-primary">جاهزين للتخطيط سوا؟</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      اعزم شريكك عشان تشاركوا القايمة وتبدأوا تجهزوا عش الزوجية.
                    </p>
                  </div>
                  <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto flex-shrink-0">
                    <UserPlus className="ml-2 h-4 w-4" />
                    ندعي شريك
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <ChecklistClient />
        </div>
      </main>
      <footer className="py-8 border-t mt-12">
        <p className="text-center text-sm text-muted-foreground">
          اتعمل بـ <span className="text-primary">♡</span> لبداية جديدة.
        </p>
      </footer>
       <InviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
