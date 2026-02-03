export type UserProfile = {
  id: string; // Firebase UID
  firstName: string;
  lastName: string;
  email: string;
  role: 'groom' | 'bride';
};

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
};

export type ChecklistItem = {
  id: string;
  name: string;
  categoryId: string;
  minPrice: number;
  maxPrice: number;
  isPurchased: boolean;
  finalPrice?: number;
  userId: string;
};
