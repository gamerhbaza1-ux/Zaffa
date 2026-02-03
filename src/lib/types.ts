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
};

export type UserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'groom' | 'bride';
    householdId: string | null;
};

export type Household = {
    id: string;
    memberIds: string[];
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
