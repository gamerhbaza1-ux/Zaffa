"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseItem } from '@/lib/actions';
import type { ChecklistItem } from '@/lib/types';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const purchaseSchema = z.object({
  itemId: z.string(),
  finalPrice: z.coerce.number().min(0, "يجب أن يكون السعر رقمًا موجبًا."),
});

type FormValues = z.infer<typeof purchaseSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      تأكيد الشراء
    </Button>
  );
}

type PurchaseDialogProps = {
  item: ChecklistItem | null;
  onOpenChange: (open: boolean) => void;
};

export function PurchaseDialog({ item, onOpenChange }: PurchaseDialogProps) {
  const [state, formAction] = useActionState(purchaseItem, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  const open = !!item;

  const { register, formState: { errors }, reset, setError, setValue } = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema),
  });
  
  useEffect(() => {
    if (state?.success) {
      toast({
        title: "تم!",
        description: "تم تحديث العنصر كـ 'تم شراؤه'.",
      });
      reset();
      onOpenChange(false);
    } else if (state?.errors?.finalPrice) {
       setError("finalPrice", { type: "server", message: state.errors.finalPrice[0] });
    }
  }, [state, reset, onOpenChange, toast, setError]);

  useEffect(() => {
    if (item) {
      setValue('itemId', item.id);
      setValue('finalPrice', item.maxPrice);
    } else {
        reset();
    }
  }, [item, setValue, reset]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        reset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">تأكيد شراء: {item?.name}</DialogTitle>
          <DialogDescription>
            الرجاء إدخال السعر النهائي الذي اشتريت به هذا العنصر.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          // @ts-ignore
          action={formAction}
          className="grid gap-4 py-4"
        >
          <input type="hidden" {...register('itemId')} />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="finalPrice" className="text-right">
              السعر النهائي
            </Label>
            <div className="col-span-3">
              <Input id="finalPrice" type="number" {...register('finalPrice')} name="finalPrice" className="w-full" />
              {errors?.finalPrice && <p className="text-sm text-destructive mt-1">{errors.finalPrice.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
