export type MenuCategory = {
  id: string;
  label: string;
  emoji: string;
};

export type MenuSpec = {
  label: string;
  value: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
  specs: MenuSpec[];
};

// Datos que llena el formulario de alta/edición (sin id, se genera aparte)
export type MenuItemDraft = Omit<MenuItem, 'id'>;