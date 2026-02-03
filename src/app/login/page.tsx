
'use client';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Define the Google Icon SVG as a separate component or string
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.5 69.5c-24.3-23.6-58.3-38.3-95.4-38.3-80.3 0-146.5 65.5-146.5 146.6s66.2 146.6 146.5 146.6c89.9 0 123.2-64.2 127.3-95.4h-127.3v-84.3h238.1c1.2 6.6 2.3 13.4 2.3 20.6z"></path>
  </svg>
);


export default function LoginPage() {
  const { user, auth, isUserLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  if (isUserLoading || user) {
     return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">أهلاً بيكم في عش المخطط</CardTitle>
          <CardDescription>سجلوا دخول عشان تبدأوا تخططوا لبيتكم الجديد.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleSignIn}>
            <GoogleIcon />
            نسجل دخول بحساب جوجل
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
