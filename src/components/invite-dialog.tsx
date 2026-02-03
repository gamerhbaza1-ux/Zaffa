"use client";

import { useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { joinHousehold } from "@/lib/actions";

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
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

const joinSchema = z.object({
  inviteCode: z.string().min(1, "لازم نكتب كود الدعوة."),
});

type FormValues = z.infer<typeof joinSchema>;

type InviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode?: string;
  userId?: string;
};

export function InviteDialog({
  open,
  onOpenChange,
  inviteCode,
  userId,
}: InviteDialogProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(joinHousehold, { error: null, success: false });
  const [hasCopied, setHasCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteCode: "" },
  });

  useEffect(() => {
    if (state.success) {
      toast({
        title: "تمام!",
        description: "انضميت للأسرة الجديدة بنجاح. القائمة هتتحدث دلوقتي.",
      });
      onOpenChange(false);
    } else if (state.error) {
      form.setError("inviteCode", { type: "server", message: state.error });
    }
  }, [state, form, onOpenChange, toast]);

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };
  
  const handleFormAction = (formData: FormData) => {
    if (userId) {
      formData.append('userId', userId);
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
            نضيف شريك ونشارك القائمة
          </DialogTitle>
          <DialogDescription>
            هنا ممكن تدي كود الدعوة لشريكك، أو تستخدم الكود بتاعه عشان
            تشاركوا نفس القائمة.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
            <h3 className="font-medium">الكود بتاعك</h3>
            <p className="text-sm text-muted-foreground">
                ادي الكود ده لشريكك عشان ينضم للأسرة بتاعتك.
            </p>
            <div className="flex items-center space-x-2 dir-ltr">
              {inviteCode ? (
                <Input
                    id="invite-code"
                    readOnly
                    value={inviteCode}
                    className="flex-1 text-lg tracking-widest text-center font-mono bg-muted border-dashed"
                />
              ) : (
                <Skeleton className="h-10 flex-1" />
              )}
                <Button type="button" size="icon" className="h-10 w-10 shrink-0" onClick={handleCopy} disabled={!inviteCode}>
                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">ننسخ الكود</span>
                </Button>
            </div>
        </div>

        <Separator className="my-4" />

        <Form {...form}>
          <form
            ref={formRef}
            action={handleFormAction}
            className="space-y-4"
          >
            <h3 className="font-medium">أو ننضم لأسرة شريكنا</h3>
             <p className="text-sm text-muted-foreground !mt-2">
                لو شريكك ادالك كود، اكتبه هنا عشان تنضم لأسرته.
            </p>
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كود دعوة الشريك</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XXXXXX"
                      {...field}
                      className="dir-ltr text-center tracking-widest font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <SubmitButton label="ننضم للأسرة" />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
