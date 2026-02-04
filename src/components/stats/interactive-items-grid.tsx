'use client';

import { useMemo, useState, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import type { ActivityLog, Category, ChecklistItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { EditItemDialog } from '@/components/checklist/edit-item-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogItemCard } from './dialog-item-card';

export function InteractiveItemsGrid({ items, categories }: { items: ChecklistItem[], categories: Category[] }) {
    const [itemToEdit, setItemToEdit] = useState<ChecklistItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);

    const { userProfile, household } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const itemsRef = useMemo(() => household ? collection(firestore, `households/${household.id}/checklistItems`) : null, [household, firestore]);


    const getCategoryHierarchy = useCallback((categoryId: string): string => {
        const category = categoriesById.get(categoryId);
        if (!category) return 'فئة غير معروفة';

        const path: string[] = [category.name];
        let current = category;
        while (current.parentId) {
            const parent = categoriesById.get(current.parentId);
            if (parent) {
                path.unshift(parent.name);
                current = parent;
            } else {
                break;
            }
        }
        return path.join(' / ');
    }, [categoriesById]);
    
    const logActivity = useCallback((action: string, details: string, payload?: Record<string, any>) => {
        if (!firestore || !household || !userProfile) return;
        const activityLogsRef = collection(firestore, `households/${household.id}/activityLogs`);
        const logEntry: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp: any } = {
            userId: userProfile.id,
            userName: userProfile.firstName,
            action,
            details,
            timestamp: serverTimestamp(),
        };
        if (payload) {
            logEntry.payload = payload;
        }
        addDoc(activityLogsRef, logEntry as any)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: activityLogsRef.path,
                    operation: 'create',
                    requestResourceData: logEntry
                }));
            });
    }, [firestore, household, userProfile]);

    const handleUpdateItem = (itemId: string, data: Omit<ChecklistItem, 'id' | 'isPurchased' | 'finalPrice'>) => {
        if (!itemsRef) return;
        const itemDocRef = doc(itemsRef, itemId);
        const originalItem = items.find(i => i.id === itemId);

        updateDoc(itemDocRef, data)
            .then(() => {
                toast({ title: "تمام!", description: "حدثنا الحاجة دي." });
                if(originalItem) {
                   const categoryInfo = getCategoryHierarchy(data.categoryId);
                   logActivity('update_item', `تعديل "${originalItem.name}" إلى "${data.name}" في ${categoryInfo}`);
                }
                setItemToEdit(null);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'update', requestResourceData: data })));
    };

    const handleDeleteItemConfirm = () => {
        if (!itemToDelete || !itemsRef) return;
        const item = itemToDelete;
        const itemDocRef = doc(itemsRef, item.id);
        const categoryInfo = getCategoryHierarchy(item.categoryId);
        
        const revertPayload = {
            name: item.name,
            categoryId: item.categoryId,
            minPrice: item.minPrice,
            maxPrice: item.maxPrice,
            priority: item.priority,
            isPurchased: false,
        };
        
        deleteDoc(itemDocRef)
            .then(() => {
                toast({ title: "اتمسحت", description: `مسحنا الحاجة "${item.name}".` });
                logActivity('delete_item', `حذف "${item.name}" من ${categoryInfo}`, { item: revertPayload });
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'delete' })));
        setItemToDelete(null);
    };

    const { sections, itemsBySection } = useMemo(() => {
        if (!items.length || !categories.length) return { sections: [], itemsBySection: {} };

        const getSectionOfItem = (item: ChecklistItem): Category | null => {
            let category = categoriesById.get(item.categoryId);
            if (!category) return null;
            while(category && category.parentId) {
                const parent = categoriesById.get(category.parentId);
                if (!parent) break;
                category = parent;
            }
            return category || null;
        };
        
        const itemsBySection: Record<string, ChecklistItem[]> = {};
        items.forEach(item => {
            const section = getSectionOfItem(item);
            if (section) {
                if (!itemsBySection[section.id]) {
                    itemsBySection[section.id] = [];
                }
                itemsBySection[section.id].push(item);
            }
        });

        const sections = Object.keys(itemsBySection).map(id => categoriesById.get(id)!).filter(Boolean);
        sections.sort((a,b) => a.name.localeCompare(b.name));

        return { sections, itemsBySection };
    }, [items, categories, categoriesById]);

    const defaultTab = sections.length > 0 ? 'all' : (items.length ? 'all' : '');

    return (
        <>
            {items && items.length > 0 ? (
                <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col min-h-0">
                    <TabsList className="flex-wrap h-auto justify-start gap-1">
                        <TabsTrigger value="all">كل البنود ({items.length})</TabsTrigger>
                        {sections.map(section => (
                            <TabsTrigger key={section.id} value={section.id}>
                                {section.name} ({itemsBySection[section.id].length})
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollArea className="flex-1 mt-4">
                        <TabsContent value="all" className="mt-0">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                                {items.map(item => <DialogItemCard key={item.id} item={item} onEdit={setItemToEdit} onDelete={setItemToDelete} />)}
                            </div>
                        </TabsContent>
                        {sections.map(section => (
                            <TabsContent key={section.id} value={section.id} className="mt-0">
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                                    {itemsBySection[section.id].map(item => <DialogItemCard key={item.id} item={item} onEdit={setItemToEdit} onDelete={setItemToDelete} />)}
                                </div>
                            </TabsContent>
                        ))}
                    </ScrollArea>
                </Tabs>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">لا توجد بنود في هذا التحليل.</p>
                </div>
            )}
            <EditItemDialog
                item={itemToEdit}
                categories={categories}
                onOpenChange={(open) => !open && setItemToEdit(null)}
                onItemUpdated={handleUpdateItem}
            />
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>متأكدين اننا هنمسح؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    الحاجة دي "{itemToDelete?.name}" هتتمسح خالص ومش هنعرف نرجعها تاني.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>لأ، نرجع</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteItemConfirm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    أه، نمسح
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </>
    );
}