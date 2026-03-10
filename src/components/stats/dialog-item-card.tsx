'use client';

import type { ChecklistItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, MoreVertical, Pencil, Trash2, Search } from 'lucide-react';
import { Badge } from '../ui/badge';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(price);
};

interface DialogItemCardProps {
  item: ChecklistItem;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  onComparePrice?: (model: string) => void;
}

export function DialogItemCard({
  item,
  onEdit,
  onDelete,
  onComparePrice,
}: DialogItemCardProps) {
  const qty = item.quantity || 1;
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all group relative',
        item.isPurchased &&
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      )}
    >
      <CardContent className="p-3">
        <div className="absolute top-1 left-1 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`خيارات لـ ${item.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => onEdit(item)}>
                <Pencil className="ml-2 h-4 w-4" />
                <span>تعديل/نقل</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="ml-2 h-4 w-4" />
                <span>حذف</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {item.isPurchased && (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 absolute top-2 right-2" />
        )}
        
        <div className="flex flex-col items-center justify-center pt-2 gap-1 text-center">
          <p className="font-bold text-xs sm:text-sm truncate w-full px-2" title={item.name}>
            {item.name}
          </p>
          
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {qty > 1 && (
                <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-primary/20 text-primary">
                    ×{qty}
                </Badge>
            )}
            {item.isPurchased && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-[9px] h-3.5 px-1">تم</Badge>
            )}
          </div>

          {item.suggestedModel && onComparePrice && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onComparePrice(item.suggestedModel!);
              }}
              className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 w-full max-w-[90%] justify-center"
            >
                <Search className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{item.suggestedModel}</span>
            </button>
          )}
        </div>
      </CardContent>
      <CardFooter
        className="bg-card-foreground/5 dark:bg-card-foreground/10 p-2 text-[10px] text-muted-foreground justify-center"
      >
        <p className="truncate w-full text-center font-medium">
          {item.isPurchased
            ? `المدفوع: ${formatPrice(item.finalPrice ?? 0)}`
            : `~ ${formatPrice(((item.minPrice + item.maxPrice) / 2) * qty)}`}
        </p>
      </CardFooter>
    </Card>
  );
}