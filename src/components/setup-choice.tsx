'use client';

import { useState, useTransition } from 'react';
import { useUser } from '@/firebase';
import { setupSingleUserHousehold } from '@/lib/actions';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InviteDialog } from '@/components/invite-dialog';
import { User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function SetupChoice() {
  const { user } = useUser();
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSoloSetup = () => {
    if (!user) return;
    startTransition(async () => {
      const result = await setupSingleUserHousehold(user.uid);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: result.error,
        });
      }
      // Revalidation will handle the UI update
    });
  };
  
  const handlePartnerSetup = () => {
    setInviteDialogOpen(true);
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold font-headline mb-2">أهلاً بك في زفة!</h1>
            <p className="text-lg text-muted-foreground mb-10">
                خطوة واحدة تفصلنا عن البدء في التخطيط لعش الزوجية. كيف تحب أن تبدأ؟
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  onClick={handleSoloSetup}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
                >
                    <CardHeader className="flex-grow">
                        <div className="mx-auto bg-secondary p-4 rounded-full mb-4">
                            <User className="h-10 w-10 text-secondary-foreground" />
                        </div>
                        <CardTitle className="font-headline text-xl">أوضب الشقة لوحدي</CardTitle>
                        <CardDescription className="pt-2">
                           يمكنك البدء الآن ودعوة شريكك للانضمام في أي وقت لاحق.
                        </CardDescription>
                    </CardHeader>
                </Card>

                 <Card
                  onClick={handlePartnerSetup}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
                >
                    <CardHeader className="flex-grow">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                            <Users className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-xl">أضيف حد يوضب معايا</CardTitle>
                        <CardDescription className="pt-2">
                            أرسل دعوة لشريكك للبدء في التخطيط معًا من الآن.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
             {isPending && (
                <div className="flex items-center justify-center mt-6 text-muted-foreground">
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    <span>جاري إعداد حسابك...</span>
                </div>
            )}
        </div>
      </div>
      <InviteDialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </>
  );
}
