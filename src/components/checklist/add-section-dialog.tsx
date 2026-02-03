"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSectionAdded: (name: string) => boolean;
};

export function AddSectionDialog({ open, onOpenChange, onSectionAdded }: AddSectionDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const success = onSectionAdded(name);
    if(success) {
      handleClose();
    }
  }

  const handleClose = () => {
    setName('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">نضيف قسم جديد</DialogTitle>
          <DialogDescription>
            الأقسام هي اللي بتنظم القائمة بتاعتنا (زي عفش، أجهزة).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="sectionName">اسم القسم</Label>
            <Input id="sectionName" placeholder="مثال: عفش" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>نلغي</Button>
            <Button type="submit">نضيف القسم</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
