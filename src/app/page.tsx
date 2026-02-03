'use client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ChecklistClient from '@/components/checklist/checklist-client';
import { Card } from '@/components/ui/card';
import { Home as HomeIcon, LogOut, History } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SetupHandler } from '@/components/setup-handler';
import { PartnerDisplay } from '@/components/partner-display';
import { InvitationNotification } from '@/components/invitation-notification';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function Header() {
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

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
          {user && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/log" aria-label="عرض سجل النشاط">
                    <History className="h-5 w-5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="تسجيل الخروج">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </header>
  );
}

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <InvitationNotification />
      <Header />
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

          <div className="space-y-8">
             <PartnerDisplay />
             <SetupHandler>
                <ChecklistClient />
             </SetupHandler>
          </div>

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
