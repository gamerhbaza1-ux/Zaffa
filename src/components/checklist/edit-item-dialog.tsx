"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import type { Category, ChecklistItem, Priority } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '../ui/label';

const itemSchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم الحاجة."),
  categoryId: z.string().min(1, "لازم نختار فئة."),
  minPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  maxPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  priority: z.enum(['important', 'nice_to_have', 'not_important']),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "أقصى سعر لازم يكون أكبر من أو بيساوي أقل سعر.",
  path: ["maxPrice"],
});

type EditItemDialogProps = {
  item: ChecklistItem | null;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (itemId: string, data: Omit<ChecklistItem, 'id' | 'isPurchased' | 'finalPrice'>) => void;
  categories: Category[];
};

export function EditItemDialog({ item, onOpenChange, onItemUpdated, categories }: EditItemDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priority, setPriority] = useState<Priority>('important');
  const [errors, setErrors] = useState<any>({});

  const open = !!item;

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.categoryId);
      setMinPrice(item.minPrice);
      setMaxPrice(item.maxPrice);
      setPriority(item.priority || 'important');
      setErrors({});
    }
  }, [item]);

  const availableCategories = categories.filter(c => c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const data = { name, categoryId, minPrice, maxPrice, priority };
    const result = itemSchema.safeParse(data);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    
    onItemUpdated(item.id, result.data);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نعدّل الحاجة دي</DialogTitle>
          <DialogDescription>
            هنا نقدر نغير اسم الحاجة، سعرها، أو مكانها في القائمة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-name">اسم الحاجة</Label>
              <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كنبة" />
              {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
            </div>
            
            <div>
              <Label htmlFor="edit-category">تبع أنهي فئة</Label>
              <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="نختار فئة" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      لازم نضيف فئة الأول.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm font-medium text-destructive">{errors.categoryId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor='edit-minPrice'>أقل سعر متوقع</Label>
                <Input id='edit-minPrice' type="number" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} />
                {errors.minPrice && <p className="text-sm font-medium text-destructive">{errors.minPrice}</p>}
              </div>
              <div>
                <Label htmlFor='edit-maxPrice'>أقصى سعر متوقع</Label>
                <Input id='edit-maxPrice' type="number" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
                {errors.maxPrice && <p className="text-sm font-medium text-destructive">{errors.maxPrice}</p>}
              </div>
            </div>

            <div>
              <Label>الأولوية</Label>
              <Select onValueChange={(v: Priority) => setPriority(v)} value={priority}>
                <SelectTrigger>
                  <SelectValue placeholder="تحديد الأولوية" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="important">مهم</SelectItem>
                    <SelectItem value="nice_to_have">لو الدنيا تمام</SelectItem>
                    <SelectItem value="not_important">مش مهم</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm font-medium text-destructive">{errors.priority}</p>}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>نلغي</Button>
              <Button type="submit">نحفظ التعديلات</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
