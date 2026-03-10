
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { findProductPrices, type MarketPrice } from '@/app/actions/price-comparison';
import { ExternalLink, Loader2, ShoppingBag, AlertCircle, Store } from 'lucide-react';
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
                    <div className="relative h-12 w-12 rounded-md border p-1 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={store.storeLogo} 
                        alt={store.storeName} 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          // إخفاء الصورة في حال فشل تحميلها وإظهار أيقونة بديلة
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                      />
                      <div className="fallback-icon hidden h-full w-full items-center justify-center bg-accent/10 text-accent-foreground">
                        <Store className="h-6 w-6 opacity-40" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{store.storeName}</h4>
                      <p className="text-[10px] text-muted-foreground">متوفر الآن</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] text-muted-foreground uppercase">أفضل سعر</p>
                      <p className="font-bold text-primary text-sm">{store.price}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="group-hover:bg-primary group-hover:text-primary-foreground h-8">
                      <a href={store.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                        فتح المتجر
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-[10px] text-muted-foreground text-center">
                * الأسعار والروابط معروضة للمقارنة وتعتمد على تحديثات المتاجر الخارجية.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
