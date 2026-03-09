
"use client";

import { useState } from 'react';
import { z } from 'zod';
import type { Category, ChecklistItem, Priority, SuggestedType } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '../ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';

const itemSchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم الحاجة."),
  categoryId: z.string().min(1, "لازم نختار فئة."),
  minPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  maxPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  priority: z.enum(['important', 'nice_to_have', 'not_important']),
  suggestedTypes: z.array(z.object({
    name: z.string().min(1, "اسم النوع مطلوب"),
    price: z.coerce.number().min(0, "السعر مطلوب")
  })).optional(),
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
  const [suggestedTypes, setSuggestedTypes] = useState<SuggestedType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  const [errors, setErrors] = useState<any>({});

  const availableCategories = categories.filter(c => c.parentId);

  const handleAddSuggestedType = () => {
    if (!newTypeName || !newTypePrice) return;
    setSuggestedTypes([...suggestedTypes, { name: newTypeName, price: Number(newTypePrice) }]);
    setNewTypeName('');
    setNewTypePrice('');
  };

  const handleRemoveSuggestedType = (index: number) => {
    setSuggestedTypes(suggestedTypes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, categoryId, minPrice, maxPrice, priority, suggestedTypes };
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
    setPriority('important');
    setSuggestedTypes([]);
    setNewTypeName('');
    setNewTypePrice('');
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
            </div>

            <Separator />

            <div className="space-y-4">
                <Label className="text-base font-bold">الأنواع المقترحة للمقارنة (اختياري)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input 
                        placeholder="اسم النوع (مثلاً: LG)" 
                        value={newTypeName} 
                        onChange={e => setNewTypeName(e.target.value)} 
                    />
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            placeholder="السعر" 
                            value={newTypePrice} 
                            onChange={e => setNewTypePrice(e.target.value)} 
                        />
                        <Button type="button" size="icon" variant="outline" onClick={handleAddSuggestedType}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {suggestedTypes.length > 0 && (
                    <div className="bg-accent/30 rounded-lg p-3 space-y-2">
                        {suggestedTypes.map((type, index) => (
                            <div key={index} className="flex justify-between items-center text-sm bg-background p-2 rounded border">
                                <span>{type.name} - <span className="font-bold text-primary">{type.price} ج.م</span></span>
                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemoveSuggestedType(index)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
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
