"use client";

import { useState, useEffect } from 'react';
import type { Category } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '../ui/label';

type EditCategoryDialogProps = {
  category: Category | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: (id: string, name: string, parentId: string | null) => boolean;
};

export function EditCategoryDialog({ category, categories, onOpenChange, onCategoryUpdated }: EditCategoryDialogProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  const open = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parentId);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name) return;
    const success = onCategoryUpdated(category.id, name, parentId);
    if (success) {
      handleClose();
    }
  }

  const handleClose = () => {
    onOpenChange(false);
  }

  const filteredCategories = categories.filter(c => c.id !== category?.id);
  const sections = filteredCategories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  const otherCategories = filteredCategories.filter(c => c.parentId).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نعدل القسم أو الفئة</DialogTitle>
          <DialogDescription>
            ممكن نغير الاسم أو ننقله لقسم أو فئة تانية.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor='editCatName'>الاسم</Label>
              <Input id='editCatName' value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div>
                <Label>تبع</Label>
                <Select onValueChange={(val) => setParentId(val === 'null' ? null : val)} value={parentId || "null"}>
                    <SelectTrigger>
                        <SelectValue placeholder="نختار قسم أو فئة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="null">مش تبع حاجة (نخليه قسم لوحده)</SelectItem>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>الأقسام</SelectLabel>
                          {sections.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              </SelectItem>
                          ))}
                        </SelectGroup>
                        {otherCategories.length > 0 && (
                          <>
                            <SelectSeparator />
                            <SelectGroup>
                                <SelectLabel>الفئات</SelectLabel>
                                {otherCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                    {c.name}
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
              <Button type="submit">نحفظ التغييرات</Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
