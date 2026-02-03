'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { HeroConfig } from '@/lib/types';

const heroConfigSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب.').max(50, 'العنوان طويل جدًا.'),
  subtitle: z.string().min(1, 'الوصف مطلوب.').max(100, 'الوصف طويل جدًا.'),
  imageUrl: z.string().url('لازم يكون رابط صورة صحيح.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof heroConfigSchema>;

interface HeroSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormValues) => void;
  currentConfig: HeroConfig;
  isSaving: boolean;
}

export function HeroSettingsDialog({
  open,
  onOpenChange,
  onSave,
  currentConfig,
  isSaving,
}: HeroSettingsDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(heroConfigSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (currentConfig && open) {
      form.reset({
        title: currentConfig.title,
        subtitle: currentConfig.subtitle,
        imageUrl: currentConfig.imageUrl,
      });
    }
  }, [currentConfig, open, form]);

  const handleSave = (values: FormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">تخصيص الواجهة</DialogTitle>
          <DialogDescription>
            غير صورة وكلام الواجهة الرئيسية عشان تعبر عنكم أكتر.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان الرئيسي</FormLabel>
                  <FormControl>
                    <Input placeholder="بنبني مستقبلنا، حاجة حاجة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف الفرعي</FormLabel>
                  <FormControl>
                    <Input placeholder="نخطط لكل تفصيلة في بيتنا الجديد بسهولة." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الصورة</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://images.unsplash.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
