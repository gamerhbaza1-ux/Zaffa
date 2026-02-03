'use client';

import { useTransition } from 'react';
import { useUser } from '@/hooks/use-user';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, collection } from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function HouseholdSetup() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleCreateHousehold = () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لازم تسجل دخول الأول.' });
            return;
        }

        startTransition(async () => {
            const householdRef = doc(collection(firestore, 'households'));
            const userRef = doc(firestore, 'users', user.uid);

            try {
                await runTransaction(firestore, async (transaction) => {
                    transaction.set(householdRef, { memberIds: [user.uid] });
                    transaction.update(userRef, { householdId: householdRef.id });
                });
                toast({
                    title: 'مبروك!',
                    description: 'تم إنشاء أسرتك الجديدة بنجاح. يلا نبدأ التخطيط!',
                });
            } catch (e) {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `transaction to create household`,
                    operation: 'write'
                }));
            }
        });
    };

    return (
        <Card className="border-2 border-dashed bg-transparent shadow-none">
            <CardContent className="p-6 text-center">
                 <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
                    <PartyPopper className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl mb-1">
                    خطوة أخيرة قبل ما نبدأ
                </CardTitle>
                <CardDescription className="mb-4">
                    محتاجين نجهز "الأسرة" بتاعتكم عشان تحفظوا فيها كل حاجة.
                </CardDescription>
                <Button onClick={handleCreateHousehold} disabled={isPending}>
                    {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    نبدأ التخطيط
                </Button>
            </CardContent>
        </Card>
    );
}
