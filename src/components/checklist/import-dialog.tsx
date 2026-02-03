"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompleted: () => void;
};


export function ImportDialog({ open, onOpenChange, onImportCompleted }: ImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">خاصية الاستيراد قيد التطوير</DialogTitle>
          <DialogDescription>
            هذه الخاصية ستتوفر قريباً لتسهيل إضافة قائمة كاملة مرة واحدة.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>حسنًا</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
