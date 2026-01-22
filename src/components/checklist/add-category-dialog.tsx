"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addCategory } from '@/lib/actions';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { SubmitButton } from '../submit-button';

const categorySchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب."),
  parentId: z.string({ required_error: "يجب اختيار قسم أو فئة رئيسية."}).min(1, "يجب اختيار قسم أو فئة رئيسية."),
});

type FormValues = z.infer<typeof categorySchema>;

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: () => void;
  categories: Category[];
};

export function AddCategoryDialog({ open, onOpenChange, onCategoryAdded, categories }: AddCategoryDialogProps) {
  const [state, formAction] = React.useActionState(addCategory, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      parentId: undefined,
    }
  });

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "نجاح!",
        description: "تمت إضافة الفئة الجديدة.",
      });
      form.reset();
      onCategoryAdded();
      onOpenChange(false);
    } else if (state?.errors) {
       Object.entries(state.errors).forEach(([key, value]) => {
        if (value) {
            form.setError(key as keyof FormValues, { type: 'server', message: value[0] });
        }
       });
    }
  }, [state, form, onOpenChange, onCategoryAdded, toast]);
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      // @ts-ignore
      formAction(new FormData()); // Reset server state
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">إضافة فئة جديدة</DialogTitle>
          <DialogDescription>
            اختر القسم أو الفئة الرئيسية التي ستنتمي إليها هذه الفئة الجديدة.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            ref={formRef}
            // @ts-ignore
            action={formAction}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الفئة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: غرفة المعيشة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تابعة لـ</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قسم أو فئة رئيسية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <SubmitButton label="إضافة فئة" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
