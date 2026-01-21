"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addItem } from '@/lib/actions';

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

const itemSchema = z.object({
  name: z.string().min(1, "اسم العنصر مطلوب."),
  minPrice: z.coerce.number().min(0, "يجب أن يكون السعر رقمًا موجبًا."),
  maxPrice: z.coerce.number().min(0, "يجب أن يكون السعر رقمًا موجبًا."),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "يجب أن يكون السعر الأقصى أكبر من أو يساوي السعر الأدنى.",
  path: ["maxPrice"],
});

type FormValues = z.infer<typeof itemSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      إضافة عنصر
    </Button>
  );
}

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
};

export function AddItemDialog({ open, onOpenChange, onItemAdded }: AddItemDialogProps) {
  const [state, formAction] = useActionState(addItem, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const { register, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(itemSchema),
  });
  
  useEffect(() => {
    if (state?.success) {
      toast({
        title: "نجاح!",
        description: "تمت إضافة العنصر الخاص بك إلى القائمة.",
      });
      reset();
      onItemAdded();
      onOpenChange(false);
    } else if (state?.errors) {
       // Handled by displaying errors below fields
    }
  }, [state, reset, onOpenChange, onItemAdded, toast]);

  const allErrors = { ...errors, ...state?.errors };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">إضافة عنصر جديد</DialogTitle>
          <DialogDescription>
            أضف عنصرًا جديدًا إلى قائمة مراجعة شقتك. املأ التفاصيل أدناه.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          action={formAction}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              اسم العنصر
            </Label>
            <div className="col-span-3">
              <Input id="name" {...register('name')} name="name" className="w-full" />
              {allErrors?.name && <p className="text-sm text-destructive mt-1">{allErrors.name[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price-range" className="text-right">
              نطاق السعر
            </Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              <div>
                <Input id="minPrice" {...register('minPrice')} name="minPrice" type="number" placeholder="الحد الأدنى" />
                {allErrors?.minPrice && <p className="text-sm text-destructive mt-1">{allErrors.minPrice[0]}</p>}
              </div>
              <div>
                <Input id="maxPrice" {...register('maxPrice')} name="maxPrice" type="number" placeholder="الحد الأقصى" />
                {allErrors?.maxPrice && <p className="text-sm text-destructive mt-1">{allErrors.maxPrice[0]}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
