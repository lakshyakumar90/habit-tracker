const light = {
  purple: '#6750C7', purpleSoft: '#F0ECFC', yellow: '#E8B83F', yellowSoft: '#FFF5DA',
  ink: '#211E2B', muted: '#625E70', line: '#E7E3ED', canvas: '#F7F6FA', card: '#FFFFFF',
  surfaceSoft: '#F0EEF5', input: '#F2F0F6', onPrimary: '#FFFFFF', tabInactive: '#777283',
  success: '#347A55', danger: '#B4424D', overlay: '#17142266', heat0: '#EEECF2',
  heat1: '#DCD4F7', heat2: '#B7A8EB', heat3: '#8C77D5', heat4: '#6750C7',
};
let accent = light.purple;
const blend = (hex: string, base: string, ratio: number) => {
  const rgb = (value: string) => [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
  const a = rgb(hex); const b = rgb(base);
  return `#${a.map((v, i) => Math.round(v * ratio + b[i] * (1 - ratio)).toString(16).padStart(2, '0')).join('')}`;
};
export const softAccent = (color: string) => blend(color, light.canvas, 0.18);
const luminance = (hex: string) => {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
export const onAccent = (color: string) => luminance(color) > 0.18 ? '#211E2B' : '#FFFFFF';
const whiteControlAccents = new Set(['#8068EA', '#568CEB', '#51A77A', '#E27C9C']);
export const onAccentControl = (color: string) => whiteControlAccents.has(color.toUpperCase()) ? '#FFFFFF' : onAccent(color);
export const setPaletteAccent = (color: string) => { if (/^#[\da-f]{6}$/i.test(color)) accent = color; };
export const palette = new Proxy(light, {
  get: (_target, key: string | symbol) => {
    if (key === 'purple') return accent;
    if (key === 'purpleSoft') return softAccent(accent);
    if (key === 'heat4') return accent;
    if (key === 'onPrimary') return onAccent(accent);
    return Reflect.get(light, key);
  },
});
export type PaletteToken = keyof typeof light;
