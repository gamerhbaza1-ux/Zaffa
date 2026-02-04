'use client';

import { useMemo, useState } from 'react';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Analysis, Category, ChecklistItem } from '@/lib/types';
import { ProgressSummary } from './checklist/progress-summary';
import { Skeleton } from './ui/skeleton';
import { Star } from 'lucide-react';
import { FeaturedAnalysisItemsDialog } from '@/components/stats/featured-analysis-items-dialog';

// Type for analysis with items included, to be passed around
type AnalysisWithItems = {
    id: string;
    title: string;
    totalCount: number;
    purchasedCount: number;
    items: ChecklistItem[];
};

function FeaturedAnalysisCard({ analysis, onClick }: { analysis: AnalysisWithItems, onClick: () => void }) {
    return (
        <div className="cursor-pointer group" onClick={onClick}>
            <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{analysis.title}</h3>
            </div>
            <ProgressSummary purchasedCount={analysis.purchasedCount} totalCount={analysis.totalCount} />
        </div>
    );
}

export function FeaturedAnalyses() {
    const { household, isHouseholdLoading } = useUser();
    const firestore = useFirestore();
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisWithItems | null>(null);

    const analysesRef = useMemo(() => household ? collection(firestore, `households/${household.id}/analyses`) : null, [household, firestore]);
    const itemsRef = useMemo(() => household ? collection(firestore, `households/${household.id}/checklistItems`) : null, [household, firestore]);
    const categoriesRef = useMemo(() => household ? collection(firestore, `households/${household.id}/categories`) : null, [household, firestore]);

    const { data: savedAnalyses, isLoading: areAnalysesLoading } = useCollection<Analysis>(analysesRef);
    const { data: itemsData, isLoading: areItemsLoading } = useCollection<ChecklistItem>(itemsRef);
    const { data: categoriesData, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);

    const featuredAnalyses = useMemo((): AnalysisWithItems[] => {
        const items = itemsData || [];
        const categories = categoriesData || [];
        const analyses = savedAnalyses || [];

        if (!analyses.length || !items.length || !categories.length) return [];
        
        const featured = analyses.filter(a => a.isFeatured);
        if (!featured.length) return [];
        
        const getDescendantIds = (catId: string, allCategories: Category[]): string[] => {
            let ids = [catId];
            const children = allCategories.filter(c => c.parentId === catId);
            children.forEach(child => {
                ids = [...ids, ...getDescendantIds(child.id, allCategories)];
            });
            return ids;
        };

        return featured.map(saved => {
            const allRelevantCategoryIds = new Set<string>();
            saved.categoryIds.forEach(id => {
                getDescendantIds(id, categories).forEach(descId => allRelevantCategoryIds.add(descId));
            });

            const relevantItems = items.filter(item => allRelevantCategoryIds.has(item.categoryId));
            const totalCount = relevantItems.length;
            const purchasedCount = relevantItems.filter(i => i.isPurchased).length;

            return {
                id: saved.id,
                title: saved.title,
                totalCount,
                purchasedCount,
                items: relevantItems,
            };
        });
    }, [savedAnalyses, itemsData, categoriesData]);
    
    const isLoading = isHouseholdLoading || areAnalysesLoading || areItemsLoading || areCategoriesLoading;

    if (isLoading) {
        return (
            <div className="space-y-4 pt-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    if (featuredAnalyses.length === 0) {
        return null; // Don't render anything if no analyses are featured
    }

    return (
        <>
            <div className="space-y-6 pt-4">
                {featuredAnalyses.map(analysis => (
                    <FeaturedAnalysisCard key={analysis.id} analysis={analysis} onClick={() => setSelectedAnalysis(analysis)} />
                ))}
            </div>
            <FeaturedAnalysisItemsDialog
                analysis={selectedAnalysis}
                categories={categoriesData || []}
                onOpenChange={(open) => { if (!open) setSelectedAnalysis(null) }}
            />
        </>
    );
}
