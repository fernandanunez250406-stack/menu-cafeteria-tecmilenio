export const menuColors = {
  background: '#FAF7F2', // crema cálido, no puro blanco
  surface: '#FFFFFF',
  textPrimary: '#2D2A26', // casi negro cálido
  textSecondary: '#7A7168',
  accent: '#2F6F5E', // verde pino - buckets activos, acciones principales
  accentSoft: '#E4EEEB',
  price: '#D98F4E', // mostaza cálido - sticker de precio
  priceSoft: '#FBEADA',
  danger: '#C0453A',
  dangerSoft: '#F7E4E1',
  border: '#EDE7DD',
  overlay: 'rgba(30, 25, 20, 0.55)',
};

export const menuSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const menuRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const menuTypography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 15, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  price: { fontSize: 15, fontWeight: '700' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
};