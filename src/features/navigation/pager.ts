export function pageIndexAtOffset(offset: number, pageWidth: number, pageCount: number) {
  'worklet';
  if (!Number.isFinite(offset) || !Number.isFinite(pageWidth) || pageWidth <= 0 || pageCount <= 0) return 0;
  return Math.max(0, Math.min(pageCount - 1, Math.round(offset / pageWidth)));
}

export function shouldAnimateTabTap(from: number, to: number) {
  return Math.abs(to - from) <= 1;
}
