"use client";

import { useState, useEffect } from 'react';
import type { ChecklistItem } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PurchaseDialogProps = {
  item: ChecklistItem | null;
  onOpenChange: (open: boolean) => void;
  onItemPurchased: (itemId: string, finalPrice: number) => void;
};

export function PurchaseDialog({ item, onOpenChange, onItemPurchased }: PurchaseDialogProps) {
  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('unit');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  const open = !!item;
  const qty = item?.quantity || 1;

  useEffect(() => {
    if (item) {
      const initialTotal = item.maxPrice * qty;
      const initialUnit = item.maxPrice;
      setUnitPrice(initialUnit);
      setTotalPrice(initialTotal);
      setPriceMode('unit');
    }
  }, [item, qty]);

  const handleUnitPriceChange = (val: number) => {
    setUnitPrice(val);
    setTotalPrice(val * qty);
  };

  const handleTotalPriceChange = (val: number) => {
    setTotalPrice(val);
    if (qty > 0) {
      setUnitPrice(val / qty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || totalPrice < 0) return;
    onItemPurchased(item.id, totalPrice);
  }

  const handleClose = () => {
    onOpenChange(false);
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(p);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">سجلنا الشراء: {item?.name}</DialogTitle>
          <DialogDescription>
            {qty > 1 ? `العدد المطللوب: ${qty} قطع.` : 'سجل السعر اللي اشتريت بيه.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={priceMode} onValueChange={(v) => setPriceMode(v as any)} className="w-full mt-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unit">سعر القطعة</TabsTrigger>
            <TabsTrigger value="total">السعر الإجمالي</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {priceMode === 'unit' ? (
              <div className="space-y-2">
                <Label htmlFor="unitPrice">سعر القطعة الواحدة</Label>
                <div className="relative">
                  <Input 
                    id="unitPrice" 
                    type="number" 
                    value={unitPrice || ''}
                    onChange={e => handleUnitPriceChange(Number(e.target.value))}
                    className="pl-12"
                    autoFocus
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ج.م</span>
                </div>
                {qty > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    الإجمالي لـ {qty} قطع: <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="totalPrice">إجمالي المبلغ المدفوع</Label>
                <div className="relative">
                  <Input 
                    id="totalPrice" 
                    type="number" 
                    value={totalPrice || ''}
                    onChange={e => handleTotalPriceChange(Number(e.target.value))}
                    className="pl-12"
                    autoFocus
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ج.م</span>
                </div>
                {qty > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    سعر القطعة الواحدة: <span className="font-bold text-primary">{formatPrice(unitPrice)}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button variant="outline" type="button" onClick={handleClose}>إلغاء</Button>
            <Button type="submit">تمام، اشترينا</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
