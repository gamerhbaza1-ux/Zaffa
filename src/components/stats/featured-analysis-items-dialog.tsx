'use client';

import { useMemo } from 'react';
import type { ChecklistItem, Category } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

// Type for the analysis data expected by the dialog
interface AnalysisData {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface FeaturedAnalysisItemsDialogProps {
  analysis: AnalysisData | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
};

// A small card to display a single checklist item in the grid
function ItemDisplayCard({ item }: { item: ChecklistItem }) {
    return (
        <Card className={cn("overflow-hidden transition-all", item.isPurchased && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800")}>
            <CardContent className="p-3 relative">
                {item.isPurchased && (
                     <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 absolute top-2 left-2" />
                )}
                <p className="font-bold text-sm truncate">{item.name}</p>
            </CardContent>
            <CardFooter className="bg-card-foreground/5 dark:bg-card-foreground/10 p-2 text-xs text-muted-foreground">
                <p className="truncate">
                    {item.isPurchased
                        ? `تم: ${formatPrice(item.finalPrice ?? 0)}`
                        : `~ ${formatPrice((item.minPrice + item.maxPrice) / 2)}`
                    }
                </p>
            </CardFooter>
        </Card>
    );
}

export function FeaturedAnalysisItemsDialog({ analysis, categories, onOpenChange }: FeaturedAnalysisItemsDialogProps) {
  const { sections, itemsBySection } = useMemo(() => {
    if (!analysis) return { sections: [], itemsBySection: {} };

    const categoriesById = new Map(categories.map(c => [c.id, c]));

    const getSectionOfItem = (item: ChecklistItem): Category | null => {
        let category = categoriesById.get(item.categoryId);
        if (!category) return null;
        // Traverse up to find the top-level parent (the section)
        while(category && category.parentId) {
            const parent = categoriesById.get(category.parentId);
            if (!parent) break; // Should not happen in consistent data
            category = parent;
        }
        return category || null;
    };
    
    const itemsBySection: Record<string, ChecklistItem[]> = {};
    analysis.items.forEach(item => {
        const section = getSectionOfItem(item);
        if (section) {
            if (!itemsBySection[section.id]) {
                itemsBySection[section.id] = [];
            }
            itemsBySection[section.id].push(item);
        }
    });

    const sections = Object.keys(itemsBySection).map(id => categoriesById.get(id)!).filter(Boolean);
    sections.sort((a,b) => a.name.localeCompare(b.name));

    return { sections, itemsBySection };
  }, [analysis, categories]);
  
  const defaultTab = sections.length > 0 ? 'all' : (analysis?.items.length ? 'all' : '');

  return (
    <Dialog open={!!analysis} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{analysis?.title}</DialogTitle>
          <DialogDescription>
            هنا كل البنود اللي تبع التحليل ده. ممكن تفلتر بالأقسام.
          </DialogDescription>
        </DialogHeader>
        
        {analysis && analysis.items.length > 0 ? (
            <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col min-h-0">
                <TabsList className="flex-wrap h-auto justify-start">
                    <TabsTrigger value="all">كل البنود ({analysis.items.length})</TabsTrigger>
                    {sections.map(section => (
                        <TabsTrigger key={section.id} value={section.id}>
                            {section.name} ({itemsBySection[section.id].length})
                        </TabsTrigger>
                    ))}
                </TabsList>
                <ScrollArea className="flex-1 mt-4">
                    <TabsContent value="all" className="mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-1">
                            {analysis.items.map(item => <ItemDisplayCard key={item.id} item={item} />)}
                        </div>
                    </TabsContent>
                    {sections.map(section => (
                        <TabsContent key={section.id} value={section.id} className="mt-0">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-1">
                                {itemsBySection[section.id].map(item => <ItemDisplayCard key={item.id} item={item} />)}
                            </div>
                        </TabsContent>
                    ))}
                </ScrollArea>
            </Tabs>
        ) : (
             <div className="flex-1 flex items-center justify-center">
                 <p className="text-muted-foreground">لا توجد بنود في هذا التحليل.</p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
