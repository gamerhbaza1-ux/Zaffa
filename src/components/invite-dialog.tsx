"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { Invitation } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const inviteSchema = z.object({
  inviteeEmail: z.string().email("لازم نكتب إيميل صحيح."),
});

type FormValues = z.infer<typeof inviteSchema>;

type InviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteDialog({
  open,
  onOpenChange,
}: InviteDialogProps) {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { inviteeEmail: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleInvite = (values: FormValues) => {
    if (!user || !userProfile || !firestore) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.' });
      return;
    }

    if (!userProfile.householdId) {
       form.setError("inviteeEmail", { type: "server", message: "معرفناش نلاقي الأسرة بتاعتك. حاول تحدث الصفحة." });
       return;
    }
    
    const { inviteeEmail } = values;
    if (userProfile.email.toLowerCase() === inviteeEmail.toLowerCase()) {
        form.setError("inviteeEmail", { type: "server", message: "مينفعش تبعت دعوة لنفسك." });
        return;
    }

    startTransition(() => {
        const householdId = userProfile.householdId!; // We already checked this
        const invitationsRef = collection(firestore, "invitations");

        const newInvitation: Omit<Invitation, 'id'> = {
          inviterId: user.uid,
          inviterName: `${userProfile.firstName} ${userProfile.lastName}`,
          inviterRole: userProfile.role,
          inviteeEmail: inviteeEmail.toLowerCase(),
          householdId: householdId,
          status: 'pending',
        };

        addDoc(invitationsRef, newInvitation)
            .then(() => {
                toast({
                  title: "تمام!",
                  description: "بعتنا الدعوة لشريكك.",
                });
                onOpenChange(false);
            })
            .catch(() => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: invitationsRef.path,
                operation: 'create',
                requestResourceData: newInvitation,
              }));
            });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            ندعي شريك عشان يشاركنا القائمة
          </DialogTitle>
          <DialogDescription>
            اكتب إيميل شريكك عشان نبعتله دعوة ينضم ليك في التخطيط.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleInvite)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="inviteeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>إيميل الشريك</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="partner@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>نلغي</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                نبعت الدعوة
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
