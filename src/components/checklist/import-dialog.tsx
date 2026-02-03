"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, File, AlertCircle } from "lucide-react";

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompleted: (data: any[]) => void;
};

type Mapping = {
    section: string;
    category: string;
    name: string;
    minPrice: string | 'none';
    maxPrice: string | 'none';
};

export function ImportDialog({ open, onOpenChange, onImportCompleted }: ImportDialogProps) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileContent, setFileContent] = useState<string>("");
    const [mapping, setMapping] = useState<Mapping>({
        section: "",
        category: "",
        name: "",
        minPrice: "none",
        maxPrice: "none",
    });
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setStep(1);
        setFile(null);
        setHeaders([]);
        setFileContent("");
        setMapping({ section: "", category: "", name: "", minPrice: "none", maxPrice: "none" });
        setError(null);
    };

    const handleClose = () => {
        resetState();
        onOpenChange(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError("من فضلك اختار ملف CSV.");
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };
    
    const handleNextStep = () => {
        if (!file) {
            setError("لازم تختار ملف الأول.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) {
                setError("الملف فاضي أو فيه مشكلة.");
                return;
            }
            const lines = text.split('\n');
            const firstLine = lines[0].trim();
            if (!firstLine) {
                 setError("الملف فاضي أو فيه مشكلة.");
                return;
            }
            const parsedHeaders = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
            setHeaders(parsedHeaders);
            setFileContent(text);
            setStep(2);
            setError(null);
        };
        reader.onerror = () => {
            setError("معرفناش نقرا الملف.");
        };
        reader.readAsText(file);
    };
    
    const handleImport = () => {
        const { section, category, name } = mapping;
        if (!section || !category || !name) {
            setError("لازم تربط الأعمدة الأساسية (القسم، الفئة، الاسم).");
            return;
        }

        try {
            const lines = fileContent.split('\n').slice(1); // skip header
            const indices = {
                section: headers.indexOf(mapping.section),
                category: headers.indexOf(mapping.category),
                name: headers.indexOf(mapping.name),
                minPrice: mapping.minPrice !== 'none' ? headers.indexOf(mapping.minPrice) : -1,
                maxPrice: mapping.maxPrice !== 'none' ? headers.indexOf(mapping.maxPrice) : -1,
            };

            const importedData = lines.map(line => {
                if (!line.trim()) return null;
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                
                const minPrice = parseFloat(indices.minPrice !== -1 ? values[indices.minPrice] : '0') || 0;
                const maxPrice = parseFloat(indices.maxPrice !== -1 ? values[indices.maxPrice] : '0') || 0;
                
                return {
                    section: values[indices.section],
                    category: values[indices.category],
                    name: values[indices.name],
                    minPrice: maxPrice < minPrice ? maxPrice : minPrice,
                    maxPrice: maxPrice < minPrice ? minPrice : maxPrice,
                };
            }).filter(Boolean);

            onImportCompleted(importedData as any[]);
            handleClose();

        } catch (e) {
            console.error("Import parse error:", e);
            setError("حصلت مشكلة واحنا بنجهز البيانات. اتأكد من صحة الملف والربط.");
        }
    };
    
    const MappingField = ({ field, label }: { field: keyof Mapping, label: string }) => (
        <div>
            <Label className="font-semibold">{label} <span className="text-destructive">*</span></Label>
            <Select
                value={mapping[field]}
                onValueChange={(value) => setMapping(prev => ({ ...prev, [field]: value }))}
            >
                <SelectTrigger>
                    <SelectValue placeholder="اختار عمود من الملف" />
                </SelectTrigger>
                <SelectContent>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
    
    const OptionalMappingField = ({ field, label }: { field: keyof Mapping, label: string }) => (
        <div>
            <Label>{label}</Label>
             <Select
                value={mapping[field]}
                onValueChange={(value) => setMapping(prev => ({ ...prev, [field]: value }))}
            >
                <SelectTrigger>
                    <SelectValue placeholder="اختياري" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">مش موجود</SelectItem>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">نستورد قائمة من ملف CSV</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'ارفع الملف اللي فيه قايمة جهازك.' : 'اربط الأعمدة اللي في ملفك بالحقول بتاعتنا.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
            <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {step === 1 && (
            <div className="py-8 space-y-4">
                 <div className="flex items-center justify-center w-full">
                    <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-accent/50 hover:bg-accent/80">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">دوس عشان ترفع</span> أو اسحب الملف هنا</p>
                            <p className="text-xs text-muted-foreground">ملف CSV بس</p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    </Label>
                </div> 
                {file && (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                        <File className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                    </div>
                )}
            </div>
        )}
        
        {step === 2 && (
            <div className="space-y-4 py-4">
                <MappingField field="section" label="اسم القسم" />
                <MappingField field="category" label="اسم الفئة" />
                <MappingField field="name" label="اسم الحاجة" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <OptionalMappingField field="minPrice" label="أقل سعر" />
                    <OptionalMappingField field="maxPrice" label="أقصى سعر" />
                </div>
            </div>
        )}

        <DialogFooter className="pt-4">
            <Button variant="outline" onClick={handleClose}>نلغي</Button>
            {step === 1 ? (
                <Button onClick={handleNextStep}>التالي</Button>
            ) : (
                <>
                <Button variant="outline" onClick={() => { setStep(1); setError(null); }}>نرجع</Button>
                <Button onClick={handleImport}>نستورد</Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
