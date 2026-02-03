'use client';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.5 69.5c-24.3-23.6-58.3-38.3-95.4-38.3-80.3 0-146.5 65.5-146.5 146.6s66.2 146.6 146.5 146.6c89.9 0 123.2-64.2 127.3-95.4h-127.3v-84.3h238.1c1.2 6.6 2.3 13.4 2.3 20.6z"></path>
  </svg>
);

const loginSchema = z.object({
  email: z.string().email("لازم يكون إيميل صحيح."),
  password: z.string().min(1, "متنساش كلمة السر."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const [firstName, lastName] = user.displayName?.split(' ') || ['', ''];
        
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName || '',
          role: 'groom', // Default role
          householdId: null, // User will choose setup on the home page
        });
      }
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setError("معرفناش نسجل دخولك بحساب جوجل، حاول تاني.");
    }
  };

  const handleEmailSignIn = async (values: LoginFormValues) => {
    if (!auth) return;
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      console.error("Error signing in with email: ", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError("الإيميل أو كلمة السر غلط.");
      } else {
        setError("حصلت مشكلة، حاول تاني كمان شوية.");
      }
    }
  };
  
  if (isUserLoading || user) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">أهلاً بيكم في زفة</CardTitle>
          <CardDescription>سجلوا دخول عشان تبدأوا تخططوا لبيتكم الجديد.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEmailSignIn)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الإيميل</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة السر</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                دخول
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">أو كمل بـ</span>
            </div>
          </div>

          <Button className="w-full" variant="outline" onClick={handleGoogleSignIn}>
            <GoogleIcon />
            نسجل دخول بحساب جوجل
          </Button>

          <p className="px-8 text-center text-sm text-muted-foreground">
            معندكش حساب؟{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              اعمل حساب جديد
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
