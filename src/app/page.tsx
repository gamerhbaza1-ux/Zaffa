'use client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ChecklistClient from '@/components/checklist/checklist-client';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
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
import { PartnerDisplay } from '@/components/partner-display';
import { InvitationNotification } from '@/components/invitation-notification';
import { Home as HomeIcon, Loader2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, runTransaction } from 'firebase/firestore';

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

function AutomaticHouseholdSetup({ forceSetup = false }: { forceSetup?: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  useEffect(() => {
    // This effect runs on the client when a user is logged in but has no household,
    // or if their household data is inconsistent.
    if (user && firestore && !isPending) {
      startTransition(async () => {
        try {
          await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, "users", user.uid);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists()) {
              throw new Error("لم يتم العثور على حسابك. حاول تسجيل الخروج والدخول مرة أخرى.");
            }

            // If householdId exists and we are not forcing a setup, bail out.
            if (userSnap.data().householdId && !forceSetup) {
              return;
            }

            // 1. Create a new household document
            const householdRef = doc(collection(firestore, "households"));
            transaction.set(householdRef, {
              memberIds: [user.uid],
            });

            // 2. Update the user's profile with the new householdId
            transaction.update(userRef, { householdId: householdRef.id });
          });
          // On success, the useUser hook's onSnapshot listener will re-fetch
          // userProfile. This will cause this component to unmount and the
          // main app content to show. No success toast is needed.
        } catch (e) {
           const message = e instanceof Error ? e.message : "An unknown error occurred";
           toast({
            variant: "destructive",
            title: "فشلت عملية الإعداد",
            description: message,
          });
           console.error("Automatic household setup failed:", e);
        }
      });
    }
  }, [user, firestore, isPending, startTransition, toast, forceSetup]);

  return (
     <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="max-w-2xl mx-auto">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
            <h1 className="text-2xl font-bold font-headline mb-2">أهلاً بك في زفة!</h1>
            <p className="text-lg text-muted-foreground">
                لحظات من فضلك، نقوم بإعداد حسابك لأول مرة...
            </p>
        </div>
      </div>
  );
}


export default function Home() {
  const { user, isUserLoading, userProfile, isProfileLoading, household, isHouseholdLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  
  if (isUserLoading || !user || isProfileLoading || isHouseholdLoading) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }
  
  // Data is inconsistent if the user profile has a householdId, but the household document itself is missing.
  const isDataInconsistent = !!(userProfile?.householdId && !household);

  if (!userProfile || !userProfile.householdId || isDataInconsistent) {
    return <AutomaticHouseholdSetup forceSetup={isDataInconsistent} />;
  }

  // If all checks pass, render the main application content.
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
          </div>

          <ChecklistClient />
        </div>
      </main>
      <footer className="py-8 border-t mt-12">
        <p className="text-center text-sm text-muted-foreground">
          اتعمل بـ <span className="text-primary">♡</span> لبداية جديدة.
        </p>
      </footer>
    </div>
  );
}
