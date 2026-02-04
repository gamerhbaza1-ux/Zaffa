import type { Timestamp } from 'firebase/firestore';

export type Priority = 'important' | 'nice_to_have' | 'not_important';

export type Category = {
  id:string;
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
  priority: Priority;
};

export type UserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'groom' | 'bride';
    householdId: string | null;
};

export type HeroConfig = {
    title: string;
    subtitle: string;
    imageUrl: string;
};

export type Household = {
    id: string;
    memberIds: string[];
    heroConfig?: HeroConfig;
};

export type Invitation = {
    id: string;
    inviterId: string;
    inviterName: string;
    inviterRole: 'groom' | 'bride';
    inviteeEmail: string;
    householdId: string;
    status: 'pending' | 'accepted' | 'declined';
};

export type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Timestamp;
  payload?: Record<string, any>;
};

export type Analysis = {
  id: string;
  title: string;
  categoryIds: string[];
  isFeatured?: boolean;
};
