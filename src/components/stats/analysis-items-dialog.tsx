'use client';

import type { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AnalysisItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ChecklistItem[];
}

export function AnalysisItemsDialog({ open, onOpenChange, title, items }: AnalysisItemsDialogProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
          <DialogDescription>
            قائمة البنود المدرجة في هذا التحليل.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3 py-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center rounded-md border p-3">
                <div>
                    <p className={cn("font-medium", item.isPurchased && "line-through text-muted-foreground")}>{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {item.isPurchased && typeof item.finalPrice === 'number'
                            ? `تم الشراء بسعر: ${formatPrice(item.finalPrice)}` 
                            : `المتوقع: ${formatPrice(item.minPrice)} - ${formatPrice(item.maxPrice)}`}
                    </p>
                </div>
                {item.isPurchased && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800/50">
                        تم الشراء
                    </Badge>
                )}
              </div>
            ))}
             {items.length === 0 && (
                <p className="text-center text-muted-foreground py-8">لا توجد بنود في هذا التحليل.</p>
             )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
