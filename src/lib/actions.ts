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
let categories: Category[] = [
  // === الأقسام الرئيسية ===
  { id: "1", name: "عفش", parentId: null },
  { id: "2", name: "أجهزة كهربائية", parentId: null },
  { id: "3", name: "مطبخ", parentId: null },
  { id: "4", name: "ديكور", parentId: null },
  { id: "5", name: "منسوجات", parentId: null },
  { id: "6", name: "إضاءة", parentId: null },
  { id: "100", name: "أدوات تنظيف", parentId: null },
  { id: "101", name: "مستلزمات الحمام", parentId: null },

  // === الفئات التابعة ===

  // --- فئات الأثاث (قسم 1) ---
  { id: "7", name: "غرفة المعيشة", parentId: "1" },
  { id: "8", name: "غرفة الطعام", parentId: "1" },
  { id: "9", name: "غرفة النوم", parentId: "1" },
  { id: "102", name: "أثاث مكتبي", parentId: "1" },
  { id: "103", name: "أثاث خارجي", parentId: "1" },

  // --- فئات الأجهزة الكهربائية (قسم 2) ---
  { id: "10", name: "أجهزة مطبخ كبيرة", parentId: "2" },
  { id: "11", name: "أجهزة ترفيهية", parentId: "2" },
  { id: "104", name: "أجهزة مطبخ صغيرة", parentId: "2" },
  { id: "105", name: "أجهزة العناية الشخصية", parentId: "2" },
  { id: "106", name: "أجهزة تنظيف", parentId: "2" },

  // --- فئات المطبخ (قسم 3) ---
  { id: "12", name: "أدوات طهي", parentId: "3" },
  { id: "107", name: "أدوات مائدة وتقديم", parentId: "3" },
  { id: "108", name: "أدوات تخزين طعام", parentId: "3" },

  // --- فئات الديكور (قسم 4) ---
  { id: "13", name: "تحف ولوحات", parentId: "4" },
  { id: "109", name: "نباتات داخلية", parentId: "4" },
  { id: "110", name: "شموع ومعطرات جو", parentId: "4" },

  // --- فئات المنسوجات (قسم 5) ---
  { id: "14", name: "ستائر وسجاد", parentId: "5" },
  { id: "111", name: "مفروشات سرير", parentId: "5" },
  { id: "112", name: "مفروشات حمام", parentId: "5" },
  { id: "113", name: "مفارش طاولة", parentId: "5" },

  // --- فئات الإضاءة (قسم 6) ---
  { id: "15", name: "نجف وأبجورات", parentId: "6" },
  { id: "114", name: "إضاءة سقف", parentId: "6" },
  { id: "115", name: "إضاءة جدارية", parentId: "6" },
  
  // --- فئات أدوات تنظيف (قسم 100) ---
  { id: "116", name: "مواد تنظيف", parentId: "100" },
  { id: "117", name: "أدوات يدوية للتنظيف", parentId: "100" },

  // --- فئات مستلزمات الحمام (قسم 101) ---
  { id: "118", name: "اكسسوارات الحمام", parentId: "101" },
  { id: "119", name: "تخزين الحمام", parentId: "101" },
];


let items: ChecklistItem[] = [
  // --- عناصر غرفة المعيشة (فئة 7) ---
  { id: "1", name: "كنبة", categoryId: "7", minPrice: 15000, maxPrice: 30000, isPurchased: false },
  { id: "1-1", name: "كرسي بذراعين (فوتيه)", categoryId: "7", minPrice: 4000, maxPrice: 8000, isPurchased: false },
  { id: "1-2", name: "طاولة قهوة", categoryId: "7", minPrice: 2000, maxPrice: 5000, isPurchased: true, finalPrice: 2200 },
  { id: "1-3", name: "وحدة تلفزيون", categoryId: "7", minPrice: 3000, maxPrice: 7000, isPurchased: false },

  // --- عناصر غرفة الطعام (فئة 8) ---
  { id: "2", name: "طقم طاولة طعام (6 كراسي)", categoryId: "8", minPrice: 8000, maxPrice: 15000, isPurchased: true, finalPrice: 9500 },
  { id: "2-1", name: "بوفيه", categoryId: "8", minPrice: 5000, maxPrice: 10000, isPurchased: false },

  // --- عناصر غرفة النوم (فئة 9) ---
  { id: "3", name: "هيكل سرير ومرتبة", categoryId: "9", minPrice: 12000, maxPrice: 25000, isPurchased: false },
  { id: "3-1", name: "2 كومود", categoryId: "9", minPrice: 2000, maxPrice: 4000, isPurchased: false },
  { id: "3-2", name: "تسريحة بمرآة", categoryId: "9", minPrice: 4000, maxPrice: 8000, isPurchased: false },
  { id: "3-3", name: "خزانة ملابس (دولاب)", categoryId: "9", minPrice: 10000, maxPrice: 20000, isPurchased: false },

  // --- عناصر أثاث مكتبي (فئة 102) ---
  { id: "20", name: "مكتب", categoryId: "102", minPrice: 2500, maxPrice: 6000, isPurchased: false },
  { id: "21", name: "كرسي مكتب مريح", categoryId: "102", minPrice: 1500, maxPrice: 4000, isPurchased: true, finalPrice: 1800 },
  { id: "22", name: "وحدة أرفف للكتب", categoryId: "102", minPrice: 1000, maxPrice: 3000, isPurchased: false },
  
  // --- عناصر أثاث خارجي (فئة 103) ---
  { id: "23", name: "طقم جلوس للبلكونة", categoryId: "103", minPrice: 3000, maxPrice: 7000, isPurchased: false },

  // --- عناصر أجهزة مطبخ كبيرة (فئة 10) ---
  { id: "4", name: "ثلاجة", categoryId: "10", minPrice: 15000, maxPrice: 30000, isPurchased: false },
  { id: "5", name: "غسالة ملابس", categoryId: "10", minPrice: 10000, maxPrice: 20000, isPurchased: true, finalPrice: 12500 },
  { id: "5-1", name: "بوتاجاز وفرن", categoryId: "10", minPrice: 8000, maxPrice: 15000, isPurchased: false },
  { id: "5-2", name: "غسالة أطباق", categoryId: "10", minPrice: 9000, maxPrice: 18000, isPurchased: false },
  { id: "5-3", name: "شفاط بوتاجاز", categoryId: "10", minPrice: 1500, maxPrice: 4000, isPurchased: false },
  
  // --- عناصر أجهزة ترفيهية (فئة 11) ---
  { id: "6", name: "تلفزيون ذكي 55 بوصة", categoryId: "11", minPrice: 10000, maxPrice: 20000, isPurchased: false },
  { id: "6-1", name: "نظام صوتي (ساوند بار)", categoryId: "11", minPrice: 2000, maxPrice: 5000, isPurchased: false },

  // --- عناصر أجهزة مطبخ صغيرة (فئة 104) ---
  { id: "24", name: "ميكروويف", categoryId: "104", minPrice: 2000, maxPrice: 5000, isPurchased: false },
  { id: "25", name: "خلاط (بلندر)", categoryId: "104", minPrice: 800, maxPrice: 2000, isPurchased: true, finalPrice: 900 },
  { id: "26", name: "محضر طعام", categoryId: "104", minPrice: 1500, maxPrice: 4000, isPurchased: false },
  { id: "27", name: "ماكينة قهوة", categoryId: "104", minPrice: 1000, maxPrice: 3500, isPurchased: false },
  { id: "28", name: "غلاية مياه كهربائية (كاتل)", categoryId: "104", minPrice: 400, maxPrice: 1000, isPurchased: false },

  // --- عناصر أدوات طهي (فئة 12) ---
  { id: "30", name: "طقم حلل (ستانلس)", categoryId: "12", minPrice: 2000, maxPrice: 5000, isPurchased: false },
  { id: "31", name: "طقم طاسات (غير لاصقة)", categoryId: "12", minPrice: 1000, maxPrice: 2500, isPurchased: false },
  { id: "32", name: "صواني فرن", categoryId: "12", minPrice: 500, maxPrice: 1200, isPurchased: false },

  // --- عناصر أدوات مائدة وتقديم (فئة 107) ---
  { id: "33", name: "طقم أطباق (24 قطعة)", categoryId: "107", minPrice: 1500, maxPrice: 4000, isPurchased: false },
  { id: "34", name: "طقم أكواب ماء وعصير", categoryId: "107", minPrice: 300, maxPrice: 800, isPurchased: false },
  { id: "35", name: "طقم فناجين قهوة وشاي", categoryId: "107", minPrice: 400, maxPrice: 1000, isPurchased: false },
  { id: "36", name: "طقم أدوات مائدة (شوك وسكاكين)", categoryId: "107", minPrice: 500, maxPrice: 1500, isPurchased: false },
  
  // --- عناصر تحف ولوحات (فئة 13) ---
  { id: "40", name: "لوحات فنية جدارية", categoryId: "13", minPrice: 800, maxPrice: 3000, isPurchased: false },
  { id: "41", name: "فازات ديكور", categoryId: "13", minPrice: 400, maxPrice: 1000, isPurchased: false },

  // --- عناصر ستائر وسجاد (فئة 14) ---
  { id: "42", name: "سجادة غرفة معيشة", categoryId: "14", minPrice: 2000, maxPrice: 5000, isPurchased: false },
  { id: "43", name: "ستائر لغرفة النوم (بلاك أوت)", categoryId: "14", minPrice: 1000, maxPrice: 2500, isPurchased: false },

  // --- عناصر نجف وأبجورات (فئة 15) ---
  { id: "44", name: "نجفة غرفة طعام", categoryId: "15", minPrice: 1500, maxPrice: 4000, isPurchased: false },
  { id: "45", name: "أباجورة لغرفة النوم", categoryId: "15", minPrice: 500, maxPrice: 1500, isPurchased: false },
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
    return { success: false, error: "معرفناش نقرا الملف." };
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
