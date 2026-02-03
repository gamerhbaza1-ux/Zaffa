"use client";

import { useUser } from "@/firebase";
import { useActionState, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { respondToInvitation } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "./submit-button";

export function InvitationNotification() {
  const { user, invitations, isLoadingInvitations } = useUser();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(respondToInvitation, { error: null, success: false });
  const { toast } = useToast();

  const pendingInvitation = !isLoadingInvitations && invitations && invitations.length > 0 ? invitations[0] : null;

  useEffect(() => {
    if (pendingInvitation) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [pendingInvitation]);

  useEffect(() => {
    if(state.error) {
        toast({
            variant: "destructive",
            title: "معرفناش نرد على الدعوة",
            description: state.error,
        });
    }
    if (state.success) {
        toast({
            title: "تمام!",
            description: "تم الرد على الدعوة بنجاح.",
        });
        setOpen(false);
    }
  }, [state, toast]);

  if (!pendingInvitation || !user) {
    return null;
  }

  const inviterRoleText = pendingInvitation.inviterRole === 'bride' ? 'عروستك' : 'عريسك';
  const title = `${inviterRoleText} ${pendingInvitation.inviterName} بيدعوك لمشاركته.`;
  const description = 'لو قبلت، هتشاركوا نفس القائمة وهتقدروا تخططوا لبيتكم الجديد سوا.';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <form action={formAction}>
            <input type="hidden" name="invitationId" value={pendingInvitation.id} />
            <input type="hidden" name="userId" value={user.uid} />
            <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
                {description}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
                <Button type="submit" variant="outline" name="action" value="decline" formAction={formAction}>نرفض</Button>
                <Button type="submit" name="action" value="accept" formAction={formAction}>نقبل</Button>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
