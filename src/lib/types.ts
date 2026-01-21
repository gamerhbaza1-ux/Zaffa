export type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

export type ChecklistItem = {
  id: string;
  name: string;
  categoryId: string;
  minPrice: number;
  maxPrice: number;
  isPurchased: boolean;
  finalPrice?: number;
};
