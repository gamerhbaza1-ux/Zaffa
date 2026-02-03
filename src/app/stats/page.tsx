'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, ListTree, ShoppingCart, Target, TrendingUp, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category, ChecklistItem } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { nanoid } from 'nanoid';

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

function StatsHeader() {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <ZaytounaIcon className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-headline text-foreground">
            الزتونة
          </h1>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href="/" aria-label="الرجوع للرئيسية">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function AnalysisResultCard({ analysis, onRemove }: { analysis: any, onRemove: (id: string) => void }) {
    const { title, stats } = analysis;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
    };

    return (
        <Card className="bg-accent/30">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(analysis.id)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="إجمالي المتوقع" value={formatPrice(stats.totalExpected)} icon={Target} />
                    <StatCard title="إجمالي المدفوع" value={formatPrice(stats.totalPaid)} icon={ShoppingCart} />
                    <StatCard title="إجمالي البنود" value={stats.totalItems.toString()} icon={ListTree} />
                    <StatCard title="نسبة الإنجاز" value={`${Math.round(stats.progress)}%`} icon={TrendingUp} />
                </div>
                <div>
                    <h3 className="text-sm font-medium mb-2">شريط التقدم ({stats.purchasedItems} من {stats.totalItems})</h3>
                    <Progress value={stats.progress} />
                </div>
            </CardContent>
        </Card>
    )
}

export default function StatsPage() {
  const { user, household, isHouseholdLoading, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [selection, setSelection] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const categoriesRef = useMemo(() => household ? collection(firestore, `households/${household.id}/categories`) : null, [household, firestore]);
  const itemsRef = useMemo(() => household ? collection(firestore, `households/${household.id}/checklistItems`) : null, [household, firestore]);

  const { data: categoriesData, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);
  const { data: itemsData, isLoading: areItemsLoading } = useCollection<ChecklistItem>(itemsRef);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  const items = useMemo(() => itemsData || [], [itemsData]);

  const isLoading = isUserLoading || isHouseholdLoading || areCategoriesLoading || areItemsLoading;

  const { sections, subCategories } = useMemo(() => {
    const sections = categories.filter(c => !c.parentId).sort((a,b) => a.name.localeCompare(b.name));
    const subCategories = categories.filter(c => c.parentId).sort((a,b) => a.name.localeCompare(b.name));
    return { sections, subCategories };
  }, [categories]);

  const handleSelectionChange = (checked: boolean | 'indeterminate', id: string) => {
    setSelection(prev => {
        if (checked) {
            return [...prev, id];
        } else {
            return prev.filter(existingId => existingId !== id);
        }
    });
  };

  const handleCreateAnalysis = useCallback(() => {
    if (selection.length === 0) return;

    const getDescendantIds = (catId: string): string[] => {
        let ids = [catId];
        const children = categories.filter(c => c.parentId === catId);
        children.forEach(child => {
            ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
    };
    
    const allRelevantCategoryIds = new Set<string>();
    selection.forEach(id => {
        getDescendantIds(id).forEach(descId => allRelevantCategoryIds.add(descId));
    });

    const relevantItems = items.filter(item => allRelevantCategoryIds.has(item.categoryId));
    const totalItems = relevantItems.length;
    const purchasedItems = relevantItems.filter(i => i.isPurchased).length;
    const totalExpected = relevantItems.reduce((sum, item) => sum + (item.minPrice + item.maxPrice) / 2, 0);
    const totalPaid = relevantItems.filter(i => i.isPurchased).reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
    const progress = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
    
    const stats = { totalItems, purchasedItems, totalExpected, totalPaid, progress };
    
    const selectedNames = selection
        .map(id => categories.find(c => c.id === id)?.name)
        .filter(Boolean);
    const title = `تحليل: ${selectedNames.join('، ')}`;

    const newAnalysis = { id: nanoid(), title, stats };

    setAnalyses(prev => [newAnalysis, ...prev]);
    setSelection([]);
  }, [selection, items, categories]);

  const handleRemoveAnalysis = (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };


  if (isLoading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <StatsHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="space-y-4 max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-32 w-full" />
                        </CardContent>
                        <CardFooter>
                           <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <StatsHeader />
      <main className="flex-1">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">إنشاء تحليل جديد</CardTitle>
                    <CardDescription>
                        اختار الأقسام أو الفئات اللي عاوز تجمع تحليلها في تقرير واحد.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium text-muted-foreground mb-3">الأقسام الرئيسية</h4>
                        <div className="space-y-2">
                        {sections.map(s => (
                            <div key={s.id} className="flex items-center gap-2">
                                <Checkbox id={s.id} checked={selection.includes(s.id)} onCheckedChange={(checked) => handleSelectionChange(checked, s.id)} />
                                <label htmlFor={s.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                    {s.name}
                                </label>
                            </div>
                        ))}
                        </div>
                    </div>
                     {subCategories.length > 0 && (
                        <>
                        <Separator />
                        <div>
                            <h4 className="font-medium text-muted-foreground mb-3">الفئات الفرعية</h4>
                            <div className="space-y-2">
                            {subCategories.map(c => (
                                <div key={c.id} className="flex items-center gap-2">
                                    <Checkbox id={c.id} checked={selection.includes(c.id)} onCheckedChange={(checked) => handleSelectionChange(checked, c.id)} />
                                    <label htmlFor={c.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        {c.name}
                                    </label>
                                </div>
                            ))}
                            </div>
                        </div>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCreateAnalysis} disabled={selection.length === 0}>
                        إنشاء تحليل
                    </Button>
                </CardFooter>
            </Card>

            {analyses.length > 0 ? (
                <div className="space-y-6">
                    {analyses.map(analysis => (
                        <AnalysisResultCard key={analysis.id} analysis={analysis} onRemove={handleRemoveAnalysis} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>لسه مفيش تحليلات. اختار حاجة من فوق عشان تبدأ.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
