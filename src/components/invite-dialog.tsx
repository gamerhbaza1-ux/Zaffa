"use client";

import { useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendInvitation } from "@/lib/actions";
import { useUser } from "@/firebase";

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
import { SubmitButton } from "./submit-button";

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
  const { user } = useUser();
  const { toast } = useToast();
  const [state, formAction] = useActionState(sendInvitation, { error: null, success: false });
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { inviteeEmail: "" },
  });

  useEffect(() => {
    if (state.success) {
      toast({
        title: "تمام!",
        description: "بعتنا الدعوة لشريكك.",
      });
      onOpenChange(false);
      form.reset();
    } else if (state.error) {
      form.setError("inviteeEmail", { type: "server", message: state.error });
    }
  }, [state, form, onOpenChange, toast]);

  const handleFormAction = (formData: FormData) => {
    if (user) {
      formData.append('inviterId', user.uid);
      formAction(formData);
    } else {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.'})
    }
  }

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
            ref={formRef}
            action={handleFormAction}
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
              <SubmitButton label="نبعت الدعوة" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
