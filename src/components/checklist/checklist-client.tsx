"use client";

import { useState, useMemo, useCallback } from 'react';
import type { ChecklistItem, Category } from '@/lib/types';
import { nanoid } from 'nanoid';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { Button } from '@/components/ui/button';
import { Plus, Upload, ListPlus, MoreVertical, Pencil, Trash2, FolderPlus } from 'lucide-react';
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
  const [categories, setCategories] = useLocalStorage<Category[]>('zaffa-categories', []);
  const [items, setItems] = useLocalStorage<ChecklistItem[]>('zaffa-items', []);

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
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, isPurchased: true, finalPrice } : item));
    toast({
        title: "تمام!",
        description: "علمنا على الحاجة دي انها اتجابت خلاص.",
    });
    setItemToPurchase(null);
  }

  const handleUnpurchaseConfirm = () => {
    if (!itemToUnpurchase) return;
    const itemName = itemToUnpurchase.name;
    setItems(prev => prev.map(item => item.id === itemToUnpurchase.id ? { ...item, isPurchased: false, finalPrice: undefined } : item));
    toast({
        title: "رجعناها القائمة",
        description: `رجعنا "${itemName}" للحاجات اللي لسه هنجيبها.`,
    });
    setItemToUnpurchase(null);
  };

  const handleDeleteItemConfirm = () => {
    if (!itemToDelete) return;
    const itemName = itemToDelete.name;
    setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
    toast({
        title: "اتمسحت",
        description: `مسحنا الحاجة "${itemName}".`,
    });
    setItemToDelete(null);
  };

  const handleAddSection = (name: string) => {
    if (categories.some(c => c.parentId === null && c.name.toLowerCase() === name.toLowerCase())) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'القسم ده موجود قبل كده.'});
      return false;
    }
    const newSection: Category = { id: nanoid(), name, parentId: null };
    setCategories(prev => [...prev, newSection]);
    toast({ title: 'تمام!', description: 'ضفنا القسم الجديد.' });
    setAddSectionDialogOpen(false);
    return true;
  }

  const handleAddCategory = (name: string, parentId: string) => {
      if (categories.some(c => c.parentId === parentId && c.name.toLowerCase() === name.toLowerCase())) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الفئة دي موجودة قبل كده في نفس المكان.'});
        return false;
    }
    const newCategory: Category = { id: nanoid(), name, parentId };
    setCategories(prev => [...prev, newCategory]);
    toast({ title: 'تمام!', description: 'ضفنا الفئة الجديدة.' });
    setAddCategoryDialogOpen(false);
    return true;
  }
  
  const handleUpdateCategory = (id: string, name: string, parentId: string | null) => {
      let currentParentId = parentId;
      while(currentParentId) {
          if (currentParentId === id) {
              toast({ variant: 'destructive', title: 'خطأ', description: 'مينفعش تخلي الفئة تبع نفسها.' });
              return false;
          }
          const parent = categories.find(c => c.id === currentParentId);
          currentParentId = parent?.parentId || null;
      }

      setCategories(prev => prev.map(c => c.id === id ? { ...c, name, parentId } : c));
      toast({ title: 'تمام!', description: 'حدثنا القسم/الفئة.' });
      setCategoryToEdit(null);
      return true;
  }

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    const hasChildren = categories.some(c => c.parentId === categoryToDelete.id);
    if(hasChildren) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'مينفعش نمسحها عشان جواها فئات تانية.' });
        return;
    }

    const hasItems = items.some(i => i.categoryId === categoryToDelete.id);
    if(hasItems) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'مينفعش نمسحها عشان جواها حاجات.' });
        return;
    }
    const categoryName = categoryToDelete.name;
    setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
    toast({ title: 'اتمسحت', description: `مسحنا "${categoryName}".` });
    setCategoryToDelete(null);
  };

  const handleImportCompleted = (importedData: { section: string; category: string; name: string; minPrice: number; maxPrice: number }[]) => {
    let currentCategories = [...categories];
    let currentItems = [...items];

    const getOrCreateCategory = (name: string, parentId: string | null): Category => {
        const lowerName = name.toLowerCase();
        const existing = currentCategories.find(c => c.name.toLowerCase() === lowerName && c.parentId === parentId);
        if (existing) {
            return existing;
        }

        const newCategory: Category = {
            id: nanoid(),
            name,
            parentId,
        };
        currentCategories.push(newCategory);
        return newCategory;
    };

    for (const record of importedData) {
        if (!record.section || !record.category || !record.name) continue;

        const section = getOrCreateCategory(record.section, null);
        const category = getOrCreateCategory(record.category, section.id);
        
        currentItems.push({
            id: nanoid(),
            name: record.name,
            categoryId: category.id,
            minPrice: record.minPrice,
            maxPrice: record.maxPrice,
            isPurchased: false,
        });
    }
    
    setCategories([...currentCategories]);
    setItems([...currentItems]);

    toast({
        title: "تمام!",
        description: `تم استيراد ${importedData.length} حاجة بنجاح.`,
    });
    setImportDialogOpen(false);
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
        onItemAdded={(newItem) => {
            setItems(prev => [...prev, { ...newItem, id: nanoid(), isPurchased: false }]);
            toast({ title: 'تمام!', description: 'ضفنا الحاجة الجديدة.'});
            setAddDialogOpen(false);
        }}
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
