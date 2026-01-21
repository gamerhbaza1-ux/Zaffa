"use client";

import { useState, useTransition } from 'react';
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { importItems } from "@/lib/actions";
import { Loader2 } from 'lucide-react';

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "لم يتم تحديد ملف",
        description: "الرجاء تحديد ملف .csv للاستيراد.",
      });
      return;
    }

    startTransition(async () => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const result = await importItems(text);
        if (result.success) {
          toast({
            title: "نجاح الاستيراد!",
            description: `تمت إضافة ${result.count} عناصر جديدة إلى قائمتك.`,
          });
          onOpenChange(false);
          setFile(null);
        } else {
          toast({
            variant: "destructive",
            title: "فشل الاستيراد",
            description: result.error || "كانت هناك مشكلة في معالجة ملفك.",
          });
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">استيراد من Excel/CSV</DialogTitle>
          <DialogDescription>
            قم بتحميل ملف .csv لإضافة عناصر بشكل جماعي. يجب أن يحتوي الملف على الأعمدة: `name`, `minPrice`, `maxPrice`, `category`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="import-file">ملف CSV</Label>
            <Input id="import-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          <p className="text-xs text-muted-foreground">
            تأكد من أن الصف الأول هو صف رأس، والذي سيتم تجاهله.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>إلغاء</Button>
          <Button onClick={handleImport} disabled={!file || isPending}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            استيراد العناصر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
