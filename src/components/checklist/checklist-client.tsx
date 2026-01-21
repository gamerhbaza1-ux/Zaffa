"use client";

import { useState, useTransition, useOptimistic } from 'react';
import type { ChecklistItem } from '@/lib/types';
import { deleteItem, toggleItemPurchased } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { ItemCard } from './item-card';
import { ProgressSummary } from './progress-summary';
import { AddItemDialog } from './add-item-dialog';
import { ImportDialog } from './import-dialog';

type ChecklistClientProps = {
  initialItems: ChecklistItem[];
};

export default function ChecklistClient({ initialItems }: ChecklistClientProps) {
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

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" /> إضافة عنصر
          </Button>
          <Button variant="secondary" onClick={() => setImportDialogOpen(true)}>
            <Upload className="ml-2 h-4 w-4" /> استيراد من Excel
          </Button>
        </div>
        <ProgressSummary purchasedCount={purchasedCount} totalCount={totalCount} />
      </div>

      <div className="space-y-3">
        {optimisticItems.length > 0 ? (
          optimisticItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item.id)}
              onDelete={() => handleDelete(item.id)}
              isPending={isPending}
            />
          ))
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
      />
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </>
  );
}
