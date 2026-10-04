const light = {
  purple: '#6750C7', purpleSoft: '#F0ECFC', yellow: '#E8B83F', yellowSoft: '#FFF5DA',
  ink: '#211E2B', muted: '#625E70', line: '#E7E3ED', canvas: '#F7F6FA', card: '#FFFFFF',
  surfaceSoft: '#F0EEF5', input: '#F2F0F6', onPrimary: '#FFFFFF', tabInactive: '#777283',
  success: '#347A55', danger: '#B4424D', overlay: '#17142266', heat0: '#EEECF2',
  heat1: '#DCD4F7', heat2: '#B7A8EB', heat3: '#8C77D5', heat4: '#6750C7',
};
const night: typeof light = {
  ...light, purple: '#B6A7FF', purpleSoft: '#302A47', yellow: '#F0CD73', yellowSoft: '#393121',
  ink: '#F3F0F8', muted: '#BBB6C8', line: '#383543', canvas: '#14131A', card: '#1E1D25',
  surfaceSoft: '#292731', input: '#292731', onPrimary: '#211B35', tabInactive: '#AAA5B6',
  success: '#82D0A0', danger: '#FF9CA5', overlay: '#00000099', heat0: '#2D2B35',
  heat1: '#403958', heat2: '#5D4F83', heat3: '#8872C1', heat4: '#B6A7FF',
};
let current: 'light' | 'dark' = 'light';
let accent = light.purple;
const blend = (hex: string, base: string, ratio: number) => {
  const rgb = (value: string) => [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
  const a = rgb(hex); const b = rgb(base);
  return `#${a.map((v, i) => Math.round(v * ratio + b[i] * (1 - ratio)).toString(16).padStart(2, '0')).join('')}`;
};
const luminance = (hex: string) => {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
export const setPaletteMode = (mode: 'light' | 'dark') => { current = mode; };
export const setPaletteAccent = (color: string) => { if (/^#[\da-f]{6}$/i.test(color)) accent = color; };
export const palette = new Proxy(light, {
  get: (_target, key: string | symbol) => {
    const tokens = current === 'dark' ? night : light;
    if (key === 'purple') return current === 'dark' ? blend(accent, '#FFFFFF', 0.76) : accent;
    if (key === 'purpleSoft') return blend(accent, tokens.canvas, 0.18);
    if (key === 'heat4') return accent;
    if (key === 'onPrimary') {
      const background = current === 'dark' ? blend(accent, '#FFFFFF', 0.76) : accent;
      return luminance(background) > 0.18 ? '#211E2B' : '#FFFFFF';
    }
    return Reflect.get(tokens, key);
  },
});
export type PaletteToken = keyof typeof light;
