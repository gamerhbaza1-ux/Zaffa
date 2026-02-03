
'use client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ChecklistClient from '@/components/checklist/checklist-client';
import { Card } from '@/components/ui/card';
import { Home as HomeIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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

function Header() {
  const { user, isUserLoading } = useAuth();
  const auth = getAuth();

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <HomeIcon className="text-primary" size={24} />
          </div>
          <h1 className="text-2xl font-bold font-headline text-foreground">
            عش المخطط
          </h1>
        </div>
        <div>
          {!isUserLoading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => auth.signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
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
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  
  if (isUserLoading || !user) {
    // You can show a loading spinner here
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
