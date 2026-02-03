'use client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ChecklistClient from '@/components/checklist/checklist-client';
import { Card } from '@/components/ui/card';
import { Home as HomeIcon, LogOut, History, Settings } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { SetupHandler } from '@/components/setup-handler';
import { PartnerDisplay } from '@/components/partner-display';
import { InvitationNotification } from '@/components/invitation-notification';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import type { HeroConfig } from '@/lib/types';
import { HeroSettingsDialog } from '@/components/hero-settings-dialog';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function Header() {
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  const ZaytounaIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M19.68 10.7a6.5 6.5 0 00-15.35 0A6.5 6.5 0 0012 22a6.5 6.5 0 007.68-11.3zM4 11.5a5.5 5.5 0 0110.4-2.52 5.5 5.5 0 01-2.9 9.42A5.5 5.5 0 014 11.5z" />
      <path d="M12 1C12 1 8 5 8 9.5a4 4 0 108 0C16 5 12 1 12 1z" />
    </svg>
  );

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
              <ThemeSwitcher />
              <Button variant="ghost" size="icon" asChild>
                <Link href="/stats" aria-label="عرض الزتونة">
                    <ZaytounaIcon className="h-5 w-5 text-muted-foreground" />
                </Link>
              </Button>
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
  const placeholderHero = PlaceHolderImages.find(p => p.id === 'hero')!;
  const { user, household, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isHeroSettingsOpen, setHeroSettingsOpen] = useState(false);
  const [isSaving, startTransition] = useTransition();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const heroConfig = household?.heroConfig ? {
    imageUrl: household.heroConfig.imageUrl || placeholderHero.imageUrl,
    imageHint: 'custom',
    title: household.heroConfig.title,
    subtitle: household.heroConfig.subtitle
  } : {
    imageUrl: placeholderHero.imageUrl,
    imageHint: placeholderHero.imageHint,
    title: 'بنبني مستقبلنا، حاجة حاجة',
    subtitle: 'نخطط لكل تفصيلة في بيتنا الجديد بسهولة.'
  };

  const handleSaveHeroConfig = (data: Omit<HeroConfig, 'imageHint'>) => {
    if (!household || !firestore) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن حفظ التغييرات الآن.' });
        return;
    }
    
    startTransition(() => {
        const householdRef = doc(firestore, 'households', household.id);
        const newConfig = {
            heroConfig: {
                title: data.title,
                subtitle: data.subtitle,
                imageUrl: data.imageUrl || placeholderHero.imageUrl // fallback to placeholder
            }
        };

        updateDoc(householdRef, newConfig)
            .then(() => {
                toast({ title: 'تم الحفظ!', description: 'تم تحديث الواجهة بنجاح.' });
                setHeroSettingsOpen(false);
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: householdRef.path,
                    operation: 'update',
                    requestResourceData: newConfig
                }));
            });
    });
  };

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <InvitationNotification />
        <Header />
        <main className="flex-1">
          <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <Card className="overflow-hidden mb-8 shadow-md border-0 rounded-xl">
              <div className="relative w-full h-48 md:h-64">
                <Image
                  src={heroConfig.imageUrl}
                  alt="صورة الواجهة الرئيسية"
                  fill
                  className="object-cover"
                  data-ai-hint={heroConfig.imageHint}
                  priority
                  // In case of error, use a transparent pixel to avoid ugly broken image icon
                  onError={(e) => { e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 right-0 p-6 md:p-8 text-right">
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-headline tracking-tight">
                    {heroConfig.title}
                  </h2>
                   <p className="mt-2 text-lg text-white/80 max-w-lg">
                    {heroConfig.subtitle}
                  </p>
                </div>
                 {household && (
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute top-4 left-4 h-8 w-8 rounded-full"
                        onClick={() => setHeroSettingsOpen(true)}
                    >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">تعديل الواجهة</span>
                    </Button>
                )}
              </div>
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
      
      {household && (
        <HeroSettingsDialog
            open={isHeroSettingsOpen}
            onOpenChange={setHeroSettingsOpen}
            onSave={handleSaveHeroConfig}
            currentConfig={{
                title: heroConfig.title,
                subtitle: heroConfig.subtitle,
                imageUrl: heroConfig.imageUrl
            }}
            isSaving={isSaving}
        />
      )}
    </>
  );
}
