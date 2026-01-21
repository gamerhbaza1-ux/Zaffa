"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addCategory } from '@/lib/actions';

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

const categorySchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب."),
});

type FormValues = z.infer<typeof categorySchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      إضافة فئة
    </Button>
  );
}

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: () => void;
};

export function AddCategoryDialog({ open, onOpenChange, onCategoryAdded }: AddCategoryDialogProps) {
  const [state, formAction] = useActionState(addCategory, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const { register, formState: { errors }, reset, setError } = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
  });
  
  useEffect(() => {
    if (state?.success) {
      toast({
        title: "نجاح!",
        description: "تمت إضافة الفئة الجديدة.",
      });
      reset();
      onCategoryAdded();
      onOpenChange(false);
    } else if (state?.errors?.name) {
       setError("name", { type: "server", message: state.errors.name[0] });
    }
  }, [state, reset, onOpenChange, onCategoryAdded, toast, setError]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        reset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">إضافة فئة جديدة</DialogTitle>
          <DialogDescription>
            أدخل اسم الفئة الجديدة التي تريد إضافتها إلى القائمة.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          // @ts-ignore
          action={formAction}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              اسم الفئة
            </Label>
            <div className="col-span-3">
              <Input id="name" {...register('name')} name="name" className="w-full" />
              {errors?.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
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
