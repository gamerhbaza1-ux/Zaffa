'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, ListTree, ShoppingCart, Target, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category, ChecklistItem } from '@/lib/types';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

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

export default function StatsPage() {
  const { user, household, isHouseholdLoading, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  };
  
  const stats = useMemo(() => {
    if (!selectedId || items.length === 0 || categories.length === 0) return null;

    const getDescendantIds = (catId: string): string[] => {
        let ids = [catId];
        const children = categories.filter(c => c.parentId === catId);
        children.forEach(child => {
            ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
    };
    
    const relevantCategoryIds = getDescendantIds(selectedId);
    const relevantItems = items.filter(item => relevantCategoryIds.includes(item.categoryId));

    const totalItems = relevantItems.length;
    const purchasedItems = relevantItems.filter(i => i.isPurchased).length;
    const totalExpected = relevantItems.reduce((sum, item) => sum + (item.minPrice + item.maxPrice) / 2, 0);
    const totalPaid = relevantItems.filter(i => i.isPurchased).reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
    const progress = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
    
    return {
        totalItems,
        purchasedItems,
        totalExpected,
        totalPaid,
        progress,
    };
  }, [selectedId, items, categories]);

  if (isLoading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <StatsHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="space-y-4 max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-full" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Skeleton className="h-28 w-full" />
                                <Skeleton className="h-28 w-full" />
                                <Skeleton className="h-28 w-full" />
                                <Skeleton className="h-28 w-full" />
                            </div>
                             <Skeleton className="h-8 w-full" />
                        </CardContent>
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
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">تحليل القائمة</CardTitle>
                    <CardDescription>
                        اختار قسم أو فئة عشان تشوف تحليل التكاليف والتقدم.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Select onValueChange={setSelectedId} value={selectedId || undefined}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختار قسم أو فئة..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>الأقسام الرئيسية</SelectLabel>
                                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectGroup>
                            {subCategories.length > 0 && (
                                <SelectGroup>
                                    <SelectLabel>الفئات الفرعية</SelectLabel>
                                    {subCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectGroup>
                            )}
                        </SelectContent>
                    </Select>
                    
                    {stats ? (
                        <div className="space-y-6">
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
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>اختار حاجة من فوق عشان نبدأ نحسب.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
