'use client';

import type { ChecklistItem, Category } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InteractiveItemsGrid } from './interactive-items-grid';

interface AnalysisItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ChecklistItem[];
  categories: Category[];
}

export function AnalysisItemsDialog({ open, onOpenChange, title, items, categories }: AnalysisItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
          <DialogDescription>
            هنا كل البنود اللي تبع التحليل ده. ممكن تعدل أو تحذف أي بند.
          </DialogDescription>
        </DialogHeader>

        <InteractiveItemsGrid items={items} categories={categories} />
        
      </DialogContent>
    </Dialog>
  );
}
