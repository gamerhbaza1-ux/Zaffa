
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
  quantity: z.coerce.number().min(1, "العدد لازم يكون 1 على الأقل."),
  priority: z.enum(['important', 'nice_to_have', 'not_important']),
  suggestedModel: z.string().optional(),
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
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<Priority>('important');
  const [suggestedModel, setSuggestedModel] = useState('');
  const [errors, setErrors] = useState<any>({});

  const availableCategories = categories.filter(c => c.parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, categoryId, minPrice, maxPrice, quantity, priority, suggestedModel };
    const result = itemSchema.safeParse(data);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    
    onItemAdded(result.data as Omit<ChecklistItem, 'id' | 'isPurchased'>);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setCategoryId('');
    setMinPrice(0);
    setMaxPrice(0);
    setQuantity(1);
    setPriority('important');
    setSuggestedModel('');
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">نضيف حاجة جديدة</DialogTitle>
          <DialogDescription>
            يلا نضيف حاجة جديدة لقائمة بيتنا. املوا البيانات دي.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="name">اسم الحاجة</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كنبة" />
                      {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                    </div>
                    <div className="w-24">
                      <Label htmlFor="quantity">العدد</Label>
                      <Input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                      {errors.quantity && <p className="text-sm font-medium text-destructive">{errors.quantity}</p>}
                    </div>
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
                    <Label htmlFor='minPrice'>أقل سعر (للقطعة)</Label>
                    <Input id='minPrice' type="number" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} />
                    {errors.minPrice && <p className="text-sm font-medium text-destructive">{errors.minPrice}</p>}
                  </div>
                  <div>
                    <Label htmlFor='maxPrice'>أقصى سعر (للقطعة)</Label>
                    <Input id='maxPrice' type="number" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
                    {errors.maxPrice && <p className="text-sm font-medium text-destructive">{errors.maxPrice}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="suggestedModel">الموديل المقترح (اختياري)</Label>
                  <Input 
                    id="suggestedModel" 
                    value={suggestedModel} 
                    onChange={e => setSuggestedModel(e.target.value)} 
                    placeholder="مثال: توشيبا 14 قدم إنفرتر" 
                  />
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
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>نلغي</Button>
              <Button type="submit">نضيف الحاجة</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
