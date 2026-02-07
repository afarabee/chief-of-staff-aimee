export interface Provider {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  categoryId: string | null;
  categoryName?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
