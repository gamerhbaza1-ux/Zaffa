"use client";

import { useState, useMemo, useCallback } from 'react';
import type { ChecklistItem, Category, Priority } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Plus, Upload, ListPlus, MoreVertical, Pencil, Trash2, FolderPlus, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ItemCard } from './item-card';
import { ProgressSummary } from './progress-summary';
import { AddItemDialog } from './add-item-dialog';
import { ImportDialog } from './import-dialog';
import { AddSectionDialog } from './add-section-dialog';
import { AddCategoryDialog } from './add-category-dialog';
import { EditCategoryDialog } from './edit-category-dialog';
import { PurchaseDialog } from './purchase-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ChecklistClient() {
    const { userProfile, household, isHouseholdLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    // Data fetching
    const categoriesRef = useMemo(() => household ? collection(firestore, `households/${household.id}/categories`) : null, [household, firestore]);
    const itemsRef = useMemo(() => household ? collection(firestore, `households/${household.id}/checklistItems`) : null, [household, firestore]);

    const { data: categoriesData, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesRef);
    const { data: itemsData, isLoading: areItemsLoading } = useCollection<ChecklistItem>(itemsRef);
    const categories = useMemo(() => categoriesData || [], [categoriesData]);
    const items = useMemo(() => itemsData || [], [itemsData]);

    // Dialog states
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isImportDialogOpen, setImportDialogOpen] = useState(false);
    const [isAddSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
    const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
    const [itemToPurchase, setItemToPurchase] = useState<ChecklistItem | null>(null);
    const [itemToUnpurchase, setItemToUnpurchase] = useState<ChecklistItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);
    const [itemToEdit, setItemToEdit] = useState<ChecklistItem | null>(null);
    const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    
    const logActivity = useCallback((action: string, details: string) => {
        if (!firestore || !household || !userProfile) return;
        const activityLogsRef = collection(firestore, `households/${household.id}/activityLogs`);
        const logEntry = {
            userId: userProfile.id,
            userName: userProfile.firstName,
            action,
            details,
            timestamp: serverTimestamp(),
        };
        addDoc(activityLogsRef, logEntry)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: activityLogsRef.path,
                    operation: 'create',
                    requestResourceData: logEntry
                }));
            });
    }, [firestore, household, userProfile]);

    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
    }, []);

    const handleToggle = (id: string) => {
        const item = items.find(i => i.id === id);
        if (item) {
            if (item.isPurchased) {
                setItemToUnpurchase(item);
            } else {
                setItemToPurchase(item);
            }
        }
    };
  
    const handlePurchase = (itemId: string, finalPrice: number) => {
        if (!itemsRef) return;
        const item = items.find(i => i.id === itemId);
        const itemDocRef = doc(itemsRef, itemId);
        updateDoc(itemDocRef, { isPurchased: true, finalPrice })
            .then(() => {
                toast({ title: "تمام!", description: "علمنا على الحاجة دي انها اتجابت خلاص." });
                if (item) {
                  logActivity('purchase_item', `شراء "${item.name}" بسعر ${formatPrice(finalPrice)}`);
                }
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'update', requestResourceData: { isPurchased: true, finalPrice } })));
        setItemToPurchase(null);
    }

    const handleUnpurchaseConfirm = () => {
        if (!itemToUnpurchase || !itemsRef) return;
        const itemName = itemToUnpurchase.name;
        const itemDocRef = doc(itemsRef, itemToUnpurchase.id);
        updateDoc(itemDocRef, { isPurchased: false, finalPrice: undefined })
             .then(() => {
                toast({ title: "رجعناها القائمة", description: `رجعنا "${itemName}" للحاجات اللي لسه هنجيبها.` });
                logActivity('unpurchase_item', `إلغاء شراء "${itemName}"`);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'update', requestResourceData: { isPurchased: false } })));
        setItemToUnpurchase(null);
    };

    const handleDeleteItemConfirm = () => {
        if (!itemToDelete || !itemsRef) return;
        const itemName = itemToDelete.name;
        const itemDocRef = doc(itemsRef, itemToDelete.id);
        deleteDoc(itemDocRef)
            .then(() => {
                toast({ title: "اتمسحت", description: `مسحنا الحاجة "${itemName}".` });
                logActivity('delete_item', `حذف "${itemName}"`);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'delete' })));
        setItemToDelete(null);
    };

    const handleAddSection = (name: string) => {
        if (!categoriesRef || categories.some(c => c.parentId === null && c.name.toLowerCase() === name.toLowerCase())) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'القسم ده موجود قبل كده.'});
            return false;
        }
        const newSection: Omit<Category, 'id'> = { name, parentId: null };
        addDoc(categoriesRef, newSection)
            .then(() => {
                toast({ title: 'تمام!', description: 'ضفنا القسم الجديد.' });
                logActivity('create_section', `إنشاء قسم جديد: "${name}"`);
                setAddSectionDialogOpen(false);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: categoriesRef.path, operation: 'create', requestResourceData: newSection })));
        return true;
    }

    const handleAddCategory = (name: string, parentId: string) => {
        if (!categoriesRef || categories.some(c => c.parentId === parentId && c.name.toLowerCase() === name.toLowerCase())) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الفئة دي موجودة قبل كده في نفس المكان.'});
            return false;
        }
        const newCategory: Omit<Category, 'id'> = { name, parentId };
        addDoc(categoriesRef, newCategory)
            .then(() => {
                toast({ title: 'تمام!', description: 'ضفنا الفئة الجديدة.' });
                const parentName = categories.find(c => c.id === parentId)?.name || '';
                logActivity('create_category', `إنشاء فئة جديدة: "${name}" تحت "${parentName}"`);
                setAddCategoryDialogOpen(false);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: categoriesRef.path, operation: 'create', requestResourceData: newCategory })));
        return true;
    }
  
    const handleUpdateCategory = (id: string, name: string, parentId: string | null) => {
        if (!categoriesRef) return false;
        let currentParentId = parentId;
        while(currentParentId) {
            if (currentParentId === id) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'مينفعش تخلي الفئة تبع نفسها.' });
                return false;
            }
            const parent = categories.find(c => c.id === currentParentId);
            currentParentId = parent?.parentId || null;
        }
        const catDocRef = doc(categoriesRef, id);
        updateDoc(catDocRef, { name, parentId: parentId || null })
            .then(() => {
                toast({ title: 'تمام!', description: 'حدثنا القسم/الفئة.' });
                logActivity('update_category', `تعديل القسم/الفئة إلى "${name}"`);
                setCategoryToEdit(null);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: catDocRef.path, operation: 'update', requestResourceData: { name, parentId } })));
        return true;
    }

    const handleDeleteCategory = () => {
        if (!categoryToDelete || !categoriesRef) return;
        const hasChildren = categories.some(c => c.parentId === categoryToDelete.id);
        if(hasChildren) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'مينفعش نمسحها عشان جواها فئات تانية.' });
            setCategoryToDelete(null); return;
        }
        const hasItems = items.some(i => i.categoryId === categoryToDelete.id);
        if(hasItems) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'مينفعش نمسحها عشان جواها حاجات.' });
            setCategoryToDelete(null); return;
        }
        const categoryName = categoryToDelete.name;
        const catDocRef = doc(categoriesRef, categoryToDelete.id);
        deleteDoc(catDocRef)
            .then(() => {
                toast({ title: 'اتمسحت', description: `مسحنا "${categoryName}".` })
                logActivity('delete_category', `حذف القسم/الفئة "${categoryName}"`);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: catDocRef.path, operation: 'delete' })));
        setCategoryToDelete(null);
    };

    const handleImportCompleted = async (importedData: { section: string; category: string; name: string; minPrice: number; maxPrice: number }[]) => {
        if (!categoriesRef || !itemsRef || !firestore) return;
        const batch = writeBatch(firestore);
        let currentCategories = [...categories];

        const getOrCreateCategory = (name: string, parentId: string | null): Category => {
            const existing = currentCategories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.parentId === parentId);
            if (existing) return existing;
            const newCategoryDocRef = doc(categoriesRef);
            const newCategory: Category = { id: newCategoryDocRef.id, name, parentId };
            batch.set(newCategoryDocRef, { name, parentId });
            currentCategories.push(newCategory);
            return newCategory;
        };

        for (const record of importedData) {
            if (!record.section || !record.category || !record.name) continue;
            const section = getOrCreateCategory(record.section, null);
            const category = getOrCreateCategory(record.category, section.id);
            const newItemRef = doc(itemsRef);
            batch.set(newItemRef, { name: record.name, categoryId: category.id, minPrice: record.minPrice, maxPrice: record.maxPrice, isPurchased: false, priority: 'important' });
        }
        
        await batch.commit()
            .then(() => {
                toast({ title: "تمام!", description: `تم استيراد ${importedData.length} حاجة بنجاح.` });
                logActivity('import_items', `استيراد ${importedData.length} حاجة من ملف.`);
                setImportDialogOpen(false);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `batch write to household ${household?.id}`, operation: 'write' })));
    };

    const handleAddItem = (newItem: Omit<ChecklistItem, 'id' | 'isPurchased'>) => {
        if (!itemsRef) return;
        addDoc(itemsRef, { ...newItem, isPurchased: false })
            .then(() => {
                toast({ title: 'تمام!', description: 'ضفنا الحاجة الجديدة.'});
                const categoryName = categories.find(c => c.id === newItem.categoryId)?.name || '';
                logActivity('create_item', `إضافة "${newItem.name}" إلى "${categoryName}"`);
                setAddDialogOpen(false);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemsRef.path, operation: 'create', requestResourceData: newItem })));
    };

    const handleUpdateItem = (itemId: string, data: Omit<ChecklistItem, 'id' | 'isPurchased' | 'finalPrice'>) => {
        if (!itemsRef) return;
        const itemDocRef = doc(itemsRef, itemId);
        const originalItem = items.find(i => i.id === itemId);

        updateDoc(itemDocRef, data)
            .then(() => {
                toast({ title: "تمام!", description: "حدثنا الحاجة دي." });
                if(originalItem) {
                   logActivity('update_item', `تعديل "${originalItem.name}" إلى "${data.name}"`);
                }
                setItemToEdit(null);
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'update', requestResourceData: data })));
    };
    
    const handleUpdatePriority = (itemId: string, priority: Priority) => {
        if (!itemsRef) return;
        const itemDocRef = doc(itemsRef, itemId);
        const item = items.find(i => i.id === itemId);

        updateDoc(itemDocRef, { priority })
            .then(() => {
                toast({ title: "تمام!", description: "تم تحديث الأولوية." });
                if (item) {
                    logActivity('update_item_priority', `تغيير أولوية "${item.name}"`);
                }
            })
            .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemDocRef.path, operation: 'update', requestResourceData: { priority } })));
    };
  
    const isLoading = isHouseholdLoading || areCategoriesLoading || areItemsLoading;
    const purchasedCount = useMemo(() => items.filter(item => item.isPurchased).length, [items]);
    const totalCount = items.length;
    const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const topLevelCategories = useMemo(() => {
        return categories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return [];
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);
  
    const getCategoryDepth = useCallback((catId: string, depth = 0): number => {
        const category = categoriesById.get(catId);
        if (!category || !category.parentId) return depth;
        const parent = categoriesById.get(category.parentId);
        if(!parent?.parentId) return depth;
        return getCategoryDepth(category.parentId, depth + 1);
    }, [categoriesById]);

    const handleDownloadData = useCallback(() => {
        if (!items.length) {
            toast({ title: 'لا توجد بيانات للتحميل', description: 'القائمة فاضية حاليًا.' });
            return;
        }

        const priorityLabels: Record<Priority, string> = {
            important: 'مهم',
            nice_to_have: 'لو الدنيا تمام',
            not_important: 'مش مهم',
        };
        
        const getCategoryHierarchy = (categoryId: string) => {
            const category = categoriesById.get(categoryId);
            if (!category) return { sectionName: '', categoryName: '' };
            
            if (category.parentId) {
                const section = categoriesById.get(category.parentId);
                return {
                    categoryName: category.name,
                    sectionName: section?.name || 'قسم غير معروف',
                };
            } else {
                return { categoryName: '', sectionName: category.name };
            }
        };

        const headers = [
            "القسم", "الفئة", "اسم الحاجة", "أقل سعر متوقع",
            "أقصى سعر متوقع", "تم الشراء", "السعر النهائي", "الأولوية"
        ];
        
        const rows = items.map(item => {
            const { sectionName, categoryName } = getCategoryHierarchy(item.categoryId);
            const values = [
                sectionName,
                categoryName,
                item.name,
                item.minPrice,
                item.maxPrice,
                item.isPurchased ? "نعم" : "لا",
                item.finalPrice ?? '',
                priorityLabels[item.priority || 'important'],
            ];
            return values.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\r\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "zaffa-checklist.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [items, categoriesById, toast]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-28" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" /> نضيف حاجة
              </Button>
              <Button variant="secondary" onClick={() => setImportDialogOpen(true)}>
                <Upload className="ml-2 h-4 w-4" /> نستورد
              </Button>
               <Button variant="outline" onClick={() => setAddCategoryDialogOpen(true)}>
                <ListPlus className="ml-2 h-4 w-4" /> نضيف فئة
              </Button>
              <Button variant="outline" onClick={handleDownloadData}>
                <Download className="ml-2 h-4 w-4" /> نحمل الداتا
              </Button>
            </div>
            <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="ابحث عن حاجة في القائمة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10"
                />
            </div>
            <ProgressSummary purchasedCount={purchasedCount} totalCount={totalCount} />
          </div>
    
          {searchQuery ? (
            <div className="space-y-2">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onToggle={() => handleToggle(item.id)}
                            onDelete={() => setItemToDelete(item)}
                            onEdit={() => setItemToEdit(item)}
                            onPriorityChange={(priority) => handleUpdatePriority(item.id, priority)}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-medium text-foreground">لا توجد نتائج</h3>
                        <p className="text-muted-foreground mt-1">
                            حاول البحث بكلمة مختلفة.
                        </p>
                    </div>
                )}
            </div>
          ) : (totalCount > 0 || categories.length > 0) ? (
            <Tabs defaultValue={topLevelCategories[0]?.id} className="w-full" dir="rtl">
                <div className="flex items-center flex-wrap gap-2">
                  <TabsList className="flex-wrap h-auto justify-start flex-grow gap-2">
                      {topLevelCategories.map(category => (
                          <TabsTrigger key={category.id} value={category.id}>
                              <span className="truncate">{category.name}</span>
                          </TabsTrigger>
                      ))}
                  </TabsList>
                  <Button variant="outline" onClick={() => setAddSectionDialogOpen(true)} className="shrink-0">
                      <FolderPlus className="ml-2 h-4 w-4" /> نضيف قسم
                  </Button>
                </div>
                {topLevelCategories.map(topLevelCategory => {
                    const getDescendantIds = (catId: string): string[] => {
                        let ids = [catId];
                        const children = categories.filter(c => c.parentId === catId);
                        children.forEach(child => {
                            ids = [...ids, ...getDescendantIds(child.id)];
                        });
                        return ids;
                    }
                    const allDescendantIds = getDescendantIds(topLevelCategory.id);
    
                    const totalExpectedInTab = items.filter(i => allDescendantIds.includes(i.categoryId) && !i.isPurchased).reduce((sum, item) => sum + (item.minPrice + item.maxPrice) / 2, 0);
                    const totalPaidInTab = items.filter(i => allDescendantIds.includes(i.categoryId) && i.isPurchased).reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
    
                    const renderCategoryTree = (categoryId: string) => {
                        const category = categoriesById.get(categoryId);
                        if (!category) return null;
    
                        const descendantIdsForCat = getDescendantIds(category.id);
                        const subCatItems = items.filter(i => i.categoryId === category.id);
                        const children = categories.filter(c => c.parentId === category.id).sort((a,b) => a.name.localeCompare(b.name));
                        const level = getCategoryDepth(category.id);
    
                        const expectedInSubCat = items.filter(i => descendantIdsForCat.includes(i.categoryId) && !i.isPurchased).reduce((sum, item) => sum + (item.minPrice + item.maxPrice) / 2, 0);
                        const paidInSubCat = items.filter(i => descendantIdsForCat.includes(i.categoryId) && i.isPurchased).reduce((sum, item) => sum + (item.finalPrice ?? 0), 0);
    
                        return (
                           <Card 
                                key={category.id} 
                                className="overflow-hidden shadow-sm"
                                style={{ marginRight: level > 0 ? '1rem' : undefined }}
                            >
                                <div className="flex justify-between items-center bg-accent/50 p-3 px-4">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-base text-accent-foreground">{category.name}</h3>
                                        {(expectedInSubCat > 0 || paidInSubCat > 0) && (
                                            <div className="text-xs text-muted-foreground font-normal flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                <span>المتوقع: {formatPrice(expectedInSubCat)}</span>
                                                <span>المدفوع: {formatPrice(paidInSubCat)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">خيارات لـ {category.name}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setCategoryToEdit(category)}>
                                                <Pencil className="ml-2 h-4 w-4" />
                                                <span>نعدّل</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setCategoryToDelete(category)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="ml-2 h-4 w-4" />
                                                <span>نمسح</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                {(subCatItems.length > 0 || children.length > 0) && (
                                    <CardContent className="p-4 space-y-4">
                                        {subCatItems.length > 0 && (
                                            <div className="space-y-2">
                                                {subCatItems.map(item => (
                                                    <ItemCard
                                                        key={item.id}
                                                        item={item}
                                                        onToggle={() => handleToggle(item.id)}
                                                        onDelete={() => setItemToDelete(item)}
                                                        onEdit={() => setItemToEdit(item)}
                                                        onPriorityChange={(priority) => handleUpdatePriority(item.id, priority)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {children.length > 0 && (
                                            <div className="space-y-4">
                                                {children.map(child => renderCategoryTree(child.id))}
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    };
    
                    const directSubCategories = categories.filter(c => c.parentId === topLevelCategory.id).sort((a,b) => a.name.localeCompare(b.name));
    
                    return (
                        <TabsContent key={topLevelCategory.id} value={topLevelCategory.id} className="mt-4">
                            <Card>
                                <div className="flex justify-between items-start p-4 border-b">
                                    <div>
                                        <h2 className="text-lg font-bold font-headline">{topLevelCategory.name}</h2>
                                        {(totalExpectedInTab > 0 || totalPaidInTab > 0) && (
                                            <div className="text-sm text-muted-foreground font-normal flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span>المتوقع: {formatPrice(totalExpectedInTab)}</span>
                                                <span>المدفوع: {formatPrice(totalPaidInTab)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-1">
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">خيارات لـ {topLevelCategory.name}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setCategoryToEdit(topLevelCategory)}>
                                                <Pencil className="ml-2 h-4 w-4" />
                                                <span>نعدّل</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setCategoryToDelete(topLevelCategory)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="ml-2 h-4 w-4" />
                                                <span>نمسح</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardContent className="p-4 space-y-6">
                                    {directSubCategories.length > 0 ? (
                                        <div className="space-y-6">
                                          {directSubCategories.map(cat => renderCategoryTree(cat.id))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-10">
                                            القسم ده فاضي. ممكن نضيف فئة عشان نبدأ.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )
                })}
            </Tabs>
          ) : (
            <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium text-foreground">القائمة بتاعتنا فاضية!</h3>
              <p className="text-muted-foreground mt-1">
                يلا نبدأ نضيف الأقسام عشان ننظم حاجتنا (زي عفش، أجهزة، مطبخ...).
              </p>
              <Button className="mt-4" onClick={() => setAddSectionDialogOpen(true)}>
                <FolderPlus className="ml-2 h-4 w-4" />
                نضيف أول قسم
              </Button>
            </div>
          )}
    
          <PurchaseDialog
            item={itemToPurchase}
            onOpenChange={(open) => !open && setItemToPurchase(null)}
            onItemPurchased={handlePurchase}
          />
    
          <AddItemDialog
            open={isAddDialogOpen}
            onOpenChange={setAddDialogOpen}
            onItemAdded={handleAddItem}
            categories={categories}
          />
          
          <ImportDialog
            open={isImportDialogOpen}
            onOpenChange={setImportDialogOpen}
            onImportCompleted={handleImportCompleted}
          />
    
          <AddSectionDialog
            open={isAddSectionDialogOpen}
            onOpenChange={setAddSectionDialogOpen}
            onSectionAdded={handleAddSection}
          />
          
          <AddCategoryDialog
            open={isAddCategoryDialogOpen}
            onOpenChange={setAddCategoryDialogOpen}
            onCategoryAdded={handleAddCategory}
            categories={categories}
          />

          <EditItemDialog
            item={itemToEdit}
            categories={categories}
            onOpenChange={(open) => !open && setItemToEdit(null)}
            onItemUpdated={handleUpdateItem}
          />
    
          <EditCategoryDialog
            category={categoryToEdit}
            categories={categories}
            onOpenChange={(open) => !open && setCategoryToEdit(null)}
            onCategoryUpdated={handleUpdateCategory}
          />
          
          <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>متأكدين اننا هنمسح؟</AlertDialogTitle>
                <AlertDialogDescription>
                  القسم ده "{categoryToDelete?.name}" هيتمسح ومش هنعرف نرجعه تاني.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>لأ، نرجع</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCategory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  أه، نمسح
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog open={!!itemToUnpurchase} onOpenChange={(open) => !open && setItemToUnpurchase(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>متأكدين؟</AlertDialogTitle>
                <AlertDialogDescription>
                  بكده هنرجع "{itemToUnpurchase?.name}" للحاجات اللي لسه هنجيبها، وهنمسح السعر اللي سجلناه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>لأ، نرجع</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnpurchaseConfirm}
                >
                  تمام، نرجعها
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    
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
