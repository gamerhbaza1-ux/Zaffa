"use client";

import { useState } from 'react';
import type { Category } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '../ui/label';

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (name: string, parentId: string) => boolean;
  categories: Category[];
};

export function AddCategoryDialog({ open, onOpenChange, onCategoryAdded, categories }: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  
  const sections = categories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  const otherCategories = categories.filter(c => c.parentId).sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parentId) {
        // Simple validation
        return;
    }
    const success = onCategoryAdded(name, parentId);
    if(success) {
        handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setParentId('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نضيف فئة جديدة</DialogTitle>
          <DialogDescription>
            نختار القسم أو الفئة اللي هتبقى تبعها الفئة الجديدة دي.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
                <Label htmlFor="catName">اسم الفئة</Label>
                <Input id="catName" placeholder="مثال: الصالة" value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div>
                <Label>تبع</Label>
                <Select onValueChange={setParentId} value={parentId}>
                    <SelectTrigger>
                        <SelectValue placeholder="نختار قسم أو فئة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                          <SelectLabel>الأقسام</SelectLabel>
                          {sections.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                              {category.name}
                              </SelectItem>
                          ))}
                        </SelectGroup>
                        {otherCategories.length > 0 && (
                          <>
                            <SelectSeparator />
                            <SelectGroup>
                                <SelectLabel>الفئات</SelectLabel>
                                {otherCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                          </>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>نلغي</Button>
              <Button type="submit">نضيف الفئة</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
