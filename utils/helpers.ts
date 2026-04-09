export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

const clampColorChannel = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)));

const normalizeHexColor = (color: string): string | null => {
  const trimmed = color.trim();
  if (!trimmed.startsWith("#")) return null;

  const hex = trimmed.slice(1);
  if (hex.length === 3 && /^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toLowerCase()}`;
  }

  if (hex.length === 6 && /^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return null;
};

const hexToRgb = (hexColor: string) => {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) {
    return null;
  }

  const hex = normalized.slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (channel: number) =>
    clampColorChannel(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const mixHexColors = (
  baseColor: string,
  targetColor: string,
  amount: number,
) => {
  const base = hexToRgb(baseColor);
  const target = hexToRgb(targetColor);
  if (!base || !target) {
    return baseColor;
  }

  const ratio = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    base.r + (target.r - base.r) * ratio,
    base.g + (target.g - base.g) * ratio,
    base.b + (target.b - base.b) * ratio,
  );
};

export const lightenHexColor = (color: string, amount: number) =>
  mixHexColors(color, "#ffffff", amount);

export const darkenHexColor = (color: string, amount: number) =>
  mixHexColors(color, "#000000", amount);

export const getReadableTextColor = (
  backgroundColor: string,
  darkText = "#111827",
  lightText = "#f9fafb",
) => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return darkText;
  }

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.62 ? darkText : lightText;
};
