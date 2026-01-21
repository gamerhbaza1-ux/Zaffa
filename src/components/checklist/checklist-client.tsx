"use client";

import { useState, useTransition, useOptimistic, useMemo, ReactNode } from 'react';
import type { ChecklistItem, Category } from '@/lib/types';
import { deleteItem, unpurchaseItem } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Plus, Upload, ListPlus } from 'lucide-react';
import { ItemCard } from './item-card';
import { ProgressSummary } from './progress-summary';
import { AddItemDialog } from './add-item-dialog';
import { ImportDialog } from './import-dialog';
import { AddCategoryDialog } from './add-category-dialog';
import { PurchaseDialog } from './purchase-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


type ChecklistClientProps = {
  initialItems: ChecklistItem[];
  initialCategories: Category[];
};

type CategoryWithChildren = Category & { children: CategoryWithChildren[] };
type CategoryTotals = { expected: number; paid: number; itemCount: number; purchasedCount: number };

export default function ChecklistClient({ initialItems, initialCategories }: ChecklistClientProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    initialItems,
    (state, { action, id }: { action: 'unpurchase' | 'delete', id: string }) => {
      if (action === 'unpurchase') {
        return state.map(i => (i.id === id ? { ...i, isPurchased: false, finalPrice: undefined } : i));
      }
      if (action === 'delete') {
        return state.filter(i => i.id !== id);
      }
      return state;
    }
  );

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [itemToPurchase, setItemToPurchase] = useState<ChecklistItem | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  };

  const handleToggle = (id: string) => {
    const item = optimisticItems.find(i => i.id === id);
    if (item) {
      if (item.isPurchased) {
        startTransition(() => {
          setOptimisticItems({ action: 'unpurchase', id });
          unpurchaseItem(id);
        });
      } else {
        setItemToPurchase(item);
      }
    }
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setOptimisticItems({ action: 'delete', id });
      deleteItem(id);
    });
  };

  const purchasedCount = optimisticItems.filter(item => item.isPurchased).length;
  const totalCount = optimisticItems.length;

  const categoriesById = useMemo(() => new Map(initialCategories.map(c => [c.id, c])), [initialCategories]);

  const itemsByCategoryId = useMemo(() => {
    const grouped: { [key: string]: ChecklistItem[] } = {};
    for (const item of optimisticItems) {
      if (!grouped[item.categoryId]) {
        grouped[item.categoryId] = [];
      }
      grouped[item.categoryId].push(item);
    }
    return grouped;
  }, [optimisticItems]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, CategoryTotals>();
    const allCategoryIds = [...categoriesById.keys()];

    function calculate(catId: string): CategoryTotals {
      if (totals.has(catId)) return totals.get(catId)!;

      const directItems = itemsByCategoryId[catId] || [];
      let result: CategoryTotals = {
        expected: directItems.reduce((sum, item) => sum + item.maxPrice, 0),
        paid: directItems.reduce((sum, item) => (item.isPurchased && item.finalPrice ? sum + item.finalPrice : 0), 0),
        itemCount: directItems.length,
        purchasedCount: directItems.filter(i => i.isPurchased).length,
      };

      const children = initialCategories.filter(c => c.parentId === catId);
      for (const child of children) {
        const childTotals = calculate(child.id);
        result.expected += childTotals.expected;
        result.paid += childTotals.paid;
        result.itemCount += childTotals.itemCount;
        result.purchasedCount += childTotals.purchasedCount;
      }
      totals.set(catId, result);
      return result;
    }

    for (const catId of allCategoryIds.reverse()) {
      calculate(catId);
    }
    return totals;
  }, [itemsByCategoryId, initialCategories, categoriesById]);

  const categoryTree = useMemo(() => {
    const tree: CategoryWithChildren[] = [];
    const map = new Map(initialCategories.map(c => [c.id, { ...c, children: [] }]));

    for (const category of map.values()) {
      if (category.parentId && map.has(category.parentId)) {
        map.get(category.parentId)!.children.push(category);
      } else {
        tree.push(category);
      }
    }
    return tree;
  }, [initialCategories]);

  const renderCategoryAccordion = (categories: CategoryWithChildren[]): ReactNode => {
    const filteredCategories = categories.filter(cat => categoryTotals.get(cat.id)?.itemCount ?? 0 > 0);
    
    if (filteredCategories.length === 0) return null;

    return (
      <Accordion type="single" collapsible className="w-full space-y-3" defaultValue={filteredCategories[0]?.id}>
        {filteredCategories.map(category => {
          const directItems = itemsByCategoryId[category.id] || [];
          const totals = categoryTotals.get(category.id);
          if (!totals || totals.itemCount === 0) return null;

          return (
            <AccordionItem value={category.id} key={category.id} className="border rounded-lg overflow-hidden bg-card/50">
              <AccordionTrigger className="text-xl font-bold font-headline hover:no-underline p-4 bg-card">
                 <div className="flex flex-col items-start gap-1 text-right w-full">
                    <div className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-3">
                          <span>{category.name}</span>
                          <Badge variant={totals.purchasedCount === totals.itemCount && totals.itemCount > 0 ? 'default' : 'secondary'}>
                            {totals.purchasedCount}/{totals.itemCount}
                          </Badge>
                       </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-normal flex gap-3">
                       <span>المتوقع: {formatPrice(totals.expected)}</span>
                       <span>المدفوع: {formatPrice(totals.paid)}</span>
                    </div>
                 </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <div className="space-y-3 pt-4 border-t">
                  {directItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      categoryName={categoriesById.get(item.categoryId)?.name || ''}
                      onToggle={() => handleToggle(item.id)}
                      onDelete={() => handleDelete(item.id)}
                      isPending={isPending}
                    />
                  ))}
                  {category.children.length > 0 && (
                    <div className="pr-4 mt-3 border-r-2 border-dashed border-border">
                        {renderCategoryAccordion(category.children)}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" /> إضافة عنصر
          </Button>
          <Button variant="secondary" onClick={() => setImportDialogOpen(true)}>
            <Upload className="ml-2 h-4 w-4" /> استيراد من Excel
          </Button>
          <Button variant="outline" onClick={() => setAddCategoryDialogOpen(true)}>
            <ListPlus className="ml-2 h-4 w-4" /> إضافة فئة
          </Button>
        </div>
        <ProgressSummary purchasedCount={purchasedCount} totalCount={totalCount} />
      </div>

      <div className="space-y-3">
        {optimisticItems.length > 0 ? (
          renderCategoryAccordion(categoryTree)
        ) : (
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-foreground">قائمة المراجعة الخاصة بك فارغة!</h3>
            <p className="text-muted-foreground mt-1">
              ابدأ بإضافة عنصر تحتاجه لمنزلك الجديد.
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              أضف أول عنصر لك
            </Button>
          </div>
        )}
      </div>

      <PurchaseDialog
        item={itemToPurchase}
        onOpenChange={(open) => {
          if (!open) {
            setItemToPurchase(null);
          }
        }}
      />

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={() => { /* revalidation is handled by server action */ }}
        categories={initialCategories}
      />
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <AddCategoryDialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onCategoryAdded={() => { /* revalidation is handled by server action */ }}
        categories={initialCategories}
      />
    </>
  );
}
