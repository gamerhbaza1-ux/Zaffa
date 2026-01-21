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
        title: "No file selected",
        description: "Please select a .csv file to import.",
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
            title: "Import Successful!",
            description: `${result.count} new items have been added to your list.`,
          });
          onOpenChange(false);
          setFile(null);
        } else {
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: result.error || "There was an issue processing your file.",
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
          <DialogTitle className="font-headline">Import from Excel/CSV</DialogTitle>
          <DialogDescription>
            Upload a .csv file to bulk-add items. The file should have columns: `name`, `minPrice`, `maxPrice`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="import-file">CSV File</Label>
            <Input id="import-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          <p className="text-xs text-muted-foreground">
            Make sure the first row is a header row, which will be ignored.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
