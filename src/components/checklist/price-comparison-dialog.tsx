
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { findProductPrices, type MarketPrice } from '@/app/actions/price-comparison';
import { ExternalLink, Loader2, ShoppingBag, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Card } from '../ui/card';

interface PriceComparisonDialogProps {
  productName: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PriceComparisonDialog({ productName, onOpenChange }: PriceComparisonDialogProps) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = !!productName;

  useEffect(() => {
    if (productName) {
      setIsLoading(true);
      setError(null);
      findProductPrices(productName)
        .then(setPrices)
        .catch(() => setError('معرفناش نجيب الأسعار دلوقتي، حاول تفتح المواقع يدوي.'))
        .finally(() => setIsLoading(false));
    }
  }, [productName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-headline flex items-center gap-3">
            <ShoppingBag className="text-primary h-6 w-6" />
            أفضل الأسعار لـ {productName}
          </DialogTitle>
          <DialogDescription>
            بنبحث لك في أهم المتاجر المصرية عشان نوفر لك وقتك ومجهودك.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">جاري البحث في الأسواق...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {prices.map((store, idx) => (
                <Card key={idx} className="flex items-center justify-between p-4 hover:shadow-md transition-shadow group border-accent/20">
                  <div className="flex items-center gap-4">
                    <div className="relative h-10 w-10 rounded-md border p-1 bg-white">
                      <img 
                        src={store.storeLogo} 
                        alt={store.storeName} 
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{store.storeName}</h4>
                      <p className="text-xs text-muted-foreground">متوفر الآن</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">أفضل سعر</p>
                      <p className="font-bold text-primary">{store.price}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="group-hover:bg-primary group-hover:text-primary-foreground">
                      <a href={store.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        فتح المتجر
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
              <div className="mt-4 p-4 bg-muted rounded-lg text-xs text-muted-foreground text-center">
                * الأسعار المعروضة قد تختلف حسب وقت البحث وتوافر العروض في كل متجر.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
