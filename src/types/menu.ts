<<<<<<< HEAD
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
  available: boolean;
};

// Datos que llena el formulario de alta/edición (sin id, se genera aparte)
=======
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
  photoUri?: string | null; // foto subida por el personal desde su dispositivo (HU1)
  description: string;
  specs: MenuSpec[];
};

// Datos que llena el formulario de alta/edición (sin id, se genera aparte)
>>>>>>> feature/fernanda
export type MenuItemDraft = Omit<MenuItem, 'id'>;