"use server";

import { revalidatePath } from "next/cache";
import type { ChecklistItem } from "./types";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  minPrice: z.coerce.number().min(0, "Price must be a positive number."),
  maxPrice: z.coerce.number().min(0, "Price must be a positive number."),
}).refine(data => data.maxPrice >= data.minPrice, {
  message: "Max price must be greater than or equal to min price.",
  path: ["maxPrice"],
});


// In-memory store for demonstration purposes
let items: ChecklistItem[] = [
  { id: "1", name: "Sofa", minPrice: 1500, maxPrice: 3000, isPurchased: false },
  { id: "2", name: "Dining Table Set", minPrice: 800, maxPrice: 1500, isPurchased: true },
  { id: "3", name: "Bed Frame & Mattress", minPrice: 1200, maxPrice: 2500, isPurchased: false },
  { id: "4", name: "Refrigerator", minPrice: 700, maxPrice: 1200, isPurchased: false },
  { id: "5", name: "Washing Machine", minPrice: 500, maxPrice: 900, isPurchased: true },
  { id: "6", name: "Television", minPrice: 400, maxPrice: 1000, isPurchased: false },
];

const simulateLatency = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getItems(): Promise<ChecklistItem[]> {
  await simulateLatency(500);
  return items;
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
    minPrice: validatedFields.data.minPrice,
    maxPrice: validatedFields.data.maxPrice,
    isPurchased: false,
  };
  items.unshift(newItem);
  revalidatePath("/");
  return { success: true };
}

export async function toggleItemPurchased(id: string) {
  await simulateLatency(500);
  items = items.map(item =>
    item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
  );
  revalidatePath("/");
}

export async function deleteItem(id: string) {
  await simulateLatency(500);
  items = items.filter(item => item.id !== id);
  revalidatePath("/");
}

export async function importItems(fileContent: string) {
  // This is a placeholder for CSV/Excel import logic.
  // In a real app, you would use a library like 'papaparse' or 'xlsx'
  // to parse the file content and add items.
  await simulateLatency(1500);

  // For demonstration, let's assume a simple CSV format: name,minPrice,maxPrice
  try {
    const lines = fileContent.split('\n').slice(1); // ignore header
    const newItems: ChecklistItem[] = lines.map((line, index) => {
      const [name, minPrice, maxPrice] = line.split(',');
      if (name && minPrice && maxPrice) {
        return {
          id: `import-${Date.now()}-${index}`,
          name: name.trim(),
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          isPurchased: false,
        };
      }
      return null;
    }).filter((item): item is ChecklistItem => item !== null);

    items.unshift(...newItems);
    revalidatePath("/");
    return { success: true, count: newItems.length };
  } catch (error) {
    return { success: false, error: "Failed to parse file." };
  }
}
