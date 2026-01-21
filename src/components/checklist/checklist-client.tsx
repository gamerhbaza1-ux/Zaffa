"use client";

import { useState, useTransition, useMemo, useCallback } from 'react';
import type { ChecklistItem, Category } from '@/lib/types';
import { deleteItem, unpurchaseItem, deleteCategory } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Plus, Upload, ListPlus, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { ItemCard } from './item-card';
import { ProgressSummary } from './progress-summary';
import { AddItemDialog } from './add-item-dialog';
import { ImportDialog } from './import-dialog';
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


type ChecklistClientProps = {
  initialItems: ChecklistItem[];
  initialCategories: Category[];
};

export default function ChecklistClient({ initialItems, initialCategories }: ChecklistClientProps) {
  const [isPending, startTransition] = useTransition();
  const items = initialItems;

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [itemToPurchase, setItemToPurchase] = useState<ChecklistItem | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  }, []);

  const handleToggle = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.isPurchased) {
        startTransition(() => {
          unpurchaseItem(id);
        });
      } else {
        setItemToPurchase(item);
      }
    }
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      deleteItem(id);
    });
  };
  
  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;

    startTransition(async () => {
      const result = await deleteCategory(categoryToDelete.id);
      if (result?.success) {
        toast({
          title: "تم الحذف",
          description: `تم حذف فئة "${categoryToDelete.name}".`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "فشل الحذف",
          description: result?.error || "حدث خطأ غير متوقع.",
        });
      }
      setCategoryToDelete(null);
    });
  };

  const purchasedCount = items.filter(item => item.isPurchased).length;
  const totalCount = items.length;

  const categoriesById = useMemo(() => new Map(initialCategories.map(c => [c.id, c])), [initialCategories]);

  const topLevelCategories = useMemo(() => {
    return initialCategories.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
  }, [initialCategories]);

  const getTopLevelParentId = useCallback((catId: string): string => {
    let current = categoriesById.get(catId);
    if (!current) return catId;
    while (current.parentId && categoriesById.has(current.parentId)) {
      current = categoriesById.get(current.parentId)!;
    }
    return current.id;
  }, [categoriesById]);
  
  const itemsByTopLevelCategory = useMemo(() => {
    const grouped: { [key: string]: ChecklistItem[] } = {};
    for (const item of items) {
      const topLevelId = getTopLevelParentId(item.categoryId);
      if (!grouped[topLevelId]) {
        grouped[topLevelId] = [];
      }
      grouped[topLevelId].push(item);
    }
    // Also add empty arrays for top level categories that have no items yet
    for (const cat of topLevelCategories) {
        if (!grouped[cat.id]) {
            grouped[cat.id] = [];
        }
    }
    return grouped;
  }, [items, topLevelCategories, getTopLevelParentId]);


  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="ml-2 h-4 w-4" /> إضافة عنصر
          </Button>
          <Button variant="secondary" onClick={() => setImportDialogOpen(true)}>
            <Upload className="ml-2 h-4 w-4" /> استيراد
          </Button>
          <Button variant="outline" onClick={() => setAddCategoryDialogOpen(true)}>
            <ListPlus className="ml-2 h-4 w-4" /> إضافة فئة
          </Button>
        </div>
        <ProgressSummary purchasedCount={purchasedCount} totalCount={totalCount} />
      </div>

      {items.length > 0 ? (
        <Tabs defaultValue={topLevelCategories[0]?.id} className="w-full" dir="rtl">
            <TabsList className="flex flex-wrap w-full h-auto justify-start">
                {topLevelCategories.map(category => (
                    <TabsTrigger key={category.id} value={category.id} className="flex-grow">
                        <span className="truncate">{category.name}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
            {topLevelCategories.map(category => {
                const itemsInTab = itemsByTopLevelCategory[category.id] || [];
                
                const itemsBySubCategory = itemsInTab.reduce((acc, item) => {
                    (acc[item.categoryId] = acc[item.categoryId] || []).push(item);
                    return acc;
                }, {} as {[key: string]: ChecklistItem[]});

                const subCategoryIds = Object.keys(itemsBySubCategory);
                
                const getCategoryDepth = (catId: string) => {
                    let depth = 0;
                    let current = categoriesById.get(catId);
                    while(current && current.parentId) {
                        depth++;
                        current = categoriesById.get(current.parentId);
                    }
                    return depth;
                }

                subCategoryIds.sort((a, b) => {
                    const depthA = getCategoryDepth(a);
                    const depthB = getCategoryDepth(b);
                    if (depthA !== depthB) return depthA - depthB;
                    return (categoriesById.get(a)?.name || '').localeCompare(categoriesById.get(b)?.name || '');
                });

                const expectedInTab = itemsInTab.reduce((sum, item) => !item.isPurchased ? sum + (item.minPrice + item.maxPrice) / 2 : sum, 0);
                const paidInTab = itemsInTab.reduce((sum, item) => item.isPurchased && typeof item.finalPrice === 'number' ? sum + item.finalPrice : sum, 0);


                return (
                    <TabsContent key={category.id} value={category.id} className="mt-4">
                         <div className="flex justify-between items-center mb-2 gap-4">
                            <div className="text-sm text-muted-foreground font-normal flex gap-4 p-1">
                                <span>الإجمالي المتوقع: {formatPrice(expectedInTab)}</span>
                                <span>الإجمالي المدفوع: {formatPrice(paidInTab)}</span>
                            </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                      <MoreVertical className="h-4 w-4" />
                                       <span className="sr-only">إجراءات الفئة</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setCategoryToEdit(category)}>
                                        <Pencil className="ml-2 h-4 w-4" />
                                        <span>تعديل</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setCategoryToDelete(category)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="ml-2 h-4 w-4" />
                                        <span>حذف</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Card>
                            <CardContent className="p-4 space-y-6">
                                {itemsInTab.length > 0 ? (
                                    subCategoryIds.map(subCatId => {
                                        const subCatItems = itemsBySubCategory[subCatId];
                                        const subCat = categoriesById.get(subCatId);
                                        const level = getCategoryDepth(subCatId);
                                        return (
                                            <div key={subCatId}>
                                                <h3 className="font-bold text-lg mb-3 border-b pb-2" style={{
                                                     marginRight: level > 0 ? `${level}rem` : undefined,
                                                }}>
                                                    {subCat?.name}
                                                </h3>
                                                <div className="space-y-2">
                                                {subCatItems.map(item => (
                                                     <ItemCard
                                                        key={item.id}
                                                        item={item}
                                                        onToggle={() => handleToggle(item.id)}
                                                        onDelete={() => handleDelete(item.id)}
                                                        isPending={isPending}
                                                    />
                                                ))}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-center py-10">
                                        لا توجد عناصر في هذه الفئة بعد.
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
            <h3 className="text-lg font-medium text-foreground">قائمة المراجعة الخاصة بك فارغة!</h3>
            <p className="text-muted-foreground mt-1">
              ابدأ بإضافة عنصر تحتاجه لمنزلك الجديد.
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              أضف أول عنصر لك
            </Button>
          </div>
      )}

      <PurchaseDialog
        item={itemToPurchase}
        onOpenChange={(open) => {
          if (!open) {
            setItemToPurchase(null);
          }
        }}
      />

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={() => { /* revalidation is handled by server action */ }}
        categories={initialCategories}
      />
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <AddCategoryDialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onCategoryAdded={() => { /* revalidation is handled by server action */ }}
        categories={initialCategories}
      />

      <EditCategoryDialog
        category={categoryToEdit}
        onOpenChange={(open) => !open && setCategoryToEdit(null)}
        onCategoryUpdated={() => { /* revalidation is handled by server action */ }}
      />
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف فئة "{categoryToDelete?.name}". لا يمكن التراجع عن هذا الإجراء. لن يتم حذف الفئات إلا إذا كانت فارغة (لا تحتوي على عناصر أو فئات فرعية).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
