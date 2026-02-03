"use server";

import { revalidatePath } from "next/cache";
import type { ChecklistItem, Category } from "./types";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم الحاجة."),
  categoryId: z.string({ required_error: "لازم نختار فئة."}).min(1, "لازم نختار فئة."),
  minPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  maxPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "أقصى سعر لازم يكون أكبر من أو بيساوي أقل سعر.",
  path: ["maxPrice"],
});

const categorySchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم القسم أو الفئة."),
  parentId: z.string().nullable().optional(),
});

const purchaseSchema = z.object({
  itemId: z.string(),
  finalPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
});

// In-memory store for demonstration purposes
let categories: Category[] = [];
let items: ChecklistItem[] = [];

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
      errors: { name: ["الاسم ده موجود قبل كده في نفس المكان."] },
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

export async function importItems(prevState: any, formData: FormData) {
  await simulateLatency(1500);

  const fileContent = formData.get('fileContent') as string | null;
  const mappingStr = formData.get('mapping') as string | null;

  if (!fileContent || !mappingStr) {
    return { error: "بيانات ناقصة، حاول تاني." };
  }

  try {
    const mapping = JSON.parse(mappingStr);
    const requiredKeys = ['section', 'category', 'name'];
    if (!requiredKeys.every(key => key in mapping)) {
      return { error: "لازم نربط كل الحقول المطلوبة." };
    }

    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return { error: "الملف فاضي أو فيه صف واحد بس." };
    }

    const headerLine = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    const indices = {
      section: headerLine.indexOf(mapping.section),
      category: headerLine.indexOf(mapping.category),
      name: headerLine.indexOf(mapping.name),
      minPrice: (mapping.minPrice && mapping.minPrice !== 'none') ? headerLine.indexOf(mapping.minPrice) : -1,
      maxPrice: (mapping.maxPrice && mapping.maxPrice !== 'none') ? headerLine.indexOf(mapping.maxPrice) : -1,
    };

    if (indices.section === -1 || indices.category === -1 || indices.name === -1) {
      return { error: "فيه أعمدة مطلوبة مش مربوطة صح. اتأكد من الربط." };
    }

    const newItems: ChecklistItem[] = [];

    dataLines.forEach((line, lineIndex) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      const sectionName = values[indices.section];
      const categoryName = values[indices.category];
      const itemName = values[indices.name];

      if (!sectionName || !categoryName || !itemName) {
        return; // Skip incomplete rows for required fields
      }

      const minPriceStr = indices.minPrice !== -1 ? values[indices.minPrice] : '0';
      const maxPriceStr = indices.maxPrice !== -1 ? values[indices.maxPrice] : '0';
      
      let minPrice = parseFloat(minPriceStr);
      let maxPrice = parseFloat(maxPriceStr);

      if (isNaN(minPrice)) minPrice = 0;
      if (isNaN(maxPrice)) maxPrice = 0;
      
      if (maxPrice < minPrice) {
        maxPrice = minPrice;
      }

      // Find or create section
      let section = categories.find(c => c.name.toLowerCase() === sectionName.toLowerCase() && c.parentId === null);
      if (!section) {
        section = { id: `s-import-${Date.now()}-${lineIndex}`, name: sectionName, parentId: null };
        categories.unshift(section);
      }

      // Find or create category under that section
      let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase() && c.parentId === section!.id);
      if (!category) {
        category = { id: `c-import-${Date.now()}-${lineIndex}`, name: categoryName, parentId: section.id };
        categories.unshift(category);
      }
      
      const newItem: ChecklistItem = {
        id: `i-import-${Date.now()}-${lineIndex}`,
        name: itemName,
        categoryId: category.id,
        minPrice,
        maxPrice,
        isPurchased: false,
      };
      
      newItems.push(newItem);
    });
    
    if (newItems.length > 0) {
      items.unshift(...newItems);
    }
    
    revalidatePath("/");
    return { success: true, count: newItems.length };

  } catch (e) {
    const message = e instanceof Error ? e.message : "An unknown error occurred";
    console.error("Import failed:", message);
    return { error: "حصلت مشكلة واحنا بنعالج الملف. اتأكد انه ملف CSV صحيح." };
  }
}

export async function updateCategory(prevState: any, formData: FormData) {
  const schema = z.object({
    id: z.string(),
    name: z.string().min(1, "الاسم مطلوب."),
    parentId: z.string().nullable().optional(),
  });
  
  const rawData = Object.fromEntries(formData.entries());
    if (rawData.parentId === 'null') {
    rawData.parentId = null;
  }
  const validatedFields = schema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  await simulateLatency(500);

  const { id, name, parentId } = validatedFields.data;
  const newParentId = parentId || null;

  if (categories.some(c => c.name === name && c.parentId === newParentId && c.id !== id)) {
     return {
      errors: { name: ["الاسم ده موجود قبل كده في نفس المكان."] },
    };
  }

  // Prevent making a category its own child/descendant
  let currentParentId = newParentId;
  while(currentParentId) {
      if (currentParentId === id) {
          return {
              errors: { parentId: ["مينفعش نخلي الفئة تبع نفسها."] },
          };
      }
      currentParentId = categories.find(c => c.id === currentParentId)?.parentId || null;
  }


  categories = categories.map(c => 
    c.id === id ? { ...c, name, parentId: newParentId } : c
  );
  revalidatePath("/");
  return { success: true };
}


export async function deleteCategory(id: string) {
  await simulateLatency(500);
  
  const hasSubcategories = categories.some(c => c.parentId === id);
  const hasItems = items.some(i => i.categoryId === id);

  if (hasSubcategories || hasItems) {
    return { success: false, error: "مينفعش نمسحها عشان جواها حاجات تانية." };
  }

  categories = categories.filter(c => c.id !== id);
  revalidatePath("/");
  return { success: true };
}
