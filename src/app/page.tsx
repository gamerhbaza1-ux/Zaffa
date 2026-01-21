import Image from 'next/image';
import { getItems } from '@/lib/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ChecklistClient from '@/components/checklist/checklist-client';
import { Card } from '@/components/ui/card';
import { Feather } from 'lucide-react';

function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
      <div className="container mx-auto p-4 flex items-center gap-3">
        <Feather className="text-primary" size={28} />
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Nest Planner
        </h1>
      </div>
    </header>
  );
}

export default async function Home() {
  const items = await getItems();
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <Card className="overflow-hidden mb-8 shadow-lg">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-headline">
                    Building Our Future, One Item at a Time
                  </h2>
                </div>
              </div>
            )}
          </Card>
          
          <ChecklistClient initialItems={items} />
        </div>
      </main>
      <footer className="py-6">
        <p className="text-center text-sm text-muted-foreground">
          Made with ♡ for a new beginning.
        </p>
      </footer>
    </div>
  );
}
