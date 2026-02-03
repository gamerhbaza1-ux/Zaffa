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
  onImportCompleted: () => void;
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
        title: "مفيش ملف",
        description: "لازم نختار ملف .csv الأول.",
      });
      return;
    }

    startTransition(async () => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        // onItemAdded is now onImportCompleted
        const result = await importItems(text);
        if (result.success) {
          toast({
            title: "نجحنا!",
            description: `ضفنا ${result.count} حاجات جديدة للقائمة.`,
          });
          onOpenChange(false);
          setFile(null);
          onImportCompleted();
        } else {
          toast({
            variant: "destructive",
            title: "معرفناش نستورد",
            description: result.error || "حصلت مشكلة في الملف.",
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
          <DialogTitle className="font-headline">نستورد من ملف Excel/CSV</DialogTitle>
          <DialogDescription>
            ممكن نرفع ملف .csv عشان نضيف حاجات كتير مرة واحدة. الملف لازم يكون فيه الأعمدة دي: `name`, `minPrice`, `maxPrice`, `category`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="import-file">ملف CSV</Label>
            <Input id="import-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          <p className="text-xs text-muted-foreground">
            متنسوش، أول صف في الملف مش هيتحسب (عشان أسماء الأعمدة).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>نلغي</Button>
          <Button onClick={handleImport} disabled={!file || isPending}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            يلا نستورد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
