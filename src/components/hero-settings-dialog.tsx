'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';

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
import { Slider } from '@/components/ui/slider';


// --- Image Cropping Utilities ---

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Needed for canvas security
    image.src = url;
  });

async function getCroppedDataUrl(
  imageSrc: string,
  pixelCrop: Area
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as a base64 data URL
  return canvas.toDataURL('image/jpeg', 0.85); // JPEG with 85% quality
}

// --- Component ---

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
  const [uncroppedImage, setUncroppedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Cropper states
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const resetState = useCallback(() => {
    form.reset({
      title: currentConfig.title,
      subtitle: currentConfig.subtitle,
    });
    setImagePreview(currentConfig.imageUrl);
    setUncroppedImage(null);
    setImageError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [currentConfig, form]);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

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
      setUncroppedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to allow re-selecting the same file
  };

  const handleCropConfirm = async () => {
    if (uncroppedImage && croppedAreaPixels) {
        try {
            const croppedImageUrl = await getCroppedDataUrl(uncroppedImage, croppedAreaPixels);
            if (croppedImageUrl) {
                if (croppedImageUrl.length > 750 * 1024) { // ~750KB limit for safety
                    setImageError('حجم الصورة كبير جدًا حتى بعد القص. الرجاء اختيار صورة أصغر.');
                    setUncroppedImage(null); // Go back to form view
                    return;
                }
                setImagePreview(croppedImageUrl);
                setUncroppedImage(null); // Go back to form view with new preview
            }
        } catch (e) {
            console.error(e);
            setImageError("حدث خطأ أثناء قص الصورة.");
            setUncroppedImage(null);
        }
    }
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
      <DialogContent className="sm:max-w-xl">
        {uncroppedImage ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline">تحديد الصورة</DialogTitle>
              <DialogDescription>
                حرّك الصورة وكبّرها عشان تختار الجزء المناسب.
              </DialogDescription>
            </DialogHeader>
            <div className="relative h-80 w-full bg-muted">
              <Cropper
                image={uncroppedImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="zoom">تكبير</Label>
                <Slider
                    id="zoom"
                    min={1}
                    max={3}
                    step={0.1}
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUncroppedImage(null)}>رجوع</Button>
              <Button onClick={handleCropConfirm}>تأكيد وقص</Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
