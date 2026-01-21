export type ChecklistItem = {
  id: string;
  name: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  isPurchased: boolean;
  finalPrice?: number;
};
