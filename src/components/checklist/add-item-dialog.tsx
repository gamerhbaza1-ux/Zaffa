"use client";

import { useState } from 'react';
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

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: Omit<ChecklistItem, 'id' | 'isPurchased'>) => void;
  categories: Category[];
};

export function AddItemDialog({ open, onOpenChange, onItemAdded, categories }: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priority, setPriority] = useState<Priority>('important');
  const [errors, setErrors] = useState<any>({});

  const availableCategories = categories.filter(c => c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, categoryId, minPrice, maxPrice, priority };
    const result = itemSchema.safeParse(data);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    
    onItemAdded(result.data);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setCategoryId('');
    setMinPrice(0);
    setMaxPrice(0);
    setPriority('important');
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نضيف حاجة جديدة</DialogTitle>
          <DialogDescription>
            يلا نضيف حاجة جديدة لقائمة بيتنا. املوا البيانات دي.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">اسم الحاجة</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كنبة" />
              {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
            </div>
            
            <div>
              <Label>تبع أنهي فئة</Label>
              <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger>
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
                <Label htmlFor='minPrice'>أقل سعر متوقع</Label>
                <Input id='minPrice' type="number" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} />
                {errors.minPrice && <p className="text-sm font-medium text-destructive">{errors.minPrice}</p>}
              </div>
              <div>
                <Label htmlFor='maxPrice'>أقصى سعر متوقع</Label>
                <Input id='maxPrice' type="number" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
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
              <Button type="submit">نضيف الحاجة</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
