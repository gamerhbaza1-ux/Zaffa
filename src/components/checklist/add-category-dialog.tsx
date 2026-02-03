"use client";

import { useActionState, useEffect, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addCategory } from '@/lib/actions';
import type { Category } from '@/lib/types';
import { useAuth } from '@/firebase';

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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

const categorySchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم الفئة."),
  parentId: z.string({ required_error: "لازم نختار قسم أو فئة رئيسية."}).min(1, "لازم نختار قسم أو فئة رئيسية."),
});

type FormValues = z.infer<typeof categorySchema>;

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: () => void;
  categories: Category[];
};

export function AddCategoryDialog({ open, onOpenChange, onCategoryAdded, categories }: AddCategoryDialogProps) {
  const { user } = useAuth();
  const [state, formAction] = React.useActionState(addCategory, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [, startTransition] = useTransition();

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
        title: "تمام!",
        description: "ضفنا الفئة الجديدة.",
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
      startTransition(() => {
        // @ts-ignore
        formAction(new FormData()); // Reset server state
      });
    }
    onOpenChange(isOpen);
  }

  const handleFormAction = (formData: FormData) => {
    if (user) {
      formData.append('userId', user.uid);
      formAction(formData);
    } else {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.'})
    }
  }

  const sections = categories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  const otherCategories = categories.filter(c => c.parentId).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نضيف فئة جديدة</DialogTitle>
          <DialogDescription>
            نختار القسم أو الفئة اللي هتبقى تبعها الفئة الجديدة دي.
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
                  <FormLabel>اسم الفئة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: الصالة" {...field} />
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
                  <FormLabel>تبع</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="نختار قسم أو فئة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectGroup>
                          <SelectLabel>الأقسام</SelectLabel>
                          {sections.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                              {category.name}
                              </SelectItem>
                          ))}
                        </SelectGroup>
                        {otherCategories.length > 0 && (
                          <>
                            <SelectSeparator />
                            <SelectGroup>
                                <SelectLabel>الفئات</SelectLabel>
                                {otherCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                          </>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>نلغي</Button>
              <SubmitButton label="نضيف الفئة" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
