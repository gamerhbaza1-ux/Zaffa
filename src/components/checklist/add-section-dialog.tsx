"use client";

import { useActionState, useEffect, useRef, useTransition } from 'react';
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

const sectionSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب."),
});

type FormValues = z.infer<typeof sectionSchema>;

type AddSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionAdded: () => void;
};

export function AddSectionDialog({ open, onOpenChange, onSectionAdded }: AddSectionDialogProps) {
  const [state, formAction] = React.useActionState(addCategory, { errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
    }
  });

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "نجاح!",
        description: "تمت إضافة القسم الجديد.",
      });
      form.reset();
      onSectionAdded();
      onOpenChange(false);
    } else if (state?.errors?.name) {
        form.setError("name", { type: 'server', message: state.errors.name[0] });
    }
  }, [state, form, onOpenChange, onSectionAdded, toast]);
  
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
    formData.append('parentId', 'null');
    formAction(formData);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">إضافة قسم جديد</DialogTitle>
          <DialogDescription>
            الأقسام هي الفئات الرئيسية التي تنظم قائمتك (مثال: أثاث، أجهزة).
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
                  <FormLabel>اسم القسم</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: أثاث" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <SubmitButton label="إضافة قسم" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
