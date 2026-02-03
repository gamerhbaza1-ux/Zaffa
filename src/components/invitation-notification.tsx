"use client";

import { useFirestore, useUser } from "@/firebase";
import { useEffect, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteDoc, doc, getDoc, runTransaction } from "firebase/firestore";
import type { Household, Invitation, UserProfile } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export function InvitationNotification() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { invitations, isLoadingInvitations } = useUser();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const pendingInvitation = !isLoadingInvitations && invitations && invitations.length > 0 ? invitations[0] : null;

  useEffect(() => {
    if (pendingInvitation) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [pendingInvitation]);

  const handleResponse = (action: 'accept' | 'decline') => {
    if (!pendingInvitation || !user || !firestore) {
      return;
    }
    
    startTransition(() => {
      const invitationRef = doc(firestore, "invitations", pendingInvitation.id);

      if (action === 'decline') {
        deleteDoc(invitationRef)
          .then(() => {
              toast({
                  title: "تمام!",
                  description: "تم رفض الدعوة بنجاح.",
              });
              setOpen(false);
          })
          .catch(() => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: invitationRef.path,
                  operation: 'delete',
              }));
          });
      } else {
        // Handle 'accept'
        runTransaction(firestore, async (transaction) => {
          const invitationSnap = await transaction.get(invitationRef);
          if (!invitationSnap.exists()) {
            throw new Error("الدعوة دي مبقتش موجودة.");
          }
          const invitation = invitationSnap.data() as Invitation;
          
          const userRef = doc(firestore, "users", user.uid);
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw new Error("حسابك مش موجود.");
          }
          const userProfile = userSnap.data() as UserProfile;

          if (userProfile.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
            throw new Error("الدعوة دي مش ليك أصلاً.");
          }

          const targetHouseholdRef = doc(firestore, "households", invitation.householdId);
          const targetHouseholdSnap = await transaction.get(targetHouseholdRef);
          if (!targetHouseholdSnap.exists()) {
              throw new Error("الأسرة اللي بتحاول تنضم ليها مش موجودة.");
          }
          const targetHousehold = targetHouseholdSnap.data() as Household;
          if (targetHousehold.memberIds.includes(user.uid)) {
              // User is already in the household, just delete the invite
              transaction.delete(invitationRef);
              return; 
          }
          if (targetHousehold.memberIds.length >= 2) {
              throw new Error("الأسرة دي مكتملة خلاص.");
          }

          // Delete the user's old, now empty household
          const oldHouseholdId = userProfile.householdId;
          if (oldHouseholdId) {
            const oldHouseholdRef = doc(firestore, "households", oldHouseholdId);
            const oldHouseholdSnap = await transaction.get(oldHouseholdRef);
            // Only delete if it was a single-person household
            if (oldHouseholdSnap.exists() && oldHouseholdSnap.data().memberIds.length === 1) {
              transaction.delete(oldHouseholdRef);
            }
          }

          // Update user's profile to new household
          transaction.update(userRef, { householdId: invitation.householdId });

          // Add user to the new household's members list
          transaction.update(targetHouseholdRef, {
            memberIds: [...targetHousehold.memberIds, user.uid]
          });

          // Delete the invitation
          transaction.delete(invitationRef);
        })
        .then(() => {
          toast({
              title: "تمام!",
              description: "تم الرد على الدعوة بنجاح.",
          });
          setOpen(false);
        })
        .catch((e) => {
          if (e && (e.name === 'FirebaseError' || e.code === 'permission-denied')) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `transaction to join household ${pendingInvitation.householdId}`,
              operation: 'write'
            }));
          } else {
            console.error("Respond to invitation failed:", e);
            const message = e instanceof Error ? e.message : "An unknown error occurred";
            toast({
                variant: "destructive",
                title: "معرفناش نرد على الدعوة",
                description: message,
            });
          }
        });
      }
    });
  }

  if (!pendingInvitation || !user) {
    return null;
  }

  const inviterRoleText = pendingInvitation.inviterRole === 'bride' ? 'عروستك' : 'عريسك';
  const title = `${inviterRoleText} ${pendingInvitation.inviterName} بيدعوك لمشاركته.`;
  const description = 'لو قبلت، هتشاركوا نفس القائمة وهتقدروا تخططوا لبيتكم الجديد سوا.';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>
            {description}
        </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
            <Button variant="outline" onClick={() => handleResponse('decline')} disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                نرفض
            </Button>
            <Button onClick={() => handleResponse('accept')} disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                نقبل
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
