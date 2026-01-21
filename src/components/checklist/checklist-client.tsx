"use client";

import { useState, useTransition, useOptimistic, useMemo } from 'react';
import type { ChecklistItem } from '@/lib/types';
import { deleteItem, toggleItemPurchased } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Plus, Upload, ListPlus } from 'lucide-react';
import { ItemCard } from './item-card';
import { ProgressSummary } from './progress-summary';
import { AddItemDialog } from './add-item-dialog';
import { ImportDialog } from './import-dialog';
import { AddCategoryDialog } from './add-category-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


type ChecklistClientProps = {
  initialItems: ChecklistItem[];
  initialCategories: string[];
};

export default function ChecklistClient({ initialItems, initialCategories }: ChecklistClientProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    initialItems,
    (state, { action, item, id }: { action: 'toggle' | 'delete', item?: ChecklistItem, id?: string }) => {
      if (action === 'toggle' && item) {
        return state.map(i => (i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i));
      }
      if (action === 'delete' && id) {
        return state.filter(i => i.id !== id);
      }
      return state;
    }
  );

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);

  const handleToggle = (id: string) => {
    const item = optimisticItems.find(i => i.id === id);
    if (item) {
      startTransition(() => {
        setOptimisticItems({ action: 'toggle', item });
        toggleItemPurchased(id);
      });
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

  const itemsByCategory = useMemo(() => {
    const grouped: { [key: string]: ChecklistItem[] } = {};
    for (const category of initialCategories) {
      grouped[category] = [];
    }
    for (const item of optimisticItems) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  }, [optimisticItems, initialCategories]);
  
  const orderedCategories = useMemo(() => {
    return initialCategories.filter(cat => itemsByCategory[cat] && itemsByCategory[cat].length > 0);
  }, [itemsByCategory, initialCategories]);
  
  const defaultOpenCategory = orderedCategories.length > 0 ? orderedCategories[0] : undefined;


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
          <Accordion type="single" collapsible className="w-full space-y-3" defaultValue={defaultOpenCategory}>
            {orderedCategories.map(category => {
              const items = itemsByCategory[category];
              const categoryPurchasedCount = items.filter(i => i.isPurchased).length;
              
              return (
                <AccordionItem value={category} key={category} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="text-xl font-bold font-headline hover:no-underline p-4 bg-card">
                    <div className="flex items-center gap-3">
                      <span>{category}</span>
                      <Badge variant={categoryPurchasedCount === items.length && items.length > 0 ? 'default' : 'secondary'}>{categoryPurchasedCount}/{items.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="space-y-3 pt-4 border-t">
                    {items.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onToggle={() => handleToggle(item.id)}
                        onDelete={() => handleDelete(item.id)}
                        isPending={isPending}
                      />
                    ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
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
      />
    </>
  );
}
