"use client";

import { useState, useTransition, useMemo, useCallback } from 'react';
import type { ChecklistItem, Category } from '@/lib/types';
import { deleteItem, unpurchaseItem, deleteCategory } from '@/lib/actions';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Plus, Upload, ListPlus, MoreVertical, Pencil, Trash2, Loader2, FolderPlus } from 'lucide-react';
import { ItemCard } from './item-card';
import { ProgressSummary } from './progress-summary';
import { AddItemDialog } from './add-item-dialog';
import { ImportDialog } from './import-dialog';
import { AddSectionDialog } from './add-section-dialog';
import { AddCategoryDialog } from './add-category-dialog';
import { EditCategoryDialog } from './edit-category-dialog';
import { PurchaseDialog } from './purchase-dialog';
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

export default function ChecklistClient() {
  const { isProfileLoading, household, isHouseholdLoading } = useUser();
  const firestore = useFirestore();

  const householdId = household?.id;

  const categoriesQuery = useMemo(() => {
    if (!householdId || !firestore) return null;
    return collection(firestore, `households/${householdId}/categories`);
  }, [firestore, householdId]);

  const itemsQuery = useMemo(() => {
    if (!householdId || !firestore) return null;
    return collection(firestore, `households/${householdId}/checklistItems`);
  }, [firestore, householdId]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const categories = categoriesData || [];
  const { data: itemsData, isLoading: isLoadingItems } = useCollection<ChecklistItem>(itemsQuery);
  const items = itemsData || [];

  const [isPending, startTransition] = useTransition();

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [itemToPurchase, setItemToPurchase] = useState<ChecklistItem | null>(null);
  const [itemToUnpurchase, setItemToUnpurchase] = useState<ChecklistItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();
  
  const refreshData = useCallback(() => {
    // Revalidation is handled by server actions
  }, []);

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

  const handleUnpurchaseConfirm = () => {
    if (!itemToUnpurchase || !householdId) return;

    startTransition(async () => {
      await unpurchaseItem(householdId, itemToUnpurchase.id);
      toast({
        title: "رجعناها القائمة",
        description: `رجعنا "${itemToUnpurchase.name}" للحاجات اللي لسه هنجيبها.`,
      });
      setItemToUnpurchase(null);
    });
  };

  const handleDeleteItemConfirm = () => {
    if (!itemToDelete || !householdId) return;
    startTransition(async () => {
      await deleteItem(householdId, itemToDelete.id);
      toast({
        title: "اتمسحت",
        description: `مسحنا الحاجة "${itemToDelete.name}".`,
      });
      setItemToDelete(null);
    });
  };
  
  const handleDeleteCategory = () => {
    if (!categoryToDelete || !householdId) return;

    startTransition(async () => {
      const result = await deleteCategory(householdId, categoryToDelete.id);
      if (result?.success) {
        toast({
          title: "اتمسحت",
          description: `مسحنا "${categoryToDelete.name}".`,
        });
        setCategoryToDelete(null);
      } else {
        toast({
          variant: "destructive",
          title: "معرفناش نمسح",
          description: result?.error || "حصلت مشكلة.",
        });
      }
    });
  };

  const purchasedCount = useMemo(() => items.filter(item => item.isPurchased).length, [items]);
  const totalCount = items.length;

  const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const topLevelCategories = useMemo(() => {
    return categories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);
  
  const getCategoryDepth = useCallback((catId: string, depth = 0): number => {
    const category = categoriesById.get(catId);
    if (!category || !category.parentId) {
      return depth;
    }
    const parent = categoriesById.get(category.parentId);
    if(!parent?.parentId) return depth;

    return getCategoryDepth(category.parentId, depth + 1);
  }, [categoriesById]);

  if (isLoadingCategories || isLoadingItems || isProfileLoading || isHouseholdLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!householdId) {
    return (
        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-foreground">خطأ في تحميل بيانات الأسرة.</h3>
            <p className="text-muted-foreground mt-1">
              من فضلك حاول تسجل خروج وترجع تاني.
            </p>
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
        </div>
        <ProgressSummary purchasedCount={purchasedCount} totalCount={totalCount} />
      </div>

      {totalCount > 0 || categories.length > 0 ? (
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
                                                    isPending={isPending}
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
                            <CardContent className="p-4 space-y-6">
                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <div className="text-sm text-muted-foreground font-normal flex flex-wrap gap-x-4 gap-y-1 p-1">
                                        <span>إجمالي المتوقع في القسم: {formatPrice(totalExpectedInTab)}</span>
                                        <span>إجمالي المدفوع في القسم: {formatPrice(totalPaidInTab)}</span>
                                    </div>
                                </div>
                                
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
              يلا نبدأ نضيف الحاجات اللي محتاجينها لبيتنا الجديد.
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              نضيف أول حاجة
            </Button>
          </div>
      )}

      <PurchaseDialog
        item={itemToPurchase}
        householdId={householdId}
        onOpenChange={(open) => {
          if (!open) {
            setItemToPurchase(null);
          }
        }}
        onItemPurchased={refreshData}
      />

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={refreshData}
        categories={categories}
        householdId={householdId}
      />
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportCompleted={refreshData}
        householdId={householdId}
      />

      <AddSectionDialog
        open={isAddSectionDialogOpen}
        onOpenChange={setAddSectionDialogOpen}
        onSectionAdded={refreshData}
        householdId={householdId}
      />
      
      <AddCategoryDialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onCategoryAdded={refreshData}
        categories={categories}
        householdId={householdId}
      />

      <EditCategoryDialog
        category={categoryToEdit}
        categories={categories}
        householdId={householdId}
        onOpenChange={(open) => !open && setCategoryToEdit(null)}
        onCategoryUpdated={refreshData}
      />
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>متأكدين اننا هنمسح؟</AlertDialogTitle>
            <AlertDialogDescription>
              القسم ده "{categoryToDelete?.name}" هيتمسح ومش هنعرف نرجعه تاني. مش هينفع يتمسح لو جواه فئات تانية أو حاجات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لأ، نرجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : "أه، نمسح"}
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
              disabled={isPending}
            >
              {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : "تمام، نرجعها"}
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
              disabled={isPending}
            >
              {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : "أه، نمسح"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
