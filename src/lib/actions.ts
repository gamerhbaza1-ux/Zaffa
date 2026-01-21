"use server";

import { revalidatePath } from "next/cache";
import type { ChecklistItem, Category } from "./types";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "اسم العنصر مطلوب."),
  categoryId: z.string({ required_error: "الفئة مطلوبة."}).min(1, "الفئة مطلوبة."),
  minPrice: z.coerce.number().min(0, "يجب أن يكون السعر رقمًا موجبًا."),
  maxPrice: z.coerce.number().min(0, "يجب أن يكون السعر رقمًا موجبًا."),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "يجب أن يكون السعر الأقصى أكبر من أو يساوي السعر الأدنى.",
  path: ["maxPrice"],
});

const categorySchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب."),
  parentId: z.string().nullable().optional(),
});

const purchaseSchema = z.object({
  itemId: z.string(),
  finalPrice: z.coerce.number().min(0, "يجب أن يكون السعر رقمًا موجبًا."),
});

// In-memory store for demonstration purposes
let categories: Category[] = [
  { id: "1", name: "أثاث", parentId: null },
  { id: "2", name: "أجهزة كهربائية", parentId: null },
  { id: "3", name: "مطبخ", parentId: null },
  { id: "4", name: "ديكور", parentId: null },
  { id: "5", name: "منسوجات", parentId: null },
  { id: "6", name: "إضاءة", parentId: null },
  { id: "7", name: "غرفة المعيشة", parentId: "1" },
];

let items: ChecklistItem[] = [
  { id: "1", name: "أريكة", categoryId: "7", minPrice: 1500, maxPrice: 3000, isPurchased: false },
  { id: "2", name: "طقم طاولة طعام", categoryId: "1", minPrice: 800, maxPrice: 1500, isPurchased: true, finalPrice: 950 },
  { id: "3", name: "هيكل سرير ومرتبة", categoryId: "1", minPrice: 1200, maxPrice: 2500, isPurchased: false },
  { id: "4", name: "ثلاجة", categoryId: "2", minPrice: 700, maxPrice: 1200, isPurchased: false },
  { id: "5", name: "غسالة", categoryId: "2", minPrice: 500, maxPrice: 900, isPurchased: true, finalPrice: 750 },
  { id: "6", name: "تلفزيون", categoryId: "2", minPrice: 400, maxPrice: 1000, isPurchased: false },
];

const simulateLatency = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getItems(): Promise<ChecklistItem[]> {
  await simulateLatency(500);
  return items;
}

export async function getCategories(): Promise<Category[]> {
  await simulateLatency(100);
  return categories;
}

export async function addCategory(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  if (rawData.parentId === 'null') {
    rawData.parentId = null;
  }
  
  const validatedFields = categorySchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  await simulateLatency(500);

  const { name, parentId } = validatedFields.data;

  const newCategory: Category = {
    id: Date.now().toString(),
    name,
    parentId: parentId || null
  };
  
  if (!categories.some(c => c.name === newCategory.name && c.parentId === newCategory.parentId)) {
    categories.unshift(newCategory);
    revalidatePath("/");
    return { success: true };
  } else {
    return {
      errors: { name: ["هذه الفئة موجودة بالفعل ضمن نفس الفئة الأصلية."] },
    };
  }
}

export async function addItem(prevState: any, formData: FormData) {
  const validatedFields = itemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  await simulateLatency(1000);

  const newItem: ChecklistItem = {
    id: Date.now().toString(),
    name: validatedFields.data.name,
    categoryId: validatedFields.data.categoryId,
    minPrice: validatedFields.data.minPrice,
    maxPrice: validatedFields.data.maxPrice,
    isPurchased: false,
  };
  items.unshift(newItem);
  revalidatePath("/");
  return { success: true };
}

export async function purchaseItem(prevState: any, formData: FormData) {
  const validatedFields = purchaseSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  await simulateLatency(500);

  const { itemId, finalPrice } = validatedFields.data;

  items = items.map(item =>
    item.id === itemId ? { ...item, isPurchased: true, finalPrice: finalPrice } : item
  );
  revalidatePath("/");
  return { success: true };
}


export async function unpurchaseItem(id: string) {
  await simulateLatency(500);
  items = items.map(item =>
    item.id === id ? { ...item, isPurchased: false, finalPrice: undefined } : item
  );
  revalidatePath("/");
}

export async function deleteItem(id: string) {
  await simulateLatency(500);
  items = items.filter(item => item.id !== id);
  revalidatePath("/");
}

export async function importItems(fileContent: string) {
  await simulateLatency(1500);
  try {
    const lines = fileContent.split('\n').slice(1); // ignore header
    const newItems: ChecklistItem[] = lines.map((line, index) => {
      const [name, minPrice, maxPrice, categoryName] = line.split(',');
      if (name && minPrice && maxPrice && categoryName) {
        const categoryNameTrimmed = categoryName.trim();
        let category = categories.find(c => c.name === categoryNameTrimmed && !c.parentId);
        if (!category) {
            category = {
                id: `cat-import-${Date.now()}-${index}`,
                name: categoryNameTrimmed,
                parentId: null
            };
            categories.unshift(category);
        }
        return {
          id: `import-${Date.now()}-${index}`,
          name: name.trim(),
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          categoryId: category.id,
          isPurchased: false,
        };
      }
      return null;
    }).filter((item): item is ChecklistItem => item !== null);

    items.unshift(...newItems);
    revalidatePath("/");
    return { success: true, count: newItems.length };
  } catch (error) {
    return { success: false, error: "فشل في تحليل الملف." };
  }
}

export async function updateCategory(prevState: any, formData: FormData) {
  const schema = z.object({
    id: z.string(),
    name: z.string().min(1, "اسم الفئة مطلوب."),
  });
  
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  await simulateLatency(500);

  const { id, name } = validatedFields.data;

  const existingCategory = categories.find(c => c.id === id);

  if (categories.some(c => c.name === name && c.parentId === existingCategory?.parentId && c.id !== id)) {
     return {
      errors: { name: ["هذه الفئة موجودة بالفعل ضمن نفس الفئة الأصلية."] },
    };
  }

  categories = categories.map(c => 
    c.id === id ? { ...c, name } : c
  );
  revalidatePath("/");
  return { success: true };
}


export async function deleteCategory(id: string) {
  await simulateLatency(500);
  
  const hasSubcategories = categories.some(c => c.parentId === id);
  const hasItems = items.some(i => i.categoryId === id);

  if (hasSubcategories || hasItems) {
    return { success: false, error: "لا يمكن حذف الفئة لأنها تحتوي على فئات فرعية أو عناصر." };
  }

  categories = categories.filter(c => c.id !== id);
  revalidatePath("/");
  return { success: true };
}
