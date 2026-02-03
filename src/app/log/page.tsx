'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityLog } from '@/lib/types';

function LogHeader() {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <History className="text-primary" size={24} />
          </div>
          <h1 className="text-2xl font-bold font-headline text-foreground">
            سجل النشاط
          </h1>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href="/" aria-label="الرجوع للرئيسية">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

export default function LogPage() {
  const { user, household, isHouseholdLoading, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const logsQuery = useMemo(() => {
    if (!household) return null;
    const logsCollection = collection(firestore, `households/${household.id}/activityLogs`);
    return query(logsCollection, orderBy('timestamp', 'desc'));
  }, [household, firestore]);

  const { data: logs, isLoading: areLogsLoading } = useCollection<ActivityLog>(logsQuery);

  const isLoading = isHouseholdLoading || areLogsLoading;

  const formatAction = (action: string) => {
    const actions: { [key: string]: string } = {
        create_item: 'إضافة حاجة',
        purchase_item: 'شراء حاجة',
        unpurchase_item: 'إلغاء شراء',
        delete_item: 'حذف حاجة',
        create_section: 'إنشاء قسم',
        create_category: 'إنشاء فئة',
        update_category: 'تعديل قسم/فئة',
        delete_category: 'حذف قسم/فئة',
        import_items: 'استيراد قائمة',
    };
    return actions[action] || action;
  };

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LogHeader />
      <main className="flex-1">
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>كل اللي حصل في القائمة</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !logs || logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">
                  لسه مفيش أي نشاط نسجله.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الحدث</TableHead>
                      <TableHead>التفاصيل</TableHead>
                      <TableHead className="text-left">الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>{formatAction(log.action)}</TableCell>
                        <TableCell>{log.details}</TableCell>
                        <TableCell className="text-left text-muted-foreground">
                          {log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true, locale: arSA }) : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
