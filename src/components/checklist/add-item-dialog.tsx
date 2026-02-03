"use client";

import { useActionState, useEffect, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addItem } from '@/lib/actions';
import type { Category } from '@/lib/types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { SubmitButton } from '../submit-button';

const itemSchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم الحاجة."),
  categoryId: z.string({ required_error: "لازم نختار فئة."}).min(1, "لازم نختار فئة."),
  minPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  maxPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "أقصى سعر لازم يكون أكبر من أو بيساوي أقل سعر.",
  path: ["maxPrice"],
});

type FormValues = z.infer<typeof itemSchema>;


type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
  categories: Category[];
  householdId: string;
};

export function AddItemDialog({ open, onOpenChange, onItemAdded, categories, householdId }: AddItemDialogProps) {
  const [state, formAction] = React.useActionState(addItem, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      minPrice: 0,
      maxPrice: 0,
    }
  });
  
  const availableCategories = categories.filter(c => c.parentId);


  useEffect(() => {
    if (state?.success) {
      toast({
        title: "تمام!",
        description: "ضفنا الحاجة الجديدة للقائمة.",
      });
      form.reset();
      onItemAdded();
      onOpenChange(false);
    } else if (state?.errors) {
       Object.entries(state.errors).forEach(([key, value]) => {
        if (value) {
            form.setError(key as keyof FormValues, { type: 'server', message: value[0] });
        }
       });
    }
  }, [state, form, onOpenChange, onItemAdded, toast]);
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      startTransition(() => {
        // @ts-ignore
        formAction(new FormData()); // Reset server state
      });
    }
    onOpenChange(isOpen);
  }

  const handleFormAction = (formData: FormData) => {
    if (householdId) {
      formData.append('householdId', householdId);
      formAction(formData);
    } else {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.'})
    }
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نضيف حاجة جديدة</DialogTitle>
          <DialogDescription>
            يلا نضيف حاجة جديدة لقائمة بيتنا. املوا البيانات دي.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            ref={formRef}
            action={handleFormAction}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الحاجة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كنبة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تبع أنهي فئة</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="نختار فئة" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أقل سعر متوقع</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أقصى سعر متوقع</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>نلغي</Button>
              <SubmitButton label="نضيف الحاجة" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
