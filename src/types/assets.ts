export interface Asset {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  description: string | null;
  purchaseDate: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  showOnKanban: boolean;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}
