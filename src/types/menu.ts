export type MenuCategory = {
  id: string;
  label: string;
  emoji: string;
};

export type MenuSpecOption = {
  id: string;
  label: string;
  price: number;
  isDefault?: boolean;
  available?: boolean;
};

export type MenuSpec = {
  id: string;
  label: string;
  options: MenuSpecOption[];
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  emoji: string;
  photoUri?: string | null;
  description: string;
  specs: MenuSpec[];
  available: boolean;
};

export type MenuItemDraft = Omit<MenuItem, "id">;
