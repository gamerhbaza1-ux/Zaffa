"use server";

import { revalidatePath } from "next/cache";
import type { ChecklistItem, Category } from "./types";
import { z } from "zod";
import { collection, writeBatch, getDocs, query, where, getDoc, doc, deleteDoc, setDoc, addDoc, updateDoc, Firestore } from "firebase/firestore";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";

// Server-side Firebase initialization
let firestore: Firestore;
if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
} else {
  firestore = getFirestore(getApp());
}

const itemSchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم الحاجة."),
  categoryId: z.string({ required_error: "لازم نختار فئة."}).min(1, "لازم نختار فئة."),
  minPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  maxPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  userId: z.string(),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "أقصى سعر لازم يكون أكبر من أو بيساوي أقل سعر.",
  path: ["maxPrice"],
});

const categorySchema = z.object({
  name: z.string().min(1, "لازم نكتب اسم القسم أو الفئة."),
  parentId: z.string().nullable().optional(),
  userId: z.string(),
});

const purchaseSchema = z.object({
  itemId: z.string(),
  finalPrice: z.coerce.number().min(0, "السعر لازم يكون رقم."),
  userId: z.string(),
});

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

  const { name, parentId, userId } = validatedFields.data;

  const categoriesRef = collection(firestore, `users/${userId}/categories`);
  const q = query(categoriesRef, where("name", "==", name), where("parentId", "==", parentId || null));
  const existing = await getDocs(q);

  if (!existing.empty) {
    return {
      errors: { name: ["الاسم ده موجود قبل كده في نفس المكان."] },
    };
  }
  
  const newCategory: Omit<Category, 'id'> = {
    name,
    parentId: parentId || null,
    userId,
  };

  await addDoc(categoriesRef, newCategory);
  
  revalidatePath("/");
  return { success: true };
}

export async function addItem(prevState: any, formData: FormData) {
  const validatedFields = itemSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, categoryId, minPrice, maxPrice, userId } = validatedFields.data;
  
  const newItem: Omit<ChecklistItem, 'id'> = {
    name,
    categoryId,
    minPrice,
    maxPrice,
    isPurchased: false,
    userId,
  };
  
  const itemsRef = collection(firestore, `users/${userId}/checklistItems`);
  await addDoc(itemsRef, newItem);
  
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

  const { itemId, finalPrice, userId } = validatedFields.data;

  const itemRef = doc(firestore, `users/${userId}/checklistItems`, itemId);
  await updateDoc(itemRef, {
    isPurchased: true,
    finalPrice: finalPrice
  });

  revalidatePath("/");
  return { success: true };
}

export async function unpurchaseItem(userId: string, id: string) {
  const itemRef = doc(firestore, `users/${userId}/checklistItems`, id);
  await updateDoc(itemRef, {
    isPurchased: false,
    finalPrice: null
  });
  revalidatePath("/");
}

export async function deleteItem(userId: string, id: string) {
  const itemRef = doc(firestore, `users/${userId}/checklistItems`, id);
  await deleteDoc(itemRef);
  revalidatePath("/");
}

export async function importItems(prevState: any, formData: FormData) {
  const fileContent = formData.get('fileContent') as string | null;
  const mappingStr = formData.get('mapping') as string | null;
  const userId = formData.get('userId') as string | null;

  if (!fileContent || !mappingStr || !userId) {
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
    
    const categoriesRef = collection(firestore, `users/${userId}/categories`);
    const allCategoriesSnap = await getDocs(categoriesRef);
    const allCategories = allCategoriesSnap.docs.map(d => ({...d.data(), id: d.id} as Category));


    const batch = writeBatch(firestore);

    for (const line of dataLines) {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      const sectionName = values[indices.section];
      const categoryName = values[indices.category];
      const itemName = values[indices.name];

      if (!sectionName || !categoryName || !itemName) {
        continue; // Skip incomplete rows
      }

      // Find or create section
      let section = allCategories.find(c => c.name.toLowerCase() === sectionName.toLowerCase() && c.parentId === null);
      if (!section) {
        const newSectionDoc = doc(categoriesRef);
        section = { id: newSectionDoc.id, name: sectionName, parentId: null, userId };
        batch.set(newSectionDoc, { name: sectionName, parentId: null, userId });
        allCategories.push(section);
      }

      // Find or create category under that section
      let category = allCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase() && c.parentId === section!.id);
      if (!category) {
        const newCategoryDoc = doc(categoriesRef);
        category = { id: newCategoryDoc.id, name: categoryName, parentId: section.id, userId };
        batch.set(newCategoryDoc, { name: categoryName, parentId: section.id, userId });
        allCategories.push(category);
      }

      const minPrice = parseFloat(indices.minPrice !== -1 ? values[indices.minPrice] : '0') || 0;
      const maxPrice = parseFloat(indices.maxPrice !== -1 ? values[indices.maxPrice] : '0') || 0;
      
      const newItemRef = doc(collection(firestore, `users/${userId}/checklistItems`));
      batch.set(newItemRef, {
        name: itemName,
        categoryId: category.id,
        minPrice: maxPrice < minPrice ? maxPrice : minPrice,
        maxPrice: maxPrice < minPrice ? minPrice : maxPrice,
        isPurchased: false,
        userId,
      });
    }

    await batch.commit();
    revalidatePath("/");
    return { success: true, count: dataLines.length };

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
    userId: z.string(),
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

  const { id, name, parentId, userId } = validatedFields.data;
  const newParentId = parentId || null;

  const categoriesRef = collection(firestore, `users/${userId}/categories`);
  const q = query(categoriesRef, where("name", "==", name), where("parentId", "==", newParentId));
  const existingSnap = await getDocs(q);
  const nameExists = existingSnap.docs.some(doc => doc.id !== id);

  if (nameExists) {
     return {
      errors: { name: ["الاسم ده موجود قبل كده في نفس المكان."] },
    };
  }

  let currentParentId = newParentId;
  while(currentParentId) {
      if (currentParentId === id) {
          return {
              errors: { parentId: ["مينفعش نخلي الفئة تبع نفسها."] },
          };
      }
      const parentDoc = await getDoc(doc(categoriesRef, currentParentId));
      currentParentId = parentDoc.data()?.parentId || null;
  }

  const categoryRef = doc(categoriesRef, id);
  await updateDoc(categoryRef, { name, parentId: newParentId });

  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(userId: string, id: string) {
  const categoriesRef = collection(firestore, `users/${userId}/categories`);
  
  const subcategoriesQuery = query(categoriesRef, where("parentId", "==", id));
  const subcategoriesSnap = await getDocs(subcategoriesQuery);
  if (!subcategoriesSnap.empty) {
    return { success: false, error: "مينفعش نمسحها عشان جواها فئات تانية." };
  }
  
  const itemsRef = collection(firestore, `users/${userId}/checklistItems`);
  const itemsQuery = query(itemsRef, where("categoryId", "==", id));
  const itemsSnap = await getDocs(itemsQuery);

  if (!itemsSnap.empty) {
    return { success: false, error: "مينفعش نمسحها عشان جواها حاجات." };
  }

  await deleteDoc(doc(categoriesRef, id));
  revalidatePath("/");
  return { success: true };
}
