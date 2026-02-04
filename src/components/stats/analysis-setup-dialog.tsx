'use client';

import { useState, useMemo } from 'react';
import type { Category } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface AnalysisSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Category[];
  subCategories: Category[];
  onAnalyze: (selection: string[]) => void;
}

export function AnalysisSetupDialog({ open, onOpenChange, sections, subCategories, onAnalyze }: AnalysisSetupDialogProps) {
  // Selection now only stores the IDs of leaf-node categories (sub-categories in this UI)
  const [selection, setSelection] = useState<string[]>([]);

  // Group subcategories by their parent section ID for easier access
  const subCategoriesBySection = useMemo(() => {
    return subCategories.reduce((acc, cat) => {
      if (cat.parentId) {
        if (!acc[cat.parentId]) {
          acc[cat.parentId] = [];
        }
        acc[cat.parentId].push(cat);
      }
      return acc;
    }, {} as Record<string, Category[]>);
  }, [subCategories]);

  // When a section checkbox is toggled...
  const handleSectionToggle = (sectionId: string, isChecked: boolean) => {
    const childIds = subCategoriesBySection[sectionId]?.map(c => c.id) || [];
    setSelection(prev => {
      // Filter out all children of the current section first
      const otherSelections = prev.filter(id => !childIds.includes(id));
      // If checking, add all children back
      if (isChecked) {
        return [...otherSelections, ...childIds];
      }
      // If unchecking, just return the other selections
      return otherSelections;
    });
  };

  // When a sub-category checkbox is toggled...
  const handleSubCategoryToggle = (subCategoryId: string, isChecked: boolean) => {
     setSelection(prev => {
      if (isChecked) {
        return [...prev, subCategoryId];
      } else {
        return prev.filter(id => id !== subCategoryId);
      }
    });
  };

  const handleAnalyzeClick = () => {
    // The selection state already contains the specific sub-category IDs the user wants.
    // If a section was selected, all its children are in the selection.
    // If a sub-category was deselected, it's not in the selection.
    // This is exactly what onAnalyze needs.
    onAnalyze(selection);
    handleClose(); // Close and reset
  };
  
  const handleClose = () => {
    setSelection([]); // Reset selection on close
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">إنشاء تحليل جديد</DialogTitle>
          <DialogDescription>
            اختار الأقسام أو الفئات اللي عاوز تجمع تحليلها في تقرير واحد.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          {sections.length > 0 ? (
             <div className="space-y-3">
              {sections.map(section => {
                  const children = subCategoriesBySection[section.id] || [];
                  const childIds = children.map(c => c.id);
                  const selectedChildrenCount = childIds.filter(id => selection.includes(id)).length;
                  
                  const isAllSelected = children.length > 0 && selectedChildrenCount === children.length;
                  const isPartiallySelected = selectedChildrenCount > 0 && selectedChildrenCount < children.length;
                  const sectionCheckedState = isAllSelected ? true : (isPartiallySelected ? 'indeterminate' : false);
                  
                  return (
                    <div key={section.id}>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id={`dialog-${section.id}`} 
                                checked={sectionCheckedState} 
                                onCheckedChange={(checked) => handleSectionToggle(section.id, !!checked)} 
                            />
                            <label htmlFor={`dialog-${section.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                {section.name}
                            </label>
                        </div>
                        {children.length > 0 && (
                            <div className="mr-6 mt-2 space-y-2 border-r border-border pr-4">
                                {children.map(subCat => (
                                    <div key={subCat.id} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`dialog-${subCat.id}`} 
                                            checked={selection.includes(subCat.id)} 
                                            onCheckedChange={(checked) => handleSubCategoryToggle(subCat.id, !!checked)} 
                                        />
                                        <label htmlFor={`dialog-${subCat.id}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground">
                                            {subCat.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  );
              })}
             </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
                لازم تضيف أقسام وفئات الأول من الصفحة الرئيسية.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>إلغاء</Button>
          <Button onClick={handleAnalyzeClick} disabled={selection.length === 0}>
            إنشاء تحليل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
