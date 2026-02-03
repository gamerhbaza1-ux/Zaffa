"use client";

import { useActionState, useEffect, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addCategory } from '@/lib/actions';
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
  name: z.string().min(1, "لازم نكتب اسم القسم."),
});

type FormValues = z.infer<typeof sectionSchema>;

type AddSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionAdded: () => void;
};

export function AddSectionDialog({ open, onOpenChange, onSectionAdded }: AddSectionDialogProps) {
  const { user } = useAuth();
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
        title: "تمام!",
        description: "ضفنا القسم الجديد.",
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
    if (user) {
      formData.append('userId', user.uid);
      formData.append('parentId', 'null');
      formAction(formData);
    } else {
       toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.'})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نضيف قسم جديد</DialogTitle>
          <DialogDescription>
            الأقسام هي اللي بتنظم القائمة بتاعتنا (زي عفش، أجهزة).
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
                    <Input placeholder="مثال: عفش" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>نلغي</Button>
              <SubmitButton label="نضيف القسم" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
