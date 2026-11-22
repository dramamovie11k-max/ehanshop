const widths = [384, 960, 1600];
export function imageVariant(src: string, width: number): string {
  try {
    const url = new URL(src, 'https://local.invalid');
    if (!url.pathname.startsWith('/api/media/') || !/\.(png|jpe?g|webp|avif)$/i.test(url.pathname)) return src;
    url.searchParams.set('width', String(widths.find(size => size >= width) || 1600));
    return src.startsWith('/') ? url.pathname + url.search : url.href;
  } catch { return src; }
}
export function imageSrcSet(src: string): string | undefined {
  if (imageVariant(src, 384) === src) return undefined;
  return widths.map(width => `${imageVariant(src, width)} ${width}w`).join(', ');
}

export const organicSalesHeroSizes = "(min-width: 1024px) 896px, (min-width: 800px) 768px, (min-width: 768px) calc(100vw - 32px), (min-width: 544px) 512px, calc(100vw - 32px)";
