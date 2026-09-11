import { MenuCategory, MenuItem } from "../types/menu";

export const mockCategories: MenuCategory[] = [
  {
    id: "cat-bebidas-calientes",
    label: "Bebidas calientes",
    emoji: "☕",
  },
  {
    id: "cat-bebidas-frias",
    label: "Bebidas frías",
    emoji: "🧊",
  },
  {
    id: "cat-panaderia",
    label: "Panadería",
    emoji: "🥐",
  },
  {
    id: "cat-snacks",
    label: "Snacks",
    emoji: "🥪",
  },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: "item-1",
    categoryId: "cat-bebidas-calientes",
    name: "Latte Vainilla",
    price: 45,
    emoji: "☕",
    description:
      "Espresso doble con leche vaporizada y un toque de jarabe de vainilla. Suave y cremoso.",
    specs: [
      {
        id: "spec-size-latte",
        label: "Tamaño",
        options: [
          {
            id: "option-12oz-latte",
            label: "12 oz",
            price: 0,
            isDefault: true,
          },
        ],
      },
      {
        id: "spec-milk-latte",
        label: "Tipo de leche",
        options: [
          {
            id: "option-whole-latte",
            label: "Leche entera",
            price: 0,
            isDefault: true,
          },
          {
            id: "option-lactose-free-latte",
            label: "Leche deslactosada",
            price: 0,
          },
          {
            id: "option-almond-latte",
            label: "Leche de almendra",
            price: 8,
          },
        ],
      },
    ],
    available: false,
  },

  {
    id: "item-2",
    categoryId: "cat-bebidas-calientes",
    name: "Capuchino Clásico",
    price: 40,
    emoji: "☕",
    description:
      "Espresso, leche vaporizada y espuma en partes iguales. El clásico de siempre.",
    specs: [
      {
        id: "spec-size-capuccino",
        label: "Tamaño",
        options: [
          {
            id: "option-10oz-capuccino",
            label: "10 oz",
            price: 0,
            isDefault: true,
          },
        ],
      },
    ],
    available: true,
  },

  {
    id: "item-3",
    categoryId: "cat-bebidas-frias",
    name: "Frappé de Moka",
    price: 55,
    emoji: "🥤",
    description:
      "Café frío licuado con chocolate, hielo y crema batida encima.",
    specs: [
      {
        id: "spec-size-frappe",
        label: "Tamaño",
        options: [
          {
            id: "option-16oz-frappe",
            label: "16 oz",
            price: 0,
            isDefault: true,
          },
        ],
      },
    ],
    available: true,
  },

  {
    id: "item-4",
    categoryId: "cat-bebidas-frias",
    name: "Limonada Menta",
    price: 35,
    emoji: "🍋",
    description:
      "Limonada natural con hojas de menta fresca y un toque de miel.",
    specs: [
      {
        id: "spec-size-lemonade",
        label: "Tamaño",
        options: [
          {
            id: "option-16oz-lemonade",
            label: "16 oz",
            price: 0,
            isDefault: true,
          },
        ],
      },
    ],
    available: true,
  },

  {
    id: "item-5",
    categoryId: "cat-panaderia",
    name: "Croissant de Mantequilla",
    price: 32,
    emoji: "🥐",
    description: "Hojaldrado, horneado en el momento, con mantequilla real.",
    specs: [],
    available: true,
  },

  {
    id: "item-6",
    categoryId: "cat-snacks",
    name: "Sándwich Club",
    price: 68,
    emoji: "🥪",
    description:
      "Pavo, tocino, lechuga, jitomate y mayonesa de chipotle en pan artesanal.",
    specs: [],
    available: true,
  },
];
