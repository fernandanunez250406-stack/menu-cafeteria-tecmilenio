export const menuColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",

  textPrimary: "#222222",
  textSecondary: "#666666",

  accent: "#7A4B2A",
  accentSoft: "#F7F0EA",

  price: "#7A4B2A",
  priceSoft: "#F7F0EA",

  danger: "#C62828",
  dangerSoft: "#FCECEC",

  border: "#DDDDDD",

  overlay: "rgba(0,0,0,0.45)",
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
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
  },

  body: {
    fontSize: 14,
    fontWeight: "400" as const,
  },

  price: {
    fontSize: 15,
    fontWeight: "700" as const,
  },

  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
};
