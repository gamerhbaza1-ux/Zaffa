"use client";

import { useActionState, useEffect, useRef, useTransition } from 'react';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { SubmitButton } from '../submit-button';

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "الاسم مطلوب."),
  parentId: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof categorySchema>;

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
  const [, startTransition] = useTransition();
  
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
        title: "تمام!",
        description: "حدثنا القسم/الفئة.",
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
        startTransition(() => {
          // @ts-ignore
          formAction(new FormData()); // Reset server state
        });
    } else {
        onOpenChange(true);
    }
  }
  
  const filteredCategories = categories.filter(c => c.id !== category?.id);
  const sections = filteredCategories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  const otherCategories = filteredCategories.filter(c => c.parentId).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نعدل القسم أو الفئة</DialogTitle>
          <DialogDescription>
            ممكن نغير الاسم أو ننقله لقسم أو فئة تانية.
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
                  <FormLabel>تبع</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value || "null"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="نختار قسم أو فئة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="null">مش تبع حاجة (نخليه قسم لوحده)</SelectItem>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>الأقسام</SelectLabel>
                          {sections.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                              {c.name}
                              </SelectItem>
                          ))}
                        </SelectGroup>
                        {otherCategories.length > 0 && (
                          <>
                            <SelectSeparator />
                            <SelectGroup>
                                <SelectLabel>الفئات</SelectLabel>
                                {otherCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                    {c.name}
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
              <SubmitButton label="نحفظ التغييرات" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
