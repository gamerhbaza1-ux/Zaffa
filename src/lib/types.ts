export type UserProfile = {
  id: string; // Firebase UID
  firstName: string;
  lastName: string;
  email: string;
  role: 'groom' | 'bride';
  householdId: string;
};

export type Household = {
  id: string;
  memberIds: string[];
  // inviteCode is deprecated but might exist on old documents
  inviteCode?: string;
};

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

export type Invitation = {
  id: string;
  inviterId: string;
  inviterName: string;
  inviterRole: 'groom' | 'bride';
  inviteeEmail: string;
  householdId: string;
  status: 'pending' | 'accepted' | 'declined';
};
