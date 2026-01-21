"use client";

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateCategory } from '@/lib/actions';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "الاسم مطلوب."),
  parentId: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof categorySchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      حفظ التغييرات
    </Button>
  );
}

type EditCategoryDialogProps = {
  category: Category | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
};

export function EditCategoryDialog({ category, categories, onOpenChange, onCategoryUpdated }: EditCategoryDialogProps) {
  const [state, formAction] = React.useActionState(updateCategory, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  const open = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: category?.id || "",
      name: category?.name || "",
      parentId: category?.parentId || null,
    }
  });

  useEffect(() => {
    if (category) {
      form.reset({ id: category.id, name: category.name, parentId: category.parentId });
    }
  }, [category, form]);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "نجاح!",
        description: "تم تحديث القسم/الفئة.",
      });
      onCategoryUpdated();
      onOpenChange(false);
    } else if (state?.errors) {
       Object.entries(state.errors).forEach(([key, value]) => {
        if (value) {
            form.setError(key as keyof FormValues, { type: 'server', message: value[0] });
        }
       });
    }
  }, [state, form, onOpenChange, onCategoryUpdated, toast]);
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        onOpenChange(false);
        form.reset();
        // @ts-ignore
        formAction(new FormData()); // Reset server state
    } else {
        onOpenChange(true);
    }
  }
  
  const filteredCategories = categories.filter(c => c.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">تعديل القسم أو الفئة</DialogTitle>
          <DialogDescription>
            قم بتعديل الاسم أو انقله إلى قسم/فئة أخرى.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            ref={formRef}
            // @ts-ignore
            action={formAction}
            className="space-y-4 pt-4"
          >
            <input type="hidden" {...form.register('id')} />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>تابع لـ</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value || "null"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قسمًا أو فئة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="null">لا شيء (جعله قسمًا رئيسيًا)</SelectItem>
                        {filteredCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
              <SubmitButton />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
