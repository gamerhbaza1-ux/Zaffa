"use client";

import { useState, useTransition, useMemo, useCallback } from 'react';
import type { ChecklistItem, Category } from '@/lib/types';
import { deleteItem, unpurchaseItem, deleteCategory, getItems, getCategories } from '@/lib/actions';
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
import { Separator } from '@/components/ui/separator';


type ChecklistClientProps = {
  initialItems: ChecklistItem[];
  initialCategories: Category[];
};

export default function ChecklistClient({ initialItems, initialCategories }: ChecklistClientProps) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [categories, setCategories] = useState(initialCategories);

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [itemToPurchase, setItemToPurchase] = useState<ChecklistItem | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();
  
  const refreshData = async () => {
    const newItems = await getItems();
    const newCategories = await getCategories();
    setItems(newItems);
    setCategories(newCategories);
  };

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  }, []);

  const handleToggle = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.isPurchased) {
        startTransition(async () => {
          await unpurchaseItem(id);
          refreshData();
        });
      } else {
        setItemToPurchase(item);
      }
    }
  };

  const handleDeleteItem = (id: string) => {
    startTransition(async () => {
      await deleteItem(id);
      refreshData();
    });
  };
  
  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;

    startTransition(async () => {
      const result = await deleteCategory(categoryToDelete.id);
      if (result?.success) {
        toast({
          title: "تم الحذف",
          description: `تم حذف "${categoryToDelete.name}".`,
        });
        refreshData();
        setCategoryToDelete(null);
      } else {
        toast({
          variant: "destructive",
          title: "فشل الحذف",
          description: result?.error || "حدث خطأ غير متوقع.",
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
    return getCategoryDepth(category.parentId, depth + 1);
  }, [categoriesById]);

  const getDescendantCategories = useCallback((categoryId: string): Category[] => {
    const directChildren = categories.filter(c => c.parentId === categoryId);
    let allDescendants: Category[] = [...directChildren];
    directChildren.forEach(child => {
        allDescendants = [...allDescendants, ...getDescendantCategories(child.id)];
    });
    return allDescendants;
  }, [categories]);

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
            <ListPlus className="ml-2 h-4 w-4" /> إضافة قسم/فئة
          </Button>
        </div>
        <ProgressSummary purchasedCount={purchasedCount} totalCount={totalCount} />
      </div>

      {totalCount > 0 ? (
        <Tabs defaultValue={topLevelCategories[0]?.id} className="w-full" dir="rtl">
            <TabsList className="flex flex-wrap w-full h-auto justify-start">
                {topLevelCategories.map(category => (
                    <TabsTrigger key={category.id} value={category.id} className="flex-grow">
                        <span className="truncate">{category.name}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
            {topLevelCategories.map(topLevelCategory => {
                const descendantCats = getDescendantCategories(topLevelCategory.id);
                const allSubCategoryIds = [topLevelCategory.id, ...descendantCats.map(c => c.id)];
                const itemsInTab = items.filter(item => allSubCategoryIds.includes(item.categoryId));

                const sortedSubCats = categories
                  .filter(c => c.parentId === topLevelCategory.id)
                  .sort((a,b) => a.name.localeCompare(b.name));
                
                const totalExpectedInTab = itemsInTab.reduce((sum, item) => !item.isPurchased ? sum + (item.minPrice + item.maxPrice) / 2 : sum, 0);
                const totalPaidInTab = itemsInTab.reduce((sum, item) => item.isPurchased && typeof item.finalPrice === 'number' ? sum + item.finalPrice : sum, 0);
                
                const renderCategoryTree = (categoryId: string) => {
                    const category = categoriesById.get(categoryId);
                    if (!category) return null;

                    const subCatItems = items.filter(i => i.categoryId === category.id);
                    const children = categories.filter(c => c.parentId === category.id).sort((a,b) => a.name.localeCompare(b.name));
                    const level = getCategoryDepth(category.id);

                    const expectedInSubCat = subCatItems.reduce((sum, item) => !item.isPurchased ? sum + (item.minPrice + item.maxPrice) / 2 : sum, 0);
                    const paidInSubCat = subCatItems.reduce((sum, item) => item.isPurchased && typeof item.finalPrice === 'number' ? sum + item.finalPrice : sum, 0);

                    return (
                        <div key={category.id} style={{ paddingRight: level > 0 ? `${level * 1.5}rem` : undefined }}>
                            <div className="flex justify-between items-center border-b pb-2 mb-3">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-lg">{category.name}</h3>
                                    {(expectedInSubCat > 0 || paidInSubCat > 0) && (
                                        <div className="text-sm text-muted-foreground font-normal flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span>المتوقع: {formatPrice(expectedInSubCat)}</span>
                                            <span>المدفوع: {formatPrice(paidInSubCat)}</span>
                                        </div>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                            <MoreVertical className="h-4 w-4" />
                                            <span className="sr-only">إجراءات {category.name}</span>
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
                            {subCatItems.length > 0 && (
                                <div className="space-y-2">
                                    {subCatItems.map(item => (
                                        <ItemCard
                                            key={item.id}
                                            item={item}
                                            onToggle={() => handleToggle(item.id)}
                                            onDelete={() => handleDeleteItem(item.id)}
                                            isPending={isPending && (item.id === itemToPurchase?.id)}
                                        />
                                    ))}
                                </div>
                            )}
                             {children.length > 0 && (
                                <div className="mt-4 space-y-4">
                                    {children.map(child => renderCategoryTree(child.id))}
                                </div>
                            )}
                        </div>
                    );
                };

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
                                
                                {sortedSubCats.length > 0 ? (
                                    <div className="space-y-6">
                                      {sortedSubCats.map(cat => renderCategoryTree(cat.id))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-10">
                                        لا توجد فئات في هذا القسم بعد.
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
        onItemPurchased={refreshData}
      />

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={refreshData}
        categories={categories}
      />
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportCompleted={refreshData}
      />

      <AddCategoryDialog
        open={isAddCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onCategoryAdded={refreshData}
        categories={categories}
      />

      <EditCategoryDialog
        category={categoryToEdit}
        categories={categories}
        onOpenChange={(open) => !open && setCategoryToEdit(null)}
        onCategoryUpdated={refreshData}
      />
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف "{categoryToDelete?.name}". هذا الإجراء لا يمكن التراجع عنه. لن يتم الحذف إلا إذا كان القسم/الفئة فارغًا (لا يحتوي على عناصر أو فئات فرعية).
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
