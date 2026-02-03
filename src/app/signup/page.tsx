"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, collection, writeBatch } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Heart, Sparkles } from "lucide-react";

const signupSchema = z
  .object({
    firstName: z.string().min(1, "الاسم الأول مطلوب."),
    lastName: z.string().min(1, "الاسم الأخير مطلوب."),
    email: z.string().email("لازم يكون إيميل صحيح."),
    password: z.string().min(6, "كلمة السر لازم تكون 6 حروف على الأقل."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتين السر مش زي بعض.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;
type Role = "groom" | "bride";

function RoleCard({
  role,
  label,
  icon: Icon,
  onSelect,
  className,
}: {
  role: Role;
  label: string;
  icon: React.ElementType;
  onSelect: (role: Role) => void;
  className?: string;
}) {
  return (
    <Card
      onClick={() => onSelect(role)}
      className={cn(
        "cursor-pointer text-center transition-all hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      <CardHeader>
        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-2">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-xl">{label}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [step, setStep] = useState<"selection" | "form">("selection");
  const [selectedRole, setSelectedRole] = useState<Role>("groom");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("form");
  };

  const handleSignup = async (values: SignupFormValues) => {
    setError(null);
    if (!auth || !firestore) return;
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // 2. Create user profile and household in Firestore
      const batch = writeBatch(firestore);

      // 2a. Create a new household for the user
      const householdRef = doc(collection(firestore, "households"));
      batch.set(householdRef, {
        memberIds: [user.uid],
      });

      // 2b. Create the user's profile document, linking it to the household
      const userDocRef = doc(firestore, "users", user.uid);
      batch.set(userDocRef, {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: selectedRole,
        householdId: householdRef.id,
      });

      // 3. Commit the batch write
      await batch.commit();

      // 4. Redirect to home page
      router.push("/");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("الإيميل ده متسجل قبل كده.");
      } else {
        console.error("Signup Error: ", error);
        setError("حصلت مشكلة واحنا بنعمل حسابك. حاول تاني.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        {step === "selection" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold font-headline">
                حساب جديد
              </CardTitle>
              <CardDescription>
                مين بيخطط معانا؟ اختاروا عشان نخصص التجربة ليكم.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RoleCard
                role="groom"
                label="عريس"
                icon={Sparkles}
                onSelect={handleRoleSelect}
                className="border-blue-300"
              />
              <RoleCard
                role="bride"
                label="عروسة"
                icon={Heart}
                onSelect={handleRoleSelect}
                className="border-pink-300"
              />
            </CardContent>
             <CardFooter>
                 <p className="w-full px-8 text-center text-sm text-muted-foreground">
                    عندك حساب؟{" "}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                      سجل دخول
                    </Link>
                </p>
            </CardFooter>
          </>
        )}

        {step === "form" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold font-headline">
                بيانات حساب {selectedRole === "bride" ? "العروسة" : "العريس"}
              </CardTitle>
              <CardDescription>
                خطوة أخيرة وهنبقى جاهزين نبدأ التخطيط!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSignup)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الأول</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: أحمد" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الأخير</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: محمد" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الإيميل</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة السر</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && (
                    <p className="text-sm font-medium text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("selection")}
                    >
                      نرجع
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                      نعمل حساب جديد
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
