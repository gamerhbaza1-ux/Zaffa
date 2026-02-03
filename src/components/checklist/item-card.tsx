"use client";

import type { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil } from 'lucide-react';
import { Badge } from '../ui/badge';

type ItemCardProps = {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function ItemCard({ item, onToggle, onDelete, onEdit }: ItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div
      className={cn(
        'p-3 flex items-center gap-4 transition-colors duration-200 rounded-lg border border-transparent hover:bg-accent',
        item.isPurchased && 'bg-accent/50'
      )}
    >
      <Checkbox
        id={`item-${item.id}`}
        checked={item.isPurchased}
        onCheckedChange={onToggle}
        aria-label={`نعلم على ${item.name} انها اتجابت`}
        className="h-5 w-5 rounded"
      />
      <div className="flex-1 grid gap-1">
        <label
          htmlFor={`item-${item.id}`}
          className={cn(
            'font-medium text-base cursor-pointer transition-all',
            item.isPurchased && 'line-through text-muted-foreground'
          )}
        >
          {item.name}
        </label>
        {item.isPurchased && typeof item.finalPrice === 'number' ? (
            <p className="text-sm text-primary">
                جبناها بكام: {formatPrice(item.finalPrice)}
            </p>
        ) : (
            <p className={cn("text-sm text-muted-foreground", item.isPurchased && 'line-through')}>
              السعر المتوقع: {formatPrice(item.minPrice)} - {formatPrice(item.maxPrice)}
            </p>
        )}
      </div>
      {item.isPurchased && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800/50">جبناها</Badge>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label={`نعدّل ${item.name}`}
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-full"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={`نمسح ${item.name}`}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
