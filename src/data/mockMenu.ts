import { MenuCategory, MenuItem } from '../types/menu';

export const mockCategories: MenuCategory[] = [
  { id: 'cat-bebidas-calientes', label: 'Bebidas calientes', emoji: '☕' },
  { id: 'cat-bebidas-frias', label: 'Bebidas frías', emoji: '🧊' },
  { id: 'cat-panaderia', label: 'Panadería', emoji: '🥐' },
  { id: 'cat-snacks', label: 'Snacks', emoji: '🥪' },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: 'item-1',
    categoryId: 'cat-bebidas-calientes',
    name: 'Latte Vainilla',
    price: 45,
    emoji: '☕',
    description:
      'Espresso doble con leche vaporizada y un toque de jarabe de vainilla. Suave y cremoso.',
    specs: [
      { label: 'Tamaño', value: '12 oz' },
      { label: 'Calorías', value: '190 kcal' },
      { label: 'Leche', value: 'Entera (opción deslactosada)' },
    ],
  },
  {
    id: 'item-2',
    categoryId: 'cat-bebidas-calientes',
    name: 'Capuchino Clásico',
    price: 40,
    emoji: '☕',
    description: 'Espresso, leche vaporizada y espuma en partes iguales. El clásico de siempre.',
    specs: [
      { label: 'Tamaño', value: '10 oz' },
      { label: 'Calorías', value: '120 kcal' },
    ],
  },
  {
    id: 'item-3',
    categoryId: 'cat-bebidas-frias',
    name: 'Frappé de Moka',
    price: 55,
    emoji: '🥤',
    description: 'Café frío licuado con chocolate, hielo y crema batida encima.',
    specs: [
      { label: 'Tamaño', value: '16 oz' },
      { label: 'Calorías', value: '320 kcal' },
    ],
  },
  {
    id: 'item-4',
    categoryId: 'cat-bebidas-frias',
    name: 'Limonada Menta',
    price: 35,
    emoji: '🍋',
    description: 'Limonada natural con hojas de menta fresca y un toque de miel.',
    specs: [{ label: 'Tamaño', value: '16 oz' }],
  },
  {
    id: 'item-5',
    categoryId: 'cat-panaderia',
    name: 'Croissant de Mantequilla',
    price: 32,
    emoji: '🥐',
    description: 'Hojaldrado, horneado en el momento, con mantequilla real.',
    specs: [{ label: 'Calorías', value: '270 kcal' }],
  },
  {
    id: 'item-6',
    categoryId: 'cat-snacks',
    name: 'Sándwich Club',
    price: 68,
    emoji: '🥪',
    description: 'Pavo, tocino, lechuga, jitomate y mayonesa de chipotle en pan artesanal.',
    specs: [
      { label: 'Calorías', value: '480 kcal' },
      { label: 'Alérgenos', value: 'Gluten' },
    ],
  },
];