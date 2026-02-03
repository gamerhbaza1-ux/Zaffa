"use client";

import { useState, useActionState, useEffect, useRef, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from '../submit-button';
import { Separator } from '@/components/ui/separator';

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompleted: () => void;
  householdId: string;
};

const REQUIRED_FIELDS = [
  { id: 'section', label: 'القسم' },
  { id: 'category', label: 'الفئة' },
  { id: 'name', label: 'اسم الحاجة' },
];

const OPTIONAL_FIELDS = [
  { id: 'minPrice', label: 'أقل سعر' },
  { id: 'maxPrice', label: 'أقصى سعر' },
];


export function ImportDialog({ open, onOpenChange, onImportCompleted, householdId }: ImportDialogProps) {
  const [state, formAction] = useActionState(importItems, { error: null, success: false, count: 0 });
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [step, setStep] = useState<'selection' | 'mapping'>('selection');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "نجحنا!",
        description: `ضفنا ${state.count} حاجات جديدة للقائمة.`,
      });
      onImportCompleted();
      onOpenChange(false);
    } else if (state?.error) {
      toast({
        variant: "destructive",
        title: "معرفناش نستورد",
        description: state.error,
      });
      setStep('mapping'); // Stay on mapping step on error
    }
  }, [state, onImportCompleted, onOpenChange, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      setFileContent(text);
      const firstLine = text.split('\n')[0].trim();
      const parsedHeaders = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(parsedHeaders);
      setStep('mapping');
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingChange = (fieldId: string, header: string) => {
    setMapping(prev => ({ ...prev, [fieldId]: header }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      startTransition(() => {
        // @ts-ignore
        formAction(new FormData()); // Reset server state
      });
       // Reset all internal component state when dialog closes
      setTimeout(() => {
        setFile(null);
        setFileContent('');
        setStep('selection');
        setHeaders([]);
        setMapping({});
        if (formRef.current) {
            // @ts-ignore
            formRef.current.reset();
        }
      }, 200);
    }
    onOpenChange(isOpen);
  }

  const handleFormAction = (formData: FormData) => {
    if (householdId) {
      formData.append('householdId', householdId);
      formAction(formData);
    } else {
       toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.'})
    }
  }

  const isMappingComplete = REQUIRED_FIELDS.every(field => mapping[field.id]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'selection' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline">نستورد من ملف Excel/CSV</DialogTitle>
              <DialogDescription>
                نختار ملف .csv عشان نضيف حاجات كتير مرة واحدة.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="import-file">ملف CSV</Label>
                <Input id="import-file" type="file" accept=".csv" onChange={handleFileChange} />
              </div>
              <p className="text-xs text-muted-foreground">
                الخطوة الجاية هنختار كل عامود في الملف بيمثل إيه.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>نلغي</Button>
            </DialogFooter>
          </>
        )}

        {step === 'mapping' && (
          <form ref={formRef} action={handleFormAction}>
            <input type="hidden" name="fileContent" value={fileContent} />
            <input type="hidden" name="mapping" value={JSON.stringify(mapping)} />
            <DialogHeader>
              <DialogTitle className="font-headline">نربط الأعمدة</DialogTitle>
              <DialogDescription>
                تمام، دلوقتي نختار كل عامود في الملف بتاعنا بيمثل إيه.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
                <p className="text-sm font-medium">الحقول الأساسية (لازم نربطها)</p>
              {REQUIRED_FIELDS.map(field => (
                <div key={field.id} className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right">
                    {field.label}
                  </Label>
                  <Select onValueChange={(value) => handleMappingChange(field.id, value)} required>
                    <SelectTrigger className="col-span-2">
                      <SelectValue placeholder="نختار عامود..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, idx) => (
                        <SelectItem key={`${header}-${idx}`} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Separator className="my-4" />
              <p className="text-sm font-medium text-muted-foreground">الحقول الاختيارية</p>
              {OPTIONAL_FIELDS.map(field => (
                <div key={field.id} className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-right text-muted-foreground">
                        {field.label}
                    </Label>
                    <Select onValueChange={(value) => handleMappingChange(field.id, value)}>
                        <SelectTrigger className="col-span-2">
                        <SelectValue placeholder="نختار عامود (اختياري)..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">مش عاوزين نربط ده</SelectItem>
                        <Separator />
                        {headers.map((header, idx) => (
                            <SelectItem key={`${header}-${idx}`} value={header}>{header}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setStep('selection')}>نرجع</Button>
              <SubmitButton label="يلا نستورد" disabled={!isMappingComplete} />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
