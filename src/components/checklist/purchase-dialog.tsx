"use client";

import { useState, useEffect } from 'react';
import type { ChecklistItem } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PurchaseDialogProps = {
  item: ChecklistItem | null;
  onOpenChange: (open: boolean) => void;
  onItemPurchased: (itemId: string, finalPrice: number) => void;
};

export function PurchaseDialog({ item, onOpenChange, onItemPurchased }: PurchaseDialogProps) {
  const [finalPrice, setFinalPrice] = useState<number | string>('');
  const open = !!item;

  useEffect(() => {
    if (item) {
      setFinalPrice(item.maxPrice);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || typeof finalPrice !== 'number' || finalPrice < 0) {
      // Basic validation
      return;
    }
    onItemPurchased(item.id, finalPrice);
  }

  const handleClose = () => {
    setFinalPrice('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">اشترينا: {item?.name}</DialogTitle>
          <DialogDescription>
            نكتب جبنا الحاجة دي بكام بالظبط.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="finalPrice" className="text-right">
              جبناها بكام؟
            </Label>
            <div className="col-span-3">
              <Input 
                id="finalPrice" 
                type="number" 
                value={finalPrice}
                onChange={e => setFinalPrice(Number(e.target.value))}
                className="w-full" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>نلغي</Button>
            <Button type="submit">تمام، اشترينا</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
