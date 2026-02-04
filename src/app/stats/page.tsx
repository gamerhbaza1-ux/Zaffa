'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ListTree, ShoppingCart, Target, TrendingUp, X, PlusCircle, Star, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category, ChecklistItem, Analysis } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { AnalysisSetupDialog } from '@/components/stats/analysis-setup-dialog';
import { AnalysisItemsDialog } from '@/components/stats/analysis-items-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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

function StatCard({ title, value, icon: Icon, onClick, className }: { title: string, value: string, icon: React.ElementType, onClick?: () => void, className?: string }) {
    return (
        <Card onClick={onClick} className={cn(className, onClick && "cursor-pointer transition-colors hover:bg-card/95")}>
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

function AnalysisResultCard({ analysis, onRemove, onShowItems, onToggleFeatured, onEdit }: { analysis: any, onRemove: (id: string) => void, onShowItems: () => void, onToggleFeatured: (id: string, isCurrentlyFeatured: boolean) => void, onEdit: () => void }) {
    const { title, stats, isFeatured } = analysis;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
    };

    return (
        <Card className="bg-accent/30">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleFeatured(analysis.id, !!isFeatured)}>
                            <Star className={cn("h-4 w-4 transition-colors", isFeatured ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary")} />
                            <span className="sr-only">{isFeatured ? 'إلغاء تثبيت التحليل' : 'تثبيت التحليل في الرئيسية'}</span>
                        </Button>
                        <CardTitle className="font-headline text-lg">{title}</CardTitle>
                    </div>
                     <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">تعديل التحليل</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(analysis.id)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">حذف التحليل</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="إجمالي المتوقع" value={formatPrice(stats.totalExpected)} icon={Target} />
                    <StatCard title="إجمالي المدفوع" value={formatPrice(stats.totalPaid)} icon={ShoppingCart} />
                    <StatCard title="إجمالي البنود" value={stats.totalItems.toString()} icon={ListTree} onClick={onShowItems} />
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
  const { toast } = useToast();
  
  const [isAnalysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [itemsToShow, setItemsToShow] = useState<{title: string, items: ChecklistItem[]} | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const categoriesRef = useMemo(() => household ? collection(firestore, `households/${household.id}/categories`) : null, [household, firestore]);
  const itemsRef = useMemo(() => household ? collection(firestore, `households/${household.id}/checklistItems`) : null, [household, firestore]);
  const analysesRef = useMemo(() => household ? collection(firestore, `households/${household.id}/analyses`) : null, [household, firestore]);

  const { data: categoriesData, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);
  const { data: itemsData, isLoading: areItemsLoading } = useCollection<ChecklistItem>(itemsRef);
  const { data: savedAnalyses, isLoading: areAnalysesLoading } = useCollection<Analysis>(analysesRef);
  
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  const items = useMemo(() => itemsData || [], [itemsData]);

  const isLoading = isUserLoading || isHouseholdLoading || areCategoriesLoading || areItemsLoading || areAnalysesLoading;

  const { sections, subCategories } = useMemo(() => {
    const sections = categories.filter(c => !c.parentId).sort((a,b) => a.name.localeCompare(b.name));
    const subCategories = categories.filter(c => c.parentId).sort((a,b) => a.name.localeCompare(b.name));
    return { sections, subCategories };
  }, [categories]);

  const analyses = useMemo(() => {
    if (!savedAnalyses) return [];

    return savedAnalyses.map(saved => {
        const allRelevantCategoryIds = new Set<string>();
        const getDescendantIds = (catId: string, allCategories: Category[]): string[] => {
            let ids = [catId];
            const children = allCategories.filter(c => c.parentId === catId);
            children.forEach(child => {
                ids = [...ids, ...getDescendantIds(child.id, allCategories)];
            });
            return ids;
        };

        saved.categoryIds.forEach(id => {
            getDescendantIds(id, categories).forEach(descId => allRelevantCategoryIds.add(descId));
        });

        const relevantItems = items.filter(item => allRelevantCategoryIds.has(item.categoryId));
        const totalItems = relevantItems.length;
        const purchasedItems = relevantItems.filter(i => i.isPurchased).length;
        const totalExpected = relevantItems.reduce((sum, item) => sum + (item.minPrice + item.maxPrice) / 2, 0);
        const totalPaid = relevantItems.filter(i => i.isPurchased).reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
        const progress = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
        
        const stats = { totalItems, purchasedItems, totalExpected, totalPaid, progress };
        
        return {
            id: saved.id,
            title: saved.title,
            isFeatured: saved.isFeatured,
            categoryIds: saved.categoryIds,
            stats,
            items: relevantItems,
        };
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [savedAnalyses, items, categories]);

  const handleSaveAnalysis = useCallback((data: { title: string; selection: string[] }) => {
    if (!analysesRef) return;
    const { title, selection } = data;

    if (editingAnalysis) { // UPDATE
        const analysisDocRef = doc(analysesRef, editingAnalysis.id);
        const updatedData = { categoryIds: selection, title };
        
        updateDoc(analysisDocRef, updatedData)
            .then(() => {
                toast({ title: 'تم تحديث التحليل' });
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: analysisDocRef.path, operation: 'update', requestResourceData: updatedData })));
    } else { // CREATE
        if (selection.length === 0) return;
        const newAnalysisData: Omit<Analysis, 'id'> = { title, categoryIds: selection, isFeatured: false };
        addDoc(analysesRef, newAnalysisData)
            .then(() => {
                toast({ title: 'تم إنشاء التحليل', description: 'تم حفظ التحليل بنجاح.' });
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: analysesRef.path, operation: 'create', requestResourceData: newAnalysisData })));
    }
    
    setAnalysisDialogOpen(false);
    setEditingAnalysis(null);
  }, [analysesRef, toast, editingAnalysis]);

  const handleRemoveAnalysis = (id: string) => {
    if (!analysesRef) return;
    const analysisDocRef = doc(analysesRef, id);
    deleteDoc(analysisDocRef)
        .then(() => {
            toast({ title: 'تم حذف التحليل' });
        })
        .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: analysisDocRef.path, operation: 'delete' })));
  };
  
  const handleToggleFeatured = (id: string, isCurrentlyFeatured: boolean) => {
    if (!analysesRef) return;
    const analysisDocRef = doc(analysesRef, id);
    updateDoc(analysisDocRef, { isFeatured: !isCurrentlyFeatured })
        .then(() => {
            toast({ title: !isCurrentlyFeatured ? 'تم التثبيت في الرئيسية' : 'تمت الإزالة من الرئيسية' });
        })
        .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: analysisDocRef.path, operation: 'update', requestResourceData: { isFeatured: !isCurrentlyFeatured } })));
  };

  const isEditing = !!editingAnalysis;
  const isDialogOpen = isAnalysisDialogOpen || isEditing;

  const handleDialogClose = () => {
    setAnalysisDialogOpen(false);
    setEditingAnalysis(null);
  }

  if (isLoading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <StatsHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="flex justify-start">
                        <Skeleton className="h-10 w-48" />
                    </div>
                    <Skeleton className="h-64 w-full" />
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
            <div className="flex justify-start">
                <Button onClick={() => setAnalysisDialogOpen(true)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء تحليل جديد
                </Button>
            </div>

            <AnalysisSetupDialog
                open={isDialogOpen}
                onOpenChange={(open) => !open && handleDialogClose()}
                isEditing={isEditing}
                initialData={editingAnalysis ? { title: editingAnalysis.title, selection: editingAnalysis.categoryIds } : null}
                sections={sections}
                subCategories={subCategories}
                onSave={handleSaveAnalysis}
            />

            <AnalysisItemsDialog
                open={!!itemsToShow}
                onOpenChange={() => setItemsToShow(null)}
                title={itemsToShow?.title || 'البنود'}
                items={itemsToShow?.items || []}
                categories={categories}
            />

            {analyses.length > 0 ? (
                <div className="space-y-6">
                    {analyses.map(analysis => (
                        <AnalysisResultCard 
                            key={analysis.id} 
                            analysis={analysis} 
                            onRemove={handleRemoveAnalysis} 
                            onShowItems={() => setItemsToShow({ title: analysis.title, items: analysis.items })}
                            onToggleFeatured={handleToggleFeatured}
                            onEdit={() => setEditingAnalysis(analysis)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-medium">ابدأ بتحليل قائمتك</h3>
                    <p className="mt-2">اضغط على "إنشاء تحليل جديد" لاختيار الأقسام والفئات التي تريد تلخيصها.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
