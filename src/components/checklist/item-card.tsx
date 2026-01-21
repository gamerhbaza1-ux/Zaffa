"use client";

import type { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

type ItemCardProps = {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
  isPending: boolean;
};

export function ItemCard({ item, onToggle, onDelete, isPending }: ItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <Card
      className={cn(
        'p-4 flex items-center gap-4 transition-all duration-300 animate-in fade-in-0 zoom-in-95',
        item.isPurchased && 'bg-muted/70',
        isPending && 'opacity-50 pointer-events-none'
      )}
    >
      <Checkbox
        id={`item-${item.id}`}
        checked={item.isPurchased}
        onCheckedChange={onToggle}
        aria-label={`تحديد ${item.name} كعنصر تم شراؤه`}
        className="h-5 w-5 rounded"
      />
      <div className="flex-1 grid gap-1">
        <div className="flex items-center gap-2">
            <label
              htmlFor={`item-${item.id}`}
              className={cn(
                'font-medium text-lg cursor-pointer transition-all',
                item.isPurchased && 'line-through text-muted-foreground'
              )}
            >
              {item.name}
            </label>
            <Badge variant="outline">{item.category}</Badge>
        </div>
        {item.isPurchased && typeof item.finalPrice === 'number' ? (
            <p className="text-sm text-muted-foreground">
                السعر النهائي: {formatPrice(item.finalPrice)}
            </p>
        ) : (
            <p className={cn("text-sm text-muted-foreground", item.isPurchased && 'line-through')}>
              السعر التقديري: {formatPrice(item.minPrice)} - {formatPrice(item.maxPrice)}
            </p>
        )}
      </div>
      {item.isPurchased && (
        <Badge variant="secondary" className="bg-accent text-accent-foreground border-accent-foreground/20">تم الشراء</Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={`حذف ${item.name}`}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
