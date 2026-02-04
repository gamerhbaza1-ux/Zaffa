'use client';

import type { ChecklistItem, Category } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InteractiveItemsGrid } from './interactive-items-grid';

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

export function FeaturedAnalysisItemsDialog({ analysis, categories, onOpenChange }: FeaturedAnalysisItemsDialogProps) {
  return (
    <Dialog open={!!analysis} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{analysis?.title}</DialogTitle>
          <DialogDescription>
            هنا كل البنود اللي تبع التحليل ده. ممكن تعدل أو تحذف أي بند.
          </DialogDescription>
        </DialogHeader>
        
        <InteractiveItemsGrid items={analysis?.items || []} categories={categories} />

      </DialogContent>
    </Dialog>
  );
}
