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
import { CheckCircle2, MoreVertical, Pencil, Trash2 } from 'lucide-react';

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
}

export function DialogItemCard({
  item,
  onEdit,
  onDelete,
}: DialogItemCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all group',
        item.isPurchased &&
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      )}
    >
      <CardContent className="p-3 relative">
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
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 absolute top-3 right-3" />
        )}
        <div
          className="h-full flex items-center justify-center pt-5 cursor-pointer"
          onClick={() => onEdit(item)}
        >
          <p className="font-bold text-sm text-center truncate">{item.name}</p>
        </div>
      </CardContent>
      <CardFooter
        className="bg-card-foreground/5 dark:bg-card-foreground/10 p-2 text-xs text-muted-foreground cursor-pointer"
        onClick={() => onEdit(item)}
      >
        <p className="truncate">
          {item.isPurchased
            ? `تم: ${formatPrice(item.finalPrice ?? 0)}`
            : `~ ${formatPrice((item.minPrice + item.maxPrice) / 2)}`}
        </p>
      </CardFooter>
    </Card>
  );
}
