'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface AnalysisSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Category[];
  subCategories: Category[];
  onAnalyze: (selection: string[]) => void;
}

export function AnalysisSetupDialog({ open, onOpenChange, sections, subCategories, onAnalyze }: AnalysisSetupDialogProps) {
  const [selection, setSelection] = useState<string[]>([]);

  const handleSelectionChange = (checked: boolean | 'indeterminate', id: string) => {
    setSelection(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(existingId => existingId !== id);
      }
    });
  };

  const handleAnalyzeClick = () => {
    onAnalyze(selection);
    setSelection([]); // Reset for next time
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">إنشاء تحليل جديد</DialogTitle>
          <DialogDescription>
            اختار الأقسام أو الفئات اللي عاوز تجمع تحليلها في تقرير واحد.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          {sections.length > 0 && (
             <div>
                <h4 className="font-medium text-muted-foreground mb-3">الأقسام الرئيسية</h4>
                <div className="space-y-2">
                  {sections.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox id={`dialog-${s.id}`} checked={selection.includes(s.id)} onCheckedChange={(checked) => handleSelectionChange(checked, s.id)} />
                      <label htmlFor={`dialog-${s.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {s.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
          )}
          {subCategories.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-muted-foreground mb-3">الفئات الفرعية</h4>
                <div className="space-y-2">
                  {subCategories.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox id={`dialog-${c.id}`} checked={selection.includes(c.id)} onCheckedChange={(checked) => handleSelectionChange(checked, c.id)} />
                      <label htmlFor={`dialog-${c.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {c.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {sections.length === 0 && subCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
                لازم تضيف أقسام وفئات الأول من الصفحة الرئيسية.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleAnalyzeClick} disabled={selection.length === 0}>
            إنشاء تحليل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
