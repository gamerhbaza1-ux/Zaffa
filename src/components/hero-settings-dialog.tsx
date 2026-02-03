'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
});

type FormValues = z.infer<typeof heroConfigSchema>;

interface HeroSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: HeroConfig) => void;
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
    },
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      form.reset({
        title: currentConfig.title,
        subtitle: currentConfig.subtitle,
      });
      setImagePreview(currentConfig.imageUrl);
      setImageError(null);
    }
  }, [currentConfig, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('الرجاء اختيار ملف صورة صالح.');
      return;
    }

    setImageError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setImageError('لا يمكن معالجة الصورة في هذا المتصفح.');
          return;
        }

        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // JPEG with 85% quality

        if (dataUrl.length > 750 * 1024) { // ~750KB limit for safety
          setImageError('حجم الصورة كبير جدًا. الرجاء اختيار صورة أصغر.');
          return;
        }

        setImagePreview(dataUrl);
      };
      img.onerror = () => {
        setImageError('الملف الذي تم اختياره ليس صورة صالحة.');
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = (values: FormValues) => {
    if (imageError) {
      form.setError('root', { message: imageError });
      return;
    }
    onSave({
      ...values,
      imageUrl: imagePreview || currentConfig.imageUrl,
    });
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
            
            <FormItem>
              <FormLabel>تغيير الصورة</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="file:ml-4 file:bg-primary file:text-primary-foreground file:hover:bg-primary/90 file:font-medium file:py-2 file:px-4 file:rounded-md file:border-0"
                />
              </FormControl>
              <FormMessage>
                {imageError}
              </FormMessage>
            </FormItem>

            {imagePreview && (
                <div className="relative w-full aspect-[16/9] mt-2 rounded-md overflow-hidden border">
                    <Image src={imagePreview} alt="معاينة الصورة الجديدة" fill className="object-cover" />
                </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSaving || !!imageError}>
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
